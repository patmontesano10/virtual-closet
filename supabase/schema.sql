-- ============================================================
-- Virtual Closet Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

create type clothing_category as enum (
  'top', 'bottom', 'outerwear', 'shoes', 'accessory', 'other'
);

create type season_tag as enum (
  'spring', 'summer', 'fall', 'winter', 'all'
);

create type unit_preference as enum ('metric', 'imperial');

create type shoe_size_region as enum ('US', 'EU', 'UK');

-- ── Profiles ─────────────────────────────────────────────────

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── User Measurements ─────────────────────────────────────────

create table user_measurements (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  unit_preference       unit_preference default 'imperial',
  -- dimensions in cm (convert on input if imperial)
  height                numeric(5,1),   -- full height
  weight_kg             numeric(5,1),   -- optional
  head_circumference    numeric(5,1),
  neck_circumference    numeric(5,1),
  shoulder_width        numeric(5,1),
  chest_circumference   numeric(5,1),
  bicep_circumference   numeric(5,1),
  arm_length            numeric(5,1),   -- shoulder to wrist
  wrist_circumference   numeric(5,1),
  waist_circumference   numeric(5,1),
  hip_circumference     numeric(5,1),
  inseam                numeric(5,1),
  thigh_circumference   numeric(5,1),
  shoe_size             numeric(4,1),
  shoe_size_region      shoe_size_region default 'US',
  updated_at            timestamptz default now()
);

-- One measurements row per user
create unique index user_measurements_user_id_idx on user_measurements(user_id);

-- ── Wardrobe Items ────────────────────────────────────────────

create table wardrobe_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  name          text not null,
  category      clothing_category not null,
  color         text,
  brand         text,
  season        season_tag default 'all',
  image_url     text not null,   -- bg-removed version
  thumbnail_url text,
  notes         text,
  created_at    timestamptz default now()
);

-- ── Wardrobe Item Measurements ────────────────────────────────

create table wardrobe_item_measurements (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references wardrobe_items(id) on delete cascade,
  size_label      text,          -- e.g. "M", "32x30", "10"
  unit            unit_preference default 'imperial',
  -- all dimensions in cm
  chest           numeric(5,1),
  waist           numeric(5,1),
  hip             numeric(5,1),
  shoulder_width  numeric(5,1),
  sleeve_length   numeric(5,1),
  inseam          numeric(5,1),
  length          numeric(5,1),  -- garment length top-to-bottom
  shoe_size       numeric(4,1),
  shoe_size_region shoe_size_region
);

create unique index item_measurements_item_id_idx on wardrobe_item_measurements(item_id);

-- ── Outfits ───────────────────────────────────────────────────

create table outfits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  name         text not null default 'Untitled Outfit',
  item_ids     uuid[] not null default '{}',
  canvas_state jsonb,            -- Fabric.js JSON state
  preview_url  text,
  created_at   timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────

alter table profiles enable row level security;
alter table user_measurements enable row level security;
alter table wardrobe_items enable row level security;
alter table wardrobe_item_measurements enable row level security;
alter table outfits enable row level security;

-- profiles
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- user_measurements
create policy "Users can manage own measurements"
  on user_measurements for all using (auth.uid() = user_id);

-- wardrobe_items
create policy "Users can manage own wardrobe"
  on wardrobe_items for all using (auth.uid() = user_id);

-- wardrobe_item_measurements (via item ownership)
create policy "Users can manage own item measurements"
  on wardrobe_item_measurements for all
  using (
    exists (
      select 1 from wardrobe_items
      where id = wardrobe_item_measurements.item_id
      and user_id = auth.uid()
    )
  );

-- outfits
create policy "Users can manage own outfits"
  on outfits for all using (auth.uid() = user_id);

-- ── Storage Buckets ───────────────────────────────────────────
-- Run these in the Supabase dashboard Storage section,
-- or via the API. SQL below creates the policies once buckets exist.

-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('wardrobe', 'wardrobe', true);

create policy "Avatar upload own folder"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatar read own"
  on storage.objects for select
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatar delete own"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Wardrobe upload own folder"
  on storage.objects for insert
  with check (bucket_id = 'wardrobe' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Wardrobe read own"
  on storage.objects for select
  using (bucket_id = 'wardrobe' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Wardrobe delete own"
  on storage.objects for delete
  using (bucket_id = 'wardrobe' and auth.uid()::text = (storage.foldername(name))[1]);
