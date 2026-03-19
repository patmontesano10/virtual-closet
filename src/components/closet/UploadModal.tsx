'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ClothingCategory } from '@/lib/types'

const CATEGORIES: ClothingCategory[] = ['top', 'bottom', 'outerwear', 'shoes', 'accessory', 'other']

export default function UploadModal() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ClothingCategory>('top')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [loading, setLoading] = useState(false)
  const [bgRemoving, setBgRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function removeBackground(imageFile: File): Promise<Blob> {
    setBgRemoving(true)
    const { removeBackground } = await import('@imgly/background-removal')
    const blob = await removeBackground(imageFile)
    setBgRemoving(false)
    return blob
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !name) return
    setLoading(true)

    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not logged in'); setLoading(false); return }

      // Upload original image (bg removal can be added later)
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${Date.now()}.${ext}`
      const path = `${user.id}/${filename}`
      const { error: uploadError } = await supabase.storage
        .from('wardrobe')
        .upload(path, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('wardrobe')
        .getPublicUrl(path)

      // Save item record
      const { error: dbError } = await supabase.from('wardrobe_items').insert({
        user_id: user.id,
        name,
        category,
        color: color || null,
        brand: brand || null,
        image_url: publicUrl,
      })

      if (dbError) throw dbError

      setOpen(false)
      resetForm()
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFile(null)
    setPreview(null)
    setName('')
    setCategory('top')
    setColor('')
    setBrand('')
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors"
      >
        Add item
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Add clothing item</h2>
          <button onClick={() => { setOpen(false); resetForm() }} className="text-zinc-400 hover:text-zinc-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-200 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors relative overflow-hidden"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="h-full object-contain" />
            ) : (
              <p className="text-sm text-zinc-400">Click to upload photo</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="White Oxford Shirt"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ClothingCategory)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Color</label>
              <input
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="White"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Brand</label>
              <input
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="Brooks Brothers"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading || !file || !name}
            className="w-full py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Uploading…' : 'Add to closet'}
          </button>
        </form>
      </div>
    </div>
  )
}
