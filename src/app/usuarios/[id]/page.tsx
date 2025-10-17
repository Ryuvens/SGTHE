import { notFound } from 'next/navigation'
import { ArrowLeft, Edit, Shield, Mail, Calendar, Hash, CreditCard, Activity, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getUsuarioById } from '@/lib/actions/usuarios'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { RolUsuario } from '@prisma/client'

// Force dynamic rendering - no cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface UsuarioDetailPageProps {
  params: {
    id: string
  }
}

const rolColors: Record<RolUsuario, string> = {
  ADMIN_SISTEMA: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  JEFE_UNIDAD: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  SUPERVISOR_ATS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ATCO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ATCO_ENTRENAMIENTO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
}

const rolLabels: Record<RolUsuario, string> = {
  ADMIN_SISTEMA: 'Administrador del Sistema',
  JEFE_UNIDAD: 'Jefe de Unidad',
  SUPERVISOR_ATS: 'Supervisor ATS',
  ATCO: 'Controlador',
  ATCO_ENTRENAMIENTO: 'Controlador en Entrenamiento',
}

export default async function UsuarioDetailPage({ params }: UsuarioDetailPageProps) {
  const result = await getUsuarioById(params.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  const usuario = result.data

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link href="/usuarios">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {usuario.nombre} {usuario.apellido}
            </h2>
            <p className="text-muted-foreground">
              Información detallada del usuario
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/usuarios/${usuario.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Información principal */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos personales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Datos Personales
            </CardTitle>
            <CardDescription>
              Información personal del funcionario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">RUT</p>
                <p className="text-lg">{usuario.rut || '-'}</p>
              </div>
              {usuario.abreviatura && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Abreviatura</p>
                  <p className="text-lg">{usuario.abreviatura.codigo}</p>
                </div>
              )}
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{usuario.email}</p>
                </div>
              </div>
              {usuario.numeroLicencia && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">N° Licencia</p>
                    <p>{usuario.numeroLicencia}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Unidad</p>
                  <p>{usuario.unidad.sigla} - {usuario.unidad.nombre}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Información del Sistema
            </CardTitle>
            <CardDescription>
              Estado y permisos en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rol</p>
                <Badge className={rolColors[usuario.rol]}>
                  {rolLabels[usuario.rol]}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <Badge variant={usuario.activo ? 'default' : 'destructive'}>
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Fecha de registro</p>
                  <p>{format(new Date(usuario.createdAt), 'PPP', { locale: es })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Última actualización</p>
                  <p>{format(new Date(usuario.updatedAt), 'PPP', { locale: es })}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habilitaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Habilitaciones</CardTitle>
          <CardDescription>
            Certificaciones y habilitaciones del controlador según DAN 11
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usuario.habilitaciones.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No tiene habilitaciones registradas
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {usuario.habilitaciones.map((hab) => {
                const vencida = hab.fechaVencimiento && new Date(hab.fechaVencimiento) < new Date()
                const proximaVencer = hab.fechaVencimiento && !vencida && 
                  Math.floor((new Date(hab.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 30

                return (
                  <div
                    key={hab.id}
                    className={`flex flex-col rounded-lg border p-3 ${
                      vencida ? 'border-red-500 bg-red-50 dark:bg-red-950' :
                      proximaVencer ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
                      ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold">{hab.tipoHabilitacion}</p>
                      <Badge 
                        variant={
                          vencida ? 'destructive' :
                          proximaVencer ? 'outline' :
                          hab.activa ? 'default' : 'secondary'
                        }
                      >
                        {vencida ? 'Vencida' : proximaVencer ? 'Por vencer' : hab.activa ? 'Vigente' : 'Inactiva'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Unidad: {hab.unidad.sigla}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Desde: {format(new Date(hab.fechaInicio), 'PP', { locale: es })}
                    </p>
                    {hab.fechaVencimiento && (
                      <p className="text-xs text-muted-foreground">
                        Vence: {format(new Date(hab.fechaVencimiento), 'PP', { locale: es })}
                      </p>
                    )}
                    {hab.requierePericia && (
                      <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-2">
                        Requiere {hab.horasMinimasMes}h/mes (DAN 11)
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

