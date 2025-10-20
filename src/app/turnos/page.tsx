// src/app/turnos/page.tsx
import { Calendar, Plus, Users, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getRolesMenuales } from '@/lib/actions/turnos'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Función para mapear estado a variante de badge
function getEstadoBadgeVariant(estado: string): "default" | "secondary" | "destructive" | "outline" {
  switch (estado) {
    case 'PUBLICADO':
    case 'VIGENTE':
      return 'default'
    case 'BORRADOR':
      return 'secondary'
    case 'CERRADO':
      return 'outline'
    default:
      return 'outline'
  }
}

// Función para mapear estado a etiqueta legible
function getEstadoLabel(estado: string): string {
  switch (estado) {
    case 'BORRADOR':
      return 'Borrador'
    case 'PUBLICADO':
      return 'Publicado'
    case 'VIGENTE':
      return 'Vigente'
    case 'CERRADO':
      return 'Cerrado'
    default:
      return estado
  }
}

// Tabla de roles
async function RolesTable() {
  const result = await getRolesMenuales()
  const roles = result.data || []
  
  if (roles.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No hay roles de turno creados
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Crea tu primer rol mensual para comenzar a gestionar los turnos del personal
            </p>
            <Button asChild size="lg">
              <Link href="/turnos/nuevo">
                <Plus className="mr-2 h-5 w-5" />
                Crear Primer Rol Mensual
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles Mensuales</CardTitle>
        <CardDescription>
          Gestión de publicaciones de turnos por mes y año
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {roles.map((rol) => {
            const fecha = new Date(rol.año, rol.mes - 1, 1)
            
            return (
              <div
                key={rol.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold capitalize">
                      {format(fecha, 'MMMM yyyy', { locale: es })}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {rol.unidad?.nombre || 'Unidad'}
                      </p>
                      <span className="text-sm text-muted-foreground">•</span>
                      <p className="text-sm text-muted-foreground">
                        {rol._count?.asignaciones || 0} asignaciones
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge variant={getEstadoBadgeVariant(rol.estado)}>
                    {getEstadoLabel(rol.estado)}
                  </Badge>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/turnos/${rol.id}`}>
                        Ver
                      </Link>
                    </Button>
                    {rol.estado !== 'CERRADO' && (
                      <Button size="sm" asChild>
                        <Link href={`/turnos/${rol.id}/editar`}>
                          Gestionar
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Estadísticas
async function EstadisticasTurnos() {
  const result = await getRolesMenuales()
  const roles = result.data || []
  
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  
  // Buscar rol del mes actual
  const rolActual = roles.find(r => r.mes === currentMonth && r.año === currentYear)
  
  // Calcular estadísticas
  const totalAsignaciones = roles.reduce((sum, r) => sum + (r._count?.asignaciones || 0), 0)
  const rolesPublicados = roles.filter(r => r.estado === 'PUBLICADO' || r.estado === 'VIGENTE').length
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rol Actual</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">
            {format(new Date(), 'MMM yyyy', { locale: es })}
          </div>
          <p className="text-xs text-muted-foreground">
            {rolActual ? getEstadoLabel(rolActual.estado) : 'Sin crear'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{roles.length}</div>
          <p className="text-xs text-muted-foreground">
            {rolesPublicados} publicados
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Asignaciones</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAsignaciones}</div>
          <p className="text-xs text-muted-foreground">
            Total de turnos asignados
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estado</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">OK</div>
          <p className="text-xs text-muted-foreground">
            Sin validaciones pendientes
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function TurnosPage() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Turnos</h2>
          <p className="text-muted-foreground mt-1">
            Administra los roles mensuales y asignaciones de turno
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/turnos/nuevo">
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Rol Mensual
          </Link>
        </Button>
      </div>
      
      <EstadisticasTurnos />
      <RolesTable />
    </div>
  )
}
