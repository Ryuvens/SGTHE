'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

// Componente draggable para usuarios
export function DraggableUser({ 
  id, 
  children 
}: { 
  id: string
  children: React.ReactNode 
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `user-${id}`,
    data: {
      type: 'user',
      userId: id
    }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-move p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors",
        isDragging && "ring-2 ring-primary"
      )}
    >
      {children}
    </div>
  )
}

// Componente draggable para tipos de turno
export function DraggableTurnoType({ 
  id, 
  codigo,
  color,
  nombre,
  horaInicio,
  horaFin,
  children 
}: { 
  id: string
  codigo: string
  color: string
  nombre?: string
  horaInicio?: string
  horaFin?: string
  children?: React.ReactNode 
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `turno-${id}`,
    data: {
      type: 'turno',
      turnoId: id,
      codigo,
      color,
      nombre,
      horaInicio,
      horaFin
    }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-move p-2 rounded-md transition-all border",
        isDragging && "ring-2 ring-primary scale-105"
      )}
    >
      {children || (
        <div>
          <div className="flex items-center justify-between">
            <span className="font-medium">{codigo}</span>
            {horaInicio && horaFin && (
              <span className="text-xs text-muted-foreground">
                {horaInicio} - {horaFin}
              </span>
            )}
          </div>
          {nombre && (
            <div className="text-xs text-muted-foreground mt-1">
              {nombre}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Componente para asignación existente draggable
export function DraggableAsignacion({
  asignacion,
  onDelete
}: {
  asignacion: any
  onDelete: () => void
}) {
  // SIEMPRE llamar hooks al principio, sin condiciones
  const tipoTurnoId = asignacion?.tipoTurnoId || asignacion?.tipoTurno?.id || ''
  const dragData = {
    type: 'asignacion-existente',
    asignacionId: asignacion?.id || '',
    tipoTurnoId: tipoTurnoId,
    codigo: asignacion?.tipoTurno?.codigo || '',
    color: asignacion?.tipoTurno?.color || '#6B7280',
    nombre: asignacion?.tipoTurno?.nombre || '',
    usuarioIdOrigen: asignacion?.usuarioId || '',
    fechaOrigen: asignacion?.fecha 
      ? (typeof asignacion.fecha === 'string' 
          ? asignacion.fecha 
          : asignacion.fecha.toISOString().split('T')[0])
      : ''
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `asignacion-${asignacion?.id || 'invalid'}`,
    data: dragData,
    disabled: !asignacion?.id || !tipoTurnoId // Deshabilitado si no hay datos válidos
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  // DESPUÉS del hook, validar datos para mostrar error
  if (!tipoTurnoId || !asignacion?.tipoTurno) {
    console.error('Asignación sin tipoTurnoId:', asignacion)
    return (
      <div className="rounded px-1.5 py-1.5 text-xs font-semibold text-center bg-red-500 text-white">
        Error
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Botón eliminar en la esquina */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          if (confirm(`¿Eliminar turno ${asignacion.tipoTurno?.codigo}?`)) {
            onDelete()
          }
        }}
        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center hover:bg-red-600"
        title="Eliminar turno"
        type="button"
      >
        ×
      </button>
      
      {/* Turno draggable */}
      <div
        {...listeners}
        {...attributes}
        className="rounded px-1.5 py-1.5 text-xs font-semibold text-center cursor-move hover:ring-2 hover:ring-primary hover:ring-offset-1 transition-all"
        style={{ 
          backgroundColor: asignacion.tipoTurno?.color || '#6B7280',
          color: 'white'
        }}
        title={`${asignacion.tipoTurno?.nombre || 'Turno'} - Arrastra para mover`}
      >
        {asignacion.tipoTurno?.codigo}
      </div>
    </div>
  )
}

// Celda droppable del calendario
export function DroppableCalendarCell({ 
  id,
  fecha,
  usuarioId,
  children,
  isWeekend = false,
  onRemove
}: { 
  id: string
  fecha: string
  usuarioId: string
  children?: React.ReactNode
  isWeekend?: boolean
  onRemove?: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${id}`,
    data: {
      type: 'calendar-cell',
      fecha,
      usuarioId
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[40px] p-1 border-l transition-colors relative",
        isWeekend && "bg-muted/30",
        isOver && "bg-primary/20 ring-2 ring-primary ring-inset"
      )}
    >
      {children}
      {isOver && !children && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-xs font-semibold text-primary">
            Soltar aquí
          </div>
        </div>
      )}
    </div>
  )
}

