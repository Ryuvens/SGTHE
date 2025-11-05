import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getHistorialVersiones } from '@/lib/services/matrizVersion.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Lock, CheckCircle2, Calendar, User, FileText } from 'lucide-react';
import Link from 'next/link';
import { CrearVersionModal } from '@/components/admin/CrearVersionModal';

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default async function HistorialMatrizPage() {
  // 1. Verificar autenticación
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // 2. Verificar permisos
  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: { 
      unidad: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
        },
      },
    },
  });

  if (!usuario) {
    redirect('/login');
  }

  const rolesPermitidos = ['ADMIN_SISTEMA', 'JEFE_UNIDAD'];
  if (!rolesPermitidos.includes(usuario.rol)) {
    redirect('/dashboard');
  }

  if (!usuario.unidadId || !usuario.unidad) {
    redirect('/admin/matriz-turnos');
  }

  // 3. Obtener historial de versiones
  const versiones = await getHistorialVersiones(usuario.unidadId);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/matriz-turnos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historial de Versiones</h1>
            <p className="text-muted-foreground mt-1">
              Versiones de matriz para {usuario.unidad.nombre}
            </p>
          </div>
        </div>
        <CrearVersionModal unidadId={usuario.unidadId} usuarioId={usuario.id} />
      </div>

      {/* Timeline de versiones */}
      <div className="space-y-4">
        {versiones.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay versiones registradas
              </p>
            </CardContent>
          </Card>
        ) : (
          versiones.map((version, index) => (
            <VersionCard
              key={version.id}
              version={version}
              isFirst={index === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE: CARD DE VERSIÓN
// ═══════════════════════════════════════════════════════════

interface VersionCardProps {
  version: {
    id: string;
    version: string;
    descripcion: string | null;
    esActiva: boolean;
    esBloqueada: boolean;
    createdAt: Date;
    creador: {
      nombre: string;
      apellido: string;
      email: string;
    };
    _count: {
      tiposTurno: number;
      publicaciones: number;
    };
  };
  isFirst: boolean;
}

function VersionCard({ version, isFirst }: VersionCardProps) {
  return (
    <Card className={version.esActiva ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{version.version}</CardTitle>
              {version.esActiva && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Activa
                </Badge>
              )}
              {version.esBloqueada && (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Bloqueada
                </Badge>
              )}
              {isFirst && !version.esActiva && (
                <Badge variant="outline">Más reciente</Badge>
              )}
            </div>
            <CardDescription>
              {version.descripcion || 'Sin descripción'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          {/* Fecha de creación */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Creada</p>
              <p className="font-medium">
                {new Date(version.createdAt).toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Creador */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Creado por</p>
              <p className="font-medium">
                {version.creador.nombre} {version.creador.apellido}
              </p>
            </div>
          </div>

          {/* Tipos de turno */}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Tipos de turno</p>
              <p className="font-medium">{version._count.tiposTurno} códigos</p>
            </div>
          </div>

          {/* Publicaciones */}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Publicaciones</p>
              <p className="font-medium">{version._count.publicaciones} roles</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

