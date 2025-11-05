import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getVersionActiva } from '@/lib/services/matrizVersion.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { History, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default async function MatrizTurnosPage() {
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

  // 3. Verificar que el usuario tenga unidad asignada
  if (!usuario.unidadId || !usuario.unidad) {
    return (
      <div className="container mx-auto py-10">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Usuario sin unidad asignada</CardTitle>
            </div>
            <CardDescription>
              No se puede gestionar la matriz de turnos sin una unidad asignada.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // 4. Obtener versión activa de la unidad del usuario
  const versionActiva = await getVersionActiva(usuario.unidadId);

  if (!versionActiva) {
    return (
      <div className="container mx-auto py-10">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">No existe versión activa</CardTitle>
            </div>
            <CardDescription>
              No se encontró una versión activa de matriz para la unidad {usuario.unidad.nombre}.
              Contacte al administrador del sistema.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header con información de versión */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matriz de Turnos</h1>
          <p className="text-muted-foreground mt-2">
            Gestión de tipos de turno para {usuario.unidad.nombre}
          </p>
        </div>
        <Link href="/admin/matriz-turnos/historial">
          <Button variant="outline">
            <History className="mr-2 h-4 w-4" />
            Historial de Versiones
          </Button>
        </Link>
      </div>

      {/* Card con info de versión activa */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Versión Activa</CardTitle>
              <CardDescription>{versionActiva.descripcion}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="default" className="text-base px-3 py-1">
                {versionActiva.version}
              </Badge>
              {versionActiva.esBloqueada && (
                <Badge variant="destructive">Bloqueada</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Creada:</span>{' '}
              <span className="font-medium">
                {new Date(versionActiva.createdAt).toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Tipos de turno:</span>{' '}
              <span className="font-medium">{versionActiva.tiposTurno.length} códigos</span>
            </div>
            <div>
              <span className="text-muted-foreground">Estado:</span>{' '}
              <span className={versionActiva.esBloqueada ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
                {versionActiva.esBloqueada ? 'Solo lectura' : 'Editable'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de tipos de turno */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Turno ({versionActiva.tiposTurno.length})</CardTitle>
          <CardDescription>
            Nomenclatura oficial de turnos para la unidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TablaTiposTurnoSkeleton />}>
            <TablaTiposTurno tiposTurno={versionActiva.tiposTurno} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE: TABLA DE TIPOS DE TURNO
// ═══════════════════════════════════════════════════════════

interface TipoTurno {
  id: string;
  codigo: string;
  nombre: string;
  duracionHoras: number | null;
  devolucionHoras: number | null;
  horasDiurnas: number | null;
  horasNocturnas: number | null;
  horasSabDomFest: number | null;
  color: string;
  esOperativo: boolean;
  esNocturno: boolean;
  esDiaInhabil: boolean;
}

interface TablaTiposTurnoProps {
  tiposTurno: TipoTurno[];
}

function TablaTiposTurno({ tiposTurno }: TablaTiposTurnoProps) {
  if (tiposTurno.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No hay tipos de turno configurados</p>
        <p className="text-sm text-muted-foreground">
          Esta versión no tiene tipos de turno asociados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Color</TableHead>
            <TableHead className="w-[100px]">Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="text-center">Duración</TableHead>
            <TableHead className="text-center">Devolución</TableHead>
            <TableHead className="text-center">Diurnas</TableHead>
            <TableHead className="text-center">Nocturnas</TableHead>
            <TableHead className="text-center">Sáb/Dom/Fest</TableHead>
            <TableHead className="text-center">Tipo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiposTurno.map((tipo) => (
            <TableRow key={tipo.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full border-2 border-border"
                    style={{ backgroundColor: tipo.color }}
                  />
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono">
                  {tipo.codigo}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{tipo.nombre}</TableCell>
              <TableCell className="text-center">
                {tipo.duracionHoras ? `${tipo.duracionHoras}h` : '-'}
              </TableCell>
              <TableCell className="text-center">
                {tipo.devolucionHoras ? (
                  <Badge variant="secondary" className="font-mono">
                    {tipo.devolucionHoras}h
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {tipo.horasDiurnas ? `${tipo.horasDiurnas}h` : '-'}
              </TableCell>
              <TableCell className="text-center">
                {tipo.horasNocturnas ? `${tipo.horasNocturnas}h` : '-'}
              </TableCell>
              <TableCell className="text-center">
                {tipo.horasSabDomFest ? `${tipo.horasSabDomFest}h` : '-'}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex gap-1 justify-center">
                  {tipo.esOperativo && (
                    <Badge variant="default" className="text-xs">
                      OP
                    </Badge>
                  )}
                  {tipo.esNocturno && (
                    <Badge variant="secondary" className="text-xs">
                      N
                    </Badge>
                  )}
                  {tipo.esDiaInhabil && (
                    <Badge variant="outline" className="text-xs">
                      Inh
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE: SKELETON DE CARGA
// ═══════════════════════════════════════════════════════════

function TablaTiposTurnoSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

