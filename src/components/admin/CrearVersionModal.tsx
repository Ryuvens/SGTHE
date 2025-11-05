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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ═══════════════════════════════════════════════════════════
// SCHEMA DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════

const crearVersionSchema = z.object({
  tipo: z.enum(['minor', 'major'], {
    required_error: 'Selecciona el tipo de versión',
  }),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
});

type CrearVersionFormValues = z.infer<typeof crearVersionSchema>;

// ═══════════════════════════════════════════════════════════
// PROPS DEL COMPONENTE
// ═══════════════════════════════════════════════════════════

interface CrearVersionModalProps {
  unidadId: string;
  usuarioId: string;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function CrearVersionModal({ unidadId, usuarioId }: CrearVersionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CrearVersionFormValues>({
    resolver: zodResolver(crearVersionSchema),
    defaultValues: {
      tipo: 'minor',
      descripcion: '',
    },
  });

  // ═══════════════════════════════════════════════════════════
  // CREAR NUEVA VERSIÓN
  // ═══════════════════════════════════════════════════════════

  const onSubmit = async (values: CrearVersionFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/matriz-versiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidadId,
          tipo: values.tipo,
          descripcion: values.descripcion,
          creadoPor: usuarioId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear versión');
      }

      const data = await response.json();

      toast.success(`Versión ${data.version.version} creada correctamente`, {
        description: `${data.tiposTurnoClonados} tipos de turno clonados`,
      });

      // Recargar página para mostrar nueva versión
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear nueva versión'
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
          Nueva Versión
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Versión</DialogTitle>
          <DialogDescription>
            La versión activa será bloqueada y los tipos de turno se clonarán a la nueva versión
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta acción bloqueará la versión actual y creará una nueva versión editable
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tipo de versión */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Versión</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="minor">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Minor (v1.0 → v1.1)</span>
                          <span className="text-xs text-muted-foreground">
                            Cambios pequeños o ajustes
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="major">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Major (v1.0 → v2.0)</span>
                          <span className="text-xs text-muted-foreground">
                            Cambios significativos
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Minor: Incrementa el número decimal (v1.0 → v1.1)
                    <br />
                    Major: Incrementa el número principal (v1.0 → v2.0)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Agregado turno especial 11S para eventos"
                    />
                  </FormControl>
                  <FormDescription>
                    Explica brevemente los cambios de esta versión
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
                Crear Versión
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

