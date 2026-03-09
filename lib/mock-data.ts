import type { InstructorCard, AvailabilitySlot, Review, BookingFull, LessonPackage } from '@/types'
import { addDays, format } from 'date-fns'

// Helper to generate today + future dates
const today = new Date()
const dateStr = (offset: number) => format(addDays(today, offset), 'yyyy-MM-dd')

// ─────────────────────────────────────────
//  Mock Instructors — Fortaleza CE
// ─────────────────────────────────────────
export const MOCK_INSTRUCTORS: InstructorCard[] = [
  {
    id: '1',
    name: 'Carlos Eduardo Santos',
    avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 4.9,
    review_count: 87,
    price_per_lesson: 120,
    neighborhood: 'Aldeota',
    city: 'Fortaleza',
    state: 'CE',
    bio: 'Instrutor certificado com 8 anos de experiência. Especialista em condutores iniciantes e pessoas com ansiedade ao volante. Método paciente e didático.',
    category: 'B',
    vehicle_type: 'Sedan',
    vehicle_brand: 'Honda City',
    categories: ['A', 'B'],
    total_lessons: 342,
    latitude: -3.7358,
    longitude: -38.5069,
    is_verified: true,
    available_today: true,
    availability_label: 'available',
    min_advance_booking_hours: 2,
    cancellation_notice_hours: 24,
  },
  {
    id: '2',
    name: 'Mariana Costa Lima',
    avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4.8,
    review_count: 63,
    price_per_lesson: 110,
    neighborhood: 'Meireles',
    city: 'Fortaleza',
    state: 'CE',
    bio: 'Instrutora com 6 anos de experiência e mais de 600 alunos formados. Aulas práticas e teóricas personalizadas. Atendo Meireles e regiões próximas.',
    category: 'B',
    vehicle_type: 'Hatch',
    vehicle_brand: 'VW Polo',
    total_lessons: 289,
    latitude: -3.7256,
    longitude: -38.5053,
    is_verified: true,
    available_today: true,
    availability_label: 'limited',
    min_advance_booking_hours: 2,
    cancellation_notice_hours: 24,
  },
  {
    id: '3',
    name: 'Roberto Ferreira Neto',
    avatar_url: 'https://randomuser.me/api/portraits/men/67.jpg',
    rating: 4.7,
    review_count: 45,
    price_per_lesson: 95,
    neighborhood: 'Benfica',
    city: 'Fortaleza',
    state: 'CE',
    bio: 'Especializado em categoria B e AB. Condutor seguro e tranquilo para quem tem medo de trânsito. Resultados na primeira tentativa na maioria dos alunos.',
    category: 'AB',
    vehicle_type: 'Sedan',
    vehicle_brand: 'Toyota Corolla',
    categories: ['A', 'B'],
    total_lessons: 198,
    latitude: -3.7450,
    longitude: -38.5461,
    is_verified: true,
    available_today: false,
    availability_label: 'limited',
    min_advance_booking_hours: 2,
    cancellation_notice_hours: 24,
  },
  {
    id: '4',
    name: 'Ana Paula Oliveira',
    avatar_url: 'https://randomuser.me/api/portraits/women/28.jpg',
    rating: 5.0,
    review_count: 31,
    price_per_lesson: 130,
    neighborhood: 'Cocó',
    city: 'Fortaleza',
    state: 'CE',
    bio: 'Instrutora premiada da região. Metodologia moderna, aulas com feedback em vídeo. Especialista em reprovados nos exames do DETRAN.',
    category: 'B',
    vehicle_type: 'SUV',
    vehicle_brand: 'Nissan Kicks',
    total_lessons: 155,
    latitude: -3.7494,
    longitude: -38.4895,
    is_verified: true,
    available_today: true,
    availability_label: 'available',
    min_advance_booking_hours: 2,
    cancellation_notice_hours: 24,
  },
  {
    id: '5',
    name: 'José Antônio Sousa',
    avatar_url: 'https://randomuser.me/api/portraits/men/12.jpg',
    rating: 4.6,
    review_count: 112,
    price_per_lesson: 85,
    neighborhood: 'Messejana',
    city: 'Fortaleza',
    state: 'CE',
    bio: 'Com 12 anos de estrada, já formei mais de mil motoristas na Grande Fortaleza. Preço justo, atendimento humanizado e carro zero km.',
    category: 'B',
    vehicle_type: 'Sedan',
    vehicle_brand: 'Chevrolet Onix',
    total_lessons: 521,
    latitude: -3.8312,
    longitude: -38.4950,
    is_verified: true,
    available_today: true,
    availability_label: 'available',
    min_advance_booking_hours: 2,
    cancellation_notice_hours: 24,
  },
  {
    id: '6',
    name: 'Fernanda Rocha Albuquerque',
    avatar_url: 'https://randomuser.me/api/portraits/women/61.jpg',
    rating: 4.8,
    review_count: 74,
    price_per_lesson: 115,
    neighborhood: 'Dionísio Torres',
    city: 'Fortaleza',
    state: 'CE',
    bio: 'Instrutora categoria B e C. Atendo empresas e particulares. Flexibilidade de horários de segunda a sábado, das 06h às 20h.',
    category: 'B',
    vehicle_type: 'Hatch',
    vehicle_brand: 'Hyundai HB20',
    categories: ['B', 'C'],
    total_lessons: 276,
    latitude: -3.7456,
    longitude: -38.5112,
    is_verified: true,
    available_today: false,
    availability_label: 'unavailable',
    min_advance_booking_hours: 2,
    cancellation_notice_hours: 24,
  },
  {
    id: '7',
    name: 'Paulo Henrique Alves',
    avatar_url: 'https://randomuser.me/api/portraits/men/48.jpg',
    rating: 4.7,
    review_count: 58,
    price_per_lesson: 100,
    neighborhood: 'Parangaba',
    city: 'Fortaleza',
    state: 'CE',
    bio: 'Instrutor acessível com carro automatizado para pessoas com deficiência. Especializado em motoristas com necessidades especiais e idosos.',
    category: 'B',
    vehicle_type: 'Sedan Automático',
    vehicle_brand: 'Fiat Cronos',
    total_lessons: 234,
    latitude: -3.7797,
    longitude: -38.5600,
    is_verified: true,
    available_today: true,
    availability_label: 'limited',
    min_advance_booking_hours: 2,
    cancellation_notice_hours: 24,
  },
  {
    id: '8',
    name: 'Juliana Medeiros Barros',
    avatar_url: 'https://randomuser.me/api/portraits/women/15.jpg',
    rating: 4.9,
    review_count: 91,
    price_per_lesson: 125,
    neighborhood: 'Fátima',
    city: 'Fortaleza',
    state: 'CE',
    bio: 'Veterana com 10 anos de experiência. Abordagem psicológica do trânsito. Ajudo alunos a superar o medo e a insegurança no volante.',
    category: 'B',
    vehicle_type: 'Hatch',
    vehicle_brand: 'Renault Sandero',
    total_lessons: 410,
    latitude: -3.7650,
    longitude: -38.5350,
    is_verified: true,
    available_today: true,
    availability_label: 'available',
    min_advance_booking_hours: 2,
    cancellation_notice_hours: 24,
  },
  {
    id: '9',
    name: 'André Luis Moura',
    avatar_url: 'https://randomuser.me/api/portraits/men/77.jpg',
    rating: 4.5,
    review_count: 39,
    price_per_lesson: 90,
    neighborhood: 'Centro',
    city: 'Fortaleza',
    state: 'CE',
    bio: 'Instrutor do Centro de Fortaleza. Domínio total do trânsito da área central, ideal para quem vai fazer prova no DETRAN da região.',
    category: 'B',
    vehicle_type: 'Hatch',
    vehicle_brand: 'Fiat Argo',
    total_lessons: 178,
    latitude: -3.7275,
    longitude: -38.5311,
    is_verified: false,
    available_today: true,
    availability_label: 'available',
    min_advance_booking_hours: 2,
    cancellation_notice_hours: 24,
  },
  {
    id: '10',
    name: 'Beatriz Nascimento Lima',
    avatar_url: 'https://randomuser.me/api/portraits/women/82.jpg',
    rating: 4.8,
    review_count: 53,
    price_per_lesson: 140,
    neighborhood: 'Cidade dos Funcionários',
    city: 'Fortaleza',
    state: 'CE',
    bio: 'Formação técnica em Educação de Trânsito. Aulas com simulador antes da pista. Taxa de aprovação no DETRAN superior a 95%.',
    category: 'B',
    vehicle_type: 'SUV',
    vehicle_brand: 'Jeep Renegade',
    total_lessons: 219,
    latitude: -3.7950,
    longitude: -38.4900,
    is_verified: true,
    available_today: false,
    availability_label: 'limited',
    min_advance_booking_hours: 2,
    cancellation_notice_hours: 24,
  },
]

