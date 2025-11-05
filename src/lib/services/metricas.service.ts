import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { calculadorPRODRH22 } from '@/services/prodrh22/calculoMetricas';

/**
 * Calcula cantidad de turnos diurnos del mes
 */
function calcularTurnosDiurnos(
  asignaciones: Array<{ esNocturno?: boolean; tipoTurno?: { esNocturno?: boolean } | null }>
): number {
  return asignaciones.filter(
    a => !a.esNocturno && !a.tipoTurno?.esNocturno
  ).length;
}

/**
 * Calcula cantidad de turnos nocturnos del mes
 */
function calcularTurnosNocturnos(
  asignaciones: Array<{ esNocturno?: boolean; tipoTurno?: { esNocturno?: boolean } | null }>
): number {
  return asignaciones.filter(
    a => a.esNocturno || a.tipoTurno?.esNocturno
  ).length;
}

/**
 * Calcula días únicos trabajados en el mes
 */
function calcularDiasTrabajados(
  asignaciones: Array<{ fecha: Date }>
): number {
  const diasUnicos = new Set(
    asignaciones.map(a => a.fecha.toISOString().split('T')[0])
  );
  return diasUnicos.size;
}

/**
 * Calcula porcentaje de cobertura del mes
 */
function calcularPorcentajeCobertura(
  diasTrabajados: number,
  diasMes: number
): number {
  if (diasMes === 0) return 0;
  return Math.round((diasTrabajados / diasMes) * 100);
}

export interface MetricasFuncionario {
  funcionarioId: string;
  funcionario: {
    id: string;
    nombre: string;
    apellido: string;
    rut: string | null;
    iniciales: string;
  };
  // Métricas CORE
  SA: number;           // Saldo Anterior
  HLM: number;          // Horario Legal Mensual
  HMR: number;          // Horario Mensual Realizado (horas trabajadas efectivamente)
  compensacion: number; // Suma de descansos complementarios
  HMC: number;          // Horario Mensual Corregido (HLM - Compensación)
  HE: number;           // Horas Extras
  HCP: number;          // Horas Compensables (a pagar)
  SHE: number;          // Saldo Horas Extras (HE - HCP)
  HAC: number;          // Horas Acumuladas (siguiente mes)
  // Métricas OPCIONALES
  TD?: number;          // Turnos Diurnos
  TN?: number;          // Turnos Nocturnos
  DT?: number;          // Días Trabajados
  PC?: number;          // % Cobertura
}

export interface ResumenMetricasUnidad {
  unidadId: string;
  mes: number;
  anio: number;
  jornadaEstandar: number;
  porcentajePago: number;
  hlm: number; // Horario Legal Mensual calculado
  metricas: MetricasFuncionario[];
  totales: {
    HLM: number;
    HMR: number;  // Horario Mensual Realizado
    compensacion: number;
    HMC: number;
    HE: number;
    SA: number;
    HCP: number;
    SHE: number;
    HAC: number;
  };
}

/**
 * Calcula las métricas de todos los funcionarios de una unidad para un mes/año específico
 */
