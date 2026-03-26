'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

type Props = {
  className?: string
  label?: string
}

export default function LogoutButton({ className = '', label = 'Sair' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/entrar')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50 ${className}`}
    >
      <LogOut className="w-4 h-4 shrink-0" />
      {loading ? 'Saindo...' : label}
    </button>
  )
}
