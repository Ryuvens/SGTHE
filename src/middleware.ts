// src/middleware.ts
// Middleware ultra-ligero optimizado para Edge Runtime (< 30 kB)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Lista de rutas públicas que NO requieren autenticación
  const publicPaths = [
    '/',           // Home (maneja su propio redirect)
    '/login',      // Página de login
    '/kiosco',     // Kiosco es público
    '/api/auth',   // NextAuth API routes
  ]
  
  // Verificar si la ruta actual es pública
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // Si es ruta pública, permitir acceso sin verificar sesión
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Para rutas protegidas, verificar sesión via cookies de NextAuth
  // En producción (HTTPS): __Secure-next-auth.session-token
  // En desarrollo (HTTP): next-auth.session-token
  const sessionToken = 
    request.cookies.get('__Secure-next-auth.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value
  
  const isAuthenticated = !!sessionToken
  
  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Si está autenticado, permitir acceso
  return NextResponse.next()
}

// Matcher ultra-específico: solo rutas protegidas
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/turnos/:path*',
    '/horas-extras/:path*',
    '/usuarios/:path*',
    '/reportes/:path*',
    '/configuracion/:path*',
  ],
}

