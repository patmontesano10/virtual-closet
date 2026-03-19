'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/closet', label: 'Closet' },
  { href: '/outfit-builder', label: 'Outfit Builder' },
  { href: '/measurements', label: 'Measurements' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-zinc-200 flex flex-col">
      <div className="px-5 py-6">
        <h2 className="text-lg font-semibold text-zinc-900">Virtual Closet</h2>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(link.href)
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 pb-6">
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
