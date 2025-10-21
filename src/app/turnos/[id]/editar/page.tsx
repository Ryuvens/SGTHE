'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { format, eachDayOfInterval, getDay, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Save, ArrowLeft, Users, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

  // Sincronizar ref con estado
  useEffect(() => {
    asignacionesRef.current = asignaciones
  }, [asignaciones])

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
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

  // Manejar drag end
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
            const key = `${fecha}-${usuarioId}`
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
        
        console.log('📦 Moviendo turno:', JSON.stringify({
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
        
        // Si es la misma celda, no hacer nada
        const fechaOrigenStr = format(new Date(fechaOrigen), 'yyyy-MM-dd')
        if (usuarioIdOrigen === usuarioId && fechaOrigenStr === fecha) {
          console.log('⏭️ Misma celda, no mover')
          setActiveId(null)
          setActiveDragData(null)
          return
        }
        
        // VALIDACIÓN: Verificar que la celda de destino esté vacía
        const keyDestino = `${fecha}-${usuarioId}`
        const asignacionEnDestino = asignacionesRef.current.get(keyDestino)
        
        if (asignacionEnDestino) {
          console.log('⚠️ Celda de destino ya tiene turno:', asignacionEnDestino.tipoTurno?.codigo)
          toast.error(`La celda ya tiene asignado el turno ${asignacionEnDestino.tipoTurno?.codigo}. Elimínalo primero.`)
          setActiveId(null)
          setActiveDragData(null)
          return
        }
        
        setIsSaving(true)
        try {
          console.log(`🗑️ Paso 1: Eliminando asignación ${asignacionId}...`)
          
          // 1. Eliminar de posición original
          const deleteResult = await eliminarAsignacion(asignacionId)
          console.log('📥 Resultado eliminación:', JSON.stringify(deleteResult, null, 2))
          
          if (!deleteResult.success) {
            console.error('❌ Falló eliminación:', deleteResult.error)
            toast.error('Error al mover: no se pudo eliminar el turno original')
            setIsSaving(false)
            setActiveId(null)
            setActiveDragData(null)
            return
          }
          
          console.log('✅ Eliminado exitosamente, creando en nueva posición...')
          
          // 2. Crear en nueva posición
          const result = await asignarTurno({
            publicacionId: params.id,
            usuarioId,
            tipoTurnoId,
            fecha: new Date(fecha),
            esNocturno: false,
            esDiaInhabil: false,
            esFestivo: false,
          })
          
          console.log('📥 Resultado creación:', JSON.stringify({
            success: result.success,
            id: result.data?.id,
            tipoTurnoId: result.data?.tipoTurnoId,
            codigo: result.data?.tipoTurno?.codigo
          }, null, 2))
          
          if (result.success && result.data) {
            // Actualizar estado local
            const keyOrigen = `${fechaOrigenStr}-${usuarioIdOrigen}`
            const keyDestino = `${fecha}-${usuarioId}`
            
            console.log(`🔄 Actualizando Map: ${keyOrigen} -> ${keyDestino}`)
            console.log('📦 Nueva asignación:', JSON.stringify({
              id: result.data.id,
              tipoTurnoId: result.data.tipoTurnoId,
              codigo: result.data.tipoTurno?.codigo
            }, null, 2))
            
            // Primero eliminar del Map origen para forzar unmount del componente viejo
            setAsignaciones(prev => {
              const newMap = new Map(prev)
              newMap.delete(keyOrigen)
              console.log('🗑️ Eliminado del Map origen:', keyOrigen)
              return newMap
            })
            
            // Pequeña pausa para que React desmonte el componente viejo
            await new Promise(resolve => setTimeout(resolve, 50))
            
            // Luego agregar en destino
            setAsignaciones(prev => {
              const newMap = new Map(prev)
              newMap.set(keyDestino, {
                id: result.data!.id,
                fecha: new Date(fecha),
                tipoTurnoId: result.data!.tipoTurnoId,
                usuarioId: usuarioId,
                tipoTurno: {
                  id: result.data!.tipoTurno?.id,
                  codigo: result.data!.tipoTurno?.codigo || codigo,
                  nombre: result.data!.tipoTurno?.nombre || nombre,
                  color: result.data!.tipoTurno?.color || color
                }
              })
              console.log('✅ Agregado al Map destino:', keyDestino)
              return newMap
            })
            
            toast.success('Turno movido exitosamente')
          } else {
            console.error('❌ Error al crear en nueva posición:', result.error)
            toast.error(result.error || 'Error al mover el turno')
          }
        } catch (error) {
          console.error('💥 Error inesperado al mover turno:', error)
          toast.error('Error inesperado al mover el turno')
        } finally {
          setIsSaving(false)
        }
      }
    }

    setActiveId(null)
    setActiveDragData(null)
  }

  // Eliminar asignación por ID (busca en Map por ID, no por key)
  async function handleDeleteByKey(asignacionId: string) {
    console.log('🗑️ Eliminando asignación por ID:', asignacionId)
    
    // Buscar la key correcta en el Map usando el ID de la asignación
    let keyToDelete: string | null = null
    
    // Convertir Map entries a array para iterar
    const entries = Array.from(asignacionesRef.current.entries())
    for (const [key, asignacion] of entries) {
      if (asignacion.id === asignacionId) {
        keyToDelete = key
        console.log('✅ Encontrada en Map:', JSON.stringify({
          key,
          id: asignacion.id,
          turno: asignacion.tipoTurno?.codigo
        }, null, 2))
        break
      }
    }
    
    if (!keyToDelete) {
      console.error('❌ No se encontró asignación con ID:', asignacionId, 'en Map')
      console.error('Keys disponibles en Map:', Array.from(asignacionesRef.current.keys()))
      toast.error('Asignación no encontrada en el calendario')
      return
    }
    
    setIsSaving(true)
    
    try {
      const result = await eliminarAsignacion(asignacionId)
      console.log('📥 Resultado eliminar:', JSON.stringify(result, null, 2))
      
      if (result.success) {
        setAsignaciones(prev => {
          const newMap = new Map(prev)
          newMap.delete(keyToDelete!)
          console.log('✅ Eliminado del Map, key:', keyToDelete)
          return newMap
        })
        toast.success('Turno eliminado correctamente')
      } else {
        console.error('❌ Error del servidor:', result.error)
        toast.error(result.error || 'Error al eliminar turno')
      }
    } catch (error) {
      console.error('💥 Error inesperado al eliminar turno:', error)
      toast.error('Error inesperado al eliminar turno')
    } finally {
      setIsSaving(false)
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
                              
                              return (
                                <td key={dia.toISOString()} className="p-0">
                                  <DroppableCalendarCell
                                    id={key}
                                    fecha={fecha}
                                    usuarioId={usuario.id}
                                    isWeekend={esFinDeSemana}
                                  >
                                    {asignacion && (
                                      <DraggableAsignacion
                                        key={asignacion.id}
                                        asignacion={{
                                          id: asignacion.id,
                                          fecha: fecha,
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
                                            handleDeleteByKey(asignacion.id)
                                          } else {
                                            toast.error('ID de asignación no válido')
                                          }
                                        }}
                                      />
                                    )}
                                  </DroppableCalendarCell>
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

