'use client'

import Image from 'next/image'
import { WardrobeItem } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  item: WardrobeItem
}

export default function ItemCard({ item }: Props) {
  const router = useRouter()

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('wardrobe_items').delete().eq('id', item.id)
    router.refresh()
  }

  return (
    <div className="group relative bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="aspect-square relative bg-zinc-100">
        <Image
          src={item.image_url}
          alt={item.name}
          fill
          className="object-contain p-2"
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
        <p className="text-xs text-zinc-400 capitalize mt-0.5">{item.category}</p>
        {item.color && (
          <p className="text-xs text-zinc-400">{item.color}</p>
        )}
      </div>
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white rounded-full w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-red-500 shadow transition-opacity"
        title="Remove item"
      >
        ×
      </button>
    </div>
  )
}
