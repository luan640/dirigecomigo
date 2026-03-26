// Supabase Database Types - mirrors the PostgreSQL schema exactly
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'student' | 'instructor' | 'admin'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type ManualLessonStatus = 'completed' | 'cancelled'
export type PayoutRequestStatus = 'pending' | 'processing' | 'paid' | 'rejected' | 'cancelled'
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded'
export type SubscriptionStatus = 'active' | 'pending' | 'expired' | 'cancelled'
export type VehicleCategory = 'A' | 'B' | 'AB' | 'C' | 'D' | 'E'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          phone: string | null
          email: string
          onboarding_completed: boolean
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      students: {
        Row: {
          id: string
          profile_id: string
          created_at: string
          updated_at: string
          date_of_birth: string | null
          cpf: string | null
        }
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      instructors: {
        Row: {
          id: string
          profile_id: string
          created_at: string
          updated_at: string
          bio: string | null
          price_per_lesson: number
          vehicle_type: string | null
          vehicle_brand: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          category: VehicleCategory
          categories: VehicleCategory[]
          neighborhood: string
          city: string
          state: string
          latitude: number | null
          longitude: number | null
          weekly_schedule: Json | null
          rating: number
          review_count: number
          total_lessons: number
          is_active: boolean
          is_verified: boolean
          min_advance_booking_hours: number
          cancellation_notice_hours: number
          price_per_lesson_a: number | null
          price_per_lesson_b: number | null
        }
        Insert: Omit<Database['public']['Tables']['instructors']['Row'], 'created_at' | 'updated_at' | 'rating' | 'review_count' | 'total_lessons'>
        Update: Partial<Database['public']['Tables']['instructors']['Insert']>
      }
      instructor_availability: {
        Row: {
          id: string
          instructor_id: string
          created_at: string
          date: string
          start_time: string
          end_time: string
          is_booked: boolean
          is_blocked: boolean
        }
        Insert: Omit<Database['public']['Tables']['instructor_availability']['Row'], 'created_at' | 'is_booked'>
        Update: Partial<Database['public']['Tables']['instructor_availability']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          instructor_id: string
          availability_slot_id: string | null
          scheduled_date: string
          start_time: string
          end_time: string
          status: BookingStatus
          total_amount: number
          platform_fee: number
          instructor_net: number
          notes: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      manual_lessons: {
        Row: {
          id: string
          instructor_id: string
          student_name: string
          student_phone: string | null
          category: VehicleCategory
          lesson_date: string
          start_time: string
          end_time: string
          amount: number
          status: ManualLessonStatus
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['manual_lessons']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['manual_lessons']['Insert']>
      }
      payout_requests: {
        Row: {
          id: string
          instructor_id: string
          amount: number
          status: PayoutRequestStatus
          notes: string | null
          admin_notes: string | null
          requested_at: string
          processed_at: string | null
          processed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payout_requests']['Row'], 'id' | 'requested_at' | 'created_at' | 'updated_at' | 'processed_at' | 'processed_by' | 'admin_notes'>
        Update: Partial<Database['public']['Tables']['payout_requests']['Insert']> & {
          processed_at?: string | null
          processed_by?: string | null
          admin_notes?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          created_at: string
          booking_id: string
          amount: number
          status: PaymentStatus
          provider: string
          provider_payment_id: string | null
          currency: string
          paid_at: string | null
          refunded_at: string | null
          metadata: Json | null
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      payment_refunds: {
        Row: {
          id: string
          payment_id: string
          booking_id: string | null
          provider: string
          provider_refund_id: string | null
          amount: number
          reason: string | null
          status: string
          refunded_by: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payment_refunds']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payment_refunds']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          instructor_id: string
          status: SubscriptionStatus
          amount: number
          started_at: string
          expires_at: string
          provider: string
          provider_reference: string | null
          cancelled_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      platform_settings: {
        Row: {
          key: string
          platform_fee_percent: number
          pix_fee_percent: number
          card_fee_percent: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['platform_settings']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['platform_settings']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          created_at: string
          booking_id: string
          student_id: string
          instructor_id: string
          rating: number
          comment: string | null
          is_visible: boolean
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      favorites: {
        Row: {
          id: string
          created_at: string
          student_id: string
          instructor_id: string
        }
        Insert: Omit<Database['public']['Tables']['favorites']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['favorites']['Insert']>
      }
      lesson_packages: {
        Row: {
          id: string
          instructor_id: string
          name: string
          description: string | null
          lessons_count: number
          price: number
          category: VehicleCategory
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['lesson_packages']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['lesson_packages']['Insert']>
      }
    }
    Enums: {
      user_role: UserRole
      booking_status: BookingStatus
      manual_lesson_status: ManualLessonStatus
      payout_request_status: PayoutRequestStatus
      payment_status: PaymentStatus
      subscription_status: SubscriptionStatus
      vehicle_category: VehicleCategory
    }
  }
}
