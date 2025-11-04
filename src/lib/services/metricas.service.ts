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
  HT: number;           // Horas Trabajadas
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
    HT: number;
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
    HT: 0, 
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

    // NUEVO: Calcular HT usando servicio PRO DRH 22 (con truncado Math.floor)
    const HT = calculadorPRODRH22.calcularHTDesdeAsignaciones(asignacionesFuncionario);

    // NUEVO: Clasificar HE por tipo usando servicio PRO DRH 22
    const { HE_total, HE_diurnas, HE_nocturnas, HE_festivas } = 
      calculadorPRODRH22.clasificarHEPorTipo(
        asignacionesFuncionario,
        HT,
        hlm
      );

    // Obtener SA (Saldo Anterior)
    // Prioridad: 1. Ajuste manual del mes actual, 2. HAC del mes anterior
    const ajusteManual = ajustesMap.get(funcionario.id);
    const SA = ajusteManual !== undefined 
      ? ajusteManual 
      : (saldosMap.get(funcionario.id) || 0);

    // NUEVO: Calcular métricas completas usando servicio PRO DRH 22
    const metricasCompletas = calculadorPRODRH22.calcularMetricasCompletas({
      funcionarioId: funcionario.id,
      mes,
      anio,
      HT,
      HE_diurnas,
      HE_nocturnas,
      HE_festivas,
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
      HT: HT,  // Entero puro - ya viene de Math.floor()
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
    totales.HT += metricaFuncionario.HT;
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
          horasTrabajadas: metrica.HT,
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
          horasTrabajadas: metrica.HT,
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
    HT: Number(totales.HT.toFixed(2)),
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
