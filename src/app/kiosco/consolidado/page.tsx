'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Clock } from 'lucide-react'
import { KioscoLayout } from '@/components/kiosco/KioscoLayout'
import { ConsolidadoMensualCard } from '@/components/kiosco/ConsolidadoMensualCard'
import { RegistrosDelMesList } from '@/components/kiosco/RegistrosDelMesList'
import { AuthPINModal } from '@/components/kiosco/AuthPINModal'
import { Button } from '@/components/ui/button'
import type { KioscoSession } from '@/types/kiosco'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'

const UNIDAD_ACCO_ID = 'cmgtzjz5700011ifkaa7ap88w'

export default function ConsolidadoPage() {
  const router = useRouter()
  const [session, setSession] = useState<KioscoSession | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Obtener mes y año actual
  const now = new Date()
  const mesActual = now.getMonth() + 1
  const añoActual = now.getFullYear()

  useEffect(() => {
    // Verificar si hay sesión activa
    setIsLoading(false)
    
    // Si no hay sesión, abrir modal
    if (!session) {
      setAuthModalOpen(true)
    }
  }, [session])

  const handleAuthSuccess = (newSession: KioscoSession) => {
    setSession(newSession)
    setAuthModalOpen(false)
  }

  const handleLogout = () => {
    setSession(null)
    router.push('/kiosco')
  }

  // Queries tRPC
  const { 
    data: consolidados, 
    isLoading: isLoadingConsolidado,
    error: errorConsolidado 
  } = trpc.atc6.consolidadoMensual.useQuery(
    {
      unidadId: UNIDAD_ACCO_ID,
      mes: mesActual,
      año: añoActual,
      usuarioId: session?.usuarioId,
    },
    {
      enabled: !!session,
    }
  )

  // Mostrar error si existe
  useEffect(() => {
    if (errorConsolidado) {
      toast.error('Error al cargar consolidado', {
        description: errorConsolidado.message,
      })
    }
  }, [errorConsolidado])

  const { 
    data: registrosData,
    isLoading: isLoadingRegistros 
  } = trpc.atc6.listar.useQuery(
    {
      unidadId: UNIDAD_ACCO_ID,
      usuarioId: session?.usuarioId,
      fechaInicio: new Date(añoActual, mesActual - 1, 1),
      fechaFin: new Date(añoActual, mesActual, 0, 23, 59, 59),
      limit: 100,
    },
    {
      enabled: !!session,
    }
  )

  const consolidado = consolidados?.[0]
  const registros = registrosData?.registros || []

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <KioscoLayout session={session} onLogout={handleLogout}>
        <div className="mx-auto max-w-4xl">
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
            <>
              {isLoadingConsolidado || isLoadingRegistros ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : consolidado ? (
                <div className="space-y-6">
                  {/* Card de consolidado */}
                  <ConsolidadoMensualCard consolidado={consolidado} />

                  {/* Lista de registros */}
                  <RegistrosDelMesList registros={registros as any} />

                  {/* Botón para nuevo registro */}
                  <div className="flex justify-center pt-4">
                    <Button
                      size="lg"
                      onClick={() => router.push('/kiosco/registro')}
                      className="w-full max-w-md"
                    >
                      + Registrar Nuevas Horas
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-slate-200 p-12 text-center">
                  <Clock className="mx-auto h-16 w-16 text-slate-300" />
                  <h2 className="mt-4 text-xl font-semibold text-slate-900">
                    Sin datos de consolidado
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    No tienes registros para el mes actual.
                  </p>
                  <Button
                    className="mt-6"
                    onClick={() => router.push('/kiosco/registro')}
                  >
                    Registrar Primeras Horas
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
              <h2 className="text-lg font-semibold text-yellow-900">
                Autenticación Requerida
              </h2>
              <p className="mt-2 text-sm text-yellow-800">
                Debes autenticarte para ver tu consolidado mensual
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
        actionTitle="Ver Consolidado"
      />
    </>
  )
}


