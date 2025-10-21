// src/middleware.ts
// Middleware optimizado para Edge Runtime (< 1 MB)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Obtener el token de la cookie de NextAuth
  const token = request.cookies.get('next-auth.session-token') || 
                request.cookies.get('__Secure-next-auth.session-token')
  
  const isLoggedIn = !!token

  // Rutas públicas que no requieren autenticación
  const publicPaths = [
    '/login',
    '/register',
    '/verify-email',
    '/forgot-password',
    '/kiosco', // Kiosco es público
  ]

  // Verificar si la ruta actual es pública
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // Si está en ruta pública y está logueado → dashboard
  if (isPublicPath && isLoggedIn && pathname !== '/kiosco') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Si NO está en ruta pública y NO está logueado → login
  // (todas las demás rutas requieren autenticación excepto las explícitamente públicas)
  if (!isPublicPath && !isLoggedIn && pathname !== '/' && !pathname.startsWith('/kiosco')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configuración optimizada del matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (except api/auth)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public files (images, fonts, etc.)
     */
    '/((?!api(?!/auth)|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}
