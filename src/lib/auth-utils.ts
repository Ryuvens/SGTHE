// src/lib/auth-utils.ts
import { auth } from '@/auth'
import { Rol } from '@/generated/prisma'

/**
 * Obtiene la sesión del usuario actual
 * Para usar en Server Components y Server Actions
 */
export async function getSession() {
  return await auth()
}

/**
 * Obtiene el usuario actual o null si no está autenticado
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * Verifica si el usuario está autenticado
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!session?.user
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export async function hasRole(role: Rol | Rol[]) {
  const user = await getCurrentUser()
  if (!user) return false

  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(user.rol as Rol)
}

/**
 * Verifica si el usuario es administrador
 */
export async function isAdmin() {
  return await hasRole('ADMIN')
}

/**
 * Verifica si el usuario es supervisor
 */
export async function isSupervisor() {
  return await hasRole(['ADMIN', 'SUPERVISOR'])
}

/**
 * Verifica si el usuario es encargado de personal
 */
export async function isEncargadoPersonal() {
  return await hasRole(['ADMIN', 'SUPERVISOR', 'ENCARGADO_PERSONAL'])
}

/**
 * Lanza error si el usuario no está autenticado
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('No autenticado')
  }
  return user
}

/**
 * Lanza error si el usuario no tiene el rol requerido
 */
export async function requireRole(role: Rol | Rol[]) {
  const user = await requireAuth()
  const roles = Array.isArray(role) ? role : [role]
  
  if (!roles.includes(user.rol as Rol)) {
    throw new Error('No autorizado: rol insuficiente')
  }
  
  return user
}

/**
 * Lanza error si el usuario no es administrador
 */
export async function requireAdmin() {
  return await requireRole('ADMIN')
}

