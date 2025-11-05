import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Trash2 } from 'lucide-react';
import { RegistrarAusenciaModal } from '@/components/admin/RegistrarAusenciaModal';
import { TablaAusencias } from '@/components/admin/TablaAusencias';

// ═══════════════════════════════════════════════════════════
// TIPOS DE AUSENCIA (SEGÚN PRO DRH 22)
// ═══════════════════════════════════════════════════════════

const TIPOS_AUSENCIA_INFO = {
  LM: { nombre: 'Licencia Médica', color: 'bg-red-500', descuenta: 'HLM' },
  FLA: { nombre: 'Feriado Legal Anual', color: 'bg-blue-500', descuenta: 'HLM' },
  PA: { nombre: 'Permiso Administrativo', color: 'bg-yellow-500', descuenta: 'HMC' },
  PG: { nombre: 'Permiso Gremial', color: 'bg-purple-500', descuenta: 'HMC' },
  OTRO: { nombre: 'Otros Permisos', color: 'bg-gray-500', descuenta: 'HMC' },
};

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default async function AusenciasPage() {
  // 1. Verificar autenticación
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // 2. Obtener usuario con permisos
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

  // 3. Verificar que tenga unidad asignada
  if (!usuario.unidadId || !usuario.unidad) {
    redirect('/dashboard');
  }

  // 4. Obtener ausencias recientes (últimos 3 meses)
  const tresMesesAtras = new Date();
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);

  const ausencias = await prisma.ausencia.findMany({
    where: {
      usuario: {
        unidadId: usuario.unidadId,
      },
      createdAt: {
        gte: tresMesesAtras,
      },
    },
    include: {
      usuario: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          rut: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 5. Obtener funcionarios de la unidad
  const funcionarios = await prisma.usuario.findMany({
    where: {
      unidadId: usuario.unidadId,
      activo: true,
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      rut: true,
    },
    orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Ausencias</h1>
          <p className="text-muted-foreground mt-1">
            Registro de ausencias que afectan cálculo de métricas - {usuario.unidad.nombre}
          </p>
        </div>
        <RegistrarAusenciaModal funcionarios={funcionarios} />
      </div>

      {/* Cards de resumen por tipo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(TIPOS_AUSENCIA_INFO).map(([codigo, info]) => {
          const count = ausencias.filter((a) => a.tipo === codigo).length;
          return (
            <Card key={codigo}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${info.color}`} />
                  {codigo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {info.nombre}
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  Descuenta {info.descuenta}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabla de ausencias */}
      <Card>
        <CardHeader>
          <CardTitle>Ausencias Registradas ({ausencias.length})</CardTitle>
          <CardDescription>
            Últimos 3 meses - Ordenadas por fecha de registro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Cargando...</div>}>
            <TablaAusencias ausencias={ausencias} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

