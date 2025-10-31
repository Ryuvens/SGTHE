import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AppLayout from '@/components/layout/AppLayout';
import PanelMetricas from '@/components/metricas/PanelMetricas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function MetricasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Obtener la unidad del usuario
  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: {
      unidad: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });

  if (!usuario?.unidad) {
    return (
      <AppLayout>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No tienes una unidad asignada. Contacta al administrador.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PanelMetricas 
        unidadId={usuario.unidad.id} 
        nombreUnidad={usuario.unidad.nombre}
      />
    </AppLayout>
  );
}
