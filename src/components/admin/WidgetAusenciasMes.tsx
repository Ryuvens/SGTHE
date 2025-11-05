'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, FileText, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════
// TIPOS DE AUSENCIA
// ═══════════════════════════════════════════════════════════

const TIPOS_AUSENCIA_INFO = {
  LM: { nombre: 'Licencia Médica', color: 'bg-red-500', descuenta: 'HLM' },
  FLA: { nombre: 'Feriado Legal', color: 'bg-blue-500', descuenta: 'HLM' },
  PA: { nombre: 'Permiso Admin', color: 'bg-yellow-500', descuenta: 'HMC' },
  PG: { nombre: 'Permiso Gremial', color: 'bg-purple-500', descuenta: 'HMC' },
  OTRO: { nombre: 'Otro Permiso', color: 'bg-gray-500', descuenta: 'HMC' },
};

// ═══════════════════════════════════════════════════════════
// PROPS DEL COMPONENTE
// ═══════════════════════════════════════════════════════════

interface WidgetAusenciasMesProps {
  ausencias: Array<{
    id: string;
    tipo: 'LM' | 'FLA' | 'PA' | 'PG' | 'OTRO';
    fechaInicio?: Date | null;
    fechaFin?: Date | null;
    fecha?: Date | null;
    diasHabiles?: number | null;
    horas?: number | null;
    usuario: {
      nombre: string;
      apellido: string;
    };
  }>;
  mes: number;
  anio: number;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function WidgetAusenciasMes({ ausencias, mes, anio }: WidgetAusenciasMesProps) {
  // Agrupar ausencias por tipo
  const ausenciasPorTipo = ausencias.reduce((acc, ausencia) => {
    const tipo = ausencia.tipo;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(ausencia);
    return acc;
  }, {} as Record<string, typeof ausencias>);

  // Calcular totales
  const totalDiasLM_FLA = ausencias
    .filter((a) => ['LM', 'FLA'].includes(a.tipo))
    .reduce((sum, a) => sum + (a.diasHabiles || 0), 0);

  const totalHorasPermisos = ausencias
    .filter((a) => ['PA', 'PG', 'OTRO'].includes(a.tipo))
    .reduce((sum, a) => sum + (a.horas || 0), 0);

  const tieneAusenciasHLM = totalDiasLM_FLA > 0;
  const tieneAusenciasHMC = totalHorasPermisos > 0;

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ausencias del Mes
            </CardTitle>
            <CardDescription>
              {ausencias.length} ausencia(s) registrada(s) para{' '}
              {new Date(anio, mes - 1).toLocaleDateString('es-CL', {
                month: 'long',
                year: 'numeric',
              })}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/ausencias">
              <ExternalLink className="mr-2 h-4 w-4" />
              Gestionar
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alertas de impacto */}
        {(tieneAusenciasHLM || tieneAusenciasHMC) && (
          <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-sm">
              <p className="font-semibold mb-1">Impacto en cálculo de métricas:</p>
              {tieneAusenciasHLM && (
                <span className="block">
                  • {totalDiasLM_FLA} día(s) descontados de HLM ({totalDiasLM_FLA * 8.8}h)
                </span>
              )}
              {tieneAusenciasHMC && (
                <span className="block">
                  • {totalHorasPermisos}h descontadas de HMC
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Sin ausencias */}
        {ausencias.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No hay ausencias registradas este mes</p>
            <Button asChild variant="link" size="sm" className="mt-2">
              <Link href="/admin/ausencias">
                Registrar ausencia
              </Link>
            </Button>
          </div>
        )}

        {/* Lista por tipo */}
        {Object.entries(ausenciasPorTipo).map(([tipo, ausenciasTipo]) => {
          const info = TIPOS_AUSENCIA_INFO[tipo as keyof typeof TIPOS_AUSENCIA_INFO];
          if (!info) return null;

          return (
            <div key={tipo} className="space-y-2 border-l-4 pl-3" style={{ borderColor: info.color.replace('bg-', '') }}>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${info.color}`} />
                <span className="font-semibold text-sm">
                  {tipo} - {info.nombre}
                </span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {ausenciasTipo.length}
                </Badge>
              </div>
              <div className="pl-5 space-y-1">
                {ausenciasTipo.map((ausencia) => (
                  <div
                    key={ausencia.id}
                    className="text-sm text-muted-foreground flex items-center justify-between"
                  >
                    <span className="truncate">
                      {ausencia.usuario.nombre} {ausencia.usuario.apellido}
                    </span>
                    <span className="text-xs font-medium shrink-0 ml-2">
                      {ausencia.diasHabiles && `${ausencia.diasHabiles}d`}
                      {ausencia.horas && `${ausencia.horas}h`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Leyenda */}
        {ausencias.length > 0 && (
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p className="font-medium mb-2">📋 Impacto en cálculo:</p>
            <ul className="space-y-1 pl-4">
              <li>• <strong>LM/FLA:</strong> Descuentan días de HLM (× 8.8h/día)</li>
              <li>• <strong>PA/PG/OTRO:</strong> Descuentan horas de HMC</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

