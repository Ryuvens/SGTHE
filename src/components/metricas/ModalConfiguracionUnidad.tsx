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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ConfiguracionUnidad {
  jornadaEstandar: number;
  porcentajePago: number;
}

interface ModalConfiguracionUnidadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadId: string;
  nombreUnidad: string;
  onConfiguracionActualizada: () => void;
}

export default function ModalConfiguracionUnidad({
  open,
  onOpenChange,
  unidadId,
  nombreUnidad,
  onConfiguracionActualizada,
}: ModalConfiguracionUnidadProps) {
  const [configuracion, setConfiguracion] = useState<ConfiguracionUnidad>({
    jornadaEstandar: 180,
    porcentajePago: 70,
  });
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  // Cargar configuración actual al abrir el modal
  useEffect(() => {
    if (open) {
      cargarConfiguracion();
    }
  }, [open, unidadId]);

  const cargarConfiguracion = async () => {
    setCargando(true);
    try {
      const response = await fetch(`/api/metricas/configuracion/${unidadId}`);
      
      if (!response.ok) throw new Error('Error al cargar configuración');
      
      const data = await response.json();
      
      setConfiguracion({
        jornadaEstandar: data.jornadaMensualEstandar || 180,
        porcentajePago: Number(data.porcentajePagoHE) || 70,
      });
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('No se pudo cargar la configuración de la unidad');
    } finally {
      setCargando(false);
    }
  };

  const validarConfiguracion = (): boolean => {
    const nuevosErrores: { [key: string]: string } = {};

    // Validar que no estén vacíos
    if (!configuracion.jornadaEstandar || configuracion.jornadaEstandar === 0) {
      nuevosErrores.jornadaEstandar = 'La jornada es requerida';
    }
    // Validar jornada estándar (120h - 240h)
    else if (configuracion.jornadaEstandar < 120 || configuracion.jornadaEstandar > 240) {
      nuevosErrores.jornadaEstandar = 'La jornada debe estar entre 120 y 240 horas';
    }

    // Validar que no esté vacío
    if (!configuracion.porcentajePago && configuracion.porcentajePago !== 0) {
      nuevosErrores.porcentajePago = 'El porcentaje es requerido';
    }
    // Validar porcentaje de pago (0% - 100%)
    else if (configuracion.porcentajePago < 0 || configuracion.porcentajePago > 100) {
      nuevosErrores.porcentajePago = 'El porcentaje debe estar entre 0% y 100%';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleJornadaChange = (valor: string) => {
    // Permitir campo vacío sin mostrar error hasta que escriba algo
    if (valor === '') {
      setConfiguracion({ ...configuracion, jornadaEstandar: 0 });
      setErrores({ ...errores, jornadaEstandar: '' });
      return;
    }

    const valorNumerico = parseFloat(valor);
    
    if (isNaN(valorNumerico)) {
      return; // No actualizar si no es número válido
    }

    setConfiguracion({ ...configuracion, jornadaEstandar: valorNumerico });

    // Validar en tiempo real
    const nuevosErrores = { ...errores };
    if (valorNumerico < 120 || valorNumerico > 240) {
      nuevosErrores.jornadaEstandar = 'La jornada debe estar entre 120 y 240 horas';
    } else {
      nuevosErrores.jornadaEstandar = '';
    }
    setErrores(nuevosErrores);
  };

  const handlePorcentajeChange = (valor: string) => {
    // Permitir campo vacío sin mostrar error hasta que escriba algo
    if (valor === '') {
      setConfiguracion({ ...configuracion, porcentajePago: 0 });
      setErrores({ ...errores, porcentajePago: '' });
      return;
    }

    const valorNumerico = parseFloat(valor);
    
    if (isNaN(valorNumerico)) {
      return; // No actualizar si no es número válido
    }

    setConfiguracion({ ...configuracion, porcentajePago: valorNumerico });

    // Validar en tiempo real
    const nuevosErrores = { ...errores };
    if (valorNumerico < 0 || valorNumerico > 100) {
      nuevosErrores.porcentajePago = 'El porcentaje debe estar entre 0% y 100%';
    } else {
      nuevosErrores.porcentajePago = '';
    }
    setErrores(nuevosErrores);
  };

  const handleGuardar = async () => {
    if (!validarConfiguracion()) {
      toast.error('Por favor corrige los errores antes de guardar');
      return;
    }

    setGuardando(true);

    try {
      const response = await fetch('/api/metricas/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidadId,
          jornadaMensualEstandar: configuracion.jornadaEstandar,
          porcentajePagoHE: configuracion.porcentajePago,
        }),
      });

      if (!response.ok) throw new Error('Error al guardar configuración');

      toast.success('Configuración actualizada correctamente');
      onConfiguracionActualizada();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('No se pudo guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const porcentajeAcumulacion = 100 - configuracion.porcentajePago;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configuración de Unidad</DialogTitle>
          <DialogDescription>
            {nombreUnidad}
          </DialogDescription>
        </DialogHeader>

        {cargando ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Estos valores afectan el cálculo de HE, HCP y HAC para todos los funcionarios.
              </AlertDescription>
            </Alert>

            {/* Jornada Estándar */}
            <div className="space-y-2">
              <Label htmlFor="jornada">
                Jornada Estándar (horas mensuales)
              </Label>
              <Input
                id="jornada"
                type="number"
                step="0.5"
                min="120"
                max="240"
                value={configuracion.jornadaEstandar || ''}
                onChange={(e) => handleJornadaChange(e.target.value)}
                className={errores.jornadaEstandar ? 'border-destructive' : ''}
                placeholder="180"
              />
              {errores.jornadaEstandar && (
                <p className="text-sm text-destructive">{errores.jornadaEstandar}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Rango válido: 120h - 240h
              </p>
            </div>

            {/* Porcentaje Pago */}
            <div className="space-y-2">
              <Label htmlFor="porcentaje">
                Porcentaje de Pago (%)
              </Label>
              <Input
                id="porcentaje"
                type="number"
                step="1"
                min="0"
                max="100"
                value={configuracion.porcentajePago || ''}
                onChange={(e) => handlePorcentajeChange(e.target.value)}
                className={errores.porcentajePago ? 'border-destructive' : ''}
                placeholder="70"
              />
              {errores.porcentajePago && (
                <p className="text-sm text-destructive">{errores.porcentajePago}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Rango válido: 0% - 100%
              </p>
            </div>

            {/* Resumen visual */}
            <div className="bg-muted p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Pago:</span>
                <span className="font-bold">{configuracion.porcentajePago}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Acumulación:</span>
                <span className="font-bold">{porcentajeAcumulacion}%</span>
              </div>
              <Alert className="mt-2">
                <AlertDescription>
                  Las horas extras se dividirán: {configuracion.porcentajePago}% para pago
                  inmediato y {porcentajeAcumulacion}% para acumulación.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={guardando}>
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
