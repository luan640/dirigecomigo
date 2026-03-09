'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  city: z.string().min(2, 'Informe sua cidade'),
  state: z.string().length(2, 'UF deve ter 2 letras'),
})
type ProfileFormData = z.infer<typeof profileSchema>

const DEMO_STUDENT = {
  full_name: 'Aluno Demonstração',
  email: 'aluno@demo.com',
  phone: '(85) 99999-0000',
  city: 'Fortaleza',
  state: 'CE',
}

export default function StudentProfilePage() {
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: DEMO_STUDENT,
  })

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Perfil atualizado com sucesso!')
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-extrabold text-gray-900">Meu perfil</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <Field label="Nome completo" error={errors.full_name?.message}>
          <input {...register('full_name')} className={inputCls} />
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          <input {...register('email')} type="email" className={inputCls} />
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

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
