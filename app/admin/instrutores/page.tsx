import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import InstructorsAdminTable from './InstructorsAdminTable'

type AdminRoleLookup = {
  role?: string | null
}

export type InstructorAdminRow = {
  id: string
  status?: string
  is_active?: boolean
  is_verified?: boolean
  created_at?: string
  neighborhood?: string
  city?: string
  state?: string
  price_per_lesson?: number
  categories?: string[] | string
  cnh_photo_url?: string
  birth_date?: string
  cpf?: string
  accepts_student_car?: boolean
  lesson_types?: string[] | string
  full_name?: string
  email?: string
  phone?: string
  avatar_url?: string
  price_per_lesson_a?: number
  price_per_lesson_b?: number
  price_per_lesson_c?: number
  price_per_lesson_d?: number
  price_per_lesson_e?: number
}

async function getAdminRole() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle() as { data: AdminRoleLookup | null; error: Error | null }

  return profile?.role || null
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}


export default async function InstrutoresAdminPage() {
  const role = await getAdminRole()
  if (role !== 'admin') redirect('/entrar')

  const service = getServiceClient()
  if (!service) {
    return (
      <div className="max-w-5xl mx-auto bg-white border border-red-200 rounded-xl p-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Instrutores</h1>
        <p className="text-sm text-red-700 mt-2">
          SUPABASE_SERVICE_ROLE_KEY nao configurado. Nao foi possivel carregar dados administrativos.
        </p>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = service as any

  const [{ data: instructors }, { data: profiles }] = await Promise.all([
    db.from('instructors').select(
      'id,status,is_active,is_verified,created_at,neighborhood,city,state,price_per_lesson,price_per_lesson_a,price_per_lesson_b,price_per_lesson_c,price_per_lesson_d,price_per_lesson_e,categories,cnh_photo_url,birth_date,cpf,accepts_student_car,lesson_types'
    ).order('created_at', { ascending: false }),
    db.from('profiles').select('id,full_name,email,phone,avatar_url'),
  ])

  const instructorRows = Array.isArray(instructors) ? instructors : []
  const profileRows = Array.isArray(profiles) ? profiles : []

  const profileMap = new Map(profileRows.map((p: { id: string }) => [p.id, p]))

  const rows: InstructorAdminRow[] = instructorRows.map((inst: Record<string, unknown>) => {
    const prof = profileMap.get(String(inst.id || '')) as Record<string, unknown> | undefined
    return {
      id: String(inst.id || ''),
      status: inst.status ? String(inst.status) : undefined,
      is_active: typeof inst.is_active === 'boolean' ? inst.is_active : undefined,
      is_verified: typeof inst.is_verified === 'boolean' ? inst.is_verified : undefined,
      created_at: inst.created_at ? String(inst.created_at) : undefined,
      neighborhood: inst.neighborhood ? String(inst.neighborhood) : undefined,
      city: inst.city ? String(inst.city) : undefined,
      state: inst.state ? String(inst.state) : undefined,
      price_per_lesson: inst.price_per_lesson != null ? Number(inst.price_per_lesson) : undefined,
      categories: inst.categories as string[] | string | undefined,
      cnh_photo_url: inst.cnh_photo_url ? String(inst.cnh_photo_url) : undefined,
      birth_date: inst.birth_date ? String(inst.birth_date) : undefined,
      cpf: inst.cpf ? String(inst.cpf) : undefined,
      accepts_student_car: typeof inst.accepts_student_car === 'boolean' ? inst.accepts_student_car : undefined,
      lesson_types: inst.lesson_types as string[] | string | undefined,
      price_per_lesson_a: inst.price_per_lesson_a != null ? Number(inst.price_per_lesson_a) : undefined,
      price_per_lesson_b: inst.price_per_lesson_b != null ? Number(inst.price_per_lesson_b) : undefined,
      price_per_lesson_c: inst.price_per_lesson_c != null ? Number(inst.price_per_lesson_c) : undefined,
      price_per_lesson_d: inst.price_per_lesson_d != null ? Number(inst.price_per_lesson_d) : undefined,
      price_per_lesson_e: inst.price_per_lesson_e != null ? Number(inst.price_per_lesson_e) : undefined,
      full_name: prof?.full_name ? String(prof.full_name) : undefined,
      email: prof?.email ? String(prof.email) : undefined,
      phone: prof?.phone ? String(prof.phone) : undefined,
      avatar_url: prof?.avatar_url ? String(prof.avatar_url) : undefined,
    }
  })


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Instrutores</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie os cadastros de instrutores da plataforma.</p>
      </div>

      <InstructorsAdminTable initialRows={rows} />
    </div>
  )
}
