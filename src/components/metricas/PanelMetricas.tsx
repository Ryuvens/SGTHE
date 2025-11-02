'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings, Download, AlertTriangle, Info, DollarSign, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import ModalConfiguracionMetricas from './ModalConfiguracionMetricas';
import ModalInfoMetrica from './ModalInfoMetrica';
import ModalAjustarSaldos from './ModalAjustarSaldos';
import ModalConfiguracionUnidad from './ModalConfiguracionUnidad';
import type { Metrica } from '@/lib/constants/metricas';

interface MetricasFuncionario {
  funcionarioId: string;
  funcionario: {
    id: string;
    nombre: string;
    apellido: string;
    rut: string | null;
    iniciales: string;
  };
  SA: number;           // Saldo Anterior
  HLM: number;          // Horario Legal Mensual
  HT: number;           // Horas Trabajadas
  compensacion: number; // Descansos complementarios
  HMC: number;          // Horario Mensual Corregido
  balanceHLM: number;   // Balance HT - HLM
  HE: number;           // Horas Extras
  HCP: number;          // Horas Compensables
  SHE: number;          // Saldo Horas Extras
  HAC: number;          // Horas Acumuladas
  // Opcionales
  TD?: number;
  TN?: number;
  DT?: number;
  PC?: number;
}

interface ResumenMetricas {
  unidadId: string;
  mes: number;
  anio: number;
  jornadaEstandar: number;
  porcentajePago: number;
  hlm: number;
  metricas: MetricasFuncionario[];
  totales: {
    HLM: number;
    HT: number;
    compensacion: number;
    HMC: number;
    balanceHLM: number;
    HE: number;
    SA: number;
    HCP: number;
    SHE: number;
    HAC: number;
  };
}

interface PanelMetricasProps {
  unidadId: string;
  nombreUnidad: string;
}

