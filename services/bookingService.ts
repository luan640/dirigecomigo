import type { ApiResponse, BookingStatus } from '@/types'
import { MOCK_STUDENT_BOOKINGS, MOCK_INSTRUCTOR_BOOKINGS } from '@/lib/mock-data'
import { calculatePaymentSplit } from '@/utils/payment'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export interface CreateBookingParams {
  student_id: string
  instructor_id: string
  availability_id: string
  date: string
  start_time: string
  end_time: string
  gross_amount: number
  notes?: string
}

/**
 * Booking service — manages lesson booking lifecycle.
 */
export const bookingService = {
  /**
   * Create a new booking (called after successful payment)
   */
  async createBooking(params: CreateBookingParams): Promise<ApiResponse<{ id: string }>> {
    if (DEMO_MODE) {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 800))
      return { data: { id: `demo-booking-${Date.now()}` }, error: null }
    }

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { platformFee, instructorNet } = calculatePaymentSplit(params.gross_amount)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bookings')
        .insert({
          ...params,
          status: 'pending',
          platform_fee: platformFee,
          instructor_net: instructorNet,
        })
        .select('id')
        .single()

      if (error) throw error

      // Mark the availability slot as booked
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('instructor_availability')
        .update({ is_booked: true })
        .eq('id', params.availability_id)

      return { data: { id: data.id }, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },

  /**
   * Get bookings for a student
   */
  async getStudentBookings(studentId: string): Promise<ApiResponse<typeof MOCK_STUDENT_BOOKINGS>> {
    if (DEMO_MODE) {
      await new Promise(r => setTimeout(r, 300))
      return { data: MOCK_STUDENT_BOOKINGS, error: null }
    }

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          instructor:instructors(*, profile:profiles(*))
        `)
        .eq('student_id', studentId)
        .order('date', { ascending: false })

      if (error) throw error
      return { data: data as typeof MOCK_STUDENT_BOOKINGS, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },

  /**
   * Get bookings for an instructor
   */
  async getInstructorBookings(instructorId: string): Promise<ApiResponse<typeof MOCK_INSTRUCTOR_BOOKINGS>> {
    if (DEMO_MODE) {
      await new Promise(r => setTimeout(r, 300))
      return { data: MOCK_INSTRUCTOR_BOOKINGS, error: null }
    }

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          student:students(*, profile:profiles(*))
        `)
        .eq('instructor_id', instructorId)
        .order('date', { ascending: false })

      if (error) throw error
      return { data: data as typeof MOCK_INSTRUCTOR_BOOKINGS, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus
  ): Promise<ApiResponse<null>> {
    if (DEMO_MODE) {
      return { data: null, error: null }
    }

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)

      if (error) throw error
      return { data: null, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },
}
