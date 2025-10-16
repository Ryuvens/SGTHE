// src/app/turnos/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Calendar,
  Plus,
  FileDown,
  Filter,
  Search,
  Edit,
  Eye
} from 'lucide-react'
import { FUNCIONARIOS_OCEANICO, getNombreCompleto, ESTADISTICAS_EQUIPO } from '@/data/funcionarios-oceanico'

export default async function TurnosPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user
  const mesActual = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Rol de Turnos</h2>
            <p className="text-gray-600 mt-2">
              Gestión y publicación de turnos mensuales - Centro de Control de Área Oceánico
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Publicación
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Funcionarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ESTADISTICAS_EQUIPO.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {ESTADISTICAS_EQUIPO.activos} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Habilitación ACC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ESTADISTICAS_EQUIPO.conACC}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Controladores de Área
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Habilitación FSS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ESTADISTICAS_EQUIPO.conFSS}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Flight Service Station
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Período Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold capitalize">{mesActual}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sin publicación
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Equipo de Controladores
                </CardTitle>
                <CardDescription className="mt-2">
                  Centro de Control de Área Oceánico - {ESTADISTICAS_EQUIPO.total} funcionarios registrados
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Email Institucional</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Habilitaciones</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FUNCIONARIOS_OCEANICO.map((funcionario, index) => (
                    <TableRow key={funcionario.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{getNombreCompleto(funcionario)}</span>
                          {funcionario.rut && (
                            <span className="text-xs text-muted-foreground">
                              RUT: {funcionario.rut}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {funcionario.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            funcionario.rol === 'ADMIN' 
                              ? 'default' 
                              : funcionario.rol === 'SUPERVISOR' 
                              ? 'secondary' 
                              : 'outline'
                          }
                        >
                          {funcionario.rol}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {funcionario.habilitaciones.map((hab) => (
                            <Badge 
                              key={hab} 
                              variant="outline"
                              className="text-xs"
                            >
                              {hab}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900">Próximas Funcionalidades</CardTitle>
            <CardDescription className="text-blue-700">
              El módulo completo de Rol de Turnos incluirá:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
              <li>Creación de publicaciones mensuales con validación DAN 11</li>
              <li>Asignación de turnos con calendario interactivo</li>
              <li>Drag & drop para facilitar asignaciones</li>
              <li>Validación automática de límites de fatiga</li>
              <li>Cálculo de horas diurnas, nocturnas y festivas</li>
              <li>Vista previa antes de publicación oficial</li>
              <li>Exportación a PDF y Excel</li>
              <li>Notificaciones automáticas a funcionarios</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
