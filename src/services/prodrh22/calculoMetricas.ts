// src/services/prodrh22/calculoMetricas.ts
/**
 * Servicio de cálculo de métricas según PRO DRH 22
 * Procedimiento de Cálculo de Horas Extraordinarias y Sistema Compensatorio
 * DGAC - Dirección General de Aeronáutica Civil
 */

import { 
  MetricasPRODRH22, 
  ConfiguracionUnidadPRODRH22,
  CONSTANTES_PRODRH22 
} from '@/types/prodrh22/metricas.types';

/**
 * Clase para cálculo centralizado de métricas PRO DRH 22
 */
export class CalculadorMetricasPRODRH22 {
  
  /**
   * Calcula el Horario Legal Mensual (HLM)
   * Basado en PRO DRH 22 Capítulo 3.1
   * 
   * @param diasHabiles - Número de días hábiles del mes (Lun-Vie)
   * @returns HLM en horas (diasHabiles × 8.8)
   * 
   * @example
   * calcularHLM(22) // Noviembre 2024: 193.6 horas
   * calcularHLM(23) // Octubre 2025: 202.4 horas
   */
  calcularHLM(diasHabiles: number): number {
    if (diasHabiles < 0 || diasHabiles > 31) {
      throw new Error('Días hábiles debe estar entre 0 y 31');
    }
    
    // HLM = días hábiles × 8.8 horas diarias estándar
    const hlm = diasHabiles * CONSTANTES_PRODRH22.HORAS_DIARIAS_ESTANDAR;
    
    // Redondear a 1 decimal
    return Math.round(hlm * 10) / 10;
  }

  /**
   * Calcula los días hábiles de un mes específico
   * Días hábiles = Lunes a Viernes, excluyendo festivos
   * 
   * @param anio - Año (ej: 2024)
   * @param mes - Mes (1-12)
   * @param festivos - Array opcional de fechas festivas a excluir
   * @returns Número de días hábiles del mes
   * 
   * @example
   * calcularDiasHabiles(2024, 11) // Noviembre 2024: 21 días hábiles
   * calcularDiasHabiles(2025, 10) // Octubre 2025: 23 días hábiles
   */
  calcularDiasHabiles(anio: number, mes: number, festivos?: Date[]): number {
    if (mes < 1 || mes > 12) {
      throw new Error('Mes debe estar entre 1 y 12');
    }
    
    if (anio < 2020 || anio > 2100) {
      throw new Error('Año debe estar entre 2020 y 2100');
    }
    
    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);
    const totalDias = ultimoDia.getDate();
    
    // Crear set de festivos para búsqueda rápida (normalizar a string YYYY-MM-DD)
    const festivosSet = new Set(
      (festivos || []).map(f => {
        const fecha = new Date(f);
        return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      })
    );
    
    let diasHabiles = 0;
    
    for (let dia = 1; dia <= totalDias; dia++) {
      const fecha = new Date(anio, mes - 1, dia);
      const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
      
      // Verificar si es día hábil (Lunes a Viernes = 1-5)
      const esDiaHabil = diaSemana >= 1 && diaSemana <= 5;
      
      if (!esDiaHabil) {
        continue; // Saltar sábados y domingos
      }
      
      // Verificar si es festivo
      const fechaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const esFestivo = festivosSet.has(fechaStr);
      
      if (esFestivo) {
        continue; // Saltar festivos
      }
      
      diasHabiles++;
    }
    
