'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAutoLogout } from '@/hooks/useAutoLogout'
import type { KioscoSession } from '@/types/kiosco'
import { toast } from 'sonner'

interface KioscoLayoutProps {
  children: React.ReactNode
  session: KioscoSession | null
  onLogout: () => void
  showTimer?: boolean
}

export function KioscoLayout({
  children,
  session,
  onLogout,
  showTimer = true,
}: KioscoLayoutProps) {
  const router = useRouter()

  // Auto-logout después de 30 segundos de inactividad
  const { timeLeftSeconds, resetTimer } = useAutoLogout({
    timeoutMs: 30000, // 30 segundos
    onTimeout: () => {
      toast.info('Sesión expirada por inactividad')
      onLogout()
      router.push('/kiosco')
    },
    enabled: !!session,
  })

  const handleManualLogout = useCallback(() => {
    toast.info('Sesión cerrada')
    onLogout()
    router.push('/kiosco')
  }, [onLogout, router])

  return (
    <div className="min-h-screen bg-slate-50" onClick={resetTimer}>
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo y título */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              🛫
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                SGTHE - Terminal Operacional
              </h1>
              <p className="text-xs text-slate-500">
                Centro de Control de Área Oceánico
              </p>
            </div>
          </div>

          {/* Info de sesión */}
          {session ? (
            <div className="flex items-center gap-4">
              {/* Timer de auto-logout */}
              {showTimer && (
                <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5">
                  <Clock className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {timeLeftSeconds}s
                  </span>
                </div>
              )}

              {/* Usuario actual */}
              <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {session.iniciales} - {session.nombre} {session.apellido}
                </span>
              </div>

              {/* Botón logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualLogout}
                className="text-slate-600 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              Terminal en modo público
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-4">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>
            Sistema de Gestión de Turnos y Horas Extraordinarias (SGTHE) - DGAC Chile
          </p>
          <p className="mt-1 text-xs">
            Versión 1.0.0 | {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}