export default function PanelMetricas({ unidadId, nombreUnidad }: PanelMetricasProps) {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [datos, setDatos] = useState<ResumenMetricas | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarOpcionales, setMostrarOpcionales] = useState(false);
  const [configuracionCargada, setConfiguracionCargada] = useState(false);
  const [ordenMetricas, setOrdenMetricas] = useState([
    'SA', 'HLM', 'HT', 'compensacion', 'HMC', 'balanceHLM', 'HE', 'HCP', 'SHE', 'HAC'
  ]);
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
  const [modalInfoAbierto, setModalInfoAbierto] = useState(false);
  const [metricaSeleccionada, setMetricaSeleccionada] = useState<Metrica | null>(null);
  const [modalSaldosAbierto, setModalSaldosAbierto] = useState(false);
  const [modalConfigUnidadAbierto, setModalConfigUnidadAbierto] = useState(false);

  // Cargar configuración del usuario al montar
  useEffect(() => {
    cargarConfiguracionUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar datos cuando cambia mes, año, unidad o configuración
  useEffect(() => {
    if (configuracionCargada) {
      cargarMetricas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, anio, unidadId, mostrarOpcionales, configuracionCargada]);

  const cargarConfiguracionUsuario = async () => {
    try {
      const response = await fetch('/api/metricas/usuario-config');
      if (response.ok) {
        const config = await response.json();
        const metricasVisibles = config.metricasVisibles as string[];
        const ordenMetricas = config.ordenMetricas as number[];
        
        // Crear array ordenado de métricas según la configuración
        const metricasOrdenadas = ordenMetricas.map((index) => metricasVisibles[index]);
        
        // Verificar si tiene alguna métrica opcional activa
        const tieneOpcionales = metricasVisibles.some(m => 
          ['TD', 'TN', 'DT', 'PC'].includes(m)
        );
        
        setMostrarOpcionales(tieneOpcionales);
        setOrdenMetricas(metricasOrdenadas);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setConfiguracionCargada(true);
    }
  };

  const cargarMetricas = async () => {
    try {
      setCargando(true);
      setError(null);

      const url = `/api/metricas/calcular/${unidadId}/${mes}/${anio}?opcionales=${mostrarOpcionales}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar métricas');
      }

      const data = await response.json();
      setDatos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  const obtenerAlerta = (metrica: MetricasFuncionario) => {
    if (metrica.HAC < 0) {
      return { tipo: 'negativo', icono: '🔴', mensaje: 'Saldo negativo' };
    }
    if (metrica.balanceHLM < 0) {
      return { tipo: 'deficit', icono: '⚠️', mensaje: `Déficit de ${Math.abs(metrica.balanceHLM).toFixed(1)}h` };
    }
    if (metrica.HAC > 10) {
      return { tipo: 'acumulacion', icono: '⚠️', mensaje: 'Acumulación alta' };
    }
    return null;
  };

  const meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' },
  ];

  const aniosDisponibles = Array.from({ length: 5 }, (_, i) => 
    new Date().getFullYear() - 2 + i
  );

  const contarAlertas = () => {
    if (!datos) return { negativos: 0, acumulacion: 0, deficit: 0 };
    
    return datos.metricas.reduce(
      (acc, m) => {
        if (m.HAC < 0) acc.negativos++;
        else if (m.balanceHLM < 0) acc.deficit++;
        else if (m.HAC > 10) acc.acumulacion++;
        return acc;
      },
      { negativos: 0, acumulacion: 0, deficit: 0 }
    );
  };

  const alertas = contarAlertas();

  const abrirInfoMetrica = (metrica: Metrica) => {
    setMetricaSeleccionada(metrica);
    setModalInfoAbierto(true);
  };

  const renderHeaders = () => {
    return ordenMetricas.map((metricaCodigo) => (
      <TableHead key={metricaCodigo}>
        {metricaCodigo}
      </TableHead>
    ));
  };

  const renderMetricasCells = (metrica: MetricasFuncionario) => {
    return ordenMetricas.map((metricaCodigo) => {
      const valor = metrica[metricaCodigo as keyof MetricasFuncionario];
      
      // Formatear el valor según el tipo de métrica
      let valorFormateado: string;
      if (metricaCodigo === 'PC' && typeof valor === 'number') {
        valorFormateado = `${valor.toFixed(1)}%`;
      } else if (typeof valor === 'number') {
        valorFormateado = valor.toFixed(1);
      } else {
        valorFormateado = valor?.toString() || '0';
      }
      
      // Aplicar estilos especiales
      const esHAC = metricaCodigo === 'HAC';
      const esBalanceHLM = metricaCodigo === 'balanceHLM';
      const esSHE = metricaCodigo === 'SHE';
      const valorNumerico = typeof valor === 'number' ? valor : 0;
      
      return (
        <TableCell
          key={metricaCodigo}
          className={cn(
            // Estilos para HAC
            esHAC && valorNumerico < 0 && 'text-red-600 font-bold',
            esHAC && valorNumerico > 10 && 'text-orange-600 font-medium',
            // Estilos para balanceHLM (negativo = falta horas, rojo)
            esBalanceHLM && valorNumerico < 0 && 'text-red-600 font-bold',
            esBalanceHLM && valorNumerico > 0 && 'text-green-600',
            // Estilos para SHE
            esSHE && valorNumerico < 0 && 'text-red-600'
          )}
        >
          {valorFormateado}
        </TableCell>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Panel de Métricas</CardTitle>
          <p className="text-sm text-muted-foreground">{nombreUnidad}</p>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={() => setModalSaldosAbierto(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Ajustar saldos
          </Button>
          <Button variant="outline" onClick={() => setModalConfigAbierto(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar métricas
          </Button>
          <Button variant="outline" onClick={() => setModalConfigUnidadAbierto(true)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Configuración de unidad
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardContent>
      </Card>

      {/* Selector de período */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mes:</span>
              <Select
                value={mes.toString()}
                onValueChange={(value) => setMes(parseInt(value))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((m) => (
                    <SelectItem key={m.valor} value={m.valor.toString()}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Año:</span>
              <Select
                value={anio.toString()}
                onValueChange={(value) => setAnio(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aniosDisponibles.map((a) => (
                    <SelectItem key={a} value={a.toString()}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen Global */}
      {datos && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen Global de la Unidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {['SA', 'HLM', 'HT', 'compensacion', 'HMC', 'balanceHLM', 'HE', 'HCP', 'SHE', 'HAC'].map((metricaCodigo) => {
                // HLM es especial: mostrar valor único del mes, no suma
                // HMC es especial: mostrar promedio, no suma
                const valor = metricaCodigo === 'HLM' 
                  ? datos.hlm  // Valor único del mes
                  : metricaCodigo === 'HMC'
                  ? (datos.metricas.length > 0 ? datos.totales.HMC / datos.metricas.length : 0)  // Promedio
                  : datos.totales[metricaCodigo as keyof typeof datos.totales];  // Suma normal
                
                return (
                  <div key={metricaCodigo} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      {metricaCodigo}
                      {metricaCodigo === 'HMC' && <span className="text-xs">⌀</span>}
                      <Info 
                        className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                        onClick={() => abrirInfoMetrica(metricaCodigo as Metrica)}
                      />
                    </div>
                    <div className="text-2xl font-bold">
                      {typeof valor === 'number' ? valor.toFixed(1) : '0.0'}h
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {datos && (alertas.negativos > 0 || alertas.acumulacion > 0 || alertas.deficit > 0) && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-2">
              {alertas.acumulacion > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">
                    ⚠️ {alertas.acumulacion} funcionario(s) con acumulación {'>'} 10h
                  </span>
                </div>
              )}
              {alertas.deficit > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">
                    ⚠️ {alertas.deficit} funcionario(s) con déficit de horas (Balance HLM negativo)
                  </span>
                </div>
              )}
              {alertas.negativos > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">
                    🔴 {alertas.negativos} funcionario(s) con saldo negativo
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuración actual */}
      {datos && (
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-900 dark:text-blue-100">
                💡 HLM: {datos.hlm?.toFixed(1) || 'N/A'}h | 
                Configuración: {datos.porcentajePago}% pago /{' '}
                {100 - datos.porcentajePago}% acumulación | 
                Jornada estándar: {datos.jornadaEstandar}h
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de funcionarios */}
      {cargando ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando métricas...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-red-600">{error}</div>
          </CardContent>
        </Card>
      ) : datos && datos.metricas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Detalle por Funcionario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-20 bg-background">RUT</TableHead>
                    <TableHead className="sticky left-[100px] z-20 bg-background">Inic.</TableHead>
                    <TableHead className="sticky left-[150px] z-20 bg-background">Funcionario</TableHead>
                    {renderHeaders()}
                    <TableHead>Alertas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.metricas.map((metrica) => {
                    const alerta = obtenerAlerta(metrica);
                    return (
                      <TableRow key={metrica.funcionarioId}>
                        <TableCell className="sticky left-0 z-10 bg-background text-xs">
                          {metrica.funcionario.rut || 'Sin RUT'}
                        </TableCell>
                        <TableCell className="sticky left-[100px] z-10 bg-background text-center font-bold">
                          {metrica.funcionario.iniciales || '--'}
                        </TableCell>
                        <TableCell className="sticky left-[150px] z-10 bg-background font-medium">
                          {metrica.funcionario.nombre} {metrica.funcionario.apellido}
                        </TableCell>
                        {renderMetricasCells(metrica)}
                        <TableCell>
                          {alerta && (
                            <Badge variant={alerta.tipo === 'negativo' ? 'destructive' : 'outline'}>
                              {alerta.icono}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              No hay datos para este período
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de configuración */}
      <ModalConfiguracionMetricas
        open={modalConfigAbierto}
        onOpenChange={setModalConfigAbierto}
        onGuardar={() => {
          cargarConfiguracionUsuario(); // Recargar configuración primero
          cargarMetricas(); // Luego recargar datos
        }}
      />

      {/* Modal de información */}
      <ModalInfoMetrica
        metrica={metricaSeleccionada}
        open={modalInfoAbierto}
        onOpenChange={setModalInfoAbierto}
      />

      {/* Modal de ajuste de saldos */}
      <ModalAjustarSaldos
        open={modalSaldosAbierto}
        onOpenChange={setModalSaldosAbierto}
        unidadId={unidadId}
        mes={mes}
        anio={anio}
        onSaldosActualizados={() => {
          cargarMetricas();
        }}
      />

      {/* Modal de configuración de unidad */}
      <ModalConfiguracionUnidad
        open={modalConfigUnidadAbierto}
        onOpenChange={setModalConfigUnidadAbierto}
        unidadId={unidadId}
        nombreUnidad={nombreUnidad}
        onConfiguracionActualizada={() => {
          cargarMetricas();
        }}
      />
    </div>
  );
}
