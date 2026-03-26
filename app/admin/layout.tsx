import type { ReactNode } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  const fallbackName = user?.email?.split('@')[0] || 'Admin'
  const fallbackEmail = user?.email || ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name,email')
    .eq('id', user?.id || '')
    .maybeSingle()

  const userName = String(profile?.full_name || fallbackName)
  const userEmail = String(profile?.email || fallbackEmail)

  return (
    <div className="flex min-h-screen bg-[#f3f6fb]">
      <AdminSidebar userName={userName} userEmail={userEmail} />
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">{children}</main>
    </div>
  )
}
