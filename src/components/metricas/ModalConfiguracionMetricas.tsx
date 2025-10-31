'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Info, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { METRICAS_CORE, METRICAS_OPCIONALES, DESCRIPCION_METRICAS } from '@/lib/constants/metricas';
import type { Metrica } from '@/lib/constants/metricas';

interface MetricaItem {
  id: string;
  nombre: string;
  descripcion: string;
  esCore: boolean;
  activa: boolean;
}

interface ModalConfiguracionMetricasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: () => void;
}

function ItemMetrica({ metrica }: { metrica: MetricaItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: metrica.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">
            {metrica.id} - {metrica.nombre}
          </span>
          {metrica.esCore && (
            <Badge variant="default" className="text-xs">
              CORE
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{metrica.descripcion}</p>
      </div>
    </div>
  );
}

export default function ModalConfiguracionMetricas({
  open,
  onOpenChange,
  onGuardar,
}: ModalConfiguracionMetricasProps) {
  const [metricas, setMetricas] = useState<MetricaItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cargar configuración actual del usuario
  useEffect(() => {
    if (open) {
      cargarConfiguracion();
    }
  }, [open]);

  const cargarConfiguracion = async () => {
    try {
      setCargando(true);
      const response = await fetch('/api/metricas/usuario-config');
      
      if (!response.ok) {
        throw new Error('Error al cargar configuración');
      }

      const config = await response.json();
      const metricasVisibles = config.metricasVisibles as string[];
      const ordenMetricas = config.ordenMetricas as number[];

      // Crear array de métricas ordenado según la configuración
      const metricasOrdenadas: MetricaItem[] = [];
      
      // Primero, agregar las métricas visibles en el orden guardado
      ordenMetricas.forEach((index) => {
        const metricaId = metricasVisibles[index] as Metrica;
        const descripcion = DESCRIPCION_METRICAS[metricaId];
        
        metricasOrdenadas.push({
          id: metricaId,
          nombre: descripcion.nombre,
          descripcion: descripcion.descripcion,
          esCore: (METRICAS_CORE as readonly string[]).includes(metricaId),
          activa: true,
        });
      });

      // Luego, agregar las métricas opcionales no visibles al final
      (METRICAS_OPCIONALES as readonly string[]).forEach((metricaId) => {
        if (!metricasVisibles.includes(metricaId)) {
          const descripcion = DESCRIPCION_METRICAS[metricaId];
          metricasOrdenadas.push({
            id: metricaId,
            nombre: descripcion.nombre,
            descripcion: descripcion.descripcion,
            esCore: false,
            activa: false,
          });
        }
      });

      setMetricas(metricasOrdenadas);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setMetricas((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleMetrica = (metricaId: string) => {
    setMetricas((prev) =>
      prev.map((m) =>
        m.id === metricaId && !m.esCore ? { ...m, activa: !m.activa } : m
      )
    );
  };

  const guardarConfiguracion = async () => {
    try {
      setGuardando(true);

      // Filtrar solo las métricas activas
      const metricasActivas = metricas.filter((m) => m.activa);
      const metricasVisibles = metricasActivas.map((m) => m.id);
      const ordenMetricas = metricasActivas.map((_, index) => index);

      const response = await fetch('/api/metricas/usuario-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metricasVisibles,
          ordenMetricas,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }

      onGuardar();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const restablecerDefecto = async () => {
    try {
      setGuardando(true);

      const response = await fetch('/api/metricas/usuario-config', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al restablecer configuración');
      }

      await cargarConfiguracion();
      onGuardar();
    } catch (error) {
      console.error('Error al restablecer:', error);
      alert('Error al restablecer la configuración');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Métricas Visibles</DialogTitle>
          <DialogDescription>
            Arrastra para reordenar las métricas. Las métricas CORE son obligatorias.
          </DialogDescription>
        </DialogHeader>

        {cargando ? (
          <div className="py-8 text-center text-muted-foreground">
            Cargando configuración...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-900">
                Selecciona las métricas opcionales que deseas ver. Arrastra para cambiar el orden.
              </p>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={metricas.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {metricas
                    .filter((m) => m.activa || m.esCore)
                    .map((metrica) => (
                      <div key={metrica.id} className="flex items-start gap-3">
                        {!metrica.esCore && (
                          <Checkbox
                            checked={metrica.activa}
                            onCheckedChange={() => toggleMetrica(metrica.id)}
                            className="mt-4"
                          />
                        )}
                        <div className="flex-1">
                          <ItemMetrica metrica={metrica} />
                        </div>
                      </div>
                    ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Métricas opcionales desactivadas */}
            {metricas.filter((m) => !m.activa && !m.esCore).length > 0 && (
              <div className="space-y-2 mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium mb-3">
                  Métricas Opcionales Desactivadas:
                </h4>
                {metricas
                  .filter((m) => !m.activa && !m.esCore)
                  .map((metrica) => (
                    <div key={metrica.id} className="flex items-start gap-3">
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => toggleMetrica(metrica.id)}
                        className="mt-4"
                      />
                      <div className="flex-1">
                        <ItemMetrica metrica={metrica} />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={restablecerDefecto}
            disabled={guardando || cargando}
          >
            Restablecer predeterminadas
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button onClick={guardarConfiguracion} disabled={guardando || cargando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
