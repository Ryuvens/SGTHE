// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { auth } from '@/auth'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  Calendar, 
  FileText,
  CheckCircle2
} from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user

  // Color del badge según rol
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'default' // Azul
      case 'SUPERVISOR':
        return 'secondary' // Gris
      case 'CONTROLADOR':
        return 'outline' // Outline
      default:
        return 'secondary'
    }
  }

  return (
    <AppLayout user={user}>
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user.nombre}
          </h2>
          <Badge variant={getRoleBadgeVariant(user.rol)}>
            {user.rol}
          </Badge>
        </div>
        <p className="text-gray-600">
          Sistema de Gestión de Turnos y Horas Extraordinarias - DGAC
        </p>
      </div>

      {/* Success Alert */}
      <Card className="mb-8 border-green-200 bg-green-50/50">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              Autenticación exitosa
            </p>
            <p className="text-sm text-green-700">
              Has iniciado sesión correctamente en el sistema.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Turnos del Mes
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Turnos asignados en {new Date().toLocaleDateString('es-CL', { month: 'long' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Horas Extraordinarias
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28.5</div>
            <p className="text-xs text-muted-foreground">
              Horas acumuladas este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reportes Generados
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Reportes este mes
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
          <CardDescription>
            Detalles de tu cuenta en el sistema SGTHE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
              <p className="text-base font-medium mt-1">
                {user.nombre} {user.apellido}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Correo Electrónico</p>
              <p className="text-base font-medium mt-1">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rol</p>
              <div className="mt-1">
                <Badge variant={getRoleBadgeVariant(user.rol)}>
                  {user.rol}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID de Usuario</p>
              <p className="text-base font-mono text-sm mt-1 text-muted-foreground">
                {user.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Development Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-900">Modo Desarrollo</CardTitle>
          <CardDescription className="text-blue-700">
            Este dashboard es temporal y será reemplazado con funcionalidades completas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800">
            Los módulos de <strong>Rol de Turnos</strong>, <strong>Horas Extraordinarias</strong>, 
            y <strong>Gestión de Usuarios</strong> se implementarán en los próximos checkpoints.
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-12">
              <Image
                src="/dgac-logotipo-footer.png"
                alt="Logo DGAC"
                width={80}
                height={48}
                className="object-contain"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Dirección General de Aeronáutica Civil</p>
              <p>Gobierno de Chile</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p>© 2025 DGAC - Todos los derechos reservados</p>
            <p>Sistema SGTHE v0.1</p>
          </div>
        </div>
      </footer>
    </AppLayout>
  )
}
