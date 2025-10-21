'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Settings, 
  Copy, 
  Download, 
  Upload, 
  Repeat, 
  Calendar,
  Users,
  FileSpreadsheet,
  Printer
} from 'lucide-react'
import { toast } from 'sonner'

export function OpcionesAvanzadas({ publicacionId }: { publicacionId: string }) {
  const [procesando, setProcesando] = useState(false)

  const opciones = [
    {
      label: 'Copiar del mes anterior',
      icon: Copy,
      action: () => {
        toast.info('Funcionalidad en desarrollo: Copiar turnos del mes anterior')
      }
    },
    {
      label: 'Aplicar patrón',
      icon: Repeat,
      action: () => {
        toast.info('Funcionalidad en desarrollo: Aplicar patrón de turnos')
      }
    },
    {
      label: 'Rotar turnos',
      icon: Calendar,
      action: () => {
        toast.info('Funcionalidad en desarrollo: Rotar turnos entre funcionarios')
      }
    },
    {
      label: 'Optimizar distribución',
      icon: Users,
      action: () => {
        toast.info('Funcionalidad en desarrollo: Optimización automática según DAN 11')
      }
    },
    { type: 'separator' as const },
    {
      label: 'Importar desde Excel',
      icon: Upload,
      action: () => {
        toast.info('Funcionalidad en desarrollo: Importar turnos desde Excel')
      }
    },
    {
      label: 'Exportar a Excel',
      icon: FileSpreadsheet,
      action: () => {
        toast.info('Funcionalidad en desarrollo: Exportar a Excel')
      }
    },
    {
      label: 'Imprimir rol',
      icon: Printer,
      action: () => {
        window.print()
      }
    }
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={procesando}>
          <Settings className="mr-2 h-4 w-4" />
          Opciones Avanzadas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Herramientas de Edición</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opciones.map((opcion, index) => {
          if ('type' in opcion && opcion.type === 'separator') {
            return <DropdownMenuSeparator key={`sep-${index}`} />
          }
          
          const Icon = opcion.icon
          return (
            <DropdownMenuItem
              key={index}
              onClick={opcion.action}
              disabled={procesando}
            >
              <Icon className="mr-2 h-4 w-4" />
              {opcion.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

