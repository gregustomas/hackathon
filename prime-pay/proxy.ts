import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
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

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const aalLevel = aalData?.currentLevel

  let hasMfaEnabled = false
  if (user) {
    const { data: mfaList } = await supabase.auth.mfa.listFactors()
    hasMfaEnabled = !!(mfaList?.totp && mfaList.totp.length > 0)
  }

  if (!user && !path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && path === '/auth/mfa') {
    if (!hasMfaEnabled || aalLevel === 'aal2') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (user && path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (user && path.startsWith('/dashboard') && (!hasMfaEnabled || aalLevel === 'aal2')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    const role = profile?.role || 'CLIENT'

    if (path.startsWith('/dashboard/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/client', request.url))
    }
    
    if (path.startsWith('/dashboard/banker') && role !== 'BANKER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/client', request.url))
    }

    if (path.startsWith('/dashboard/child') && role !== 'CHILD') {
      return NextResponse.redirect(new URL('/dashboard/client', request.url))
    }

    if (path.startsWith('/dashboard/client') && role === 'BANKER') {
      return NextResponse.redirect(new URL('/dashboard/banker', request.url))
    }
    
    if (path.startsWith('/dashboard/client') && role === 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url))
    }

    if (path === '/dashboard' || path === '/dashboard/') {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      if (role === 'BANKER') return NextResponse.redirect(new URL('/dashboard/banker', request.url))
      if (role === 'CHILD') return NextResponse.redirect(new URL('/dashboard/child', request.url))
      return NextResponse.redirect(new URL('/dashboard/client', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