    return diasHabiles;
  }

  /**
   * Calcula HT (Horas Trabajadas) desde array de asignaciones
   * Suma todas las duraciones y aplica truncado según PRO DRH 22
   * 
   * @param asignaciones - Array de asignaciones de turno
   * @returns HT truncado a enteros (sin decimales)
   * 
   * @example
   * calcularHTDesdeAsignaciones([{duracion: 9.5}, {duracion: 12.3}])
   * // Suma: 21.8 → Truncado: 21h
   */
  calcularHTDesdeAsignaciones(
    asignaciones: Array<{ duracion?: number | null; tipoTurno?: { duracionHoras?: number } | null }>
  ): number {
    const suma = asignaciones.reduce((total, asignacion) => {
      const duracion = asignacion.duracion || asignacion.tipoTurno?.duracionHoras || 0;
      return total + duracion;
    }, 0);
    
    // PRO DRH 22: Truncar HT mensual (sin decimales)
    return Math.floor(suma);
  }

  /**
   * Clasifica horas extraordinarias por tipo según características del turno
   * PRO DRH 22 distingue entre HE diurnas (recargo 25%), nocturnas (50%) y festivas (50%)
   * 
   * @param asignaciones - Array de asignaciones con campos esNocturno, esDiaInhabil, esFestivo
   * @param HT - Horas trabajadas totales (truncadas)
   * @param HLM - Horario legal mensual
   * @returns Objeto con HE clasificadas por tipo
   * 
   * @example
   * clasificarHEPorTipo(asignaciones, 230, 202.4)
   * // HE_total: 27.6h
   * // Distribuye según proporción de turnos diurnos/nocturnos/festivos
   */
  clasificarHEPorTipo(
    asignaciones: Array<{ 
      duracion?: number | null; 
      tipoTurno?: { duracionHoras?: number } | null;
      esNocturno?: boolean;
      esDiaInhabil?: boolean;
      esFestivo?: boolean;
    }>,
    HT: number,
    HLM: number
  ): {
    HE_diurnas: number;
    HE_nocturnas: number;
    HE_festivas: number;
    HE_total: number;
  } {
    // Solo hay HE si HT > HLM
    const HE_total = Math.max(0, HT - HLM);
    
    if (HE_total === 0) {
      return { HE_diurnas: 0, HE_nocturnas: 0, HE_festivas: 0, HE_total: 0 };
    }
    
    // Clasificar turnos por tipo
    let horasDiurnas = 0;
    let horasNocturnas = 0;
    let horasFestivas = 0;
    
    for (const asignacion of asignaciones) {
      const duracion = asignacion.duracion || asignacion.tipoTurno?.duracionHoras || 0;
      
      if (asignacion.esDiaInhabil || asignacion.esFestivo) {
        horasFestivas += duracion;
      } else if (asignacion.esNocturno) {
        horasNocturnas += duracion;
      } else {
        horasDiurnas += duracion;
      }
    }
    
    // Calcular proporción de HE por tipo
    const totalHoras = horasDiurnas + horasNocturnas + horasFestivas;
    const proporcionDiurnas = totalHoras > 0 ? horasDiurnas / totalHoras : 0;
    const proporcionNocturnas = totalHoras > 0 ? horasNocturnas / totalHoras : 0;
    const proporcionFestivas = totalHoras > 0 ? horasFestivas / totalHoras : 0;
    
    return {
      HE_diurnas: Math.round(HE_total * proporcionDiurnas * 10) / 10,
      HE_nocturnas: Math.round(HE_total * proporcionNocturnas * 10) / 10,
      HE_festivas: Math.round(HE_total * proporcionFestivas * 10) / 10,
      HE_total: Math.round(HE_total * 10) / 10
    };
  }

  /**
   * Calcula las compensaciones monetarias por horas extraordinarias
   * Basado en PRO DRH 22 Capítulo 1.7
   * 
   * @param HE_diurnas - Horas extras diurnas (07:00-21:00)
   * @param HE_nocturnas - Horas extras nocturnas (21:00-07:00)
   * @param HE_festivas - Horas extras en días festivos
   * @returns Factor de compensación total (no monto en pesos, sino factor de horas equivalentes)
   * 
   * @example
   * calcularCompensaciones(10, 5, 3)
   * // Diurnas: 10 × 1.25 = 12.5
   * // Nocturnas: 5 × 1.50 = 7.5
   * // Festivas: 3 × 1.50 = 4.5
   * // Total: 24.5 horas equivalentes con recargo
   */
  calcularCompensaciones(
    HE_diurnas: number, 
    HE_nocturnas: number, 
    HE_festivas: number
  ): number {
    if (HE_diurnas < 0 || HE_nocturnas < 0 || HE_festivas < 0) {
      throw new Error('Las horas extraordinarias no pueden ser negativas');
    }
    
    // Aplicar recargos según PRO DRH 22 Capítulo 1.7
    const compensacionDiurna = HE_diurnas * (1 + CONSTANTES_PRODRH22.RECARGO_DIURNO / 100);
    const compensacionNocturna = HE_nocturnas * (1 + CONSTANTES_PRODRH22.RECARGO_NOCTURNO / 100);
    const compensacionFestiva = HE_festivas * (1 + CONSTANTES_PRODRH22.RECARGO_FESTIVO / 100);
    
    // Suma total de compensaciones
    const compensacionTotal = compensacionDiurna + compensacionNocturna + compensacionFestiva;
    
    // Redondear a 2 decimales
    return Math.round(compensacionTotal * 100) / 100;
  }

  /**
   * Calcula el balance entre HT y HLM según PRO DRH 22
   * Balance positivo (+) = horas extraordinarias a compensar
   * Balance negativo (-) = horas faltantes (posible descuento)
   * 
   * @param HT - Horas Trabajadas (horas reales trabajadas en el mes)
   * @param HLM - Horario Legal Mensual (horas obligatorias del mes)
   * @returns Balance en horas (HT - HLM)
   * 
   * @example
   * calcularBalanceHLM(230.0, 202.4) // +27.6h (horas extras a pagar)
   * calcularBalanceHLM(180.0, 202.4) // -22.4h (horas faltantes)
   * calcularBalanceHLM(202.4, 202.4) // 0.0h (jornada exacta)
   */
  calcularBalanceHLM(HT: number, HLM: number): number {
    if (HLM < 0 || HT < 0) {
      throw new Error('HLM y HT no pueden ser negativos');
    }
    
    const balance = HT - HLM;
    
    // Redondear a 1 decimal
    return Math.round(balance * 10) / 10;
  }

  /**
   * Calcula las horas a pagar según el porcentaje de pago configurado
   * Basado en PRO DRH 22 Capítulo 3.6
   * 
   * @param HE_total - Total de horas extraordinarias
   * @param porcentajePago - Porcentaje que se paga (ej: 70)
   * @returns Horas a pagar
   */
  calcularHorasPago(HE_total: number, porcentajePago: number): number {
    if (HE_total < 0) {
      throw new Error('HE_total no puede ser negativo');
    }
    
    if (porcentajePago < 0 || porcentajePago > 100) {
      throw new Error('Porcentaje de pago debe estar entre 0 y 100');
    }
    
    const horasPago = (HE_total * porcentajePago) / 100;
    
    // Redondear a 2 decimales
    return Math.round(horasPago * 100) / 100;
  }

  /**
   * Calcula las horas a acumular para el siguiente mes
   * Basado en PRO DRH 22 Capítulo 3.6
   * 
   * @param HE_total - Total de horas extraordinarias
   * @param porcentajeAcumulacion - Porcentaje que se acumula (ej: 30)
   * @param saldoAnterior - Saldo acumulado del mes anterior
   * @returns Horas acumuladas para siguiente mes
   */
  calcularHorasAcumuladas(
    HE_total: number, 
    porcentajeAcumulacion: number,
    saldoAnterior: number
  ): number {
    if (HE_total < 0) {
      throw new Error('HE_total no puede ser negativo');
    }
    
    if (porcentajeAcumulacion < 0 || porcentajeAcumulacion > 100) {
      throw new Error('Porcentaje de acumulación debe estar entre 0 y 100');
    }
    
    const horasNuevas = (HE_total * porcentajeAcumulacion) / 100;
    const horasAcumuladas = horasNuevas + saldoAnterior;
    
    // Redondear a 2 decimales
    return Math.round(horasAcumuladas * 100) / 100;
  }

  /**
   * Calcula las deducciones totales de horas por ausencias
   * Basado en PRO DRH 22 Capítulo 3.4
   * 
   * @param diasFeriado - Días de feriado legal
   * @param diasLicencia - Días de licencia médica
   * @param horasPermisoAdmin - Horas de permisos administrativos
   * @param horasDescansoComp - Horas de descanso compensatorio
   * @param horasPermisoLactancia - Horas de permiso de lactancia (opcional)
   * @returns Total de horas a deducir
   */
  calcularDeducciones(
    diasFeriado: number,
    diasLicencia: number,
    horasPermisoAdmin: number,
    horasDescansoComp: number,
    horasPermisoLactancia: number = 0
  ): number {
    // Convertir días a horas (usando 8.8 horas por día)
    const horasFeriado = diasFeriado * CONSTANTES_PRODRH22.HORAS_DIARIAS_ESTANDAR;
    const horasLicencia = diasLicencia * CONSTANTES_PRODRH22.HORAS_DIARIAS_ESTANDAR;
    
    const totalDeducciones = 
      horasFeriado + 
      horasLicencia + 
      horasPermisoAdmin + 
      horasDescansoComp + 
      horasPermisoLactancia;
    
    // Redondear a 2 decimales
    return Math.round(totalDeducciones * 100) / 100;
  }

  /**
   * Valida si el saldo acumulado requiere alerta
   * Basado en límites configurables de la unidad
   * 
   * @param horasAcumuladas - Horas acumuladas del funcionario
   * @param limiteAlerta - Límite que genera alerta amarilla (default: 10h)
   * @param limiteMaximo - Límite máximo permitido (default: 40h)
   * @returns Nivel de alerta: null | 'ALERTA' | 'CRITICO'
   */
  validarLimitesAcumulacion(
    horasAcumuladas: number,
    limiteAlerta: number = CONSTANTES_PRODRH22.LIMITE_ACUMULACION_ALERTA,
    limiteMaximo: number = CONSTANTES_PRODRH22.LIMITE_ACUMULACION_MAXIMO
  ): null | 'ALERTA' | 'CRITICO' {
    if (horasAcumuladas < 0) {
      return 'CRITICO'; // Saldo negativo
    }
    
    if (horasAcumuladas >= limiteMaximo) {
      return 'CRITICO'; // Supera límite máximo
    }
    
    if (horasAcumuladas >= limiteAlerta) {
      return 'ALERTA'; // Supera límite de alerta
    }
    
    return null; // Sin alertas
  }

  /**
   * Calcula todas las métricas de un funcionario para un mes específico
   * 
   * @param datos - Datos de entrada para el cálculo
   * @returns Métricas completas según PRO DRH 22
   */
  calcularMetricasCompletas(datos: {
    funcionarioId: string;
    mes: number;
    anio: number;
    HT: number;
    HE_diurnas: number;
    HE_nocturnas: number;
    HE_festivas: number;
    diasFeriado?: number;
    diasLicencia?: number;
    horasPermisoAdmin?: number;
    horasDescansoComp?: number;
    horasPermisoLactancia?: number;
    saldoAnterior?: number;
    porcentajePago?: number;
    porcentajeAcumulacion?: number;
    festivos?: Date[];
  }): MetricasPRODRH22 {
    // Calcular días hábiles y HLM
    const diasHabiles = this.calcularDiasHabiles(datos.anio, datos.mes, datos.festivos);
    const HLM = this.calcularHLM(diasHabiles);
    
    // Calcular deducciones
    const deducciones = this.calcularDeducciones(
      datos.diasFeriado || 0,
      datos.diasLicencia || 0,
      datos.horasPermisoAdmin || 0,
      datos.horasDescansoComp || 0,
      datos.horasPermisoLactancia || 0
    );
    
    // HT ajustado (después de deducciones)
    const HT_ajustado = datos.HT - deducciones;
    
    // Balance HLM (HT primero, HLM segundo - parámetros corregidos)
    const balanceHLM = this.calcularBalanceHLM(HT_ajustado, HLM);
    
    // HE total (solo si HT_ajustado > HLM)
    const HE_total = Math.max(0, HT_ajustado - HLM);
    
    // Compensación total (factor de horas equivalentes con recargo)
    const compensacionTotal = this.calcularCompensaciones(
      datos.HE_diurnas,
      datos.HE_nocturnas,
      datos.HE_festivas
    );
    
    // Sistema compensatorio
    const porcentajePago = datos.porcentajePago ?? CONSTANTES_PRODRH22.PORCENTAJE_PAGO_DEFAULT;
    const porcentajeAcumulacion = datos.porcentajeAcumulacion ?? CONSTANTES_PRODRH22.PORCENTAJE_ACUMULACION_DEFAULT;
    
    const horasPago = this.calcularHorasPago(HE_total, porcentajePago);
    const horasAcumuladas = this.calcularHorasAcumuladas(
      HE_total,
      porcentajeAcumulacion,
      datos.saldoAnterior || 0
    );
    
    // Validar si requiere ajuste
    const nivelAlerta = this.validarLimitesAcumulacion(horasAcumuladas);
    const requiereAjuste = nivelAlerta === 'CRITICO' || balanceHLM < -50;
    
    return {
      funcionarioId: datos.funcionarioId,
      mes: datos.mes,
      anio: datos.anio,
      diasHabiles,
      HLM,
      HT: datos.HT,
      HE_diurnas: datos.HE_diurnas,
      HE_nocturnas: datos.HE_nocturnas,
      HE_festivas: datos.HE_festivas,
      balanceHLM,
      compensacionTotal,
      diasFeriado: datos.diasFeriado || 0,
      diasLicencia: datos.diasLicencia || 0,
      horasPermisoAdmin: datos.horasPermisoAdmin || 0,
      horasDescansoComp: datos.horasDescansoComp || 0,
      horasPermisoLactancia: datos.horasPermisoLactancia,
      HT_ajustado,
      HE_total,
      porcentajePago,
      porcentajeAcumulacion,
      horasPago,
      horasAcumuladas,
      saldoAnterior: datos.saldoAnterior || 0,
      saldoSiguiente: horasAcumuladas,
      requiereAjuste,
      estado: 'CALCULADO',
    };
  }
}

/**
 * Instancia singleton del calculador
 * Usar esta instancia en toda la aplicación para consistencia
 */
export const calculadorPRODRH22 = new CalculadorMetricasPRODRH22();

/**
 * Funciones helper exportadas para uso directo
 */
export const {
  calcularHLM,
  calcularDiasHabiles,
  calcularHTDesdeAsignaciones,
  clasificarHEPorTipo,
  calcularCompensaciones,
  calcularBalanceHLM,
} = calculadorPRODRH22;

