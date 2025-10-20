// src/app/configuracion/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default async function ConfiguracionPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Verificar que sea admin
  if (session.user.rol !== 'ADMIN_SISTEMA') {
    redirect('/dashboard')
  }

  const user = session.user

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Configuración</h2>
          <p className="text-gray-600 mt-2">
            Configuración general del sistema SGTHE
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
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
              El módulo de Configuración incluirá:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Gestión de configuraciones del sistema</li>
              <li>Definición de límites y umbrales</li>
              <li>Configuración de tipos de turno</li>
              <li>Gestión de dependencias y categorías</li>
              <li>Parámetros de cálculo de bonificaciones</li>
              <li>Configuración de notificaciones</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