export async function calcularMetricasUnidad(
  unidadId: string,
  mes: number,
  anio: number,
  incluirOpcionales: boolean = false
): Promise<ResumenMetricasUnidad> {
  // 1. Obtener configuración de la unidad (jornada y % pago)
  let configuracion = await prisma.configuracionUnidad.findUnique({
    where: { unidadId },
  });

  // Si no existe configuración, usar valores por defecto
  if (!configuracion) {
    configuracion = {
      id: 'default',
      unidadId,
      jornadaMensualEstandar: 180,
      porcentajePagoHE: new Prisma.Decimal(70),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const jornadaEstandar = configuracion.jornadaMensualEstandar;
  const porcentajePago = Number(configuracion.porcentajePagoHE);
  const porcentajeAcumulacion = 100 - porcentajePago;

  // NUEVO: Calcular HLM usando servicio PRO DRH 22
  const diasHabiles = calculadorPRODRH22.calcularDiasHabiles(anio, mes);
  const hlm = calculadorPRODRH22.calcularHLM(diasHabiles);

  // 2. Obtener todos los funcionarios de la unidad
  const funcionarios = await prisma.usuario.findMany({
    where: {
      unidadId,
      activo: true,
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      rut: true,
      abreviatura: {
        select: {
          codigo: true,
        },
      },
    },
  });

  // 3. Obtener todos los turnos asignados del mes para esta unidad
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);

  const asignaciones = await prisma.asignacionTurno.findMany({
    where: {
      fecha: {
        gte: primerDia,
        lte: ultimoDia,
      },
      usuarioId: {
        in: funcionarios.map(f => f.id),
      },
    },
    include: {
      tipoTurno: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          rut: true,
        },
      },
    },
  });

  // 4. Obtener ajustes manuales para el mes actual (si existen)
  const ajustesManuales = await prisma.saldoHorasFuncionario.findMany({
    where: {
      funcionarioId: {
        in: funcionarios.map(f => f.id),
      },
      mes: mes,
      anio: anio,
      motivo: { not: null }, // Solo considerar ajustes manuales (con motivo)
    },
  });

  // Crear un mapa de ajustes manuales por funcionario
  const ajustesMap = new Map(
    ajustesManuales.map(a => [a.funcionarioId, Number(a.saldoAnterior)])
  );

  // 5. Obtener HAC del mes anterior para calcular SA automático (si no hay ajuste manual)
  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const anioAnterior = mes === 1 ? anio - 1 : anio;

  const saldosAnteriores = await prisma.saldoHorasFuncionario.findMany({
    where: {
      funcionarioId: {
        in: funcionarios.map(f => f.id),
      },
      mes: mesAnterior,
      anio: anioAnterior,
    },
  });

  // Crear un mapa de saldos anteriores (HAC del mes anterior)
  const saldosMap = new Map(
    saldosAnteriores.map(s => [s.funcionarioId, Number(s.horasAcumuladas)])
  );

  // 6. Calcular días del mes para métricas opcionales
  const diasMes = ultimoDia.getDate();

  // 7. Calcular métricas por funcionario usando servicio PRO DRH 22
  const metricas: MetricasFuncionario[] = [];
  let totales = { 
    HLM: 0, 
    HMR: 0,  // Horario Mensual Realizado
    compensacion: 0, 
    HMC: 0, 
    HE: 0, 
    SA: 0, 
    HCP: 0, 
    SHE: 0, 
    HAC: 0 
  };

  for (const funcionario of funcionarios) {
    // Filtrar asignaciones de este funcionario
    const asignacionesFuncionario = asignaciones.filter(
      a => a.usuarioId === funcionario.id
    );

    // NUEVO: Calcular HMR usando servicio PRO DRH 22 (con truncado Math.floor)
    const HMR = calculadorPRODRH22.calcularHMRDesdeAsignaciones(asignacionesFuncionario);

    // NUEVO: Clasificar HE por tipo usando servicio PRO DRH 22
    const { HE_total, HE_diurnas, HE_nocturnas, HE_festivas } = 
      calculadorPRODRH22.clasificarHEPorTipo(
        asignacionesFuncionario,
        HMR,
        hlm
      );

    // Obtener SA (Saldo Anterior)
    // Prioridad: 1. Ajuste manual del mes actual, 2. HAC del mes anterior
    const ajusteManual = ajustesMap.get(funcionario.id);
    const SA = ajusteManual !== undefined 
      ? ajusteManual 
      : (saldosMap.get(funcionario.id) || 0);

    // Calcular descansos complementarios (DC) del funcionario
    const codigosDescanso = ['DA', 'DV', 'DC', 'DN', 'DS'];
    const horasDescansoComp = asignacionesFuncionario
      .filter(a => codigosDescanso.includes(a.tipoTurno?.codigo || ''))
      .reduce((sum, a) => sum + (a.tipoTurno?.duracionHoras || 0), 0);

    // NUEVO: Calcular métricas completas usando servicio PRO DRH 22
    const metricasCompletas = calculadorPRODRH22.calcularMetricasCompletas({
      funcionarioId: funcionario.id,
      mes,
      anio,
      HMR,  // Horario Mensual Realizado
      HE_diurnas,
      HE_nocturnas,
      HE_festivas,
      horasDescansoComp,  // ← NUEVO: Pasar DC calculados
      saldoAnterior: SA,
      porcentajePago,
      porcentajeAcumulacion
    });

    // Extraer valores para compatibilidad
    const HE = metricasCompletas.HE_total;
    const HCP = metricasCompletas.horasPago;
    const HAC = metricasCompletas.saldoSiguiente;

    // Calcular las 3 métricas nuevas
    const compensacion = metricasCompletas.horasDescansoComp || 0;
    const HMC = hlm - compensacion; // Horario Mensual Corregido
    const SHE = HE - HCP; // Saldo Horas Extras

    const metricaFuncionario: MetricasFuncionario = {
      funcionarioId: funcionario.id,
      funcionario: {
        id: funcionario.id,
        nombre: funcionario.nombre,
        apellido: funcionario.apellido,
        rut: funcionario.rut,
        iniciales: funcionario.abreviatura?.codigo || '',
      },
      SA: Number(SA.toFixed(2)),
      HLM: Number(hlm.toFixed(2)),
      HMR: HMR,  // Entero puro - ya viene de Math.floor()
      compensacion: Number(compensacion.toFixed(2)),
      HMC: Number(HMC.toFixed(2)),
      HE: Number(HE.toFixed(2)),
      HCP: Number(HCP.toFixed(2)),
      SHE: Number(SHE.toFixed(2)),
      HAC: Number(HAC.toFixed(2)),
    };

    // Calcular métricas opcionales si se solicitan
    if (incluirOpcionales) {
      metricaFuncionario.TD = calcularTurnosDiurnos(asignacionesFuncionario);
      metricaFuncionario.TN = calcularTurnosNocturnos(asignacionesFuncionario);
      metricaFuncionario.DT = calcularDiasTrabajados(asignacionesFuncionario);
      metricaFuncionario.PC = calcularPorcentajeCobertura(
        metricaFuncionario.DT,
        diasMes
      );
    }

    metricas.push(metricaFuncionario);

    // Acumular totales
    totales.HLM += hlm;
    totales.HMR += metricaFuncionario.HMR;
    totales.compensacion += metricaFuncionario.compensacion;
    totales.HMC += metricaFuncionario.HMC;
    totales.HE += metricaFuncionario.HE;
    totales.SA += metricaFuncionario.SA;
    totales.HCP += metricaFuncionario.HCP;
    totales.SHE += metricaFuncionario.SHE;
    totales.HAC += metricaFuncionario.HAC;
  }

  // 8. Guardar métricas calculadas en BD para trazabilidad histórica
  // Esto permite que HAC de un mes se convierta en SA del siguiente mes
  await prisma.$transaction(
    metricas.map((metrica) =>
      prisma.saldoHorasFuncionario.upsert({
        where: {
          funcionarioId_mes_anio: {
            funcionarioId: metrica.funcionarioId,
            mes,
            anio,
          },
        },
        update: {
          horasTrabajadas: metrica.HMR,  // HMR → horasTrabajadas en BD
          horasExtras: metrica.HE,
          horasCompensables: metrica.HCP,
          horasAcumuladas: metrica.HAC,
          // NO sobrescribir saldoAnterior si hay ajuste manual (motivo presente)
          ...(ajustesMap.has(metrica.funcionarioId) ? {} : { saldoAnterior: metrica.SA }),
        },
        create: {
          funcionarioId: metrica.funcionarioId,
          mes,
          anio,
          saldoAnterior: metrica.SA,
          horasTrabajadas: metrica.HMR,  // HMR → horasTrabajadas en BD
          horasExtras: metrica.HE,
          horasCompensables: metrica.HCP,
          horasAcumuladas: metrica.HAC,
        },
      })
    )
  );

  // Redondear totales
  totales = {
    HLM: Number(totales.HLM.toFixed(2)),
    HMR: Number(totales.HMR.toFixed(2)),  // Horario Mensual Realizado
    compensacion: Number(totales.compensacion.toFixed(2)),
    HMC: Number(totales.HMC.toFixed(2)),
    HE: Number(totales.HE.toFixed(2)),
    SA: Number(totales.SA.toFixed(2)),
    HCP: Number(totales.HCP.toFixed(2)),
    SHE: Number(totales.SHE.toFixed(2)),
    HAC: Number(totales.HAC.toFixed(2)),
  };

  return {
    unidadId,
    mes,
    anio,
    jornadaEstandar,
    porcentajePago,
    hlm,
    metricas,
    totales,
  };
}
