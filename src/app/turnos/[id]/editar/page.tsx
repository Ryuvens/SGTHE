'use client'

import { useState, useEffect } from 'react'
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
  DroppableCalendarCell 
} from '@/components/turnos/drag-drop-components'

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
  tipoTurno?: {
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDragData, setActiveDragData] = useState<any>(null)

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
          tipoTurno: {
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
      
      // Si es un tipo de turno
      if (activeData?.type === 'turno') {
        setIsSaving(true)
        try {
          const result = await asignarTurno({
            publicacionId: params.id,
            usuarioId,
            tipoTurnoId: activeData.turnoId,
            fecha: new Date(fecha),
            esNocturno: false,
            esDiaInhabil: false,
            esFestivo: false,
          })
          
          if (result.success) {
            // Actualizar asignaciones localmente
            const key = `${fecha}-${usuarioId}`
            setAsignaciones(prev => {
              const newMap = new Map(prev)
              newMap.set(key, {
                id: result.data?.id,
                fecha: new Date(fecha),
                tipoTurno: {
                  codigo: activeData.codigo,
                  nombre: activeData.nombre,
                  color: activeData.color
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
    }

    setActiveId(null)
    setActiveDragData(null)
  }

  // Eliminar asignación
  async function handleRemoveAsignacion(key: string, asignacionId?: string) {
    if (!asignacionId) return

    setIsSaving(true)
    try {
      const result = await eliminarAsignacion(asignacionId)
      
      if (result.success) {
        setAsignaciones(prev => {
          const newMap = new Map(prev)
          newMap.delete(key)
          return newMap
        })
        toast.success('Turno eliminado')
      } else {
        toast.error('Error al eliminar turno')
      }
    } catch (error) {
      toast.error('Error al eliminar turno')
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
                  Arrastra los tipos de turno a las celdas para asignar. Haz clic derecho en una celda asignada para eliminar.
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
                                      <div 
                                        className="rounded px-1.5 py-1.5 text-xs font-semibold text-center cursor-pointer hover:opacity-80 transition-opacity"
                                        style={{ 
                                          backgroundColor: asignacion.tipoTurno?.color || '#6B7280',
                                          color: 'white'
                                        }}
                                        onClick={() => handleRemoveAsignacion(key, asignacion.id)}
                                        title={`${asignacion.tipoTurno?.nombre || asignacion.tipoTurno?.codigo}\nClick para eliminar`}
                                      >
                                        {asignacion.tipoTurno?.codigo}
                                      </div>
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

