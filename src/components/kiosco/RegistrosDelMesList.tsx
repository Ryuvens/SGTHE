'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Moon, Sun, Calendar } from 'lucide-react'

interface Registro {
  id: string
  fecha: Date
  sector?: 'O' | 'N' | 'ON' | null
  horaInicio: string
  horaTermino: string | null
  totalHoras: number | null
  totalHorasStr: string | null
  esNocturno: boolean
  esDiaInhabil: boolean
  tipoActividad: string
  esEntrenamiento: boolean
  esExamen: boolean
}

interface RegistrosDelMesListProps {
  registros: Registro[]
}

const SECTOR_COLORS = {
  O: 'bg-blue-100 text-blue-700 border-blue-200',
  N: 'bg-purple-100 text-purple-700 border-purple-200',
  ON: 'bg-green-100 text-green-700 border-green-200',
}

const SECTOR_NAMES = {
  O: 'Oscar',
  N: 'November',
  ON: 'O+N',
}

export function RegistrosDelMesList({ registros }: RegistrosDelMesListProps) {
  // Ordenar registros por fecha descendente
  const registrosOrdenados = [...registros].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  const formatearFecha = (fecha: Date) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Registros del Mes
        </CardTitle>
        <CardDescription>
          {registros.length} {registros.length === 1 ? 'registro' : 'registros'} en total
        </CardDescription>
      </CardHeader>

      <CardContent>
        {registros.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Sin registros aún
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              No tienes registros de control para este mes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {registrosOrdenados.map((registro) => (
              <div
                key={registro.id}
                className="rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  {/* Información principal */}
                  <div className="flex-1">
                    {/* Fecha y sector */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatearFecha(registro.fecha)}
                      </span>
                      {registro.sector && (
                        <Badge 
                          variant="outline"
                          className={SECTOR_COLORS[registro.sector]}
                        >
                          {SECTOR_NAMES[registro.sector]}
                        </Badge>
                      )}
                      {registro.esNocturno && (
                        <Badge variant="outline" className="bg-slate-100">
                          <Moon className="mr-1 h-3 w-3" />
                          Nocturno
                        </Badge>
                      )}
                      {registro.esDiaInhabil && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                          Día inhábil
                        </Badge>
                      )}
                    </div>

                    {/* Horas */}
                    <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Sun className="h-4 w-4" />
                        <span className="font-mono">{registro.horaInicio}</span>
                      </div>
                      <span>→</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{registro.horaTermino || '----'}</span>
                      </div>
                    </div>

                    {/* Badges adicionales */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {registro.esEntrenamiento && (
                        <Badge variant="secondary" className="text-xs">
                          Entrenamiento
                        </Badge>
                      )}
                      {registro.esExamen && (
                        <Badge variant="secondary" className="text-xs">
                          Examen
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Total de horas */}
                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-slate-900">
                      {registro.totalHorasStr || '--:--'}
                    </div>
                    <div className="text-xs text-slate-500">horas</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

