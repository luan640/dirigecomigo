import Image from 'next/image'
import { notFound } from 'next/navigation'
import { addDays, format } from 'date-fns'
import { Star, MapPin, Car, CheckCircle2 } from 'lucide-react'
import { MOCK_INSTRUCTORS, MOCK_REVIEWS, generateMockAvailability } from '@/lib/mock-data'
import { loadPublicInstructors } from '@/lib/publicInstructors'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/utils/format'
import { VEHICLE_CATEGORY_LABELS } from '@/constants/pricing'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BookingSection from './BookingSection'

const CAT_CONFIG: Record<string, { label: string; color: string }> = {
  A: { label: 'Moto (Cat. A)', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
  B: { label: 'Carro (Cat. B)', color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  AB: { label: 'Moto + Carro (AB)', color: 'bg-purple-100 text-purple-700 border border-purple-200' },
  C: { label: 'Caminhao (Cat. C)', color: 'bg-green-100 text-green-700 border border-green-200' },
  D: { label: 'Onibus (Cat. D)', color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  E: { label: 'Carreta (Cat. E)', color: 'bg-gray-100 text-gray-700 border border-gray-200' },
}

const DEFAULT_WEEKLY_TEMPLATES: Record<string, Array<{ start_time: string; end_time: string }>> = {
  '1': ['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(start => ({
    start_time: start,
    end_time: `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:${start.slice(3, 5)}`,
  })),
  '2': ['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(start => ({
    start_time: start,
    end_time: `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:${start.slice(3, 5)}`,
  })),
  '3': ['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(start => ({
    start_time: start,
    end_time: `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:${start.slice(3, 5)}`,
  })),
  '4': ['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(start => ({
    start_time: start,
    end_time: `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:${start.slice(3, 5)}`,
  })),
  '5': ['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(start => ({
    start_time: start,
    end_time: `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:${start.slice(3, 5)}`,
  })),
  '6': ['08:00', '09:00', '10:00', '11:00'].map(start => ({
    start_time: start,
    end_time: `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:${start.slice(3, 5)}`,
  })),
}

type AvailabilityItem = {
  id: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean
}
type AvailabilityRow = {
  id: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean | null
}
type BookingRow = {
  availability_slot_id?: string | null
  scheduled_date?: string | null
  start_time?: string | null
  status?: string | null
}
type InstructorMetaRow = {
  created_at?: string | null
}

export async function generateStaticParams() {
  return MOCK_INSTRUCTORS.map(i => ({ id: i.id }))
}

async function loadInstructorProfileData(id: string) {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  if (demoMode) {
    const instructor = MOCK_INSTRUCTORS.find(item => item.id === id) || null
    return {
      instructor,
      reviews: instructor ? MOCK_REVIEWS[id] || [] : [],
      availability: instructor ? generateMockAvailability(id) : [],
      memberSince: '2026-01-01',
    }
  }

  const [instructors, supabase] = await Promise.all([loadPublicInstructors(), createClient()])
  const instructor = instructors.find(item => item.id === id) || null
  if (!instructor) return { instructor: null, reviews: [], availability: [] }

  const [availabilityResult, bookingResult, instructorMetaResult] = await Promise.all([
    supabase
      .from('instructor_availability')
      .select('id,date,start_time,end_time,is_booked')
      .eq('instructor_id', id)
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date', { ascending: true })
      .order('start_time', { ascending: true }),
    supabase
      .from('bookings')
      .select('availability_slot_id,scheduled_date,start_time,status')
      .eq('instructor_id', id)
      .gte('scheduled_date', new Date().toISOString().slice(0, 10)),
    supabase
      .from('instructors')
      .select('created_at')
      .eq('id', id)
      .maybeSingle(),
  ])

  const availabilityRows = availabilityResult.data
  const bookingRows = bookingResult.data
  const instructorMeta = (instructorMetaResult as { data: InstructorMetaRow | null; error: Error | null }).data

  const safeAvailabilityRows: AvailabilityRow[] = Array.isArray(availabilityRows) ? availabilityRows : []
  const safeBookingRows: BookingRow[] = Array.isArray(bookingRows) ? bookingRows : []

  const occupiedSlotKeys = new Set(
    safeBookingRows
      .filter(row => {
        const status = String(row.status || '')
        return status !== 'cancelled' && status !== 'no_show'
      })
      .map(row => {
        const availabilityId = String(row.availability_slot_id || '')
        if (availabilityId) return `id:${availabilityId}`
        const date = String(row.scheduled_date || '').slice(0, 10)
        const time = String(row.start_time || '').slice(0, 5)
        return date && time ? `time:${date}-${time}` : ''
      })
      .filter(Boolean),
  )

  const todayDate = new Date()
  const todayStr = format(todayDate, 'yyyy-MM-dd')
  const mappedAvailability: AvailabilityItem[] = safeAvailabilityRows
    .map(slot => ({
        id: String(slot.id),
        date: String(slot.date),
        start_time: String(slot.start_time).slice(0, 5),
        end_time: String(slot.end_time).slice(0, 5),
        is_booked:
          Boolean(slot.is_booked) ||
          occupiedSlotKeys.has(`id:${String(slot.id)}`) ||
          occupiedSlotKeys.has(`time:${String(slot.date)}-${String(slot.start_time).slice(0, 5)}`),
      }))

  const futureAvailability = mappedAvailability.filter(slot => slot.date >= todayStr)
  const availability =
    futureAvailability.length > 0
      ? futureAvailability
      : (() => {
          const templatesByWeekday = new Map<string, Array<{ start_time: string; end_time: string }>>()

          if (mappedAvailability.length === 0) {
            for (const [weekday, templates] of Object.entries(DEFAULT_WEEKLY_TEMPLATES)) {
              templatesByWeekday.set(weekday, templates)
            }
          } else {
            for (const slot of mappedAvailability) {
              const weekday = String(new Date(`${slot.date}T00:00:00`).getDay())
              const current = templatesByWeekday.get(weekday) || []
              const slotKey = `${slot.start_time}-${slot.end_time}`
              if (!current.some(item => `${item.start_time}-${item.end_time}` === slotKey)) {
                current.push({ start_time: slot.start_time, end_time: slot.end_time })
              }
              templatesByWeekday.set(weekday, current.sort((a, b) => a.start_time.localeCompare(b.start_time)))
            }
          }

          const generated: AvailabilityItem[] = []
          for (let offset = 0; offset <= 60; offset += 1) {
            const date = addDays(todayDate, offset)
            const dateStr = format(date, 'yyyy-MM-dd')
            const weekday = String(date.getDay())
            const templates = templatesByWeekday.get(weekday) || []
            for (const template of templates) {
              generated.push({
                id: `derived-${dateStr}-${template.start_time}`,
                date: dateStr,
                start_time: template.start_time,
                end_time: template.end_time,
                is_booked: occupiedSlotKeys.has(`time:${dateStr}-${template.start_time}`),
              })
            }
          }
          return generated
        })()

  return {
    instructor,
    reviews: [],
    availability,
    memberSince: String(instructorMeta?.created_at || '').slice(0, 10) || null,
  }
}