// ─────────────────────────────────────────
//  Mock Lesson Packages
// ─────────────────────────────────────────
export const MOCK_PACKAGES: LessonPackage[] = [
  // Carlos (id: '1') — Cat A + B
  { id: 'pkg-1-1', instructor_id: '1', name: 'Pacote Iniciante',        description: '5 aulas para quem está aprendendo do zero. Acompanhamento próximo e método progressivo.',          lessons_count: 5,  price: 550,  category: 'B', is_active: true },
  { id: 'pkg-1-2', instructor_id: '1', name: 'Aprovação Express',       description: '10 aulas intensivas voltadas para a prova do DETRAN. Foco em manobras e percurso.',              lessons_count: 10, price: 1050, category: 'B', is_active: true },
  { id: 'pkg-1-3', instructor_id: '1', name: 'Habilitação Moto (Cat. A)', description: '5 aulas de 60 min com moto Honda CG 160. Ideal para quem quer a categoria A.',               lessons_count: 5,  price: 480,  category: 'A', is_active: true },
  // Roberto (id: '3') — Cat A + B
  { id: 'pkg-3-1', instructor_id: '3', name: 'Dupla Habilitação',       description: '4 aulas de moto (Cat. A) + 4 aulas de carro (Cat. B). Economize 15% em relação às aulas avulsas.', lessons_count: 8, price: 680,  category: 'B', is_active: true },
  { id: 'pkg-3-2', instructor_id: '3', name: 'Pacote Moto Completo',    description: '6 aulas de categoria A para quem quer a habilitação de moto do zero.',                          lessons_count: 6,  price: 510,  category: 'A', is_active: true },
  // Ana Paula (id: '4') — Cat B
  { id: 'pkg-4-1', instructor_id: '4', name: '5 Aulas Premium',         description: 'Pacote com 5 aulas e relatório de desempenho individualizado após cada aula.',                  lessons_count: 5,  price: 600,  category: 'B', is_active: true },
  { id: 'pkg-4-2', instructor_id: '4', name: 'Aprovação Garantida',     description: '10 aulas + 2 simulados de prova + revisão teórica. O mais completo da região.',                 lessons_count: 12, price: 1400, category: 'B', is_active: true },
  // Fernanda (id: '6') — Cat B + C
  { id: 'pkg-6-1', instructor_id: '6', name: 'Pacote Caminhão (Cat. C)', description: '6 aulas para habilitação de caminhão. Treinamento em veículo próprio, categoria C.',           lessons_count: 6,  price: 780,  category: 'C', is_active: true },
  { id: 'pkg-6-2', instructor_id: '6', name: 'Pacote Carro 5 Aulas',    description: '5 aulas de categoria B com horário estendido de segunda a sábado.',                            lessons_count: 5,  price: 530,  category: 'B', is_active: true },
  // Juliana (id: '8') — Cat B
  { id: 'pkg-8-1', instructor_id: '8', name: 'Pacote Anti-Reprovação',  description: '6 aulas focadas em quem foi reprovado no DETRAN. Técnicas para superar nervosismo e erros frequentes.', lessons_count: 6, price: 700, category: 'B', is_active: true },
  { id: 'pkg-8-2', instructor_id: '8', name: 'Pacote Completo',         description: '8 aulas progressivas do zero até a aprovação. Feedback em vídeo após cada aula.',               lessons_count: 8,  price: 900,  category: 'B', is_active: true },
]

