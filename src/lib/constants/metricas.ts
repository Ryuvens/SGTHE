export const METRICAS_CORE = ['HT', 'HE', 'SA', 'HCP', 'HAC'] as const;
export const METRICAS_OPCIONALES = ['TD', 'TN', 'DT', 'PC'] as const;
export const TODAS_LAS_METRICAS = [...METRICAS_CORE, ...METRICAS_OPCIONALES] as const;

export type MetricaCORE = typeof METRICAS_CORE[number];
export type MetricaOPCIONAL = typeof METRICAS_OPCIONALES[number];
export type Metrica = typeof TODAS_LAS_METRICAS[number];

export const DESCRIPCION_METRICAS: Record<string, { nombre: string; descripcion: string; calculo: string }> = {
  HT: {
    nombre: 'Horas Trabajadas',
    descripcion: 'Total de horas asignadas en turnos del mes',
    calculo: 'Suma de duración de todos los turnos',
  },
  HE: {
    nombre: 'Horas Extras',
    descripcion: 'Horas trabajadas sobre la jornada estándar',
    calculo: 'HT - Jornada Estándar (si HT > Jornada)',
  },
  SA: {
    nombre: 'Saldo Anterior',
    descripcion: 'Horas acumuladas del mes anterior',
    calculo: 'Valor del campo HAC del mes anterior',
  },
  HCP: {
    nombre: 'Horas Compensables',
    descripcion: 'Horas extras que se pagarán monetariamente',
    calculo: 'HE × (% Pago / 100)',
  },
  HAC: {
    nombre: 'Horas Acumuladas',
    descripcion: 'Saldo de horas para el siguiente mes',
    calculo: 'HE - HCP + SA',
  },
  TD: {
    nombre: 'Turnos Diurnos',
    descripcion: 'Cantidad de turnos diurnos asignados',
    calculo: 'Contador de turnos con horario diurno',
  },
  TN: {
    nombre: 'Turnos Nocturnos',
    descripcion: 'Cantidad de turnos nocturnos asignados',
    calculo: 'Contador de turnos con horario nocturno',
  },
  DT: {
    nombre: 'Días Trabajados',
    descripcion: 'Cantidad de días con al menos un turno',
    calculo: 'Contador de días únicos con turnos',
  },
  PC: {
    nombre: '% Cobertura',
    descripcion: 'Porcentaje de días del mes trabajados',
    calculo: '(Días Trabajados / Días del Mes) × 100',
  },
};

export const CONFIGURACION_DEFAULT = {
  metricasVisibles: METRICAS_CORE,
  ordenMetricas: [0, 1, 2, 3, 4],
};
