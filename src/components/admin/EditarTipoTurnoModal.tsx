'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// SCHEMA DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════

const tipoTurnoSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  duracionHoras: z.number().min(0).max(24).nullable(),
  devolucionHoras: z.number().min(0).max(24).nullable(),
  horasDiurnas: z.number().min(0).max(24).nullable(),
  horasNocturnas: z.number().min(0).max(24).nullable(),
  horasSabDomFest: z.number().min(0).max(24).nullable(),
}).refine(
  (data) => {
    // Validación: horasDiurnas + horasNocturnas <= duracionHoras (si existe)
    if (data.duracionHoras && data.horasDiurnas && data.horasNocturnas) {
      return data.horasDiurnas + data.horasNocturnas <= data.duracionHoras;
    }
    return true;
  },
  {
    message: 'Horas diurnas + nocturnas no puede exceder duración total',
    path: ['horasNocturnas'],
  }
);

type TipoTurnoFormValues = z.infer<typeof tipoTurnoSchema>;

// ═══════════════════════════════════════════════════════════
// PROPS DEL COMPONENTE
// ═══════════════════════════════════════════════════════════

interface EditarTipoTurnoModalProps {
  tipoTurnoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function EditarTipoTurnoModal({
  tipoTurnoId,
  isOpen,
  onClose,
  onSuccess,
}: EditarTipoTurnoModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [codigoTurno, setCodigoTurno] = useState('');

  const form = useForm<TipoTurnoFormValues>({
    resolver: zodResolver(tipoTurnoSchema),
    defaultValues: {
      nombre: '',
      duracionHoras: null,
      devolucionHoras: null,
      horasDiurnas: null,
      horasNocturnas: null,
      horasSabDomFest: null,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // CARGAR DATOS DEL TIPO DE TURNO
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (isOpen && tipoTurnoId) {
      fetchTipoTurno();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tipoTurnoId]);

  const fetchTipoTurno = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`/api/admin/tipos-turno/${tipoTurnoId}`);
      if (!response.ok) {
        throw new Error('Error al cargar tipo de turno');
      }
      const data = await response.json();
      
      setCodigoTurno(data.codigo);
      form.reset({
        nombre: data.nombre,
        duracionHoras: data.duracionHoras,
        devolucionHoras: data.devolucionHoras,
        horasDiurnas: data.horasDiurnas,
        horasNocturnas: data.horasNocturnas,
        horasSabDomFest: data.horasSabDomFest,
      });
    } catch (error) {
      toast.error('No se pudo cargar el tipo de turno');
      onClose();
    } finally {
      setIsFetching(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // GUARDAR CAMBIOS
  // ═══════════════════════════════════════════════════════════

  const onSubmit = async (values: TipoTurnoFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/tipos-turno/${tipoTurnoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar');
      }

      toast.success('Tipo de turno actualizado correctamente');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar cambios');
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tipo de Turno {codigoTurno && `- ${codigoTurno}`}</DialogTitle>
          <DialogDescription>
            Modifica los valores de horas para este tipo de turno
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Nombre */}
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Turno Diurno" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grid 2 columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Duración Total */}
                <FormField
                  control={form.control}
                  name="duracionHoras"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración Total (h)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Total de horas del turno
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Devolución */}
                <FormField
                  control={form.control}
                  name="devolucionHoras"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Devolución (h)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Para descansos complementarios
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Horas Diurnas */}
                <FormField
                  control={form.control}
                  name="horasDiurnas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Diurnas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        07:00 - 21:00
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Horas Nocturnas */}
                <FormField
                  control={form.control}
                  name="horasNocturnas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Nocturnas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        21:00 - 07:00
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Horas Sáb/Dom/Fest */}
                <FormField
                  control={form.control}
                  name="horasSabDomFest"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Horas Sáb/Dom/Festivos (override)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Opcional: Override para días inhábiles
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

