// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { auth, signOut } from '@/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  LogOut, 
  User, 
  Settings, 
  Clock, 
  Calendar, 
  FileText,
  ChevronDown,
  CheckCircle2
} from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user

  // Obtener iniciales del nombre
  const getInitials = (nombre: string, apellido: string) => {
    const n = nombre?.charAt(0) || ''
    const a = apellido?.charAt(0) || ''
    return (n + a).toUpperCase() || 'US'
  }

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

  const initials = getInitials(user.nombre, user.apellido)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y título */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo-dgac.png"
                  alt="Logo DGAC"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Sistema SGTHE</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 h-auto py-2 px-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image || undefined} alt={user.nombre || ''} />
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user.nombre}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form
                    action={async () => {
                      'use server'
                      await signOut({ redirectTo: '/login' })
                    }}
                  >
                    <button type="submit" className="flex w-full items-center text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  )
}
