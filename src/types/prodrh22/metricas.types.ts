// src/types/prodrh22/metricas.types.ts
/**
 * Tipos y definiciones para el cálculo de métricas según PRO DRH 22
 * Procedimiento de Cálculo de Horas Extraordinarias y Sistema Compensatorio
 * DGAC - Dirección General de Aeronáutica Civil
 */

/**
 * Métricas completas de un funcionario según PRO DRH 22
 * Basado en Capítulo 3 del procedimiento
 */
export interface MetricasPRODRH22 {
  // Identificación
  funcionarioId: string;
  mes: number; // 1-12
  anio: number; // 2024, 2025...
  
  // Base de cálculo (Capítulo 3.1)
  diasHabiles: number; // Días hábiles del mes (Lun-Vie)
  HLM: number; // Horario Legal Mensual = días_hábiles × 8.8
  
  // Horas trabajadas (Capítulo 3.2)
  HT: number; // Horas Trabajadas totales del mes
  
  // Horas extraordinarias por tipo (Capítulo 3.3)
  HE_diurnas: number; // 07:00-21:00, recargo 25%
  HE_nocturnas: number; // 21:00-07:00, recargo 50%
  HE_festivas: number; // Sábados, domingos, festivos, recargo 50%
  
  // Balance y compensación
  balanceHLM: number; // HLM - HT (positivo = horas faltantes, negativo = exceso)
  compensacionTotal: number; // Monto total en pesos ($) por HE
  
  // Deducciones (Capítulo 3.4)
  diasFeriado: number; // Días de feriado legal
  diasLicencia: number; // Días de licencia médica
  horasPermisoAdmin: number; // Horas de permisos administrativos
  horasDescansoComp: number; // Horas de descanso compensatorio
  
  // Opcional - Solo para personal femenino con lactancia (Anexo C)
  horasPermisoLactancia?: number; // Horas de permiso de lactancia
  
  // Cálculo final (Capítulo 3.5)
  HT_ajustado: number; // HT - deducciones
  HE_total: number; // Total de horas extraordinarias = HT_ajustado - HLM
  
  // Sistema compensatorio (Capítulo 3.6)
  porcentajePago: number; // % de HE que se paga (configurable)
  porcentajeAcumulacion: number; // % de HE que se acumula (100 - porcentajePago)
  horasPago: number; // HE × (porcentajePago / 100)
  horasAcumuladas: number; // HE × (porcentajeAcumulacion / 100) + saldoAnterior
  
  // Saldos
  saldoAnterior: number; // Horas acumuladas del mes anterior
  saldoSiguiente: number; // Horas que pasan al siguiente mes
  
  // Observaciones y estado
  observaciones?: string;
  requiereAjuste: boolean; // Si necesita revisión manual
  estado: 'CALCULADO' | 'AJUSTADO' | 'VALIDADO' | 'APROBADO';
}

/**
 * Configuración de unidad para cálculo de métricas PRO DRH 22
 * Basado en Capítulo 2 del procedimiento
 */
export interface ConfiguracionUnidadPRODRH22 {
  unidadId: string;
  nombreUnidad: string;
  
  // Parámetros de cálculo (Capítulo 2.1)
  jornadaMensualEstandar: number; // Horas mensuales estándar (ej: 180h)
  horasDiarias: number; // Horas diarias estándar (ej: 8.8h)
  
  // Recargos según tipo de hora extraordinaria (Capítulo 2.2)
  recargoDiurno: number; // % recargo HE diurnas (25%)
  recargoNocturno: number; // % recargo HE nocturnas (50%)
  recargoFestivo: number; // % recargo HE festivas (50%)
  
  // Sistema compensatorio (Capítulo 2.3)
  porcentajePagoDefault: number; // % que se paga monetariamente (ej: 70%)
  porcentajeAcumulacionDefault: number; // % que se acumula (ej: 30%)
  
  // Límites y alertas (Capítulo 2.4)
  limiteAcumulacionAlerta: number; // Horas acumuladas que generan alerta (ej: 10h)
  limiteAcumulacionMaximo: number; // Horas acumuladas máximas (ej: 40h)
  
  // Validaciones activas
  validarLimiteMensual: boolean; // Validar límite mensual de HE
  validarLimiteSemanal: boolean; // Validar límite semanal de HE
  
  // Fechas
  vigenciaDesde: Date;
  vigenciaHasta?: Date;
  
  // Auditoría
  creadoPor: string;
  creadoEn: Date;
  modificadoPor?: string;
  modificadoEn?: Date;
}

/**
 * Resumen de métricas de toda la unidad
 * Para vistas agregadas y reportes
 */
export interface ResumenUnidadPRODRH22 {
  unidadId: string;
  mes: number;
  anio: number;
  
  // Configuración aplicada
  configuracion: ConfiguracionUnidadPRODRH22;
  
  // Métricas por funcionario
  metricas: MetricasPRODRH22[];
  
  // Totales de la unidad
  totales: {
    funcionariosActivos: number;
    diasHabiles: number;
    HLM_total: number;
    HT_total: number;
    HE_diurnas_total: number;
    HE_nocturnas_total: number;
    HE_festivas_total: number;
    compensacionTotal: number;
    horasPago_total: number;
    horasAcumuladas_total: number;
  };
  
