import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-middleware'

// Geliştirme modu: Supabase yapılandırılmamışsa auth'u bypass et
const DEV_BYPASS_AUTH = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http')

// Korunan rotalar
const protectedRoutes = ['/dashboard', '/haberler', '/kriz', '/rakip', '/raporlar']
const adminRoutes = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Statik dosyalar ve API rotaları için middleware çalıştırma
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // dosya uzantıları
  ) {
    return NextResponse.next()
  }

  // Korunan rota kontrolü
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route))

  if (!isProtected && !isAdmin) {
    return NextResponse.next()
  }

  // Dev bypass: Supabase yoksa direkt geç
  if (DEV_BYPASS_AUTH) {
    console.log('[nabızai] Dev modu: Auth bypass aktif — Supabase yapılandırılmamış')
    return NextResponse.next()
  }

  try {
    const { user, supabaseResponse } = await updateSession(request)

    if (!user) {
      // Auth yoksa login'e yönlendir
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Admin route kontrolü: gelecekte role bazlı kontrol eklenecek
    // if (isAdmin) {
    //   const { data: userRole } = await supabase
    //     .from('client_users')
    //     .select('role')
    //     .eq('user_id', user.id)
    //     .single()
    //   if (userRole?.role !== 'admin') {
    //     return NextResponse.redirect(new URL('/dashboard', request.url))
    //   }
    // }

    return supabaseResponse
  } catch {
    // Supabase bağlantı hatası durumunda devam et
    if (isProtected) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
