'use client'

import { ChevronLeft, ChevronRight, Calendar, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PositionIndicatorsProps {
  currentMonth: Date
  visibleDaysStart: number
  visibleDaysEnd: number
  totalDays: number
  currentDay: number
  onNavigatePrevWeek: () => void
  onNavigateNextWeek: () => void
  onNavigateToToday: () => void
  onPreview: () => void
  className?: string
}

export function PositionIndicators({
  currentMonth,
  visibleDaysStart,
  visibleDaysEnd,
  totalDays,
  currentDay,
  onNavigatePrevWeek,
  onNavigateNextWeek,
  onNavigateToToday,
  onPreview,
  className
}: PositionIndicatorsProps) {
  const monthName = currentMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
  const todayDate = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })

  return (
    <div className={cn("flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg border", className)}>
      {/* Información de posición */}
      <div className="flex items-center gap-4 text-sm">
        {/* OCULTO - Indicador de días visibles
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            Mostrando: Días {visibleDaysStart}-{visibleDaysEnd} de {totalDays}
          </span>
        </div>
        */}
        
        <div className="h-4 w-px bg-border" />
        
        <div className="text-muted-foreground">
          📍 Hoy: {todayDate}
        </div>
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('⚡ onClick de Semana anterior ejecutado')
            console.log('🔍 disabled?', visibleDaysStart <= 1, '(visibleDaysStart:', visibleDaysStart, ')')
            onNavigatePrevWeek()
          }}
          disabled={visibleDaysStart <= 1}
          className="h-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Semana anterior
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('⚡ onClick de Ir a hoy ejecutado')
            onNavigateToToday()
          }}
          className="h-8"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Ir a hoy
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('⚡ onClick de Siguiente semana ejecutado')
            onNavigateNextWeek()
          }}
          disabled={visibleDaysEnd >= totalDays}
          className="h-8"
        >
          Siguiente semana
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          className="h-8 ml-auto"
        >
          <Eye className="h-4 w-4 mr-1" />
          Vista Previa
        </Button>
      </div>
    </div>
  )
}

