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
        {/* Estilos de impresión inline */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            /* Configuración de página Legal landscape */
            @page {
              size: legal landscape;
              margin: 0.5cm;
            }
            
            /* Ocultar todo excepto el diálogo */
            body * {
              visibility: hidden !important;
            }
            
            [role="dialog"],
            [role="dialog"] * {
              visibility: visible !important;
            }
            
            /* Posicionar el diálogo para impresión */
            [role="dialog"] {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: none !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              transform: none !important;
              margin: 0 !important;
              padding: 0.5cm !important;
            }
            
            /* Título centrado */
            h1 {
              font-size: 16px !important;
              margin-bottom: 4px !important;
              text-align: center !important;
            }
            
            /* Subtítulo */
            h1 + p {
              font-size: 12px !important;
              margin-bottom: 8px !important;
              text-align: center !important;
            }
            
            /* Tabla ajustada */
            table {
              width: 100% !important;
              font-size: 7px !important;
              border-collapse: collapse !important;
              page-break-inside: avoid !important;
              margin: 0 auto !important;
            }
            
            /* Celdas compactas */
            th, td {
              padding: 1px 2px !important;
              font-size: 7px !important;
              border: 0.5px solid #000 !important;
              line-height: 1.2 !important;
            }
            
            /* Header de tabla */
            thead th {
              background-color: #f0f0f0 !important;
              font-weight: bold !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Primera columna (nombres) un poco más ancha */
            td:first-child,
            th:first-child {
              min-width: 80px !important;
              max-width: 80px !important;
              font-size: 6px !important;
            }
            
            /* Celdas de días */
            td:not(:first-child),
            th:not(:first-child) {
              text-align: center !important;
              min-width: 18px !important;
              max-width: 18px !important;
            }
            
            /* Colores de turnos */
            td div {
              font-size: 7px !important;
              padding: 1px !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Ocultar botones */
            .print\\:hidden,
            button {
              display: none !important;
            }
            
            /* Footer */
            div:last-child {
              font-size: 8px !important;
              margin-top: 8px !important;
              text-align: center !important;
            }
          }
        `}} />

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
            <h1 className="text-2xl font-bold uppercase text-center print:text-base">
              Rol de Turno - {mesNombre}
            </h1>
            <p className="text-lg text-muted-foreground text-center print:text-xs">
              {unidad || 'Centro de Control de Área Oceánico'}
            </p>
          </div>

          {/* Tabla del rol */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-[7px] print:text-[7px]">
              {/* Header con días */}
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1 text-left font-semibold max-w-[100px] print:max-w-[80px] print:text-[6px]">
                    Funcionario
                  </th>
                  {diasDelMes.map((dia) => (
                    <th
                      key={dia.toISOString()}
                      className="border border-gray-300 p-1 text-center min-w-[20px] print:p-0.5 print:text-[7px]"
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
                    <td className="border border-gray-300 p-1 text-xs font-medium max-w-[100px] print:max-w-[80px] print:text-[6px]">
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
                          className="border border-gray-300 p-1 text-center print:p-0.5"
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
