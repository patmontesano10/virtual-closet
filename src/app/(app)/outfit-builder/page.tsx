import { createClient } from '@/lib/supabase/server'
import { WardrobeItem } from '@/lib/types'
import OutfitCanvas from '@/components/outfit/OutfitCanvas'

export default async function OutfitBuilderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: items } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', user!.id)
    .order('category')

  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Outfit Builder</h1>
      <OutfitCanvas
        wardrobeItems={(items ?? []) as WardrobeItem[]}
        avatarUrl={profile?.avatar_url ?? null}
        userId={user!.id}
      />
    </div>
  )
}
