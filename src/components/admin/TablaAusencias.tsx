'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════

const TIPOS_AUSENCIA_INFO = {
  LM: { nombre: 'Licencia Médica', color: 'bg-red-500' },
  FLA: { nombre: 'Feriado Legal Anual', color: 'bg-blue-500' },
  PA: { nombre: 'Permiso Administrativo', color: 'bg-yellow-500' },
  PG: { nombre: 'Permiso Gremial', color: 'bg-purple-500' },
  OTRO: { nombre: 'Otros Permisos', color: 'bg-gray-500' },
};

interface Ausencia {
  id: string;
  tipo: string;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  diasHabiles: number | null;
  fecha: Date | null;
  horas: number | null;
  observaciones: string | null;
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    rut: string | null;
  };
}

interface TablaAusenciasProps {
  ausencias: Ausencia[];
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function TablaAusencias({ ausencias }: TablaAusenciasProps) {
  const [eliminando, setEliminando] = useState<string | null>(null);

  const handleEliminar = async (ausenciaId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta ausencia?')) {
      return;
    }

    setEliminando(ausenciaId);
    try {
      const response = await fetch(`/api/admin/ausencias/${ausenciaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar');
      }

      toast.success('Ausencia eliminada correctamente');
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar ausencia'
      );
    } finally {
      setEliminando(null);
    }
  };

  if (ausencias.length === 0) {
    return (
      <div className="py-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          No hay ausencias registradas en los últimos 3 meses
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Funcionario
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Tipo
            </th>
            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
              Fecha Inicio
            </th>
            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
              Fecha Fin
            </th>
            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
              Días/Horas
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Observaciones
            </th>
            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {ausencias.map((ausencia) => {
            const tipoInfo = TIPOS_AUSENCIA_INFO[ausencia.tipo as keyof typeof TIPOS_AUSENCIA_INFO] || {
              nombre: ausencia.tipo,
              color: 'bg-gray-500',
            };

            return (
              <tr key={ausencia.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {ausencia.usuario.nombre} {ausencia.usuario.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ausencia.usuario.rut || 'Sin RUT'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${tipoInfo.color}`} />
                    <div>
                      <p className="font-mono font-semibold text-sm">
                        {ausencia.tipo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tipoInfo.nombre}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 align-middle text-center">
                  {ausencia.fechaInicio
                    ? new Date(ausencia.fechaInicio).toLocaleDateString('es-CL')
                    : ausencia.fecha
                    ? new Date(ausencia.fecha).toLocaleDateString('es-CL')
                    : '-'}
                </td>
                <td className="p-4 align-middle text-center">
                  {ausencia.fechaFin
                    ? new Date(ausencia.fechaFin).toLocaleDateString('es-CL')
                    : '-'}
                </td>
                <td className="p-4 align-middle text-center">
                  {ausencia.diasHabiles ? (
                    <Badge variant="secondary">
                      {ausencia.diasHabiles} días
                    </Badge>
                  ) : ausencia.horas ? (
                    <Badge variant="outline">
                      {ausencia.horas}h
                    </Badge>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-4 align-middle">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ausencia.observaciones || '-'}
                  </p>
                </td>
                <td className="p-4 align-middle text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEliminar(ausencia.id)}
                    disabled={eliminando === ausencia.id}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

