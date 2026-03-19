'use client'

import { useEffect, useRef, useState } from 'react'
import { WardrobeItem, ClothingCategory } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  wardrobeItems: WardrobeItem[]
  avatarUrl: string | null
  userId: string
}

const CATEGORIES: ClothingCategory[] = ['top', 'bottom', 'outerwear', 'shoes', 'accessory', 'other']

export default function OutfitCanvas({ wardrobeItems, avatarUrl, userId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<unknown>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, WardrobeItem | null>>({})
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>('top')
  const [outfitName, setOutfitName] = useState('My Outfit')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  // Group wardrobe items by category
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = wardrobeItems.filter(i => i.category === cat)
    return acc
  }, {} as Record<string, WardrobeItem[]>)

  useEffect(() => {
    let canvas: unknown
    async function initFabric() {
      const { Canvas, FabricImage } = await import('fabric')
      if (!canvasRef.current) return

      canvas = new Canvas(canvasRef.current, {
        width: 400,
        height: 600,
        backgroundColor: '#f4f4f5',
      })
      fabricRef.current = canvas

      // Load avatar if available
      if (avatarUrl) {
        const img = await FabricImage.fromURL(avatarUrl, { crossOrigin: 'anonymous' })
        img.scaleToHeight(500)
        img.set({ left: 200 - (img.getScaledWidth() / 2), top: 50, selectable: false })
        ;(canvas as InstanceType<typeof Canvas>).add(img)
        ;(canvas as InstanceType<typeof Canvas>).sendObjectToBack(img)
      }
    }
    initFabric()

    return () => {
      if (fabricRef.current) {
        ;(fabricRef.current as { dispose: () => void }).dispose()
      }
    }
  }, [avatarUrl])

  async function addItemToCanvas(item: WardrobeItem) {
    if (!fabricRef.current) return
    const { FabricImage } = await import('fabric')

    const img = await FabricImage.fromURL(item.image_url, { crossOrigin: 'anonymous' })
    img.scaleToWidth(160)
    img.set({ left: 120, top: 150, data: { itemId: item.id, category: item.category } })
    ;(fabricRef.current as { add: (obj: unknown) => void; renderAll: () => void }).add(img)
    ;(fabricRef.current as { renderAll: () => void }).renderAll()

    setSelectedItems(prev => ({ ...prev, [item.category]: item }))
  }

  async function saveOutfit() {
    if (!fabricRef.current) return
    setSaving(true)
    const supabase = createClient()
    const itemIds = Object.values(selectedItems).filter(Boolean).map(i => i!.id)
    const canvasState = (fabricRef.current as { toJSON: () => object }).toJSON()

    await supabase.from('outfits').insert({
      user_id: userId,
      name: outfitName,
      item_ids: itemIds,
      canvas_state: canvasState,
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex gap-6">
      {/* Left: category selector + item grid */}
      <div className="w-64 flex-shrink-0">
        <div className="flex flex-wrap gap-1 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full capitalize transition-colors ${
                activeCategory === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {cat}
              {selectedItems[cat] && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
            </button>
          ))}
        </div>
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {byCategory[activeCategory]?.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">No {activeCategory}s in closet</p>
          ) : (
            byCategory[activeCategory]?.map(item => (
              <button
                key={item.id}
                onClick={() => addItemToCanvas(item)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors text-left ${
                  selectedItems[item.category]?.id === item.id
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-zinc-200 hover:border-zinc-400'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image_url} alt={item.name} className="w-12 h-12 object-contain rounded-md bg-zinc-100" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 truncate w-36">{item.name}</p>
                  {item.color && <p className="text-xs text-zinc-400">{item.color}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: canvas + save */}
      <div className="flex flex-col items-start gap-4">
        <canvas ref={canvasRef} className="rounded-xl border border-zinc-200 shadow-sm" />
        <div className="flex gap-3 w-full">
          <input
            value={outfitName}
            onChange={e => setOutfitName(e.target.value)}
            className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <button
            onClick={saveOutfit}
            disabled={saving || Object.keys(selectedItems).length === 0}
            className="px-5 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save outfit'}
          </button>
        </div>
      </div>
    </div>
  )
}
