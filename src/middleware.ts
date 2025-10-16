// src/middleware.ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Rutas que requieren autenticación
  const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard') ||
                          nextUrl.pathname.startsWith('/turnos') ||
                          nextUrl.pathname.startsWith('/horas-extras') ||
                          nextUrl.pathname.startsWith('/usuarios') ||
                          nextUrl.pathname.startsWith('/reportes') ||
                          nextUrl.pathname.startsWith('/configuracion')

  // Rutas de autenticación (login, register, etc.)
  const isAuthRoute = nextUrl.pathname.startsWith('/login') ||
                     nextUrl.pathname.startsWith('/register') ||
                     nextUrl.pathname.startsWith('/verify-email') ||
                     nextUrl.pathname.startsWith('/forgot-password')

  // Si está en ruta de auth y ya está logueado → dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Si está en ruta protegida y NO está logueado → login
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  return NextResponse.next()
})

// Configurar qué rutas ejecutan el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

