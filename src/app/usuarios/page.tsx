import { Suspense } from 'react'
import { Users, UserPlus, Shield, Activity } from 'lucide-react'
import { getUsuarios } from '@/lib/actions/usuarios'
import { UsuariosDataTable } from '@/components/usuarios/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { RolUsuario } from '@prisma/client'

// Estadísticas de usuarios
async function getUsuarioStats() {
  const [total, admins, jefes, supervisors, controllers, active] = await Promise.all([
    getUsuarios(1, 1000),
    getUsuarios(1, 1000, undefined, 'ADMIN_SISTEMA' as RolUsuario),
    getUsuarios(1, 1000, undefined, 'JEFE_UNIDAD' as RolUsuario),
    getUsuarios(1, 1000, undefined, 'SUPERVISOR_ATS' as RolUsuario),
    getUsuarios(1, 1000, undefined, 'ATCO' as RolUsuario),
    getUsuarios(1, 1000, undefined, undefined, true),
  ])

  return {
    total: total.data?.total || 0,
    admins: admins.data?.total || 0,
    jefes: jefes.data?.total || 0,
    supervisors: supervisors.data?.total || 0,
    controllers: controllers.data?.total || 0,
    active: active.data?.total || 0,
  }
}

// Componente de estadísticas
async function StatsCards() {
  const stats = await getUsuarioStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active} activos
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Administradores</CardTitle>
          <Shield className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.admins}</div>
          <p className="text-xs text-muted-foreground">
            Con permisos totales
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Supervisores</CardTitle>
          <Shield className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.supervisors}</div>
          <p className="text-xs text-muted-foreground">
            Gestión de turnos
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Controladores</CardTitle>
          <Activity className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.controllers}</div>
          <p className="text-xs text-muted-foreground">
            Personal operativo
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Loading skeleton para estadísticas
function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px]" />
            <Skeleton className="h-3 w-[80px] mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Tabla de usuarios con loading
async function UsuariosTable() {
  const result = await getUsuarios(1, 100)
  
  if (!result.success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Error al cargar usuarios: {result.error}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>
              Administra los usuarios del sistema SGTHE
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/usuarios/nuevo">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <UsuariosDataTable 
          data={result.data?.usuarios || []} 
          onRefresh={() => {
            // Refresh se maneja con router.refresh() en el componente
          }}
        />
      </CardContent>
    </Card>
  )
}

// Loading skeleton para tabla
function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[300px] mt-2" />
          </div>
          <Skeleton className="h-10 w-[140px]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[300px]" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// Página principal
export default async function UsuariosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
        <p className="text-muted-foreground">
          Gestiona los usuarios y permisos del sistema
        </p>
      </div>

      {/* Estadísticas */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* Tabla de usuarios */}
      <Suspense fallback={<TableSkeleton />}>
        <UsuariosTable />
      </Suspense>
    </div>
  )
}
