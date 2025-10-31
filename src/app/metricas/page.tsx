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

  // Obtener el usuario completo con unidad
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

  if (!usuario) {
    redirect('/login');
  }

  // Preparar datos del usuario para AppLayout
  const userData = {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido || '',
    email: usuario.email,
    rol: usuario.rol,
    image: null, // El modelo Usuario no tiene campo image
  };

  if (!usuario.unidad) {
    return (
      <AppLayout user={userData}>
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
    <AppLayout user={userData}>
      <PanelMetricas 
        unidadId={usuario.unidad.id} 
        nombreUnidad={usuario.unidad.nombre}
      />
    </AppLayout>
  );
}