export default async function InstructorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { instructor, reviews, availability, memberSince } = await loadInstructorProfileData(id)
  if (!instructor) notFound()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-5">
                  <div className="relative flex-shrink-0">
                    <div className="h-24 w-24 overflow-hidden rounded-2xl bg-gray-100">
                      <Image
                        src={
                          instructor.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=1D4ED8&color=fff&size=120`
                        }
                        alt={instructor.name}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {instructor.is_verified && (
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-blue-700 p-1">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">{instructor.name}</h1>
                        {instructor.is_verified && (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Instrutor verificado
                          </span>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-2xl font-extrabold text-blue-700">{formatCurrency(instructor.price_per_lesson)}</p>
                        <p className="text-xs text-gray-400">por aula</p>
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      Na plataforma desde {memberSince ? formatDate(memberSince) : 'data nao informada'}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {instructor.neighborhood} - {instructor.city}/{instructor.state}
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="h-4 w-4" />
                        {instructor.vehicle_brand}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(instructor.categories ?? [instructor.category]).map(cat => (
                        <span
                          key={cat}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CAT_CONFIG[cat]?.color ?? 'border border-gray-200 bg-gray-100 text-gray-600'}`}
                        >
                          {CAT_CONFIG[cat]?.label ?? `Cat. ${cat}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-50 pt-5">
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-gray-900">{instructor.total_lessons}</p>
                    <p className="mt-0.5 text-xs text-gray-500">Aulas realizadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-gray-900">{instructor.min_advance_booking_hours ?? 2}h</p>
                    <p className="mt-0.5 text-xs text-gray-500">Antecedencia minima</p>
                  </div>
                </div>
              </div>

              {instructor.bio && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-3 text-lg font-bold text-gray-900">Sobre o instrutor</h2>
                  <p className="leading-relaxed text-gray-600">{instructor.bio}</p>
                </div>
              )}

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-gray-900">Detalhes da aula</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Detail label="Categoria CNH" value={`Cat. ${instructor.category} - ${VEHICLE_CATEGORY_LABELS[instructor.category]?.split('(')[0] || ''}`} />
                  <Detail label="Veiculo" value={instructor.vehicle_brand || 'Nao informado'} />
                  <Detail label="Tipo de veiculo" value={instructor.vehicle_type || 'Seda'} />
                  <Detail label="Duracao da aula" value="60 minutos" />
                  <Detail label="Local de aula" value={`${instructor.neighborhood} e arredores`} />
                  <Detail label="Total de alunos" value={`${instructor.total_lessons}+ formados`} />
                </div>
              </div>

              {reviews.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-bold text-gray-900">Avaliacoes dos alunos ({reviews.length})</h2>
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0">
                        <div className="mb-1 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">A</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">Aluno verificado</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star
                                    key={s}
                                    className={`h-3 w-3 ${
                                      s <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                          </div>
                        </div>
                        {review.comment && <p className="ml-10 text-sm text-gray-600">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <BookingSection instructor={instructor} availability={availability} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}