  // Alertas y validaciones
  alertas: {
    funcionariosConSaldoNegativo: number;
    funcionariosConAcumulacionAlta: number;
    funcionariosRequierenAjuste: number;
  };
  
  // Estado general
  estadoCalculo: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'ERROR';
  fechaCalculo: Date;
  calculadoPor: string;
}

/**
 * Deducción de horas según tipo (Capítulo 3.4)
 */
export interface DeduccionHoras {
  tipo: 'FERIADO' | 'LICENCIA_MEDICA' | 'PERMISO_ADMIN' | 'DESCANSO_COMP' | 'PERMISO_LACTANCIA';
  fecha: Date;
  horas: number;
  motivo?: string;
  documentoRespaldo?: string; // URL del documento que respalda la deducción
}

/**
 * Detalle diario de turnos para planilla de control (Anexo B/C)
 */
export interface DetalleDiarioTurno {
  fecha: Date;
  diaSemana: string; // 'LUN', 'MAR', etc.
  esFeriado: boolean;
  esDiaInhabil: boolean; // Sábado o domingo
  
  // Turno asignado
  tipoTurno?: string; // Código del turno (A, B, C, D, N, etc.)
  horarioInicio?: string; // "08:00"
  horarioFin?: string; // "20:00"
  
  // Horas por tipo
  horasDiurnas: number;
  horasNocturnas: number;
  
  // Ausencias
  horasAusencia: number;
  tipoAusencia?: 'FLA' | 'LIC_MEDICA' | 'DESC_COMP' | 'PERM_LACTANCIA' | 'PERM_ADM';
  
  // Observaciones
  observaciones?: string;
}

/**
 * Historial de compensaciones (Anexo G)
 */
export interface HistorialCompensacion {
  id: string;
  funcionarioId: string;
  mesDevolucion: number;
  anioDevolucion: number;
  horasDevueltas: number;
  mesOrigen: string; // "Marzo 2024"
  numeroResolucion?: string; // Número de resolución de descanso compensatorio
  fechaResolucion?: Date;
  saldoAnterior: number;
  saldoPosterior: number;
  creadoEn: Date;
}

/**
 * Anexo para formulario de pago de HE (Anexo A)
 */
export interface FormularioPagoHE {
  funcionarioId: string;
  mes: number;
  anio: number;
  
  // Detalle de HE a pagar
  HE_diurnas: number;
  HE_nocturnas: number;
  HE_festivas: number;
  totalHE: number;
  
  // Cálculo monetario
  valorHoraDiurna: number; // Basado en sueldo + recargo 25%
  valorHoraNocturna: number; // Basado en sueldo + recargo 50%
  valorHoraFestiva: number; // Basado en sueldo + recargo 50%
  montoTotal: number;
  
  // Firmas y aprobaciones
  firmaFuncionario?: Date;
  firmaJefeUnidad?: Date;
  firmaEncargadoPersonal?: Date;
  
  // Estado
  estado: 'BORRADOR' | 'PENDIENTE_FIRMA' | 'FIRMADO' | 'PAGADO';
  pdfGenerado?: string; // URL del PDF generado
}

/**
 * Constantes del PRO DRH 22
 */
export const CONSTANTES_PRODRH22 = {
  // Horas diarias estándar (Capítulo 2.1)
  HORAS_DIARIAS_ESTANDAR: 8.8,
  
  // Recargos por tipo de HE (Capítulo 2.2)
  RECARGO_DIURNO: 25, // 25%
  RECARGO_NOCTURNO: 50, // 50%
  RECARGO_FESTIVO: 50, // 50%
  
  // Rangos de horarios (Capítulo 2.2)
  HORA_INICIO_DIURNO: '07:00',
  HORA_FIN_DIURNO: '21:00',
  HORA_INICIO_NOCTURNO: '21:00',
  HORA_FIN_NOCTURNO: '07:00',
  
  // Sistema compensatorio por defecto (Capítulo 2.3)
  PORCENTAJE_PAGO_DEFAULT: 70, // 70% se paga
  PORCENTAJE_ACUMULACION_DEFAULT: 30, // 30% se acumula
  
  // Límites de acumulación (Capítulo 2.4)
  LIMITE_ACUMULACION_ALERTA: 10, // Alerta amarilla
  LIMITE_ACUMULACION_MAXIMO: 40, // Alerta roja
} as const;

/**
 * Estados posibles de una métrica
 */
export type EstadoMetrica = 
  | 'CALCULADO' // Calculado automáticamente
  | 'AJUSTADO' // Con ajuste manual
  | 'VALIDADO' // Validado por supervisor
  | 'APROBADO'; // Aprobado para pago/compensación

/**
 * Tipos de ausencias según PRO DRH 22
 */
export type TipoAusencia = 
  | 'FLA' // Feriado Legal Anual
  | 'LIC_MEDICA' // Licencia Médica
  | 'DESC_COMP' // Descanso Compensatorio
  | 'PERM_LACTANCIA' // Permiso de Lactancia (Anexo C)
  | 'PERM_ADM'; // Permiso Administrativo

/**
 * Tipos de deducciones de horas
 */
export type TipoDeduccion = TipoAusencia;

