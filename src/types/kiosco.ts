/**
 * Types para el Modo Kiosco
 */

export interface KioscoSession {
  usuarioId: string
  nombre: string
  apellido: string
  iniciales: string
  unidadId: string
  unidadNombre: string
  startedAt: Date
  expiresAt: Date
}

export interface AuthPINData {
  iniciales: string
  pin: string
}

export interface KioscoAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  requiresAuth: boolean
  color?: string
}

