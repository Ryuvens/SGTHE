'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { format, eachDayOfInterval, getDay, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Save, ArrowLeft, Users, AlertCircle, Loader2, TrendingUp, X, Copy, Clipboard, Check } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { 
  DraggableTurnoType, 
  DroppableCalendarCell,
  DraggableAsignacion 
} from '@/components/turnos/drag-drop-components'
import { OpcionesAvanzadas } from '@/components/turnos/opciones-avanzadas'

import { 
  getPublicacion, 
  asignarTurno, 
  eliminarAsignacion,
  getUsuariosUnidad,
  getTiposTurno
} from '@/lib/actions/turnos'
import { cn } from '@/lib/utils'

interface Asignacion {
  id?: string
  fecha: Date
  usuarioId?: string
  tipoTurnoId?: string
  tipoTurno?: {
    id?: string
    codigo: string
    nombre?: string
    color?: string
  }
}

export default function EditarRolPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [publicacion, setPublicacion] = useState<any>(null)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [tiposTurno, setTiposTurno] = useState<any[]>([])
  const [asignaciones, setAsignaciones] = useState<Map<string, Asignacion>>(new Map())
  const asignacionesRef = useRef<Map<string, Asignacion>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDragData, setActiveDragData] = useState<any>(null)
  const [renderVersion, setRenderVersion] = useState(0)
  const [mostrarMetricas, setMostrarMetricas] = useState(true)
  
  // Estados para copiar/pegar secuencias
  const [selectedCells, setSelectedCells] = useState<string[]>([]) // Keys de celdas seleccionadas
  const [lastSelectedCell, setLastSelectedCell] = useState<string | null>(null)
  const [copiedSequence, setCopiedSequence] = useState<Asignacion[]>([])
  const [pastePreview, setPastePreview] = useState<{
    destino: string
    turnos: Asignacion[]
    errors: string[]
  } | null>(null)

  // Sincronizar ref con estado
  useEffect(() => {
    asignacionesRef.current = asignaciones
  }, [asignaciones])

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function loadData() {
    try {
      const pubResult = await getPublicacion(params.id)

      if (!pubResult.success || !pubResult.data) {
        toast.error('No se pudo cargar la publicación')
        router.push('/turnos')
        return
      }

      const pub = pubResult.data
      setPublicacion(pub)

      // Cargar usuarios y tipos de turno de la misma unidad
      const [usersResult, turnosResult] = await Promise.all([
        getUsuariosUnidad(pub.unidadId),
        getTiposTurno(pub.unidadId)
      ])

      setUsuarios(usersResult.data || [])
      setTiposTurno(turnosResult.data || [])

      // Cargar asignaciones existentes en el Map
      const asigMap = new Map<string, Asignacion>()
      pub.asignaciones?.forEach((asig: any) => {
        const key = `${format(new Date(asig.fecha), 'yyyy-MM-dd')}-${asig.usuarioId}`
        asigMap.set(key, {
          id: asig.id,
          fecha: new Date(asig.fecha),
          usuarioId: asig.usuarioId,
          tipoTurnoId: asig.tipoTurnoId || asig.tipoTurno?.id,
          tipoTurno: {
            id: asig.tipoTurno?.id,
            codigo: asig.tipoTurno?.codigo || '',
            nombre: asig.tipoTurno?.nombre,
            color: asig.tipoTurno?.color
          }
        })
      })
      setAsignaciones(asigMap)

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar drag start
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
    setActiveDragData(event.active.data.current)
  }

  // Función mejorada para eliminar asignación con verificación de existencia
  async function handleEliminarAsignacion(asignacionId: string, key: string) {
    console.log('🗑️ Intentando eliminar asignación:', { asignacionId, key })
    
    // CRÍTICO: Verificar que existe en el Map antes de eliminar
    const asignacion = asignacionesRef.current.get(key)
    
    if (!asignacion) {
      console.log('⚠️ Asignación no encontrada en Map (key):', key)
      toast.error('Esta asignación ya fue eliminada')
      return
    }
    
    if (asignacion.id !== asignacionId) {
      console.log('⚠️ ID de asignación no coincide:', {
        enMap: asignacion.id,
        solicitado: asignacionId
      })
      toast.error('La asignación ha cambiado, recarga la página')
      return
    }
    
    // Guardar referencia para posible rollback
    const asignacionBackup = { ...asignacion }
    
    // Eliminar del Map inmediatamente (optimistic update)
    setAsignaciones(prev => {
      const newMap = new Map(prev)
      newMap.delete(key)
      console.log('✅ Eliminado del Map (optimistic):', key)
      return newMap
    })
    
    // Incrementar version para forzar re-render
    setRenderVersion(v => v + 1)
    
    // Luego eliminar de la BD
    try {
      const result = await eliminarAsignacion(asignacionId)
      
      if (!result.success) {
        console.error('❌ Error al eliminar de BD, revirtiendo...')
        // Si falla, restaurar en el Map
        setAsignaciones(prev => {
          const newMap = new Map(prev)
          newMap.set(key, asignacionBackup)
          return newMap
        })
        setRenderVersion(v => v + 1)
        toast.error(result.error || 'Error al eliminar')
      } else {
        console.log('✅ Turno eliminado exitosamente de BD')
        toast.success('Turno eliminado')
      }
    } catch (error) {
      console.error('💥 Error inesperado al eliminar:', error)
      // Revertir
      setAsignaciones(prev => {
        const newMap = new Map(prev)
        newMap.set(key, asignacionBackup)
        return newMap
      })
      setRenderVersion(v => v + 1)
      toast.error('Error al eliminar el turno')
    }
  }

  // Manejar drag end con verificación robusta
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setActiveDragData(null)
      return
    }

    const activeData = active.data.current
    const overData = over.data.current

    // Solo procesar si se suelta en una celda del calendario
    if (overData?.type === 'calendar-cell') {
      const { fecha, usuarioId } = overData
      
      // Validar que tenemos todos los datos necesarios
      if (!fecha || !usuarioId) {
        toast.error('Datos incompletos para la asignación')
        setActiveId(null)
        setActiveDragData(null)
        return
      }
      
      // CASO 1: Asignar un nuevo tipo de turno desde el sidebar
      if (activeData?.type === 'turno') {
        const turnoId = activeData.turnoId
        
        if (!turnoId) {
          toast.error('ID de turno no válido')
          setActiveId(null)
          setActiveDragData(null)
          return
        }
        
        // Verificar si hay una asignación existente
        const key = `${fecha}-${usuarioId}`
        const asignacionExistente = asignacionesRef.current.get(key)
        
        if (asignacionExistente) {
          const confirmar = confirm(`Ya existe un turno ${asignacionExistente.tipoTurno?.codigo} en esta celda. ¿Reemplazar?`)
          if (!confirmar) {
            setActiveId(null)
            setActiveDragData(null)
            return
          }
          // Eliminar la asignación existente primero
          if (asignacionExistente.id) {
            await handleEliminarAsignacion(asignacionExistente.id, key)
            // Pequeña pausa para que se complete la eliminación
            await new Promise(resolve => setTimeout(resolve, 100))
          } else {
            toast.error('ID de asignación no válido')
            setActiveId(null)
            setActiveDragData(null)
            return
          }
        }
        
        setIsSaving(true)
        try {
          const result = await asignarTurno({
            publicacionId: params.id,
            usuarioId,
            tipoTurnoId: turnoId,
            fecha: new Date(fecha),
            esNocturno: false,
            esDiaInhabil: false,
            esFestivo: false,
          })
          
          if (result.success && result.data) {
            // Actualizar asignaciones localmente
            setAsignaciones(prev => {
              const newMap = new Map(prev)
              newMap.set(key, {
                id: result.data!.id,
                fecha: new Date(fecha),
                usuarioId: usuarioId,
                tipoTurnoId: result.data!.tipoTurnoId,
                tipoTurno: {
                  id: result.data!.tipoTurno?.id,
                  codigo: result.data!.tipoTurno?.codigo || activeData.codigo,
                  nombre: result.data!.tipoTurno?.nombre || activeData.nombre,
                  color: result.data!.tipoTurno?.color || activeData.color
                }
              })
              return newMap
            })
            setRenderVersion(v => v + 1)
            toast.success('Turno asignado correctamente')
          } else {
            toast.error(result.error || 'Error al asignar turno')
          }
        } catch (error) {
          console.error('Error:', error)
          toast.error('Error al asignar turno')
        } finally {
          setIsSaving(false)
        }
      }
      
      // CASO 2: Mover una asignación existente a otro día/usuario
      if (activeData?.type === 'asignacion-existente') {
        const { asignacionId, usuarioIdOrigen, fechaOrigen, tipoTurnoId, codigo, nombre, color } = activeData
        
        console.log('📦 Intentando mover turno:', JSON.stringify({
          asignacionId,
          tipoTurnoId,
          codigo,
          origen: `${fechaOrigen} - Usuario: ${usuarioIdOrigen}`,
          destino: `${fecha} - Usuario: ${usuarioId}`
        }, null, 2))
        
        // Validar todos los datos necesarios
        if (!asignacionId || !tipoTurnoId) {
          console.error('❌ Datos incompletos:', { asignacionId, tipoTurnoId })
          toast.error('Datos de asignación incompletos')
          setActiveId(null)
          setActiveDragData(null)
          return
        }
        
        // CRÍTICO: Verificar que la asignación AÚN existe en el Map
        // FIX: Usar el string directamente si ya está en formato correcto (evitar problemas de zona horaria)
        const fechaOrigenStr = typeof fechaOrigen === 'string' && fechaOrigen.match(/^\d{4}-\d{2}-\d{2}$/)
          ? fechaOrigen  // Ya está en formato 'yyyy-MM-dd', usar directamente
          : format(new Date(fechaOrigen), 'yyyy-MM-dd')  // Formatear si es Date
        
        const keyOrigen = `${fechaOrigenStr}-${usuarioIdOrigen}`
        const asignacionOriginal = asignacionesRef.current.get(keyOrigen)
        
        if (!asignacionOriginal || asignacionOriginal.id !== asignacionId) {
          console.log('⚠️ Asignación ya no existe en Map o cambió')
          console.log('  keyOrigen:', keyOrigen)
          console.log('  Keys disponibles:', Array.from(asignacionesRef.current.keys()).slice(0, 5))
          toast.error('Esta asignación ya fue modificada o eliminada')
          setActiveId(null)
          setActiveDragData(null)
          return
        }
        
        // Si es la misma celda, no hacer nada
        if (usuarioIdOrigen === usuarioId && fechaOrigenStr === fecha) {
          setActiveId(null)
          setActiveDragData(null)
          return
        }
        
        // Verificar si hay una asignación en el destino
        const keyDestino = `${fecha}-${usuarioId}`
        const asignacionDestino = asignacionesRef.current.get(keyDestino)
        
        if (asignacionDestino) {
          const confirmar = confirm(`Ya existe un turno ${asignacionDestino.tipoTurno?.codigo} en esta celda. ¿Reemplazar?`)
          if (!confirmar) {
            setActiveId(null)
            setActiveDragData(null)
            return
          }
          // Eliminar la asignación del destino primero
          if (asignacionDestino.id) {
            console.log('🗑️ Eliminando turno en destino antes de mover')
            await handleEliminarAsignacion(asignacionDestino.id, keyDestino)
            await new Promise(resolve => setTimeout(resolve, 100))
          } else {
            toast.error('ID de asignación en destino no válido')
            setActiveId(null)
            setActiveDragData(null)
            return
          }
        }
        
        setIsSaving(true)
        
        try {
          console.log('🔄 PASO 1: Actualizar Map local (optimistic update)')
          
          // IMPORTANTE: Actualizar el Map ANTES de hacer la llamada a la BD
          setAsignaciones(prev => {
            const newMap = new Map(prev)
            // Remover del origen
            newMap.delete(keyOrigen)
            // Agregar temporalmente al destino con un ID temporal
            newMap.set(keyDestino, {
              ...asignacionOriginal,
              id: 'temp-' + Date.now(), // ID temporal mientras se guarda
              fecha: new Date(fecha),
              usuarioId: usuarioId
            })
            console.log('✅ Map actualizado (optimistic)')
            return newMap
          })
          
          setRenderVersion(v => v + 1)
          
          console.log('🔄 PASO 2: Eliminar y crear en BD en paralelo')
          
          // Hacer las operaciones en la BD en paralelo
          const [deleteResult, createResult] = await Promise.all([
            eliminarAsignacion(asignacionId),
            asignarTurno({
              publicacionId: params.id,
              usuarioId,
              tipoTurnoId,
              fecha: new Date(fecha),
              esNocturno: false,
              esDiaInhabil: false,
              esFestivo: false,
            })
          ])
          
          console.log('📥 Resultados BD:', {
            delete: deleteResult.success,
            create: createResult.success
          })
          
          if (!createResult.success) {
            console.error('❌ Error al crear en BD, revirtiendo Map')
            // Si falla la creación, revertir el Map
            setAsignaciones(prev => {
              const newMap = new Map(prev)
              newMap.delete(keyDestino)
              newMap.set(keyOrigen, asignacionOriginal)
              return newMap
            })
            setRenderVersion(v => v + 1)
            toast.error(createResult.error || 'Error al mover el turno')
            setActiveId(null)
            setActiveDragData(null)
            setIsSaving(false)
            return
          }
          
          console.log('✅ PASO 3: Actualizar Map con ID real de BD')
          
          // Actualizar con el ID real de la BD
          setAsignaciones(prev => {
            const newMap = new Map(prev)
            newMap.set(keyDestino, {
              id: createResult.data!.id,
              fecha: new Date(fecha),
              tipoTurnoId: createResult.data!.tipoTurnoId,
              usuarioId: usuarioId,
              tipoTurno: {
                id: createResult.data!.tipoTurno?.id,
                codigo: createResult.data!.tipoTurno?.codigo || codigo,
                nombre: createResult.data!.tipoTurno?.nombre || nombre,
                color: createResult.data!.tipoTurno?.color || color
              }
            })
            console.log('✅ Map actualizado con ID real:', createResult.data!.id)
            return newMap
          })
          
          setRenderVersion(v => v + 1)
          
          toast.success(`Turno ${codigo} movido exitosamente`)
          
        } catch (error) {
          console.error('💥 Error inesperado al mover:', error)
          // Revertir el Map en caso de error
          setAsignaciones(prev => {
            const newMap = new Map(prev)
            newMap.delete(keyDestino)
            newMap.set(keyOrigen, asignacionOriginal)
            return newMap
          })
          setRenderVersion(v => v + 1)
          toast.error('Error inesperado al mover el turno')
        } finally {
          setIsSaving(false)
        }
      }
    }

    setActiveId(null)
    setActiveDragData(null)
  }

  // ============================================
  // FUNCIONES DE COPIAR/PEGAR SECUENCIAS
  // ============================================
  
  // Manejar selección de celdas con Shift+Click
  function handleCellClick(key: string, fecha: string, usuarioId: string, event: React.MouseEvent) {
    console.log('🖱️ CELL CLICK:', { 
      key, 
      fecha, 
      usuarioId, 
      shiftKey: event.shiftKey,
      lastSelectedCell,
      selectedCells: selectedCells.length
    })
    
    // Si hay Shift presionado, seleccionar rango
    if (event.shiftKey && lastSelectedCell) {
      console.log('🔵 SHIFT+CLICK detectado, calculando rango...')
      const lastParts = lastSelectedCell.split('-')
      const currentParts = key.split('-')
      
      // Solo permitir selección en la misma fila (mismo usuario)
      const lastUsuarioId = lastParts[lastParts.length - 1]
      const currentUsuarioId = currentParts[currentParts.length - 1]
      
      if (lastUsuarioId === currentUsuarioId) {
        // Calcular rango de fechas (evitar problema de zona horaria)
        const fechaInicio = lastParts.slice(0, 3).join('-')
        const fechaFin = currentParts.slice(0, 3).join('-')
        
        console.log('🔍 Calculando rango:', { fechaInicio, fechaFin, usuarioId: currentUsuarioId })
        
        // Crear Date con hora del mediodía para evitar problemas de zona horaria
        const startDate = new Date(fechaInicio + 'T12:00:00')
        const endDate = new Date(fechaFin + 'T12:00:00')
        
        // Obtener todos los días entre las fechas
        const dias = eachDayOfInterval({
          start: startDate,
          end: endDate
        })
        
        // Crear keys para cada día (usar el usuarioId correcto)
        const newSelection = dias.map(dia => `${format(dia, 'yyyy-MM-dd')}-${currentUsuarioId}`)
        console.log('✅ Rango seleccionado:', newSelection)
        setSelectedCells(newSelection)
        setLastSelectedCell(key) // Actualizar última celda seleccionada
        toast.success(`${newSelection.length} celda${newSelection.length > 1 ? 's' : ''} seleccionada${newSelection.length > 1 ? 's' : ''}`)
      } else {
        console.log('⚠️ Usuarios diferentes, no se puede seleccionar rango entre filas')
        toast.error('Solo puedes seleccionar celdas del mismo funcionario')
      }
    } else {
      // Selección simple (toggle)
      console.log('🔵 Selección simple')
      if (selectedCells.includes(key)) {
        console.log('  → Ya está seleccionada, DESELECCIONANDO:', key)
        setSelectedCells(prev => {
          const newState = prev.filter(k => k !== key)
          console.log('  ✅ Nuevo estado después de deseleccionar:', newState)
          return newState
        })
        setLastSelectedCell(null)
      } else {
        console.log('  → NO está seleccionada, SELECCIONANDO:', key)
        setSelectedCells(prev => {
          const newState = [key]
          console.log('  ✅ Nuevo estado después de seleccionar:', newState)
          return newState
        })
        setLastSelectedCell(key)
      }
    }
  }
  
  // Copiar secuencia seleccionada (incluyendo espacios vacíos)
  function handleCopySequence() {
    if (selectedCells.length === 0) {
      toast.error('No hay celdas seleccionadas')
      return
    }
    
    // Copiar TODAS las celdas, incluyendo las vacías (libres)
    const sequence: (Asignacion | { isEmpty: true; key: string })[] = []
    selectedCells.forEach(key => {
      const asignacion = asignaciones.get(key)
      if (asignacion) {
        sequence.push(asignacion)
      } else {
        // Marcar como día libre
        sequence.push({ isEmpty: true, key })
      }
    })
    
    setCopiedSequence(sequence as any)
    
    // Generar string visual de la secuencia
    const secuenciaStr = sequence
      .map(item => {
        if ('isEmpty' in item && item.isEmpty) return 'Libre'
        return (item as Asignacion).tipoTurno?.codigo || '?'
      })
      .join(' → ')
    
    toast.success(`${sequence.length} días copiados: ${secuenciaStr}`)
  }
  
  // Validar pegado de secuencia (considerando días libres)
  function validatePaste(
    sequence: any[],
    targetFecha: string,
    targetUsuarioId: string
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    sequence.forEach((item, index) => {
      // Si es un día libre, no validar (no se pegará)
      if (item.isEmpty) return
      
      // Calcular fecha de destino para este turno
      const fechaBase = new Date(targetFecha + 'T12:00:00')
      fechaBase.setDate(fechaBase.getDate() + index)
      const dayOfWeek = fechaBase.getDay()
      const fechaDestino = format(fechaBase, 'yyyy-MM-dd')
      
      // Validación 1: Turnos de viernes solo en viernes
      const codigo = item.tipoTurno?.codigo || ''
      if (codigo === 'AV' && dayOfWeek !== 5) {
        errors.push(`Día ${index + 1}: Turno ${codigo} solo puede ir en viernes`)
      }
      
      // Validación 2: Verificar si la celda destino ya está ocupada
      const keyDestino = `${fechaDestino}-${targetUsuarioId}`
      const asignacionExistente = asignaciones.get(keyDestino)
      if (asignacionExistente) {
        errors.push(`Día ${index + 1} (${fechaDestino}): Ya tiene turno ${asignacionExistente.tipoTurno?.codigo}`)
      }
    })
    
    return { valid: errors.length === 0, errors }
  }
  
  // Mostrar vista previa de pegado
  function handlePastePreview(targetKey: string) {
    if (copiedSequence.length === 0) {
      toast.error('No hay secuencia copiada')
      return
    }
    
    const [targetFecha, targetUsuarioId] = targetKey.split('-').slice(-4).join('-').split('-')
    const fechaCompleta = targetKey.split('-').slice(0, 3).join('-')
    
    // Validar el pegado
    const validation = validatePaste(copiedSequence, fechaCompleta, targetKey.split('-').pop()!)
    
    setPastePreview({
      destino: targetKey,
      turnos: copiedSequence,
      errors: validation.errors
    })
  }
  
  // Ejecutar pegado de secuencia (incluyendo días libres)
  async function handleConfirmPaste() {
    if (!pastePreview) return
    
    const targetUsuarioId = pastePreview.destino.split('-').pop()!
    const fechaCompleta = pastePreview.destino.split('-').slice(0, 3).join('-')
    
    setIsSaving(true)
    let turnosPegados = 0
    
    try {
      // Asignar cada turno de la secuencia
      for (let i = 0; i < pastePreview.turnos.length; i++) {
        const item = pastePreview.turnos[i] as any
        
        // Si es un día libre (isEmpty), saltarlo
        if (item.isEmpty) {
          console.log(`  Día ${i + 1}: Libre (saltando)`)
          continue
        }
        
        // Calcular fecha destino (con hora del mediodía para evitar zona horaria)
        const fechaBase = new Date(fechaCompleta + 'T12:00:00')
        fechaBase.setDate(fechaBase.getDate() + i)
        const nuevaFecha = format(fechaBase, 'yyyy-MM-dd')
        
        // Verificar si existe el tipo de turno
        if (!item.tipoTurnoId) {
          console.log(`  Día ${i + 1}: Sin tipoTurnoId, saltando`)
          continue
        }
        
        console.log(`  Día ${i + 1}: Asignando ${item.tipoTurno?.codigo} en ${nuevaFecha}`)
        
        const result = await asignarTurno({
          publicacionId: params.id,
          usuarioId: targetUsuarioId,
          tipoTurnoId: item.tipoTurnoId,
          fecha: new Date(nuevaFecha + 'T12:00:00'),
          esNocturno: false,
          esDiaInhabil: false,
          esFestivo: false,
        })
        
        if (result.success && result.data) {
          // Actualizar Map local
          const key = `${nuevaFecha}-${targetUsuarioId}`
          setAsignaciones(prev => {
            const newMap = new Map(prev)
            newMap.set(key, {
              id: result.data!.id,
              fecha: new Date(nuevaFecha),
              usuarioId: targetUsuarioId,
              tipoTurnoId: result.data!.tipoTurnoId,
              tipoTurno: item.tipoTurno
            })
            return newMap
          })
          turnosPegados++
        }
      }
      
      setRenderVersion(v => v + 1)
      toast.success(`Secuencia pegada: ${turnosPegados} turnos (${pastePreview.turnos.length - turnosPegados} días libres)`)
      setPastePreview(null)
      setSelectedCells([])
      setCopiedSequence([])
      
    } catch (error) {
      console.error('Error al pegar secuencia:', error)
      toast.error('Error al pegar la secuencia')
    } finally {
      setIsSaving(false)
    }
  }

  // Calcular métricas de HLM y validaciones DAN 11 por usuario
  function calcularMetricasUsuario(usuarioId: string) {
    const todasLasAsignaciones = Array.from(asignaciones.values())
    const turnosUsuario = todasLasAsignaciones.filter(a => a.usuarioId === usuarioId)
    
    // DEBUG: Logs para diagnosticar el problema de horas incorrectas
    console.log(`🔍 MÉTRICAS - Usuario: ${usuarioId}`)
    console.log(`  Total asignaciones en Map: ${todasLasAsignaciones.length}`)
    console.log(`  Turnos filtrados para este usuario: ${turnosUsuario.length}`)
    if (turnosUsuario.length > 0) {
      console.log(`  Turnos:`, turnosUsuario.map(t => ({
        codigo: t.tipoTurno?.codigo,
        fecha: t.fecha,
        usuarioId: t.usuarioId
      })))
    }
    
    // Horas por tipo de turno según documento oficial
    const HORAS_TURNO: Record<string, number> = {
      'A': 9, 'AV': 8, 'OP': 12, 'OE': 12, 'B': 9,
      'CIC': 12, 'C': 9, 'CV': 8, 'D': 12, 'D11S': 9.5,
      'E': 9, 'EV': 8, 'IA': 9, 'IAV': 8, 'ID': 12,
      'IN': 3.5, 'IS': 8.5, 'N': 3.5, 'S': 8.5,
      'O': 9, 'OV': 8, 'PA': 9, 'PAV': 8, 'R': 4,
      'L': 0, 'FLA': 0, 'DA': 0, 'DV': 0, 'DC': 0, 'DN': 0, 'DS': 0
    }
    
    // Horas devueltas por descansos complementarios
    const DEVOLUCION_HORAS: Record<string, number> = {
      'DA': 9, 'DV': 8, 'DC': 12, 'DN': 3.5, 'DS': 8.5
    }
    
    let horasTrabajadas = 0
    let horasDevueltas = 0
    const horasSemanales = [0, 0, 0, 0, 0] // 5 semanas máximo
    const alertas: string[] = []
    
    turnosUsuario.forEach(turno => {
      const codigo = turno.tipoTurno?.codigo || ''
      const horas = HORAS_TURNO[codigo] || 0
      const devolucion = DEVOLUCION_HORAS[codigo] || 0
      
      console.log(`    Turno ${codigo}: ${horas}h trabajadas, ${devolucion}h devueltas`)
      
      horasTrabajadas += horas
      horasDevueltas += devolucion
      
      // Calcular semana del mes
      const dia = new Date(turno.fecha).getDate()
      const semana = Math.floor((dia - 1) / 7)
      if (semana < 5) {
        horasSemanales[semana] += horas
      }
    })
    
    console.log(`  ✅ Total horas trabajadas: ${horasTrabajadas}h`)
    console.log(`  ✅ Total horas devueltas: ${horasDevueltas}h`)
    
    // Validaciones DAN 11
    if (horasTrabajadas > 192) {
      alertas.push(`Excede 192h/mes (${horasTrabajadas}h)`)
    }
    
    horasSemanales.forEach((horas, semana) => {
      if (horas > 54) {
        alertas.push(`Semana ${semana + 1}: ${horas}h (máx 54h)`)
      }
    })
    
    const balanceHLM = 168 - horasTrabajadas + horasDevueltas
    const horasExtras = Math.max(0, horasTrabajadas - horasDevueltas - 168)
    
    return {
      horasTrabajadas,
      horasDevueltas,
      balanceHLM,
      horasExtras,
      alertas,
      horasSemanales,
      estado: alertas.length > 0 ? 'alerta' : balanceHLM < 0 ? 'sobrecarga' : 'ok'
    }
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!publicacion) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No se encontró la publicación</h2>
          <Button onClick={() => router.push('/turnos')}>
            Volver a Turnos
          </Button>
        </div>
      </div>
    )
  }

  const fechaInicio = startOfMonth(new Date(publicacion.año, publicacion.mes - 1))
  const fechaFin = endOfMonth(fechaInicio)
  const dias = eachDayOfInterval({ start: fechaInicio, end: fechaFin })

  // DEBUG: Log de estados en cada render
  console.log('🔄 RENDER - Estados actuales:', {
    selectedCells: selectedCells.length,
    copiedSequence: copiedSequence.length,
    mostrarBotones: selectedCells.length > 0,
    mostrarBadgeCopia: copiedSequence.length > 0
  })

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push(`/turnos/${params.id}`)}
              disabled={isSaving}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight capitalize">
                Editar Rol - {format(fechaInicio, 'MMMM yyyy', { locale: es })}
              </h2>
              <p className="text-muted-foreground">
                {publicacion.unidad?.nombre || 'Unidad'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMostrarMetricas(!mostrarMetricas)}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {mostrarMetricas ? 'Ocultar' : 'Ver'} Métricas
            </Button>
            
            {/* Botones de Copiar/Pegar */}
            {selectedCells.length > 0 && (
              <>
                <Badge variant="secondary">
                  {selectedCells.length} celda{selectedCells.length > 1 ? 's' : ''} seleccionada{selectedCells.length > 1 ? 's' : ''}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopySequence}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedCells([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {copiedSequence.length > 0 && (
              <Badge variant="default" className="bg-green-600">
                <Clipboard className="mr-1 h-3 w-3" />
                {copiedSequence.length} turno{copiedSequence.length > 1 ? 's' : ''} copiado{copiedSequence.length > 1 ? 's' : ''}
              </Badge>
            )}
            
            <OpcionesAvanzadas publicacionId={params.id} />
            <Badge variant={publicacion.estado === 'PUBLICADO' ? 'default' : 'secondary'}>
              {publicacion.estado}
            </Badge>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Métricas HLM */}
        {mostrarMetricas && (
          <Card className="border-2 border-primary" key={`metricas-${renderVersion}-${asignaciones.size}`}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Panel de Métricas HLM y Validaciones DAN 11
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setMostrarMetricas(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Funcionario</th>
                      <th className="text-center p-2">H. Trabajadas</th>
                      <th className="text-center p-2">H. Devueltas</th>
                      <th className="text-center p-2">Balance HLM</th>
                      <th className="text-center p-2">H. Extras</th>
                      <th className="text-center p-2">Sem 1</th>
                      <th className="text-center p-2">Sem 2</th>
                      <th className="text-center p-2">Sem 3</th>
                      <th className="text-center p-2">Sem 4</th>
                      <th className="text-center p-2">Validaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(usuario => {
                      const m = calcularMetricasUsuario(usuario.id)
                      
                      // DEBUG: Log del valor renderizado en UI
                      console.log(`📊 RENDERIZANDO - ${usuario.nombre} ${usuario.apellido}: ${m.horasTrabajadas}h`)
                      
                      return (
                        <tr 
                          key={usuario.id} 
                          className={cn(
                            "border-b hover:bg-accent/50",
                            m.estado === 'alerta' && "bg-red-50 dark:bg-red-950/20"
                          )}
                        >
                          <td className="p-2 font-medium">
                            {usuario.nombre} {usuario.apellido}
                          </td>
                          <td className="text-center p-2">{m.horasTrabajadas}h</td>
                          <td className="text-center p-2 text-blue-600">
                            {m.horasDevueltas > 0 ? `-${m.horasDevueltas}h` : '-'}
                          </td>
                          <td className={cn(
                            "text-center p-2 font-bold",
                            m.balanceHLM < 0 ? "text-red-600" : 
                            m.balanceHLM > 20 ? "text-yellow-600" : 
                            "text-green-600"
                          )}>
                            {m.balanceHLM > 0 ? '+' : ''}{m.balanceHLM}h
                          </td>
                          <td className="text-center p-2">
                            {m.horasExtras > 0 && (
                              <span className="text-orange-600 font-semibold">
                                +{m.horasExtras}h
                              </span>
                            )}
                          </td>
                          {m.horasSemanales.slice(0, 4).map((h, i) => (
                            <td 
                              key={i} 
                              className={cn(
                                "text-center p-2",
                                h > 54 && "text-red-600 font-bold"
                              )}
                            >
                              {h || '-'}
                            </td>
                          ))}
                          <td className="text-center p-2">
                            {m.alertas.length > 0 ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="destructive" className="cursor-help">
                                    ⚠️ {m.alertas.length}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <ul className="text-xs">
                                    {m.alertas.map((a, i) => (
                                      <li key={i}>{a}</li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Badge variant="default" className="bg-green-600">✅ OK</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted font-semibold">
                      <td className="p-2">TOTALES</td>
                      <td className="text-center p-2">
                        {usuarios.reduce((sum, u) => 
                          sum + calcularMetricasUsuario(u.id).horasTrabajadas, 0
                        )}h
                      </td>
                      <td className="text-center p-2 text-blue-600">
                        -{usuarios.reduce((sum, u) => 
                          sum + calcularMetricasUsuario(u.id).horasDevueltas, 0
                        )}h
                      </td>
                      <td className="text-center p-2" colSpan={6}>
                        Promedio: {usuarios.length > 0 ? Math.round(usuarios.reduce((sum, u) => 
                          sum + calcularMetricasUsuario(u.id).balanceHLM, 0
                        ) / usuarios.length) : 0}h
                      </td>
                      <td className="text-center p-2">
                        {usuarios.filter(u => 
                          calcularMetricasUsuario(u.id).alertas.length > 0
                        ).length} alertas
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* Leyenda */}
              <div className="mt-4 p-3 bg-muted rounded-lg text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>📊 <strong>HLM:</strong> Meta 168h/mes</div>
                  <div>⚠️ <strong>DAN 11:</strong> Máx 192h/mes, 54h/sem</div>
                  <div>🔄 <strong>Descansos:</strong> Devuelven horas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar con tipos de turno */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipos de Turno</CardTitle>
                <CardDescription>Arrastra al calendario para asignar</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-2">
                    {tiposTurno.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        No hay tipos de turno disponibles
                      </div>
                    ) : (
                      tiposTurno.map(turno => (
                        <DraggableTurnoType
                          key={turno.id}
                          id={turno.id}
                          codigo={turno.codigo}
                          color={turno.color || '#6B7280'}
                          nombre={turno.nombre}
                          horaInicio={turno.horaInicio}
                          horaFin={turno.horaFin}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Calendario editable */}
          <div className="col-span-9">
            <Card>
              <CardHeader>
                <CardTitle>Calendario de Asignación</CardTitle>
                <CardDescription>
                  Arrastra tipos de turno desde el sidebar para asignar. Arrastra turnos asignados para moverlos. Haz clic en X para eliminar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usuarios.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay funcionarios disponibles</h3>
                    <p className="text-muted-foreground">
                      Necesitas tener funcionarios activos en la unidad para asignar turnos
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium sticky left-0 bg-background z-10 min-w-[140px]">
                            Funcionario
                          </th>
                          {dias.map(dia => {
                            const diaSemana = getDay(dia)
                            const esFinDeSemana = diaSemana === 0 || diaSemana === 6
                            return (
                              <th 
                                key={dia.toISOString()} 
                                className={cn(
                                  "p-1 text-center text-xs min-w-[45px]",
                                  esFinDeSemana && "bg-muted/50"
                                )}
                              >
                                <div className="font-normal capitalize">{format(dia, 'EEE', { locale: es })}</div>
                                <div className="font-bold text-base">{format(dia, 'd')}</div>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {usuarios.map(usuario => (
                          <tr key={usuario.id} className="border-b hover:bg-accent/30 transition-colors">
                            <td className="p-2 font-medium sticky left-0 bg-background z-10">
                              <div>
                                <div className="text-sm">{usuario.nombre} {usuario.apellido}</div>
                                {usuario.abreviatura?.codigo && (
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {usuario.abreviatura.codigo}
                                  </div>
                                )}
                              </div>
                            </td>
                            {dias.map(dia => {
                              const fecha = format(dia, 'yyyy-MM-dd')
                              const key = `${fecha}-${usuario.id}`
                              const asignacion = asignaciones.get(key)
                              const esFinDeSemana = getDay(dia) === 0 || getDay(dia) === 6
                              
                              const isSelected = selectedCells.includes(key)
                              const canPaste = copiedSequence.length > 0 && !asignacion
                              
                              return (
                                <td 
                                  key={dia.toISOString()} 
                                  className="p-0"
                                  onClick={(e) => {
                                    // CRÍTICO: Capturar click a nivel de TD para que funcione siempre
                                    // Solo si NO es click en botón de eliminar
                                    const target = e.target as HTMLElement
                                    if (target.tagName === 'BUTTON' || target.closest('button')) {
                                      return // Permitir que el botón de eliminar funcione
                                    }
                                    
                                    console.log('👆 TD CLICK - Celda:', key, 'Tiene turno:', !!asignacion)
                                    
                                    // Si hay secuencia copiada y la celda está vacía, mostrar preview
                                    if (canPaste) {
                                      console.log('  → Modo PASTE, mostrando preview')
                                      handlePastePreview(key)
                                    } else {
                                      // Si no, manejar selección (SIEMPRE, tenga o no turno)
                                      console.log('  → Modo SELECCIÓN, llamando handleCellClick')
                                      handleCellClick(key, fecha, usuario.id, e)
                                    }
                                  }}
                                >
                                  <div
                                    className={cn(
                                      "relative",
                                      isSelected && "ring-2 ring-blue-500 ring-inset z-10 bg-blue-50 dark:bg-blue-950/20",
                                      canPaste && "hover:bg-green-50 dark:hover:bg-green-950/20"
                                    )}
                                  >
                                    <DroppableCalendarCell
                                      id={key}
                                      fecha={fecha}
                                      usuarioId={usuario.id}
                                      isWeekend={esFinDeSemana}
                                    >
                                      {asignacion && (
                                        <DraggableAsignacion
                                          key={`${asignacion.id}-v${renderVersion}`}
                                          asignacion={{
                                            id: asignacion.id,
                                            fecha: fecha, // Usar fecha del loop (ya en formato 'yyyy-MM-dd')
                                            usuarioId: usuario.id,
                                            tipoTurnoId: asignacion.tipoTurnoId || asignacion.tipoTurno?.id,
                                            tipoTurno: {
                                              id: asignacion.tipoTurno?.id,
                                              codigo: asignacion.tipoTurno?.codigo || '',
                                              nombre: asignacion.tipoTurno?.nombre,
                                              color: asignacion.tipoTurno?.color
                                            }
                                          }}
                                          onDelete={() => {
                                            if (asignacion.id) {
                                              handleEliminarAsignacion(asignacion.id, key)
                                            } else {
                                              toast.error('ID de asignación no válido')
                                            }
                                          }}
                                        />
                                      )}
                                      
                                      {/* Indicador de paste disponible */}
                                      {canPaste && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                          <Clipboard className="h-3 w-3 text-green-600" />
                                        </div>
                                      )}
                                    </DroppableCalendarCell>
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de vista previa para pegar */}
      <Dialog open={!!pastePreview} onOpenChange={() => setPastePreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vista Previa - Pegar Secuencia</DialogTitle>
            <DialogDescription>
              Revisa los turnos que se pegarán antes de confirmar
            </DialogDescription>
          </DialogHeader>
          
          {pastePreview && (
            <div className="space-y-4">
              {/* Información de la secuencia */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {pastePreview.turnos.length} turno{pastePreview.turnos.length > 1 ? 's' : ''}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Secuencia: {pastePreview.turnos.map(t => t.tipoTurno?.codigo).join(' → ')}
                </span>
              </div>
              
              {/* Tabla de preview */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Día</th>
                      <th className="text-center p-2">Turno</th>
                      <th className="text-left p-2">Horario</th>
                      <th className="text-center p-2">Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastePreview.turnos.map((item: any, index) => {
                      const fechaBase = new Date(pastePreview.destino.split('-').slice(0, 3).join('-') + 'T12:00:00')
                      fechaBase.setDate(fechaBase.getDate() + index)
                      const fecha = format(fechaBase, 'yyyy-MM-dd')
                      
                      const isLibre = item.isEmpty === true
                      
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-2">
                            {format(fechaBase, "EEE d 'de' MMMM", { locale: es })}
                          </td>
                          <td className="text-center p-2">
                            {isLibre ? (
                              <Badge variant="outline" className="text-muted-foreground">
                                Libre
                              </Badge>
                            ) : (
                              <Badge style={{ backgroundColor: item.tipoTurno?.color, color: 'white' }}>
                                {item.tipoTurno?.codigo}
                              </Badge>
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground text-xs">
                            {isLibre ? 'Día de descanso' : (item.tipoTurno?.nombre || '-')}
                          </td>
                          <td className="text-center p-2">
                            {isLibre ? '0h' : '12h'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Errores de validación */}
              {pastePreview.errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
                  <h4 className="font-semibold text-destructive mb-2">⚠️ Errores de Validación:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {pastePreview.errors.map((error, i) => (
                      <li key={i} className="text-destructive">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPastePreview(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmPaste}
              disabled={pastePreview?.errors && pastePreview.errors.length > 0}
            >
              <Check className="mr-2 h-4 w-4" />
              Confirmar Pegado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drag overlay */}
      <DragOverlay>
        {activeId && activeDragData?.type === 'turno' && (
          <div 
            className="bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg font-semibold"
          >
            {activeDragData.codigo} - {activeDragData.nombre}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

