import type { Database, BookingStatus, PaymentStatus, SubscriptionStatus, VehicleCategory } from './database'

// Row types from database
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type InstructorDB = Database['public']['Tables']['instructors']['Row']
export type InstructorAvailability = Database['public']['Tables']['instructor_availability']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']

// Enriched types used throughout the app
export interface InstructorWithProfile extends InstructorDB {
  profile: Profile
}

export interface InstructorFull extends InstructorDB {
  profile: Profile
  reviews: Review[]
  availability: InstructorAvailability[]
  active_subscription: Subscription | null
}

export interface BookingFull extends Booking {
  instructor: InstructorWithProfile
  student: Student & { profile: Profile }
  payment: Payment | null
}

// UI-level types (used in components)
export interface InstructorCard {
  id: string
  name: string
  avatar_url: string | null
  rating: number
  review_count: number
  price_per_lesson: number
  neighborhood: string
  city: string
  state: string
  bio: string | null
  category: VehicleCategory
  categories?: VehicleCategory[]   // all offered vehicle categories
  vehicle_type: string | null
  vehicle_brand: string | null
  total_lessons: number
  latitude: number | null
  longitude: number | null
  is_verified: boolean
  available_today: boolean
  availability_label: 'available' | 'limited' | 'unavailable'
  min_advance_booking_hours?: number
  cancellation_notice_hours?: number
}

export interface AvailabilitySlot {
  id: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean
  is_blocked: boolean
}

export interface BookingSummary {
  instructor: InstructorCard
  slot: AvailabilitySlot
  gross_amount: number
  platform_fee: number
  instructor_net: number
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  client_secret?: string
  provider: 'mercadopago' | 'stripe' | 'mock'
  provider_reference?: string
  pix_qr_code?: string
  pix_qr_code_base64?: string
  expires_at?: string
}

export interface LessonPackage {
  id: string
  instructor_id: string
  name: string
  description: string | null
  lessons_count: number
  price: number
  category: VehicleCategory
  is_active: boolean
}

export interface LessonPackage {
  id: string
  instructor_id: string
  name: string
  description: string | null
  lessons_count: number
  price: number
  category: VehicleCategory
  is_active: boolean
}

// Search / filter types
export interface InstructorSearchFilters {
  neighborhood?: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  min_price?: number
  max_price?: number
  min_rating?: number
  available_today?: boolean
  category?: VehicleCategory
}

// Dashboard analytics types
export interface DailyRevenue {
  date: string
  gross: number
  net: number
  lessons: number
}

export interface InstructorAnalytics {
  total_lessons: number
  total_gross: number
  total_net: number
  total_platform_fees: number
  monthly_revenue: DailyRevenue[]
  daily_lessons: DailyRevenue[]
  upcoming_bookings: number
}

export interface StudentStats {
  total_lessons: number
  total_spent: number
  upcoming_lessons: number
  favorite_instructor: string | null
}

// Auth context type
export interface AuthUser {
  id: string
  email: string
  role: 'student' | 'instructor'
  full_name: string | null
  avatar_url: string | null
}

// API response wrappers
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export type { BookingStatus, PaymentStatus, SubscriptionStatus, VehicleCategory }
