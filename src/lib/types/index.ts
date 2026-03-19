export type ClothingCategory = 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory' | 'other'
export type SeasonTag = 'spring' | 'summer' | 'fall' | 'winter' | 'all'
export type UnitPreference = 'metric' | 'imperial'
export type ShoeSizeRegion = 'US' | 'EU' | 'UK'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface UserMeasurements {
  id: string
  user_id: string
  unit_preference: UnitPreference
  height: number | null
  weight_kg: number | null
  head_circumference: number | null
  neck_circumference: number | null
  shoulder_width: number | null
  chest_circumference: number | null
  bicep_circumference: number | null
  arm_length: number | null
  wrist_circumference: number | null
  waist_circumference: number | null
  hip_circumference: number | null
  inseam: number | null
  thigh_circumference: number | null
  shoe_size: number | null
  shoe_size_region: ShoeSizeRegion
  updated_at: string
}

export interface WardrobeItem {
  id: string
  user_id: string
  name: string
  category: ClothingCategory
  color: string | null
  brand: string | null
  season: SeasonTag
  image_url: string
  thumbnail_url: string | null
  notes: string | null
  created_at: string
}

export interface Outfit {
  id: string
  user_id: string
  name: string
  item_ids: string[]
  canvas_state: object | null
  preview_url: string | null
  created_at: string
}
