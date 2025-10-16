'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, BarChart3, Calendar, Clock } from 'lucide-react'
import { KioscoLayout } from '@/components/kiosco/KioscoLayout'
import { KioscoActionButton } from '@/components/kiosco/KioscoActionButton'
import { AuthPINModal } from '@/components/kiosco/AuthPINModal'
import type { KioscoSession, KioscoAction } from '@/types/kiosco'

// ID de la unidad ACCO (obtenido de la base de datos)
const UNIDAD_ACCO_ID = 'cmgtzjz5700011ifkaa7ap88w'

export default function KioscoPage() {
  const router = useRouter()
  const [session, setSession] = useState<KioscoSession | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<KioscoAction | null>(null)

  // Definición de acciones disponibles
  const actions: KioscoAction[] = [
    {
      id: 'registro-atc6',
      title: 'Registrar ATC-6',
      description: 'Registra tus horas de control del turno',
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      href: '/kiosco/registro',
      requiresAuth: true,
      color: 'bg-blue-100',
    },
    {
      id: 'ver-consolidado',
      title: 'Ver Consolidado',
      description: 'Consulta tus horas del mes actual',
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      href: '/kiosco/consolidado',
      requiresAuth: true,
      color: 'bg-green-100',
    },
    {
      id: 'rol-turnos',
      title: 'Rol de Turnos',
      description: 'Ver programación del mes',
      icon: <Calendar className="h-6 w-6 text-purple-600" />,
      href: '/kiosco/turnos',
      requiresAuth: false,
      color: 'bg-purple-100',
    },
    {
      id: 'registros-hoy',
      title: 'Registros de Hoy',
      description: 'Ver todos los registros del día',
      icon: <Clock className="h-6 w-6 text-orange-600" />,
      href: '/kiosco/hoy',
      requiresAuth: false,
      color: 'bg-orange-100',
    },
  ]

  const handleActionClick = (action: KioscoAction) => {
    if (action.requiresAuth && !session) {
      // Requiere autenticación
      setSelectedAction(action)
      setAuthModalOpen(true)
    } else {
      // No requiere autenticación o ya está autenticado
      router.push(action.href)
    }
  }

  const handleAuthSuccess = (newSession: KioscoSession) => {
    setSession(newSession)
    // Redirigir a la acción seleccionada
    if (selectedAction) {
      router.push(selectedAction.href)
    }
  }

  const handleLogout = () => {
    setSession(null)
    setSelectedAction(null)
  }

  return (
    <>
      <KioscoLayout session={session} onLogout={handleLogout} showTimer={!!session}>
        <div className="mx-auto max-w-5xl">
          {/* Título principal */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900">
              Terminal Operacional ACCO
            </h1>
            <p className="mt-2 text-slate-600">
              Selecciona una acción para continuar
            </p>
          </div>

          {/* Grid de acciones */}
          <div className="grid gap-6 md:grid-cols-2">
            {actions.map((action) => (
              <KioscoActionButton
                key={action.id}
                action={action}
                onClick={() => handleActionClick(action)}
              />
            ))}
          </div>

          {/* Información adicional */}
          <div className="mt-12 rounded-lg border bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              💡 Instrucciones
            </h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="font-medium text-slate-900">•</span>
                <span>
                  <strong>Registrar ATC-6:</strong> Ingresa tus horas de control al
                  finalizar tu turno.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-slate-900">•</span>
                <span>
                  <strong>Ver Consolidado:</strong> Consulta tu cumplimiento de horas
                  mensuales.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-slate-900">•</span>
                <span>
                  <strong>Rol de Turnos:</strong> Revisa la programación del mes sin
                  necesidad de autenticarte.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-slate-900">•</span>
                <span>
                  <strong>Auto-logout:</strong> Por seguridad, tu sesión se cerrará
                  automáticamente después de 30 segundos de inactividad.
                </span>
              </li>
            </ul>
          </div>

          {/* Advertencia de seguridad */}
          <div className="mt-6 rounded-md bg-yellow-50 p-4 text-sm">
            <p className="font-medium text-yellow-900">⚠️ Importante</p>
            <p className="mt-1 text-yellow-800">
              Esta es una terminal compartida. Nunca compartas tu PIN con otros
              funcionarios. Cierra tu sesión al terminar.
            </p>
          </div>
        </div>
      </KioscoLayout>

      {/* Modal de autenticación */}
      <AuthPINModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={handleAuthSuccess}
        unidadId={UNIDAD_ACCO_ID}
        actionTitle={selectedAction?.title}
      />
    </>
  )
}

