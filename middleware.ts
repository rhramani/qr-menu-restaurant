import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Public routes — always accessible
  const publicPaths = ['/', '/login', '/menu', '/order']
  const isPublic = publicPaths.some(p => path === p || path.startsWith(p + '/'))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (user) {
    // Fetch role from profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profileData as { role: string } | null)?.role

    // Redirect authenticated users away from login
    if (path === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'super_admin' ? '/super-admin' : '/dashboard'
      return NextResponse.redirect(url)
    }

    // Protect super-admin routes
    if (path.startsWith('/super-admin') && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Protect dashboard routes
    if (path.startsWith('/dashboard') && !['restaurant_admin', 'staff'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/super-admin', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
