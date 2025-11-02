export const METRICAS_CORE = [
  'SA',           // Saldo Anterior
  'HLM',          // Horario Legal Mensual
  'HT',           // Horas Trabajadas
  'compensacion', // Descansos complementarios
  'HMC',          // Horario Mensual Corregido
  'balanceHLM',   // Balance HT - HLM
  'HE',           // Horas Extras
  'HCP',          // Horas Compensables (a pagar)
  'SHE',          // Saldo Horas Extras
  'HAC'           // Horas Acumuladas
] as const;
export const METRICAS_OPCIONALES = ['TD', 'TN', 'DT', 'PC'] as const;
export const TODAS_LAS_METRICAS = [...METRICAS_CORE, ...METRICAS_OPCIONALES] as const;

export type MetricaCORE = typeof METRICAS_CORE[number];
export type MetricaOPCIONAL = typeof METRICAS_OPCIONALES[number];
export type Metrica = typeof TODAS_LAS_METRICAS[number];

export const DESCRIPCION_METRICAS: Record<string, { nombre: string; descripcion: string; calculo: string }> = {
  SA: {
    nombre: 'Saldo Anterior',
    descripcion: 'Horas acumuladas del mes anterior',
    calculo: 'Valor del campo HAC del mes anterior',
  },
  HLM: {
    nombre: 'Horario Legal Mensual',
    descripcion: 'Horas obligatorias que se deben trabajar en el mes según días hábiles',
    calculo: 'días_hábiles × 8.8 horas',
  },
  HT: {
    nombre: 'Horas Trabajadas',
    descripcion: 'Total de horas asignadas en turnos del mes',
    calculo: 'Suma de duración de todos los turnos (truncado)',
  },
  compensacion: {
    nombre: 'Compensación',
    descripcion: 'Suma total de horas de descansos complementarios del mes',
    calculo: 'Σ (DC diurnos + DN nocturnos)',
  },
  HMC: {
    nombre: 'Horario Mensual Corregido',
    descripcion: 'Horario legal ajustado por descansos complementarios otorgados. En resumen global se muestra el promedio de la unidad',
    calculo: 'HLM - Compensación (⌀ promedio en resumen)',
  },
  balanceHLM: {
    nombre: 'Balance HLM',
    descripcion: 'Diferencia entre horas trabajadas y horario legal. Positivo = horas extras, Negativo = déficit',
    calculo: 'HT - HLM',
  },
  HE: {
    nombre: 'Horas Extras',
    descripcion: 'Horas trabajadas sobre el horario legal mensual',
    calculo: 'HT - HLM (si HT > HLM)',
  },
  HCP: {
    nombre: 'Horas Compensables',
    descripcion: 'Horas extras que se pagarán monetariamente',
    calculo: 'HE × (% Pago / 100)',
  },
  SHE: {
    nombre: 'Saldo Horas Extras',
    descripcion: 'Horas extraordinarias que se acumulan (no se pagan monetariamente)',
    calculo: 'HE - HCP',
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
  ordenMetricas: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // SA, HLM, HT, compensacion, HMC, balanceHLM, HE, HCP, SHE, HAC
};
