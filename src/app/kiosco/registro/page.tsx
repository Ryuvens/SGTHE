'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KioscoLayout } from '@/components/kiosco/KioscoLayout'
import { RegistroATC6Form } from '@/components/kiosco/RegistroATC6Form'
import { AuthPINModal } from '@/components/kiosco/AuthPINModal'
import type { KioscoSession } from '@/types/kiosco'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const UNIDAD_ACCO_ID = 'cmgtzjz5700011ifkaa7ap88w'

export default function RegistroPage() {
  const router = useRouter()
  const [session, setSession] = useState<KioscoSession | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay sesión activa
    // En producción, esto vendría de un contexto global o localStorage
    // Por ahora, si no hay sesión, pedimos autenticación
    const checkSession = () => {
      // Simular chequeo de sesión
      // TODO: Implementar con contexto global
      setIsLoading(false)
      
      // Si no hay sesión, abrir modal
      if (!session) {
        setAuthModalOpen(true)
      }
    }

    checkSession()
  }, [session])

  const handleAuthSuccess = (newSession: KioscoSession) => {
    setSession(newSession)
    setAuthModalOpen(false)
  }

  const handleLogout = () => {
    setSession(null)
    router.push('/kiosco')
  }

  const handleCancel = () => {
    router.push('/kiosco')
  }

  const handleSuccess = () => {
    // El formulario ya redirige a /kiosco
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <KioscoLayout session={session} onLogout={handleLogout}>
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/kiosco')}
              className="text-slate-600 hover:text-slate-900"
            >
              ← Volver al inicio
            </Button>
          </div>

          {session ? (
            <RegistroATC6Form
              session={session}
              onCancel={handleCancel}
              onSuccess={handleSuccess}
            />
          ) : (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-yellow-600" />
              <h2 className="mt-4 text-lg font-semibold text-yellow-900">
                Autenticación Requerida
              </h2>
              <p className="mt-2 text-sm text-yellow-800">
                Debes autenticarte para registrar horas de control
              </p>
              <Button
                className="mt-4"
                onClick={() => setAuthModalOpen(true)}
              >
                Autenticar
              </Button>
            </div>
          )}
        </div>
      </KioscoLayout>

      {/* Modal de autenticación */}
      <AuthPINModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={handleAuthSuccess}
        unidadId={UNIDAD_ACCO_ID}
        actionTitle="Registrar ATC-6"
      />
    </>
  )
}

