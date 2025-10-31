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
import { Settings, Download, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import ModalConfiguracionMetricas from './ModalConfiguracionMetricas';
import ModalInfoMetrica from './ModalInfoMetrica';
import type { Metrica } from '@/lib/constants/metricas';

interface MetricasFuncionario {
  funcionarioId: string;
  funcionario: {
    id: string;
    nombre: string;
    apellido: string;
    rut: string;
  };
  HT: number;
  HE: number;
  SA: number;
  HCP: number;
  HAC: number;
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
  metricas: MetricasFuncionario[];
  totales: {
    HT: number;
    HE: number;
    SA: number;
    HCP: number;
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
  const [ordenMetricas, setOrdenMetricas] = useState(['HT', 'HE', 'SA', 'HCP', 'HAC']);
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
  const [modalInfoAbierto, setModalInfoAbierto] = useState(false);
  const [metricaSeleccionada, setMetricaSeleccionada] = useState<Metrica | null>(null);

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
    if (!datos) return { negativos: 0, acumulacion: 0 };
    
    return datos.metricas.reduce(
      (acc, m) => {
        if (m.HAC < 0) acc.negativos++;
        else if (m.HAC > 10) acc.acumulacion++;
        return acc;
      },
      { negativos: 0, acumulacion: 0 }
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
      
      // Aplicar estilos especiales a HAC
      const esHAC = metricaCodigo === 'HAC';
      const valorNumerico = typeof valor === 'number' ? valor : 0;
      
      return (
        <TableCell
          key={metricaCodigo}
          className={cn(
            esHAC && valorNumerico < 0 && 'text-red-600 font-bold',
            esHAC && valorNumerico > 10 && 'text-orange-600 font-medium'
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
          <Button variant="outline" onClick={() => setModalConfigAbierto(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar métricas
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
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  HT
                  <Info 
                    className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                    onClick={() => abrirInfoMetrica('HT')}
                  />
                </div>
                <div className="text-2xl font-bold">{datos.totales.HT.toFixed(1)}h</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  HE
                  <Info 
                    className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                    onClick={() => abrirInfoMetrica('HE')}
                  />
                </div>
                <div className="text-2xl font-bold">{datos.totales.HE.toFixed(1)}h</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  SA
                  <Info 
                    className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                    onClick={() => abrirInfoMetrica('SA')}
                  />
                </div>
                <div className="text-2xl font-bold">{datos.totales.SA.toFixed(1)}h</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  HCP
                  <Info 
                    className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                    onClick={() => abrirInfoMetrica('HCP')}
                  />
                </div>
                <div className="text-2xl font-bold">{datos.totales.HCP.toFixed(1)}h</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  HAC
                  <Info 
                    className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                    onClick={() => abrirInfoMetrica('HAC')}
                  />
                </div>
                <div className="text-2xl font-bold">{datos.totales.HAC.toFixed(1)}h</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {datos && (alertas.negativos > 0 || alertas.acumulacion > 0) && (
        <Card className="border-orange-200 bg-orange-50">
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
                💡 Configuración actual: {datos.porcentajePago}% pago /{' '}
                {100 - datos.porcentajePago}% acumulación | Jornada estándar:{' '}
                {datos.jornadaEstandar}h
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
                    <TableHead>Nombre</TableHead>
                    {renderHeaders()}
                    <TableHead>Alertas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.metricas.map((metrica) => {
                    const alerta = obtenerAlerta(metrica);
                    return (
                      <TableRow key={metrica.funcionarioId}>
                        <TableCell className="font-medium">
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
    </div>
  );
}
