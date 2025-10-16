// src/app/reportes/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default async function ReportesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reportes</h2>
          <p className="text-gray-600 mt-2">
            Generación de reportes y estadísticas del sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
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
              El módulo de Reportes incluirá:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Reporte de turnos por período</li>
              <li>Reporte de horas extraordinarias</li>
              <li>Estadísticas de fatiga (DAN 11)</li>
              <li>Resumen de bonificaciones</li>
              <li>Gráficos y visualizaciones</li>
              <li>Exportación a PDF, Excel y CSV</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