// ─────────────────────────────────────────
//  Mock Availability Slots
// ─────────────────────────────────────────
export function generateMockAvailability(instructorId: string): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = []
  const times = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00', '17:00']

  for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
    // Skip Sundays
    const date = addDays(today, dayOffset)
    if (date.getDay() === 0) continue

    // Random subset of time slots
    const availableTimes = times.filter(() => Math.random() > 0.4)

    availableTimes.forEach((startTime, i) => {
      const [h, m] = startTime.split(':').map(Number)
      const endHour = h + 1
      const endTime = `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const isBooked = Math.random() < 0.25

      slots.push({
        id: `${instructorId}-${dayOffset}-${i}`,
        date: format(date, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        is_booked: isBooked,
        is_blocked: false,
      })
    })
  }

  return slots
}

// ─────────────────────────────────────────
//  Mock Reviews
// ─────────────────────────────────────────
export const MOCK_REVIEWS: Record<string, Review[]> = {
  '1': [
    {
      id: 'r1',
      created_at: '2026-02-10T14:30:00Z',
      booking_id: 'b1',
      student_id: 's1',
      instructor_id: '1',
      rating: 5,
      comment: 'Carlos é incrível! Muito paciente e didático. Aprendi a dirigir em apenas 10 aulas. Recomendo demais!',
      is_visible: true,
    },
    {
      id: 'r2',
      created_at: '2026-01-28T10:15:00Z',
      booking_id: 'b2',
      student_id: 's2',
      instructor_id: '1',
      rating: 5,
      comment: 'Excelente instrutor! Tive muito medo no começo mas ele foi super tranquilo e me deu confiança.',
      is_visible: true,
    },
    {
      id: 'r3',
      created_at: '2026-01-15T16:00:00Z',
      booking_id: 'b3',
      student_id: 's3',
      instructor_id: '1',
      rating: 4,
      comment: 'Ótimo profissional, pontual e educado. Carro bem conservado. Só achei um pouco caro.',
      is_visible: true,
    },
  ],
  '4': [
    {
      id: 'r4',
      created_at: '2026-02-20T09:00:00Z',
      booking_id: 'b4',
      student_id: 's4',
      instructor_id: '4',
      rating: 5,
      comment: 'Ana Paula é a melhor instrutora que já tive! O feedback em vídeo faz toda a diferença. Passei na primeira tentativa!',
      is_visible: true,
    },
    {
      id: 'r5',
      created_at: '2026-02-05T14:00:00Z',
      booking_id: 'b5',
      student_id: 's5',
      instructor_id: '4',
      rating: 5,
      comment: 'Metodologia diferenciada e muito eficaz. Vale cada centavo!',
      is_visible: true,
    },
  ],
  '8': [
    {
      id: 'r6',
      created_at: '2026-02-18T11:30:00Z',
      booking_id: 'b6',
      student_id: 's6',
      instructor_id: '8',
      rating: 5,
      comment: 'Juliana me ajudou a superar minha fobia de dirigir. Approach psicológico muito eficaz. Aprovo com louvor!',
      is_visible: true,
    },
  ],
}

// ─────────────────────────────────────────
//  Mock Bookings for Student Dashboard
// ─────────────────────────────────────────
export const MOCK_STUDENT_BOOKINGS = [
  {
    id: 'booking-1',
    date: dateStr(2),
    start_time: '09:00',
    end_time: '10:00',
    status: 'confirmed' as const,
    gross_amount: 120,
    platform_fee: 9.60,
    instructor_net: 110.40,
    instructor: MOCK_INSTRUCTORS[0],
  },
  {
    id: 'booking-2',
    date: dateStr(5),
    start_time: '14:00',
    end_time: '15:00',
    status: 'confirmed' as const,
    gross_amount: 110,
    platform_fee: 8.80,
    instructor_net: 101.20,
    instructor: MOCK_INSTRUCTORS[1],
  },
  {
    id: 'booking-3',
    date: dateStr(-5),
    start_time: '08:00',
    end_time: '09:00',
    status: 'completed' as const,
    gross_amount: 95,
    platform_fee: 7.60,
    instructor_net: 87.40,
    instructor: MOCK_INSTRUCTORS[2],
  },
  {
    id: 'booking-4',
    date: dateStr(-12),
    start_time: '16:00',
    end_time: '17:00',
    status: 'completed' as const,
    gross_amount: 120,
    platform_fee: 9.60,
    instructor_net: 110.40,
    instructor: MOCK_INSTRUCTORS[0],
  },
  {
    id: 'booking-5',
    date: dateStr(-20),
    start_time: '10:00',
    end_time: '11:00',
    status: 'cancelled' as const,
    gross_amount: 130,
    platform_fee: 10.40,
    instructor_net: 119.60,
    instructor: MOCK_INSTRUCTORS[3],
  },
]

// ─────────────────────────────────────────
//  Mock Instructor Dashboard Data
// ─────────────────────────────────────────
export const MOCK_INSTRUCTOR_BOOKINGS = [
  {
    id: 'ib-1',
    date: dateStr(0),
    start_time: '08:00',
    end_time: '09:00',
    status: 'confirmed' as const,
    gross_amount: 120,
    platform_fee: 9.60,
    instructor_net: 110.40,
    student_name: 'Lucas Andrade',
    student_avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
  },
  {
    id: 'ib-2',
    date: dateStr(0),
    start_time: '10:00',
    end_time: '11:00',
    status: 'confirmed' as const,
    gross_amount: 120,
    platform_fee: 9.60,
    instructor_net: 110.40,
    student_name: 'Camila Souza',
    student_avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
  },
  {
    id: 'ib-3',
    date: dateStr(1),
    start_time: '14:00',
    end_time: '15:00',
    status: 'pending' as const,
    gross_amount: 120,
    platform_fee: 9.60,
    instructor_net: 110.40,
    student_name: 'Felipe Martins',
    student_avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
  },
  {
    id: 'ib-4',
    date: dateStr(-2),
    start_time: '09:00',
    end_time: '10:00',
    status: 'completed' as const,
    gross_amount: 120,
    platform_fee: 9.60,
    instructor_net: 110.40,
    student_name: 'Patricia Lima',
    student_avatar: 'https://randomuser.me/api/portraits/women/19.jpg',
  },
  {
    id: 'ib-5',
    date: dateStr(-3),
    start_time: '15:00',
    end_time: '16:00',
    status: 'completed' as const,
    gross_amount: 120,
    platform_fee: 9.60,
    instructor_net: 110.40,
    student_name: 'Rodrigo Bezerra',
    student_avatar: 'https://randomuser.me/api/portraits/men/56.jpg',
  },
]

// Monthly revenue data for charts (last 6 months)
export const MOCK_MONTHLY_REVENUE = [
  { month: 'Set', gross: 1800, net: 1656, lessons: 15 },
  { month: 'Out', gross: 2040, net: 1876.8, lessons: 17 },
  { month: 'Nov', gross: 2280, net: 2097.6, lessons: 19 },
  { month: 'Dez', gross: 1920, net: 1766.4, lessons: 16 },
  { month: 'Jan', gross: 2520, net: 2318.4, lessons: 21 },
  { month: 'Fev', gross: 2760, net: 2539.2, lessons: 23 },
]

// Daily lessons this month
export const MOCK_DAILY_LESSONS = Array.from({ length: 28 }, (_, i) => ({
  day: i + 1,
  lessons: Math.floor(Math.random() * 4),
  gross: 0,
})).map(d => ({ ...d, gross: d.lessons * 120 }))
