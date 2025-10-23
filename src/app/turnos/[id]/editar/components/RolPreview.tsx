'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface RolPreviewProps {
  open: boolean
  onClose: () => void
  publicacion: any // Tipo apropiado
  funcionarios: any[]
  turnos: any[]
  mes: Date
  unidad: string
}

export default function RolPreview({
  open,
  onClose,
  publicacion,
  funcionarios,
  turnos,
  mes,
  unidad
}: RolPreviewProps) {
  const handlePrint = () => {
    window.print()
  }

  // Logs de debug temporal
  console.log('🔍 RolPreview DEBUG:', {
    totalFuncionarios: funcionarios.length,
    totalTurnos: turnos.length,
    primerosLimitadoTurnos: turnos.slice(0, 3),
    estructura: turnos[0]
  })

  const mesNombre = format(mes, 'MMMM yyyy', { locale: es })
  const diasDelMes = Array.from(
    { length: new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate() },
    (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1)
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Vista Previa del Rol</DialogTitle>
          <DialogDescription className="sr-only">
            Vista previa del rol de turnos para impresión
          </DialogDescription>
        </DialogHeader>

        {/* Contenedor para impresión */}
        <div className="print:p-8">
          {/* Encabezado */}
          <div className="text-center mb-8 space-y-2">
            <h1 className="text-2xl font-bold uppercase">
              Rol de Turno - {mesNombre}
            </h1>
            <p className="text-lg text-muted-foreground">
              {unidad || 'Centro de Control de Área Oceánico'}
            </p>
          </div>

          {/* Tabla del rol */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-xs">
              {/* Header con días */}
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1 text-left font-semibold">
                    Funcionario
                  </th>
                  {diasDelMes.map((dia) => (
                    <th
                      key={dia.toISOString()}
                      className="border border-gray-300 p-1 text-center min-w-[30px]"
                    >
                      <div className="text-xs">
                        {format(dia, 'EEE', { locale: es })}
                      </div>
                      <div className="font-bold">
                        {format(dia, 'd')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Filas de funcionarios */}
              <tbody>
                {funcionarios.map((func) => (
                  <tr key={func.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-1 text-xs font-medium">
                      <div>{func.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {func.unidad}
                      </div>
                    </td>
                    {diasDelMes.map((dia) => {
                      const turnoDelDia = turnos.find((t) => {
                        // Comparar funcionarioId
                        const matchFuncionario = t.funcionarioId === func.id || 
                                                t.funcionario?.id === func.id
                        
                        // Comparar fecha
                        const fechaTurno = new Date(t.fecha)
                        const matchFecha = 
                          fechaTurno.getDate() === dia.getDate() &&
                          fechaTurno.getMonth() === dia.getMonth() &&
                          fechaTurno.getFullYear() === dia.getFullYear()
                        
                        return matchFuncionario && matchFecha
                      })
                      
                      return (
                        <td
                          key={dia.toISOString()}
                          className="border border-gray-300 p-1 text-center"
                        >
                          {turnoDelDia && (
                            <div
                              className="text-xs font-semibold rounded px-0.5 py-0"
                              style={{
                                backgroundColor: (turnoDelDia.tipoTurno?.color || '#000') + '20',
                                color: turnoDelDia.tipoTurno?.color || '#000'
                              }}
                            >
                              {turnoDelDia.tipoTurno?.codigo || '?'}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer con métricas (opcional) */}
          <div className="mt-8 text-sm text-muted-foreground text-center print:mt-4">
            Generado el {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </div>
        </div>

        {/* Botones - no se imprimen */}
        <div className="flex justify-end gap-2 mt-4 print:hidden">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Cerrar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
