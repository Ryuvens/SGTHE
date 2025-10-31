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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Funcionario {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
}

interface SaldoFuncionario {
  funcionario: Funcionario;
  saldoAutomatico: number; // HAC del mes anterior
  ajusteManual: number | null; // Valor que el usuario ingresará
  aplicarAjuste: boolean; // Si el checkbox está marcado
  motivo?: string; // Motivo del ajuste manual
}

interface ModalAjustarSaldosProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadId: string;
  mes: number;
  anio: number;
  onSaldosActualizados: () => void;
}

export default function ModalAjustarSaldos({
  open,
  onOpenChange,
  unidadId,
  mes,
  anio,
  onSaldosActualizados,
}: ModalAjustarSaldosProps) {
  const [saldos, setSaldos] = useState<SaldoFuncionario[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Cargar funcionarios y sus saldos automáticos al abrir el modal
  useEffect(() => {
    if (open) {
      cargarSaldos();
    }
  }, [open, unidadId, mes, anio]);

  const cargarSaldos = async () => {
    setCargando(true);
    try {
      // Obtener funcionarios de la unidad con sus saldos automáticos
      const response = await fetch(
        `/api/metricas/saldos/unidad/${unidadId}?mes=${mes}&anio=${anio}`
      );
      
      if (!response.ok) throw new Error('Error al cargar saldos');
      
      const data = await response.json();
      
      // Transformar a formato del componente
      const saldosIniciales: SaldoFuncionario[] = data.map((item: any) => ({
        funcionario: item.funcionario,
        saldoAutomatico: item.saldoAutomatico || 0,
        ajusteManual: item.ajusteManual,
        aplicarAjuste: item.tieneAjusteManual || false,
        motivo: item.motivo || '',
      }));
      
      setSaldos(saldosIniciales);
    } catch (error) {
      console.error('Error al cargar saldos:', error);
      toast.error('No se pudieron cargar los saldos de los funcionarios');
    } finally {
      setCargando(false);
    }
  };

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const nuevosSaldos = [...saldos];
    nuevosSaldos[index].aplicarAjuste = checked;
    
    // Si desmarca, limpiar el ajuste manual y motivo
    if (!checked) {
      nuevosSaldos[index].ajusteManual = null;
      nuevosSaldos[index].motivo = '';
    }
    
    setSaldos(nuevosSaldos);
  };

  const handleAjusteChange = (index: number, valor: string) => {
    const nuevosSaldos = [...saldos];
    const valorNumerico = parseFloat(valor);
    
    // Validar rango: -999.9 a 999.9
    if (valor === '' || valor === '-') {
      nuevosSaldos[index].ajusteManual = null;
    } else if (!isNaN(valorNumerico) && valorNumerico >= -999.9 && valorNumerico <= 999.9) {
      nuevosSaldos[index].ajusteManual = valorNumerico;
    }
    
    setSaldos(nuevosSaldos);
  };

  const handleMotivoChange = (index: number, valor: string) => {
    const nuevosSaldos = [...saldos];
    nuevosSaldos[index].motivo = valor;
    setSaldos(nuevosSaldos);
  };

  const handleGuardar = async () => {
    // Validar que todos los ajustes marcados tengan valor
    const ajustesIncompletos = saldos.some(
      s => s.aplicarAjuste && (s.ajusteManual === null || isNaN(s.ajusteManual))
    );
    
    if (ajustesIncompletos) {
      toast.error('Todos los ajustes marcados deben tener un valor válido');
      return;
    }
    
    setGuardando(true);
    
    try {
      // Preparar solo los ajustes que están marcados
      const ajustes = saldos
        .filter(s => s.aplicarAjuste && s.ajusteManual !== null)
        .map(s => ({
          funcionarioId: s.funcionario.id,
          mes,
          anio,
          saldoAnterior: s.ajusteManual,
          motivo: s.motivo || 'Ajuste manual',
        }));
      
      const response = await fetch('/api/metricas/saldos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ajustes }),
      });
      
      if (!response.ok) throw new Error('Error al guardar ajustes');
      
      toast.success(`${ajustes.length} ajuste(s) guardado(s) correctamente`);
      
      onSaldosActualizados();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar ajustes:', error);
      toast.error('No se pudieron guardar los ajustes');
    } finally {
      setGuardando(false);
    }
  };

  const mesNombre = new Date(anio, mes - 1).toLocaleDateString('es-CL', { month: 'long' });
  const ajustesMarcados = saldos.filter(s => s.aplicarAjuste).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Ajustar Saldos de {mesNombre} {anio}
          </DialogTitle>
          <DialogDescription>
            El sistema calcula automáticamente el saldo desde el mes anterior. Solo ajusta
            manualmente en casos especiales (transferencias, correcciones).
          </DialogDescription>
        </DialogHeader>

        {cargando ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                SA Auto: Saldo calculado del mes anterior (HAC).{' '}
                Ajustar: Sobrescribir manualmente. Marca el checkbox para
                aplicar el ajuste.
              </AlertDescription>
            </Alert>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionario</TableHead>
                    <TableHead>SA Auto (h)</TableHead>
                    <TableHead>Ajuste Manual (h)</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Aplicar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saldos.map((saldo, index) => (
                    <TableRow key={saldo.funcionario.id}>
                      <TableCell className="font-medium">
                        {saldo.funcionario.nombre} {saldo.funcionario.apellido}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {saldo.saldoAutomatico.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          min="-999.9"
                          max="999.9"
                          value={saldo.ajusteManual ?? ''}
                          onChange={(e) => handleAjusteChange(index, e.target.value)}
                          disabled={!saldo.aplicarAjuste}
                          className="w-24 text-center"
                          placeholder="-"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          maxLength={100}
                          value={saldo.motivo ?? ''}
                          onChange={(e) => handleMotivoChange(index, e.target.value)}
                          disabled={!saldo.aplicarAjuste}
                          className="w-full"
                          placeholder="Ej: Transferencia desde otra unidad"
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={saldo.aplicarAjuste}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(index, checked as boolean)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {ajustesMarcados > 0 && (
              <Alert>
                <AlertDescription>
                  {ajustesMarcados} ajuste(s) manual(es) se guardarán y reemplazarán el saldo
                  automático.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={guardando || ajustesMarcados === 0}>
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar ajustes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
