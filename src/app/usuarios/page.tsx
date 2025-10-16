// src/app/usuarios/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default async function UsuariosPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Verificar que sea admin
  if (session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  const user = session.user

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-600 mt-2">
            Administración de usuarios y permisos del sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Módulo en Desarrollo</CardTitle>
                <CardDescription>
                  Esta funcionalidad será implementada en el próximo checkpoint
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              El módulo de Gestión de Usuarios incluirá:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-muted-foreground">
              <li>CRUD completo de usuarios</li>
              <li>Gestión de roles y permisos</li>
              <li>Asignación de habilitaciones y categorías</li>
              <li>Búsqueda y filtros avanzados</li>
              <li>Exportación de datos</li>
              <li>Auditoría de accesos</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

