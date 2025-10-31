'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DESCRIPCION_METRICAS } from '@/lib/constants/metricas';
import type { Metrica } from '@/lib/constants/metricas';

interface ModalInfoMetricaProps {
  metrica: Metrica | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getEjemplo(metrica: Metrica): React.ReactNode {
  const ejemplos: Record<Metrica, React.ReactNode> = {
    HT: (
      <>
        Si un funcionario tiene asignados:
        <br />
        • 10 turnos de 8 horas = 80h
        <br />
        • 8 turnos de 12 horas = 96h
        <br />
        <strong>Total HT = 176 horas</strong>
      </>
    ),
    HE: (
      <>
        Si trabajaste 195 horas en el mes:
        <br />
        • Jornada estándar: 180h
        <br />
        <strong>HE = 195 - 180 = 15 horas extras</strong>
      </>
    ),
    SA: (
      <>
        Si el mes anterior acumulaste 12.5 horas:
        <br />
        • Esas horas se traspasan como Saldo Anterior
        <br />
        <strong>SA = 12.5 horas</strong>
      </>
    ),
    HCP: (
      <>
        Si tienes 10 HE y la configuración es 70% pago:
        <br />
        • HE: 10 horas
        <br />
        • % Pago: 70%
        <br />
        <strong>HCP = 10 × 0.70 = 7 horas a pagar</strong>
      </>
    ),
    HAC: (
      <>
        Con los siguientes valores:
        <br />
        • HE: 10 horas
        <br />
        • HCP: 7 horas (pagadas)
        <br />
        • SA: 5 horas (del mes anterior)
        <br />
        <strong>HAC = 10 - 7 + 5 = 8 horas acumuladas</strong>
      </>
    ),
    TD: (
      <>
        Si en el mes tienes asignados:
        <br />
        • 12 turnos diurnos (D)
        <br />
        • 8 turnos nocturnos (N)
        <br />
        <strong>TD = 12 turnos diurnos</strong>
      </>
    ),
    TN: (
      <>
        Si en el mes tienes asignados:
        <br />
        • 12 turnos diurnos (D)
        <br />
        • 8 turnos nocturnos (N)
        <br />
        <strong>TN = 8 turnos nocturnos</strong>
      </>
    ),
    DT: (
      <>
        Si trabajaste en los siguientes días:
        <br />
        • 5, 6, 7, 12, 13, 14, 19, 20, 21, 26, 27, 28 de octubre
        <br />
        <strong>DT = 12 días trabajados</strong>
      </>
    ),
    PC: (
      <>
        Si en octubre (31 días) trabajaste 20 días:
        <br />
        • Días trabajados: 20
        <br />
        • Días del mes: 31
        <br />
        <strong>%C = (20 / 31) × 100 = 64.52%</strong>
      </>
    ),
  };

  return ejemplos[metrica];
}

export default function ModalInfoMetrica({
  metrica,
  open,
  onOpenChange,
}: ModalInfoMetricaProps) {
  if (!metrica) return null;

  const info = DESCRIPCION_METRICAS[metrica];

  if (!info) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg">
              {metrica}
            </Badge>
            {info.nombre}
          </DialogTitle>
          <DialogDescription>{info.descripcion}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Definición */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              📊 Definición
            </h4>
            <p className="text-sm text-muted-foreground pl-6">{info.descripcion}</p>
          </div>

          {/* Cálculo */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              🧮 Cálculo
            </h4>
            <div className="text-sm bg-muted p-3 rounded-md pl-6">
              <code>{info.calculo}</code>
            </div>
          </div>

          {/* Ejemplo */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              💡 Ejemplo
            </h4>
            <div className="text-sm text-muted-foreground pl-6">
              {getEjemplo(metrica)}
            </div>
          </div>

          {/* Base Legal */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              📋 Base Legal
            </h4>
            <p className="text-sm text-muted-foreground pl-6">
              PRO DRH 22 - Procedimiento de Horas Extraordinarias DGAC
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Entendido</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
