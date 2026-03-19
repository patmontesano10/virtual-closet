import { createClient } from '@/lib/supabase/server'
import { WardrobeItem } from '@/lib/types'
import ItemCard from '@/components/closet/ItemCard'
import UploadModal from '@/components/closet/UploadModal'

export default async function ClosetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: items } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">My Closet</h1>
        <UploadModal />
      </div>
      {items && items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(items as WardrobeItem[]).map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
          <p className="text-lg">Your closet is empty</p>
          <p className="text-sm mt-1">Upload your first item to get started</p>
        </div>
      )}
    </div>
  )
}
