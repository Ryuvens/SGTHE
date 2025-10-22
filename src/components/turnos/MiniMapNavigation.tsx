'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface MiniMapNavigationProps {
  totalDays: number
  visibleDaysStart: number
  visibleDaysEnd: number
  currentDay: number
  onNavigate: (startDay: number) => void
  className?: string
}

export function MiniMapNavigation({
  totalDays,
  visibleDaysStart,
  visibleDaysEnd,
  currentDay,
  onNavigate,
  className
}: MiniMapNavigationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const [canvasWidth, setCanvasWidth] = useState(0)

  // Actualizar ancho del canvas cuando cambia el tamaño del contenedor
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth - 180 // Restar espacio de labels
        setCanvasWidth(width)
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  // Dibujar el mini-mapa
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasWidth === 0) return

    // Actualizar dimensiones del canvas
    canvas.width = canvasWidth
    canvas.height = 40

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const dayWidth = width / totalDays

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)

    // Dibujar todos los días (fondo gris claro)
    ctx.fillStyle = '#e5e7eb' // gray-200
    ctx.fillRect(0, 0, width, height)

    // Dibujar días visibles (azul transparente)
    const visibleStartX = (visibleDaysStart - 1) * dayWidth
    const visibleWidth = (visibleDaysEnd - visibleDaysStart + 1) * dayWidth
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)' // blue-500 con transparencia
    ctx.fillRect(visibleStartX, 0, visibleWidth, height)

    // Dibujar borde de área visible
    ctx.strokeStyle = '#3b82f6' // blue-500
    ctx.lineWidth = 2
    ctx.strokeRect(visibleStartX, 0, visibleWidth, height)

    // Dibujar marcador del día actual
    if (currentDay >= 1 && currentDay <= totalDays) {
      const currentX = (currentDay - 0.5) * dayWidth
      ctx.fillStyle = '#ef4444' // red-500
      ctx.beginPath()
      ctx.arc(currentX, height / 2, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Dibujar día hover
    if (hoveredDay !== null && hoveredDay >= 1 && hoveredDay <= totalDays) {
      const hoverX = (hoveredDay - 1) * dayWidth
      ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'
      ctx.fillRect(hoverX, 0, dayWidth, height)
    }

  }, [totalDays, visibleDaysStart, visibleDaysEnd, currentDay, hoveredDay, canvasWidth])

  // Manejar click en el mini-mapa
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    
    // Usar el ancho REAL del canvas (no el escalado por CSS)
    const canvasActualWidth = canvas.width
    const dayWidth = canvasActualWidth / totalDays
    
    // Ajustar x según la escala
    const scaleX = canvasActualWidth / rect.width
    const adjustedX = x * scaleX
    
    const clickedDay = Math.floor(adjustedX / dayWidth) + 1

    console.log('🗺️ Click en mini-mapa:', {
      clickX: x,
      adjustedX,
      dayWidth,
      clickedDay,
      totalDays,
      canvasActualWidth,
      rectWidth: rect.width,
      scaleX
    })

    if (clickedDay >= 1 && clickedDay <= totalDays) {
      const visibleRange = visibleDaysEnd - visibleDaysStart + 1
      const newStart = Math.max(1, clickedDay - Math.floor(visibleRange / 2))
      onNavigate(newStart)
    }
  }

  // Manejar hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    
    const canvasActualWidth = canvas.width
    const dayWidth = canvasActualWidth / totalDays
    const scaleX = canvasActualWidth / rect.width
    const adjustedX = x * scaleX
    
    const day = Math.floor(adjustedX / dayWidth) + 1

    if (day >= 1 && day <= totalDays) {
      setHoveredDay(day)
    }
  }

  const handleMouseLeave = () => {
    setHoveredDay(null)
  }

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-fit">
          🗺️ <span className="font-medium">Mini-mapa:</span>
        </div>
        
        <div className="relative flex-1 group">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={40}
            className="w-full h-10 cursor-pointer rounded transition-all hover:shadow-md"
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
          
          {hoveredDay !== null && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg border pointer-events-none">
              Día {hoveredDay}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground min-w-fit">
          <span className="inline-block w-3 h-3 bg-blue-500/20 border-2 border-blue-500 rounded-sm mr-1"></span>
          Visible
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-3 mr-1"></span>
          Hoy
        </div>
      </div>
    </div>
  )
}
