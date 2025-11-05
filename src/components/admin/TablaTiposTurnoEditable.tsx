'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Pencil } from 'lucide-react';
import { EditarTipoTurnoModal } from '@/components/admin/EditarTipoTurnoModal';

// ═══════════════════════════════════════════════════════════
// TIPOS
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

interface TablaTiposTurnoEditableProps {
  tiposTurno: TipoTurno[];
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function TablaTiposTurnoEditable({ tiposTurno }: TablaTiposTurnoEditableProps) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);

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
    <>
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
              <TableHead className="w-[100px] text-center">Acciones</TableHead>
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
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTipoSeleccionado(tipo.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal de edición */}
      {tipoSeleccionado && (
        <EditarTipoTurnoModal
          tipoTurnoId={tipoSeleccionado}
          isOpen={!!tipoSeleccionado}
          onClose={() => setTipoSeleccionado(null)}
          onSuccess={() => {
            setTipoSeleccionado(null);
            // Recargar página para mostrar cambios
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

