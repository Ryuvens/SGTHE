import { prisma } from '@/lib/prisma';

export interface MetricasFuncionario {
  funcionarioId: string;
  funcionario: {
    id: string;
    nombre: string;
    apellido: string;
    rut: string;
  };
  // Métricas CORE
  HT: number;  // Horas Trabajadas
  HE: number;  // Horas Extras
  SA: number;  // Saldo Anterior
  HCP: number; // Horas Compensables (a pagar)
  HAC: number; // Horas Acumuladas (siguiente mes)
  // Métricas OPCIONALES
  TD?: number;  // Turnos Diurnos
  TN?: number;  // Turnos Nocturnos
  DT?: number;  // Días Trabajados
  PC?: number;  // % Cobertura
}

export interface ResumenMetricasUnidad {
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
      porcentajePagoHE: 70,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const jornadaEstandar = configuracion.jornadaMensualEstandar;
  const porcentajePago = Number(configuracion.porcentajePagoHE);

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

  // 6. Calcular métricas por funcionario
  const metricas: MetricasFuncionario[] = [];
  let totales = { HT: 0, HE: 0, SA: 0, HCP: 0, HAC: 0 };

  for (const funcionario of funcionarios) {
    // Filtrar asignaciones de este funcionario
    const asignacionesFuncionario = asignaciones.filter(
      a => a.usuarioId === funcionario.id
    );

    // Calcular HT (Horas Trabajadas)
    // Usar duracion de asignacion si existe, sino duracionHoras del tipoTurno
    const HT = asignacionesFuncionario.reduce((total, asignacion) => {
      const duracion = asignacion.duracion 
        || asignacion.tipoTurno?.duracionHoras 
        || 0;
      return total + duracion;
    }, 0);

    // Calcular HE (Horas Extras)
    const HE = Math.max(0, HT - jornadaEstandar);

    // Obtener SA (Saldo Anterior)
    // Prioridad: 1. Ajuste manual del mes actual, 2. HAC del mes anterior
    const ajusteManual = ajustesMap.get(funcionario.id);
    const SA = ajusteManual !== undefined 
      ? ajusteManual 
      : (saldosMap.get(funcionario.id) || 0);

    // Calcular HCP (Horas Compensables - a pagar)
    const HCP = (HE * porcentajePago) / 100;

    // Calcular HAC (Horas Acumuladas - siguiente mes)
    const HAC = HE - HCP + SA;

    const metricaFuncionario: MetricasFuncionario = {
      funcionarioId: funcionario.id,
      funcionario: {
        id: funcionario.id,
        nombre: funcionario.nombre,
        apellido: funcionario.apellido,
        rut: funcionario.rut || '',
      },
      HT: Number(HT.toFixed(2)),
      HE: Number(HE.toFixed(2)),
      SA: Number(SA.toFixed(2)),
      HCP: Number(HCP.toFixed(2)),
      HAC: Number(HAC.toFixed(2)),
    };

    // Calcular métricas opcionales si se solicitan
    if (incluirOpcionales) {
      // TD (Turnos Diurnos) - basado en esNocturno o codigo del tipoTurno
      metricaFuncionario.TD = asignacionesFuncionario.filter(
        a => !a.esNocturno && !a.tipoTurno?.esNocturno && 
             (a.tipoTurno?.codigo === 'D' || !a.tipoTurno?.codigo.includes('N'))
      ).length;

      // TN (Turnos Nocturnos)
      metricaFuncionario.TN = asignacionesFuncionario.filter(
        a => a.esNocturno || a.tipoTurno?.esNocturno || 
             a.tipoTurno?.codigo === 'N'
      ).length;

      // DT (Días Trabajados)
      const diasUnicos = new Set(
        asignacionesFuncionario.map(a => a.fecha.toISOString().split('T')[0])
      );
      metricaFuncionario.DT = diasUnicos.size;

      // PC (% Cobertura)
      const diasMes = ultimoDia.getDate();
      metricaFuncionario.PC = Number(((metricaFuncionario.DT / diasMes) * 100).toFixed(2));
    }

    metricas.push(metricaFuncionario);

    // Acumular totales
    totales.HT += HT;
    totales.HE += HE;
    totales.SA += SA;
    totales.HCP += HCP;
    totales.HAC += HAC;
  }

  // Redondear totales
  totales = {
    HT: Number(totales.HT.toFixed(2)),
    HE: Number(totales.HE.toFixed(2)),
    SA: Number(totales.SA.toFixed(2)),
    HCP: Number(totales.HCP.toFixed(2)),
    HAC: Number(totales.HAC.toFixed(2)),
  };

  return {
    unidadId,
    mes,
    anio,
    jornadaEstandar,
    porcentajePago,
    metricas,
    totales,
  };
}
