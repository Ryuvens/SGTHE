'use client';

import { useState } from 'react';
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
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════
// TIPOS DE AUSENCIA SEGÚN PRO DRH 22
// ═══════════════════════════════════════════════════════════

const TIPOS_AUSENCIA = [
  { valor: 'LM', nombre: 'Licencia Médica', descuenta: 'HLM (días)' },
  { valor: 'FLA', nombre: 'Feriado Legal Anual', descuenta: 'HLM (días)' },
  { valor: 'PA', nombre: 'Permiso Administrativo', descuenta: 'HMC (horas)' },
  { valor: 'PG', nombre: 'Permiso Gremial', descuenta: 'HMC (horas)' },
  { valor: 'OTRO', nombre: 'Otros Permisos', descuenta: 'HMC (horas)' },
];

// ═══════════════════════════════════════════════════════════
// SCHEMA DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════

const ausenciaSchema = z.object({
  funcionarioId: z.string().min(1, 'Selecciona un funcionario'),
  tipo: z.enum(['LM', 'FLA', 'PA', 'PG', 'OTRO'], {
    required_error: 'Selecciona un tipo de ausencia',
  }),
  fechaInicio: z.date({
    required_error: 'Selecciona fecha de inicio',
  }),
  fechaFin: z.date({
    required_error: 'Selecciona fecha de fin',
  }),
  observaciones: z.string().optional(),
}).refine((data) => data.fechaFin >= data.fechaInicio, {
  message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio',
  path: ['fechaFin'],
});

type AusenciaFormValues = z.infer<typeof ausenciaSchema>;

// ═══════════════════════════════════════════════════════════
// PROPS DEL COMPONENTE
// ═══════════════════════════════════════════════════════════

interface RegistrarAusenciaModalProps {
  funcionarios: Array<{
    id: string;
    nombre: string;
    apellido: string;
    rut: string | null;
  }>;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function RegistrarAusenciaModal({ funcionarios }: RegistrarAusenciaModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AusenciaFormValues>({
    resolver: zodResolver(ausenciaSchema),
    defaultValues: {
      funcionarioId: '',
      tipo: undefined,
      observaciones: '',
    },
  });

  // ═══════════════════════════════════════════════════════════
  // REGISTRAR AUSENCIA
  // ═══════════════════════════════════════════════════════════

  const onSubmit = async (values: AusenciaFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/ausencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          fechaInicio: values.fechaInicio.toISOString().split('T')[0],
          fechaFin: values.fechaFin.toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al registrar ausencia');
      }

      const data = await response.json();

      toast.success('Ausencia registrada correctamente', {
        description: data.diasHabiles ? `${data.diasHabiles} días hábiles` : `${data.horas}h`,
      });

      setIsOpen(false);
      form.reset();
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al registrar ausencia'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Ausencia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Registrar Ausencia</DialogTitle>
          <DialogDescription>
            Registra ausencias que afectan el cálculo de métricas (HLM o HMC)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Funcionario */}
            <FormField
              control={form.control}
              name="funcionarioId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funcionario</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un funcionario" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {funcionarios.map((func) => (
                        <SelectItem key={func.id} value={func.id}>
                          {func.apellido} {func.nombre} {func.rut && `- ${func.rut}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Ausencia */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Ausencia</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS_AUSENCIA.map((tipo) => (
                        <SelectItem key={tipo.valor} value={tipo.valor}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">
                              {tipo.valor} - {tipo.nombre}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Descuenta {tipo.descuenta}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    LM/FLA descuentan días de HLM | PA/PG/OTRO descuentan horas de HMC
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha Inicio */}
              <FormField
                control={form.control}
                name="fechaInicio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Inicio</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: es })
                            ) : (
                              <span>Selecciona fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha Fin */}
              <FormField
                control={form.control}
                name="fechaFin"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: es })
                            ) : (
                              <span>Selecciona fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observaciones */}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Comentarios adicionales sobre la ausencia..."
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Información adicional relevante (documento, motivo detallado, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

