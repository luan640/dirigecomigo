import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// Routes that require the student role
const STUDENT_ROUTES = ['/aluno']
// Routes that require the instructor role
const INSTRUCTOR_ROUTES = ['/painel']
// Routes that require admin role
const ADMIN_ROUTES = ['/admin']
// Fully public routes (no auth needed)
const PUBLIC_PREFIXES = ['/', '/instrutores', '/instrutor', '/entrar', '/cadastro', '/onboarding', '/confirmacao-email', '/_next', '/favicon']

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Mercado Pago webhook must be publicly reachable (no auth redirect).
  if (pathname.startsWith('/api/webhooks/mercadopago')) {
    return NextResponse.next()
  }

  // API routes handle auth/authorization internally and must return JSON, not HTML redirects.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ── Demo mode: allow everything except let student/instructor routes
  //    still pass so we can showcase dashboards without real auth
  if (DEMO_MODE) {
    return NextResponse.next()
  }

  if (isPublic(pathname)) return NextResponse.next()

  // Create Supabase server client with cookie forwarding
  const response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: cookies => cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        ),
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    const loginUrl = new URL('/entrar', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Fetch role from profiles table
  const primaryProfileQuery = await supabase
    .from('profiles')
    .select('role,onboarding_completed')
    .eq('id', user.id)
    .single()

  let profile = primaryProfileQuery.data as { role?: string; onboarding_completed?: boolean } | null
  const primaryProfileError = String(primaryProfileQuery.error?.message || '')

  if (primaryProfileError.toLowerCase().includes('onboarding_completed')) {
    const fallbackProfileQuery = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    profile = fallbackProfileQuery.data
      ? { ...fallbackProfileQuery.data, onboarding_completed: false }
      : null
  }

  const role = profile?.role
  let onboardingCompleted = Boolean(profile?.onboarding_completed)

  // Student-only routes
  if (STUDENT_ROUTES.some(r => pathname.startsWith(r))) {
    if (role !== 'student') {
      return NextResponse.redirect(new URL('/entrar', request.url))
    }
  }

  // Instructor-only routes
  if (INSTRUCTOR_ROUTES.some(r => pathname.startsWith(r))) {
    if (role !== 'instructor') {
      return NextResponse.redirect(new URL('/entrar', request.url))
    }

    const isSubscriptionPage = pathname.startsWith('/painel/assinatura')

    if (!onboardingCompleted) {
      // Fallback for remote schema/cache lag: treat an already configured instructor
      // or an active subscription as an implicitly completed onboarding.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: instructor } = await (supabase.from('instructors') as any)
        .select('category,price_per_lesson,vehicle_type')
        .eq('id', user.id)
        .maybeSingle()

      const hasInstructorSetup = Boolean(
        instructor &&
        String(instructor.category || '').trim() &&
        Number(instructor.price_per_lesson || 0) >= 1
      )

      if (hasInstructorSetup) {
        onboardingCompleted = true
      }
    }

    if (!onboardingCompleted && !isSubscriptionPage) {
      return NextResponse.redirect(new URL('/onboarding?role=instructor', request.url))
    }

    // Check active subscription for painel routes (except assinatura itself)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('instructor_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const subscriptionStatus = String((sub as Record<string, unknown> | null)?.status || '')
    const endDateRaw = (sub as Record<string, unknown> | null)?.current_period_end
      || (sub as Record<string, unknown> | null)?.expires_at
    const today = new Date().toISOString().split('T')[0]
    const hasActiveSubscription = !!sub
      && subscriptionStatus === 'active'
      && typeof endDateRaw === 'string'
      && String(endDateRaw).slice(0, 10) >= today

    if (hasActiveSubscription) {
      onboardingCompleted = true
    }

    if (!isSubscriptionPage) {
      if (subscriptionStatus !== 'active') {
        return NextResponse.redirect(new URL('/painel/assinatura', request.url))
      }

      if (!hasActiveSubscription) {
        return NextResponse.redirect(new URL('/painel/assinatura', request.url))
      }
    }
  }

  // Admin-only routes
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/entrar', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
