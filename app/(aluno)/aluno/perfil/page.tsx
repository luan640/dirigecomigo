'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  city: z.string().min(2, 'Informe sua cidade'),
  state: z.string().length(2, 'UF deve ter 2 letras'),
})
type ProfileFormData = z.infer<typeof profileSchema>

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '', email: '', phone: '', city: '', state: '' },
  })

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('full_name, phone, city, state')
          .eq('id', user.id)
          .maybeSingle()

        reset({
          full_name: profile?.full_name || '',
          email: user.email || '',
          phone: profile?.phone || '',
          city: profile?.city || '',
          state: profile?.state || '',
        })
      } catch {
        // silently fail, form stays empty
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [reset])

  const onSubmit = async (data: ProfileFormData) => {
    if (!userId) return
    setSaving(true)
    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ full_name: data.full_name, phone: data.phone, city: data.city, state: data.state })
        .eq('id', userId)

      if (error) throw new Error(error.message)
      toast.success('Perfil atualizado com sucesso!')
      reset(data)
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando perfil...
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-extrabold text-gray-900">Meu perfil</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <Field label="Nome completo" error={errors.full_name?.message}>
          <input {...register('full_name')} className={inputCls} />
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          <input {...register('email')} type="email" className={inputCls} disabled />
        </Field>
        <Field label="Telefone" error={errors.phone?.message}>
          <input {...register('phone')} placeholder="(85) 99999-0000" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade" error={errors.city?.message}>
            <input {...register('city')} className={inputCls} />
          </Field>
          <Field label="Estado (UF)" error={errors.state?.message}>
            <input {...register('state')} maxLength={2} className={`${inputCls} uppercase`} />
          </Field>
        </div>

        <button
          type="submit"
          disabled={!isDirty || saving}
          className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
