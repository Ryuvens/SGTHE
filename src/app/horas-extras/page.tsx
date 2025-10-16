// src/app/horas-extras/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export default async function HorasExtrasPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Horas Extraordinarias</h2>
          <p className="text-gray-600 mt-2">
            Registro y gestión de horas extraordinarias
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-600" />
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
              El módulo de Horas Extraordinarias incluirá:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Registro de horas extras según PRO DRH 22</li>
              <li>Cálculo automático de bonificaciones</li>
              <li>Validación de límites mensuales</li>
              <li>Resumen de horas acumuladas</li>
              <li>Exportación de reportes</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

