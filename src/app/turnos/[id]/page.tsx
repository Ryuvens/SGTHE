import { notFound } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Users, Clock, AlertCircle, Edit, FileDown, CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getPublicacion } from '@/lib/actions/turnos'

// Colores por defecto para tipos de turno
const DEFAULT_COLORS: Record<string, string> = {
  'M': 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 border-blue-300',
  'T': 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 border-amber-300',
  'N': 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100 border-indigo-300',
  'D': 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100 border-green-300',
  'L': 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100 border-gray-300',
  'ADM': 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100 border-purple-300',
}

function getTurnoColor(color?: string, codigo?: string): string {
  if (color) {
    // Convertir color hex a clases Tailwind
    return `border-2`
  }
  return DEFAULT_COLORS[codigo || ''] || 'bg-gray-100 text-gray-900 border-gray-300'
}

interface PageProps {
  params: {
    id: string
  }
}

export default async function RolDetallePage({ params }: PageProps) {
  const result = await getPublicacion(params.id)
  
  if (!result.success || !result.data) {
    notFound()
  }
  
  const publicacion = result.data
  const fechaInicio = startOfMonth(new Date(publicacion.año, publicacion.mes - 1))
  const fechaFin = endOfMonth(fechaInicio)
  const dias = eachDayOfInterval({ start: fechaInicio, end: fechaFin })
  
  // Organizar asignaciones por fecha y usuario
  const asignacionesMap = new Map()
  publicacion.asignaciones?.forEach(asig => {
    const key = `${format(new Date(asig.fecha), 'yyyy-MM-dd')}-${asig.usuarioId}`
    asignacionesMap.set(key, asig)
  })
  
  // Obtener usuarios únicos con turnos
  const usuariosConTurnos = Array.from(
    new Set(publicacion.asignaciones?.map(a => a.usuarioId) || [])
  ).map(id => {
    const asignacion = publicacion.asignaciones?.find(a => a.usuarioId === id)
    return asignacion?.usuario
  }).filter(Boolean)
  
  // Calcular estadísticas
  const totalDias = dias.length
  const totalPosiciones = totalDias * usuariosConTurnos.length
  const totalAsignado = publicacion.asignaciones?.length || 0
  const porcentajeCobertura = totalPosiciones > 0 
    ? Math.round((totalAsignado / totalPosiciones) * 100) 
    : 0

  // Calcular promedio de horas (aproximado)
  const horasTotales = publicacion.asignaciones?.reduce((acc, asig) => {
    return acc + (asig.tipoTurno?.duracionHoras || 8)
  }, 0) || 0
  const promedioHoras = usuariosConTurnos.length > 0 
    ? Math.round(horasTotales / usuariosConTurnos.length) 
    : 0

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/turnos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight capitalize">
            Rol de Turnos - {format(fechaInicio, 'MMMM yyyy', { locale: es })}
          </h2>
          <p className="text-muted-foreground">
            {publicacion.unidad.nombre} • {totalDias} días • {usuariosConTurnos.length} funcionarios
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={
            publicacion.estado === 'PUBLICADO' || publicacion.estado === 'VIGENTE' ? 'default' :
            publicacion.estado === 'BORRADOR' ? 'secondary' : 'outline'
          }>
            {publicacion.estado}
          </Badge>
          
          {publicacion.estado !== 'CERRADO' && (
            <Button asChild>
              <Link href={`/turnos/${params.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
          
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{porcentajeCobertura}%</div>
            <p className="text-xs text-muted-foreground">
              {totalAsignado} de {totalPosiciones} posiciones
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuariosConTurnos.length}</div>
            <p className="text-xs text-muted-foreground">
              Con turnos asignados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promedioHoras}</div>
            <p className="text-xs text-muted-foreground">
              Horas mensuales por persona
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validaciones</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Alertas DAN 11
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario de Turnos
          </CardTitle>
          <CardDescription>
            Vista mensual con asignaciones por funcionario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usuariosConTurnos.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay turnos asignados todavía</h3>
              <p className="text-muted-foreground mb-6">
                Comienza asignando turnos a los funcionarios de tu unidad
              </p>
              {publicacion.estado !== 'CERRADO' && (
                <Button asChild size="lg">
                  <Link href={`/turnos/${params.id}/editar`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Comenzar Asignación
                  </Link>
                </Button>
              )}
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
                          className={`p-1 text-center text-xs min-w-[40px] ${
                            esFinDeSemana ? 'bg-muted/50' : ''
                          }`}
                        >
                          <div className="font-normal capitalize">{format(dia, 'EEE', { locale: es })}</div>
                          <div className="font-bold text-base">{format(dia, 'd')}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {usuariosConTurnos.map(usuario => {
                    if (!usuario) return null
                    
                    return (
                      <tr key={usuario.id} className="border-b hover:bg-accent/50 transition-colors">
                        <td className="p-2 sticky left-0 bg-background z-10">
                          <div>
                            <p className="font-medium text-sm">
                              {usuario.nombre} {usuario.apellido}
                            </p>
                            {usuario.abreviatura?.codigo && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {usuario.abreviatura.codigo}
                              </p>
                            )}
                          </div>
                        </td>
                        {dias.map(dia => {
                          const key = `${format(dia, 'yyyy-MM-dd')}-${usuario.id}`
                          const asignacion = asignacionesMap.get(key)
                          const diaSemana = getDay(dia)
                          const esFinDeSemana = diaSemana === 0 || diaSemana === 6
                          
                          return (
                            <td 
                              key={dia.toISOString()} 
                              className={`p-1 text-center border-l ${
                                esFinDeSemana ? 'bg-muted/50' : ''
                              }`}
                            >
                              {asignacion && asignacion.tipoTurno && (
                                <div 
                                  className={`rounded px-1.5 py-1 text-xs font-semibold border ${
                                    getTurnoColor(asignacion.tipoTurno.color, asignacion.tipoTurno.codigo)
                                  }`}
                                  title={asignacion.tipoTurno.nombre}
                                >
                                  {asignacion.tipoTurno.codigo}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leyenda */}
      {usuariosConTurnos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Leyenda de Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {/* Obtener tipos de turno únicos de las asignaciones */}
              {Array.from(
                new Set(
                  publicacion.asignaciones
                    ?.map(a => a.tipoTurno)
                    .filter(Boolean)
                    .map(t => t!.codigo)
                )
              ).map(codigo => {
                const tipoTurno = publicacion.asignaciones
                  ?.find(a => a.tipoTurno?.codigo === codigo)
                  ?.tipoTurno
                
                if (!tipoTurno) return null
                
                return (
                  <div key={codigo} className="flex items-center gap-2">
                    <div 
                      className={`rounded px-2 py-1 text-xs font-semibold border ${
                        getTurnoColor(tipoTurno.color, tipoTurno.codigo)
                      }`}
                    >
                      {tipoTurno.codigo}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {tipoTurno.nombre}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

