'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface StickyScrollBarProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>
  totalDays: number
  visibleDaysStart: number
  currentDay: number
  className?: string
}

export function StickyScrollBar({
  scrollContainerRef,
  totalDays,
  visibleDaysStart,
  currentDay,
  className
}: StickyScrollBarProps) {
  const scrollBarRef = useRef<HTMLDivElement>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [scrollWidth, setScrollWidth] = useState(0)
  const [clientWidth, setClientWidth] = useState(0)

  // Sincronizar con el scroll del contenedor principal
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollLeft(container.scrollLeft)
      setScrollWidth(container.scrollWidth)
      setClientWidth(container.clientWidth)
    }

    // Inicial
    handleScroll()

    // Observer para cambios de tamaño
    const resizeObserver = new ResizeObserver(handleScroll)
    resizeObserver.observe(container)

    container.addEventListener('scroll', handleScroll)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [scrollContainerRef])

  // Manejar drag de la barra de scroll
  const handleScrollBarDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current
    const scrollBar = scrollBarRef.current
    if (!container || !scrollBar) return

    const startX = e.clientX
    const startScrollLeft = container.scrollLeft
    const scrollBarWidth = scrollBar.offsetWidth
    const maxScroll = scrollWidth - clientWidth

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const scrollRatio = maxScroll / scrollBarWidth
      container.scrollLeft = startScrollLeft + (deltaX * scrollRatio)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Calcular posición del thumb
  const maxScroll = scrollWidth - clientWidth
  const scrollPercentage = maxScroll > 0 ? scrollLeft / maxScroll : 0
  const thumbPercentage = maxScroll > 0 ? clientWidth / scrollWidth : 1

  return (
    <div 
      ref={scrollBarRef}
      className={cn(
        "sticky bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t shadow-lg",
        className
      )}
    >
      {/* Números de días */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-b">
        {Array.from({ length: Math.min(totalDays, 31) }, (_, i) => {
          const day = i + 1
          const isCurrentDay = day === currentDay
          const isVisible = day >= visibleDaysStart && day <= visibleDaysStart + 6

          return (
            <div
              key={day}
              className={cn(
                "flex items-center justify-center min-w-[24px] transition-colors relative",
                isCurrentDay && "text-blue-600 font-bold",
                isVisible && !isCurrentDay && "text-foreground font-medium"
              )}
            >
              {day}
              {isCurrentDay && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
            </div>
          )
        })}
      </div>

      {/* Barra de scroll */}
      <div className="relative h-3 mx-4 my-2 bg-muted rounded-full cursor-pointer group hover:h-4 transition-all">
        <div
          className="absolute top-0 h-full bg-primary/50 rounded-full transition-all group-hover:bg-primary/70 cursor-grab active:cursor-grabbing"
          style={{
            left: `${scrollPercentage * 100}%`,
            width: `${thumbPercentage * 100}%`,
          }}
          onMouseDown={handleScrollBarDrag}
        />
      </div>
    </div>
  )
}

