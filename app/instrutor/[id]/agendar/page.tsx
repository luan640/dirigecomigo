'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, CheckCircle2, Clock, Copy, CreditCard, Loader2, QrCode } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { paymentService } from '@/services/paymentService'
import { formatCurrency } from '@/utils/format'
import { applyAmountToPaymentSplit, calculatePaymentSplit } from '@/utils/payment'
import { DEFAULT_PLATFORM_PRICING_SETTINGS, normalizePlatformPricingSettings, type PlatformPricingSettings } from '@/lib/platformPricing'
import type { InstructorCard, PaymentIntent } from '@/types'

type Step = 'review' | 'payment' | 'pix' | 'success'
type PayMethod = 'card' | 'pix'

function resolveLessonPrice(instructor: InstructorCard | null, category: string) {
  if (!instructor) return 0
  if (category === 'A') return instructor.price_per_lesson_a ?? instructor.price_per_lesson
  if (category === 'B') return instructor.price_per_lesson_b ?? instructor.price_per_lesson
  return instructor.price_per_lesson
}

function CheckoutContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>('review')
  const [payMethod, setPayMethod] = useState<PayMethod>('pix')
  const [instructor, setInstructor] = useState<InstructorCard | null>(null)
  const [loadingInstructor, setLoadingInstructor] = useState(true)
  const [loading, setLoading] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)
  const [pixIntentId, setPixIntentId] = useState<string | null>(null)
  const [pixCode, setPixCode] = useState('')
  const [pixQrBase64, setPixQrBase64] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount_amount: number
    final_amount: number
  } | null>(null)
  const [platformSettings, setPlatformSettings] = useState<PlatformPricingSettings>(DEFAULT_PLATFORM_PRICING_SETTINGS)

  const slotId = searchParams.get('slotId') || ''
  const bookingId = searchParams.get('bookingId') || ''
  const dateStr = searchParams.get('date') || ''
  const timeStr = searchParams.get('time') || ''
  const categoryParam = searchParams.get('category') || ''
  const couponCodeFromQuery = String(searchParams.get('coupon') || '').trim().toUpperCase()

  const redirectToLogin = () => {
    const params = new URLSearchParams()
    if (slotId) params.set('slotId', slotId)
    if (bookingId) params.set('bookingId', bookingId)
    if (dateStr) params.set('date', dateStr)
    if (timeStr) params.set('time', timeStr)
    if (categoryParam) params.set('category', categoryParam)

    const returnUrl = `/instrutor/${id}/agendar${params.toString() ? `?${params.toString()}` : ''}`
    router.push(`/entrar?redirectTo=${encodeURIComponent(returnUrl)}`)
  }

  useEffect(() => {
    let mounted = true

    const loadUserContact = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        const user = data.user

        if (!user) {
          if (mounted) {
            setCustomerEmail('')
            setCustomerPhone('')
          }
          return
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .limit(1)
          .maybeSingle()

        if (mounted) {
          setCustomerEmail(user.email || '')
          setCustomerPhone(String(profile?.phone || '').trim())
        }
      } catch {
        if (mounted) {
          setCustomerEmail('')
          setCustomerPhone('')
        }
      }
    }

    void loadUserContact()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const loadPlatformSettings = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('platform_settings')
          .select('platform_fee_percent,pix_fee_percent,card_fee_percent')
          .eq('key', 'default')
          .maybeSingle()

        if (mounted) setPlatformSettings(normalizePlatformPricingSettings(data))
      } catch {
        if (mounted) setPlatformSettings(DEFAULT_PLATFORM_PRICING_SETTINGS)
      }
    }

    void loadPlatformSettings()

    return () => {
      mounted = false
    }
  }, [])
  // Handle return from Mercado Pago Checkout Pro
  useEffect(() => {
    const mpReturn = searchParams.get('mp_return')
    const mpPaymentId = searchParams.get('payment_id')
    if (!mpReturn || !mpPaymentId) return

    if (mpReturn === 'failure') {
      toast.error('Pagamento não aprovado. Tente novamente.')
      return
    }

    if (mpReturn === 'pending') {
      toast.info('Pagamento pendente. Aguarde a confirmação do Mercado Pago.')
      return
    }

    if (mpReturn === 'approved') {
      const run = async () => {
        setLoading(true)
        try {
          const intent: PaymentIntent = {
            id: mpPaymentId,
            amount: 0,
            currency: 'BRL',
            status: 'paid',
            provider: 'mercadopago',
            provider_reference: mpPaymentId,
          }
          await createBookingAfterPayment(intent)
          setStep('success')
        } catch (err) {
          toast.error((err as Error).message || 'Erro ao confirmar reserva.')
        } finally {
          setLoading(false)
        }
      }
      void run()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ensureStudentPhone = () => {
    if (customerPhone.trim()) return true

    toast.error('Informe seu telefone antes de agendar a aula.')
    router.push('/onboarding?role=student')
    return false
  }

  useEffect(() => {
    let mounted = true

    const loadInstructor = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('instructors')
          .select('*, profile:profiles(full_name, avatar_url)')
          .eq('id', id)
          .maybeSingle()

        if (!mounted) return

        if (error || !data) {
          setInstructor(null)
          return
        }

        const profile = data.profile || {}
        setInstructor({
          id: String(data.id || ''),
          name: String(profile.full_name || 'Instrutor'),
          avatar_url: String(profile.avatar_url || '').trim() || null,
          rating: Number(data.rating || 0),
          review_count: Number(data.review_count || 0),
          price_per_lesson: Number(data.price_per_lesson || 0),
          price_per_lesson_a: data.price_per_lesson_a !== null && data.price_per_lesson_a !== undefined ? Number(data.price_per_lesson_a) : null,
          price_per_lesson_b: data.price_per_lesson_b !== null && data.price_per_lesson_b !== undefined ? Number(data.price_per_lesson_b) : null,
          neighborhood: String(data.neighborhood || ''),
          city: String(data.city || 'Fortaleza'),
          state: String(data.state || 'CE'),
          bio: data.bio ? String(data.bio) : null,
          category: String(data.category || 'B') as InstructorCard['category'],
          categories: Array.isArray(data.categories)
            ? data.categories.map((item: unknown) => String(item) as InstructorCard['category'])
            : [],
          vehicle_type: data.vehicle_type ? String(data.vehicle_type) : null,
          vehicle_brand: data.vehicle_brand ? String(data.vehicle_brand) : null,
          total_lessons: Number(data.total_lessons || 0),
          latitude: data.latitude !== null && data.latitude !== undefined ? Number(data.latitude) : null,
          longitude: data.longitude !== null && data.longitude !== undefined ? Number(data.longitude) : null,
          is_verified: Boolean(data.is_verified),
          available_today: true,
          availability_label: 'available',
          min_advance_booking_hours: Number(data.min_advance_booking_hours || 2),
          cancellation_notice_hours: Number(data.cancellation_notice_hours || 24),
        })
      } catch {
        if (mounted) setInstructor(null)
      } finally {
        if (mounted) setLoadingInstructor(false)
      }
    }

    void loadInstructor()

    return () => {
      mounted = false
    }
  }, [id])

  const instructorPrice = resolveLessonPrice(instructor, categoryParam)
  const split = calculatePaymentSplit(instructorPrice, 'pix', platformSettings)
  const payableAmount = appliedCoupon?.final_amount ?? split.gross
  const payableSplit = applyAmountToPaymentSplit(split, payableAmount)
  const activeCouponCode = appliedCoupon?.code || couponCodeFromQuery
  const minAdvanceHours = instructor?.min_advance_booking_hours ?? 2
  const cancellationNoticeHours = instructor?.cancellation_notice_hours ?? 24
  const cancellationNoticeLabel =
    cancellationNoticeHours >= 24 && cancellationNoticeHours % 24 === 0
      ? `${cancellationNoticeHours / 24} dia(s)`
      : `${cancellationNoticeHours} hora(s)`

  const isBeforeMinAdvanceWindow = () => {
    if (!dateStr || !timeStr) return false
    const slotStart = new Date(`${dateStr}T${timeStr.slice(0, 5)}:00`)
    const cutoff = new Date(Date.now() + minAdvanceHours * 60 * 60 * 1000)
    return slotStart.getTime() < cutoff.getTime()
  }

  const syncPaymentWithBooking = useCallback(
    async (paymentIntent: PaymentIntent, createdBookingId: string) => {
      const paymentId = String(paymentIntent.provider_reference || paymentIntent.id || '').trim()
      if (!paymentId || paymentIntent.provider !== 'mercadopago') return

      const response = await fetch('/api/payments/link-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: createdBookingId,
          paymentId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency || 'BRL',
          status: paymentIntent.status,
          metadata: {
            bookingId: createdBookingId,
            slotId,
            date: dateStr,
            time: timeStr,
            instructorId: String(id),
            couponCode: activeCouponCode,
          },
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Falha ao registrar pagamento na reserva.')
      }
    },
    [activeCouponCode, dateStr, id, slotId, timeStr],
  )

  const queueAvailabilityBackfill = useCallback((createdBookingId: string) => {
    void fetch('/api/payments/link-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'backfill-availability',
        bookingId: createdBookingId,
      }),
    }).catch(() => null)
  }, [])

  const createBookingAfterPayment = useCallback(async (paymentIntent: PaymentIntent) => {
    if (!dateStr || !timeStr) throw new Error('Data/horário inválidos para criar agendamento.')

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) throw new Error('Sessao expirada. Faca login novamente.')

    const startHHMM = timeStr.slice(0, 5)
    const [h, m] = startHHMM.split(':').map(Number)
    const endHHMM = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    const isUuid = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

    const normalizeInstructorId = (raw: string) => {
      if (isUuid(raw)) return raw
      const n = Number(raw)
      if (Number.isInteger(n) && n >= 1 && n <= 999999999999) {
        return `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`
      }
      return raw
    }

    const normalizedInstructorId = normalizeInstructorId(String(id))
    const normalizedSlotId = isUuid(slotId) ? slotId : null

    await db.from('students').upsert({ id: user.id }, { onConflict: 'id' })

    const existingBooking = await db
      .from('bookings')
      .select('id')
      .eq('student_id', user.id)
      .eq('instructor_id', normalizedInstructorId)
      .eq('scheduled_date', dateStr)
      .eq('start_time', startHHMM)
      .limit(1)
      .maybeSingle()

    if (existingBooking.data?.id) {
      const existingBookingId = String(existingBooking.data.id)
      await syncPaymentWithBooking(paymentIntent, String(existingBooking.data.id))
      if (normalizedSlotId) await db.from('instructor_availability').update({ is_booked: true }).eq('id', normalizedSlotId)
      if (activeCouponCode) {
        await fetch('/api/coupons/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: activeCouponCode }),
        })
      }
      queueAvailabilityBackfill(existingBookingId)
      return
    }

    const newSchemaPayload = {
      student_id: user.id,
      instructor_id: normalizedInstructorId,
      availability_slot_id: normalizedSlotId,
      scheduled_date: dateStr,
      start_time: startHHMM,
      end_time: endHHMM,
      status: 'confirmed',
      total_amount: payableSplit.gross,
      platform_fee: payableSplit.platformFee,
      instructor_net: payableSplit.instructorNet,
    }

    const oldSchemaPayload = {
      student_id: user.id,
      instructor_id: normalizedInstructorId,
      availability_id: normalizedSlotId,
      date: dateStr,
      start_time: startHHMM,
      end_time: endHHMM,
      status: 'confirmed',
      gross_amount: payableSplit.gross,
      platform_fee: payableSplit.platformFee,
      instructor_net: payableSplit.instructorNet,
    }

    const tryInsertNew = await db.from('bookings').insert(newSchemaPayload).select('id').single()
    if (!tryInsertNew.error && tryInsertNew.data?.id) {
      const createdBookingId = String(tryInsertNew.data.id)
      await syncPaymentWithBooking(paymentIntent, String(tryInsertNew.data.id))
      if (normalizedSlotId) await db.from('instructor_availability').update({ is_booked: true }).eq('id', normalizedSlotId)
      if (activeCouponCode) {
        await fetch('/api/coupons/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: activeCouponCode }),
        })
      }
      queueAvailabilityBackfill(createdBookingId)
      return
    }

    const tryInsertOld = await db.from('bookings').insert(oldSchemaPayload).select('id').single()
    if (!tryInsertOld.error && tryInsertOld.data?.id) {
      const createdBookingId = String(tryInsertOld.data.id)
      await syncPaymentWithBooking(paymentIntent, String(tryInsertOld.data.id))
      if (normalizedSlotId) await db.from('instructor_availability').update({ is_booked: true }).eq('id', normalizedSlotId)
      if (activeCouponCode) {
        await fetch('/api/coupons/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: activeCouponCode }),
        })
      }
      queueAvailabilityBackfill(createdBookingId)
      return
    }

    throw new Error(tryInsertOld.error?.message || tryInsertNew.error?.message || 'Falha ao criar agendamento.')
  }, [activeCouponCode, dateStr, id, payableSplit.gross, payableSplit.instructorNet, payableSplit.platformFee, queueAvailabilityBackfill, slotId, syncPaymentWithBooking, timeStr])

  const handlePixConfirm = async () => {
    if (!pixIntentId) {
      toast.error('Gere o QR Code Pix antes de confirmar.')
      return
    }

    setLoading(true)
    try {
      const result = await paymentService.confirmPayment(pixIntentId, { slotId, date: dateStr, time: timeStr })

      if (!result.data || result.error) {
        toast.error(result.error || 'Nao foi possivel verificar o pagamento.')
        return
      }

      if (result.data.status === 'paid') {
        await createBookingAfterPayment(result.data)
        setStep('success')
        return
      }

      if (result.data.status === 'failed') {
        toast.error('Pagamento nao aprovado. Gere um novo PIX e tente novamente.')
        return
      }

      toast.info('Pagamento ainda pendente. Aguarde alguns segundos e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handlePixGenerate = async () => {
    if (isBeforeMinAdvanceWindow()) {
      toast.error(`Este instrutor aceita agendamento com no minimo ${minAdvanceHours}h de antecedencia.`)
      return
    }

    if (!customerEmail) {
      redirectToLogin()
      return
    }

    if (!ensureStudentPhone()) {
      return
    }

    setLoading(true)
    try {
      const result = await paymentService.createPaymentIntent({
        amount: payableSplit.gross,
        currency: 'BRL',
        paymentMethod: 'pix',
        customerEmail,
        description: `Aula com ${instructor?.name || 'Instrutor'} em ${dateStr} as ${timeStr}`,
        metadata: {
          bookingId,
          slotId,
          date: dateStr,
          time: timeStr,
          instructorId: String(id),
          couponCode: activeCouponCode,
        },
      })

      if (!result.data || result.error) {
        toast.error(result.error || 'Nao foi possivel gerar o Pix.')
        return
      }

      setPixIntentId(result.data.id)
      setPixCode(result.data.pix_qr_code || '')
      setPixQrBase64(result.data.pix_qr_code_base64 || '')
      setStep('pix')
    } catch {
      toast.error('Erro ao gerar Pix. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }


  const handleCardCheckoutPro = async () => {
    if (!customerEmail) { redirectToLogin(); return }
    if (!ensureStudentPhone()) return
    if (isBeforeMinAdvanceWindow()) {
      toast.error(`Este instrutor aceita agendamento com no minimo ${minAdvanceHours}h de antecedencia.`)
      return
    }

    setLoading(true)
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const baseParams = new URLSearchParams()
      if (slotId) baseParams.set('slotId', slotId)
      if (dateStr) baseParams.set('date', dateStr)
      if (timeStr) baseParams.set('time', timeStr)
      if (categoryParam) baseParams.set('category', categoryParam)
      if (activeCouponCode) baseParams.set('coupon', activeCouponCode)

      const successUrl = `${appUrl}/instrutor/${id}/agendar?${baseParams.toString()}&mp_return=approved`
      const failureUrl = `${appUrl}/instrutor/${id}/agendar?${baseParams.toString()}&mp_return=failure`
      const pendingUrl = `${appUrl}/instrutor/${id}/agendar?${baseParams.toString()}&mp_return=pending`

      const res = await fetch('/api/payments/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payableSplit.gross,
          currency: 'BRL',
          customerEmail,
          description: `Aula com ${instructor?.name || 'Instrutor'} em ${dateStr} as ${timeStr}`,
          successUrl,
          failureUrl,
          pendingUrl,
          metadata: { slotId, date: dateStr, time: timeStr, instructorId: String(id), couponCode: activeCouponCode },
        }),
      })
      const payload = await res.json()
      if (!res.ok || !payload?.data?.init_point) {
        toast.error(payload?.error || 'Não foi possível iniciar o checkout.')
        return
      }
      window.location.href = payload.data.init_point
    } catch {
      toast.error('Erro ao iniciar checkout. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdvanceToPayment = async () => {
    if (!customerEmail) {
      redirectToLogin()
      return
    }

    if (!ensureStudentPhone()) {
      return
    }

    if (payMethod === 'pix') {
      await handlePixGenerate()
      return
    }

    await handleCardCheckoutPro()
  }

  const copyPix = () => {
    if (!pixCode) {
      toast.error('Codigo Pix indisponivel.')
      return
    }

    navigator.clipboard.writeText(pixCode)
    setPixCopied(true)
    toast.success('Codigo Pix copiado!')
    setTimeout(() => setPixCopied(false), 3000)
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Informe um codigo de cupom.')
      return
    }

    setCouponLoading(true)
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, amount: split.gross }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Cupom invalido.')

      setAppliedCoupon({
        code: String(payload.data.code || couponCode.toUpperCase()),
        discount_amount: Number(payload.data.discount_amount || 0),
        final_amount: Number(payload.data.final_amount || split.gross),
      })
      setCouponCode(String(payload.data.code || couponCode).toUpperCase())
      toast.success('Cupom aplicado com sucesso!')
    } catch (err) {
      setAppliedCoupon(null)
      toast.error((err as Error).message || 'Nao foi possivel aplicar cupom.')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
  }

  if (loadingInstructor) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-12 text-gray-500 sm:px-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando instrutor...
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!instructor) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
            <h1 className="text-2xl font-extrabold text-gray-900">Instrutor nao encontrado</h1>
            <p className="mt-2 text-sm text-gray-500">
              Nao foi possivel carregar os dados deste instrutor para concluir o agendamento.
            </p>
            <Link
              href={`/instrutor/${id}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao perfil
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          {step !== 'success' && (
            <Link
              href={`/instrutor/${id}`}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao perfil
            </Link>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold text-gray-900">Confirmar agendamento</h1>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <Image
                    src={
                      instructor.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=1D4ED8&color=fff&size=80`
                    }
                    alt={instructor.name}
                    width={60}
                    height={60}
                    className="rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-bold text-gray-900">{instructor.name}</p>
                    <p className="text-sm text-gray-500">
                      {instructor.neighborhood} - Cat. {instructor.category}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-blue-700" />
                    <span>
                      {dateStr
                        ? format(new Date(`${dateStr}T00:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-blue-700" />
                    <span>{timeStr ? `${timeStr.slice(0, 5)} - 60 min` : '-'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-bold text-gray-900">Resumo do pagamento</h2>
                <div className="space-y-2 text-sm">
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Desconto ({appliedCoupon.code})</span>
                      <span>- {formatCurrency(appliedCoupon.discount_amount)}</span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-base font-extrabold text-gray-900">
                    <span>Total a pagar</span>
                    <span className="text-blue-700">{formatCurrency(payableAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                Cancelamentos são aceitos até {cancellationNoticeLabel} antes da aula.
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-gray-900">Cupom de desconto</h2>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Digite seu cupom"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={couponLoading}
                  />
                  {!appliedCoupon ? (
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {couponLoading ? 'Aplicando...' : 'Aplicar'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Remover
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-xs font-semibold text-emerald-700">
                    Cupom {appliedCoupon.code} aplicado. Economize {formatCurrency(appliedCoupon.discount_amount)}.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-bold text-gray-900">Forma de pagamento</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPayMethod('pix')}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                      payMethod === 'pix' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <QrCode className={`h-7 w-7 ${payMethod === 'pix' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${payMethod === 'pix' ? 'text-emerald-700' : 'text-gray-600'}`}>
                      Pix
                    </span>
                  </button>

                  <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-4 opacity-50 cursor-not-allowed">
                    <CreditCard className="h-7 w-7 text-gray-300" />
                    <span className="text-sm font-bold text-gray-400">Cartao de credito</span>
                    <span className="text-xs font-medium text-gray-400 text-center">Em breve</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAdvanceToPayment}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : payMethod === 'pix' ? (
                  <>
                    <QrCode className="h-4 w-4" />
                    Gerar QR Code Pix
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Ir para pagamento
                  </>
                )}
              </button>
            </div>
          )}


          {step === 'pix' && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold text-gray-900">Pagamento via Pix</h1>

              <div className="flex flex-col items-center gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                {pixQrBase64 ? (
                  <Image
                    src={`data:image/png;base64,${pixQrBase64}`}
                    alt="QR Code PIX"
                    width={192}
                    height={192}
                    className="h-48 w-48 rounded-2xl border border-gray-200 bg-white p-2"
                  />
                ) : (
                  <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                    <QrCode className="h-16 w-16 text-gray-300" />
                    <span className="px-4 text-center text-xs text-gray-400">QR Code indisponivel no momento</span>
                  </div>
                )}

                <div className="w-full text-center">
                  <p className="mb-1 text-sm font-semibold text-gray-700">Valor a pagar</p>
                  <p className="text-3xl font-extrabold text-emerald-600">{formatCurrency(payableAmount)}</p>
                  <p className="mt-1 text-xs text-gray-400">Valido por 30 minutos</p>
                </div>

                <div className="w-full">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Pix copia e cola</p>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="flex-1 truncate font-mono text-xs text-gray-500">
                      {pixCode ? `${pixCode.slice(0, 40)}...` : 'Codigo Pix indisponivel'}
                    </p>
                    <button
                      onClick={copyPix}
                      className={`flex flex-shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        pixCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {pixCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {pixCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <ol className="w-full space-y-1.5 rounded-xl bg-emerald-50 p-4 text-sm text-gray-600">
                  <li className="flex items-start gap-2"><span className="flex-shrink-0 font-bold text-emerald-700">1.</span> Abra o app do seu banco</li>
                  <li className="flex items-start gap-2"><span className="flex-shrink-0 font-bold text-emerald-700">2.</span> Escolha pagar com Pix</li>
                  <li className="flex items-start gap-2"><span className="flex-shrink-0 font-bold text-emerald-700">3.</span> Escaneie o QR code ou cole o codigo acima</li>
                  <li className="flex items-start gap-2"><span className="flex-shrink-0 font-bold text-emerald-700">4.</span> Confirme o pagamento de {formatCurrency(payableAmount)}</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('review')}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handlePixConfirm}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Ja paguei
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">Aula agendada!</h1>
              <p className="mt-2 max-w-sm text-gray-500">
                Seu pagamento foi confirmado. A aula com{' '}
                <span className="font-semibold text-gray-800">{instructor.name}</span> esta agendada para{' '}
                <span className="font-semibold text-gray-800">
                  {dateStr && format(new Date(`${dateStr}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR })} as {timeStr.slice(0, 5)}
                </span>
                .
              </p>

              <div className="mt-8 flex gap-3">
                <Link
                  href="/aluno/dashboard"
                  className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-800"
                >
                  Ir para minhas aulas
                </Link>
                <Link
                  href="/instrutores"
                  className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Ver mais instrutores
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <main className="min-h-screen bg-gray-50">
            <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-12 text-gray-500 sm:px-6">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando checkout...
            </div>
          </main>
          <Footer />
        </>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}








