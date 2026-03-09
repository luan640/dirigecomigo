import type { InstructorCard, InstructorSearchFilters, ApiResponse } from '@/types'
import { MOCK_INSTRUCTORS, generateMockAvailability } from '@/lib/mock-data'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

/**
 * Instructor service — handles all instructor-related data operations.
 * In demo mode it reads from mock data; in production it queries Supabase.
 */
export const instructorService = {
  /**
   * Fetch all active instructors, optionally filtered
   */
  async getInstructors(filters?: InstructorSearchFilters): Promise<ApiResponse<InstructorCard[]>> {
    if (DEMO_MODE) {
      let results = [...MOCK_INSTRUCTORS]

      if (filters?.neighborhood) {
        results = results.filter(i =>
          i.neighborhood.toLowerCase().includes(filters.neighborhood!.toLowerCase())
        )
      }
      if (filters?.city) {
        results = results.filter(i =>
          i.city.toLowerCase().includes(filters.city!.toLowerCase())
        )
      }
      if (filters?.min_price !== undefined) {
        results = results.filter(i => i.price_per_lesson >= filters.min_price!)
      }
      if (filters?.max_price !== undefined) {
        results = results.filter(i => i.price_per_lesson <= filters.max_price!)
      }
      if (filters?.available_today) {
        results = results.filter(i => i.available_today)
      }
      if (filters?.category) {
        results = results.filter(i => i.category === filters.category)
      }

      return { data: results, error: null }
    }

    // Production: real Supabase call
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      let query = supabase
        .from('instructors')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('is_active', true)

      if (filters?.neighborhood) query = query.ilike('neighborhood', `%${filters.neighborhood}%`)
      if (filters?.city) query = query.ilike('city', `%${filters.city}%`)
      if (filters?.min_price) query = query.gte('price_per_lesson', filters.min_price)
      if (filters?.max_price) query = query.lte('price_per_lesson', filters.max_price)
      const { data, error } = await query.order('rating', { ascending: false })

      if (error) throw error
      return { data: data as unknown as InstructorCard[], error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },

  /**
   * Get a single instructor by ID
   */
  async getInstructorById(id: string): Promise<ApiResponse<InstructorCard>> {
    if (DEMO_MODE) {
      const instructor = MOCK_INSTRUCTORS.find(i => i.id === id) || null
      return {
        data: instructor,
        error: instructor ? null : 'Instrutor não encontrado',
      }
    }

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('instructors')
        .select('*, profile:profiles(*)')
        .eq('id', id)
        .single()

      if (error) throw error
      return { data: data as unknown as InstructorCard, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },

  /**
   * Get available slots for an instructor
   */
  async getAvailability(instructorId: string, fromDate?: string, toDate?: string) {
    if (DEMO_MODE) {
      return { data: generateMockAvailability(instructorId), error: null }
    }

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      let query = supabase
        .from('instructor_availability')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('is_blocked', false)
        .gte('date', fromDate || new Date().toISOString().split('T')[0])

      if (toDate) query = query.lte('date', toDate)

      const { data, error } = await query.order('date').order('start_time')

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },
}
