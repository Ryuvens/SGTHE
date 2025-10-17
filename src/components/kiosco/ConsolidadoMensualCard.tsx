'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ConsolidadoMensualCardProps {
  consolidado: {
    mes: number
    año: number
    horasSectorO: number
    horasSectorN: number
    horasSectorON: number
    totalHoras: number
    cumpleMinimo: boolean
    requiereVCP: boolean
  }
  horasMinimas?: number
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function ConsolidadoMensualCard({ 
  consolidado, 
  horasMinimas = 10 
}: ConsolidadoMensualCardProps) {
  const porcentajeCumplimiento = Math.min(
    (consolidado.totalHoras / horasMinimas) * 100,
    100
  )

  const nombreMes = MESES[consolidado.mes - 1]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📊 Consolidado {nombreMes} {consolidado.año}</span>
          {consolidado.cumpleMinimo ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          )}
        </CardTitle>
        <CardDescription>
          Resumen de tus horas de control del mes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Resumen por sector */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Horas por Sector
          </h3>
          
          <div className="grid gap-3">
            {/* Sector O */}
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-blue-700 font-semibold">
                  O
                </div>
                <span className="text-sm font-medium">Sector Oscar</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {consolidado.horasSectorO.toFixed(1)}h
              </span>
            </div>

            {/* Sector N */}
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-100 text-purple-700 font-semibold">
                  N
                </div>
                <span className="text-sm font-medium">Sector November</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {consolidado.horasSectorN.toFixed(1)}h
              </span>
            </div>

            {/* Sector O+N */}
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-green-100 text-green-700 font-semibold text-xs">
                  O+N
                </div>
                <span className="text-sm font-medium">Sector Refundido</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {consolidado.horasSectorON.toFixed(1)}h
              </span>
            </div>
          </div>
        </div>

        {/* Total y progreso */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Total del Mes
            </h3>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-500">
                Mínimo: {horasMinimas}h
              </span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <Progress 
              value={porcentajeCumplimiento} 
              className="h-3"
            />
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{consolidado.totalHoras.toFixed(1)}h acumuladas</span>
              <span>{porcentajeCumplimiento.toFixed(0)}%</span>
            </div>
          </div>

          {/* Total destacado */}
          <div className={`rounded-lg p-4 ${
            consolidado.cumpleMinimo 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-yellow-50 border-2 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  consolidado.cumpleMinimo ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  Total Mensual
                </p>
                <p className={`text-xs ${
                  consolidado.cumpleMinimo ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {consolidado.cumpleMinimo 
                    ? 'Cumple con el mínimo requerido' 
                    : 'No cumple con el mínimo requerido'
                  }
                </p>
              </div>
              <span className={`text-3xl font-bold ${
                consolidado.cumpleMinimo ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {consolidado.totalHoras.toFixed(1)}h
              </span>
            </div>
          </div>
        </div>

        {/* Alerta VCP */}
        {consolidado.requiereVCP && (
          <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900">
                  Requiere VCP (Verificación de la Competencia Profesional)
                </h4>
                <p className="mt-1 text-sm text-orange-800">
                  No has alcanzado las {horasMinimas} horas mínimas mensuales requeridas 
                  según DAN 11. Debes someterte a una Verificación de la Competencia Profesional 
                  para demostrar tus competencias. Esta verificación será documentada en el 
                  formulario ATC-14 y se adjuntará al Informe Mensual de Actividades.
                </p>
                <p className="mt-2 text-xs font-medium text-orange-900">
                  Diferencia: {(horasMinimas - consolidado.totalHoras).toFixed(1)}h 
                  ({((horasMinimas - consolidado.totalHoras) / horasMinimas * 100).toFixed(0)}% por debajo del mínimo)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-800">
          <p className="font-medium">💡 Información</p>
          <ul className="mt-2 space-y-1 pl-4">
            <li>• Las horas se calculan automáticamente desde tus registros ATC-6</li>
            <li>• Se requieren mínimo {horasMinimas} horas mensuales para mantener pericia (DAN 11)</li>
            <li>• Este consolidado se actualiza en tiempo real con cada registro</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

