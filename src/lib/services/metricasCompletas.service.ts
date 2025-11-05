import { prisma } from '@/lib/prisma';

// ═══════════════════════════════════════════════════════════
// TIPOS Y CONSTANTES
// ═══════════════════════════════════════════════════════════

interface CalcularMetricasParams {
  publicacionId: string;
  usuarioId: string;
  mes: number;
  anio: number;
}

export interface MetricasCalculadas {
  hmr: number;           // Horario Mensual Realizado
  hlm: number;           // Horario Legal Mensual (ajustado por ausencias)
  hmc: number;           // Horario Mensual Corregido
  ponderacion: number;   // Ponderación de horas nocturnas/inhábiles
  totalHoras: number;    // Total horas ponderadas
  hdf: number;           // Horas Diurnas Faltantes
  he: number;            // Horas Extras Ponderadas
  
  // Desgloses para análisis
  horasDiurnas: number;
  horasNocturnas: number;
  horasSabDomFest: number;
  horasDescansoComp: number;
  diasAusenciaLM_FLA: number;
  horasPermisos: number;
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN AUXILIAR: Calcular días hábiles del mes
// ═══════════════════════════════════════════════════════════

function calcularDiasHabilesMes(mes: number, anio: number): number {
  let dias = 0;
  const diasEnMes = new Date(anio, mes, 0).getDate();
  
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = new Date(anio, mes - 1, dia);
    const dayOfWeek = fecha.getDay();
    // Lunes a Viernes (1-5)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dias++;
    }
  }
  
  return dias;
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL: Calcular métricas mensuales
// Implementa fórmulas PRO DRH 22 validadas
// ═══════════════════════════════════════════════════════════

export async function calcularMetricasMensuales(
  params: CalcularMetricasParams
): Promise<MetricasCalculadas> {
  const { publicacionId, usuarioId, mes, anio } = params;

  // ═══════════════════════════════════════════════════════════
  // PASO 1: Obtener asignaciones del funcionario
  // ═══════════════════════════════════════════════════════════

  const asignaciones = await prisma.asignacionTurno.findMany({
    where: {
      publicacionId,
      usuarioId,
    },
    include: {
      tipoTurno: {
        select: {
          codigo: true,
          devolucionHoras: true,
          horasDiurnas: true,
          horasNocturnas: true,
          horasSabDomFest: true,
          esNocturno: true,
          esDiaInhabil: true,
        },
      },
    },
  });

  // ═══════════════════════════════════════════════════════════
  // PASO 2: Obtener ausencias del funcionario en el mes
  // ═══════════════════════════════════════════════════════════

  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);

  const ausencias = await prisma.ausencia.findMany({
    where: {
      usuarioId,
      publicacionId,
      OR: [
        // Ausencias por días (LM, FLA)
        {
          fechaInicio: {
            gte: primerDia,
            lte: ultimoDia,
          },
        },
        // Ausencias por fecha única (PA, PG, OTRO)
        {
          fecha: {
            gte: primerDia,
            lte: ultimoDia,
          },
        },
      ],
    },
  });

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO 1: HMR (Horario Mensual Realizado)
  // Fórmula: HMR = Σ(Horas Diurnas + Horas Nocturnas + Horas Sáb/Dom/Fest)
  // Nota: Suma BRUTA y NO ponderada
  // ═══════════════════════════════════════════════════════════

  let sumaHorasDiurnas = 0;
  let sumaHorasNocturnas = 0;
  let sumaHorasSabDomFest = 0;

  for (const asignacion of asignaciones) {
    const turno = asignacion.tipoTurno;
    
    sumaHorasDiurnas += turno.horasDiurnas || 0;
    sumaHorasNocturnas += turno.horasNocturnas || 0;
    sumaHorasSabDomFest += turno.horasSabDomFest || 0;
  }

  // HMR = Suma bruta (no ponderada) - TRUNCAR
  const hmr = Math.floor(sumaHorasDiurnas + sumaHorasNocturnas + sumaHorasSabDomFest);

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO 2: HLM ajustado por ausencias (LM y FLA)
  // Fórmula: HLM = (Días hábiles - Días LM/FLA) × 8.8 - TRUNCAR
  // ═══════════════════════════════════════════════════════════

  const diasHabilesMes = calcularDiasHabilesMes(mes, anio);
  
  // Descontar días de LM y FLA
  const diasAusenciaLM_FLA = ausencias
    .filter((a) => ['LM', 'FLA'].includes(a.tipo))
    .reduce((sum, a) => sum + (a.diasHabiles || 0), 0);

  const diasHabilesEfectivos = Math.max(0, diasHabilesMes - diasAusenciaLM_FLA);
  const hlm = Math.floor(diasHabilesEfectivos * 8.8);

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO 3: DC (Descansos Complementarios)
  // Fórmula: DC = Σ(devolucionHoras de todos los turnos)
  // ═══════════════════════════════════════════════════════════

  const horasDescansoComp = asignaciones.reduce(
    (sum, asig) => sum + (asig.tipoTurno.devolucionHoras || 0),
    0
  );

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO 4: Horas de permisos (PA, PG, OTRO)
  // Fórmula: Σ(horas de PA + PG + OTRO)
  // ═══════════════════════════════════════════════════════════

  const horasPermisos = ausencias
    .filter((a) => ['PA', 'PG', 'OTRO'].includes(a.tipo))
    .reduce((sum, a) => sum + (a.horas || 0), 0);

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO 5: HMC (Horario Mensual Corregido)
  // Fórmula: HMC = HLM - DC - PA - PG - OTRO - TRUNCAR
  // ═══════════════════════════════════════════════════════════

  const hmc = Math.floor(hlm - horasDescansoComp - horasPermisos);

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO 6: PONDERACIÓN
  // Fórmula:
  //   SI HMC < HMR → PONDERACIÓN = (Σ Nocturnas + Inhábiles) × 0.5
  //   SI HMC ≥ HMR → PONDERACIÓN = (Σ Nocturnas + Inhábiles) × 1.5
  // Resultado: TRUNCAR
  // ═══════════════════════════════════════════════════════════

  const horasNocturnasInhabiles = sumaHorasNocturnas + sumaHorasSabDomFest;

  let ponderacion: number;
  if (hmc < hmr) {
    // Factor 0.5: Funcionario trabajó más de lo obligado
    // Solo se compensa el 50% extra de las horas nocturnas/inhábiles
    ponderacion = Math.floor(horasNocturnasInhabiles * 0.5);
  } else {
    // Factor 1.5: Funcionario cumplió o excedió la jornada
    // Valor completo de la hora más 50% de recargo
    ponderacion = Math.floor(horasNocturnasInhabiles * 1.5);
  }

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO 7: TOTAL HORAS (Ponderadas)
  // Fórmula:
  //   SI HMC ≥ HMR → TOTAL_HORAS = HMR + PONDERACIÓN
  //   SI HMC < HMR → TOTAL_HORAS = 0
  // Resultado: TRUNCAR
  // ═══════════════════════════════════════════════════════════

  let totalHoras: number;
  if (hmc >= hmr) {
    totalHoras = Math.floor(hmr + ponderacion);
  } else {
    // No se generan horas compensables si no se cumplió la jornada mínima
    totalHoras = 0;
  }

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO 8: HDF (Horas Diurnas Faltantes)
  // Fórmula:
  //   SI HMC < HMR → HDF = HMC - (Σ Horas Diurnas trabajadas)
  //   SI HMC ≥ HMR → HDF = 0
  // Resultado: TRUNCAR
  // ═══════════════════════════════════════════════════════════

  let hdf: number;
  if (hmc < hmr) {
    hdf = Math.floor(hmc - sumaHorasDiurnas);
  } else {
    hdf = 0;
  }

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO 9: HE (Horas Extras Ponderadas)
  // Fórmula:
  //   SI HMC < HMR → HE = PONDERACIÓN - HDF
  //   SI HMC ≥ HMR → HE = TOTAL_HORAS - HMC
  // Resultado: TRUNCAR
  // ═══════════════════════════════════════════════════════════

  let he: number;
  if (hmc < hmr) {
    he = Math.floor(ponderacion - hdf);
  } else {
    he = Math.floor(totalHoras - hmc);
  }

  // ═══════════════════════════════════════════════════════════
  // RETORNAR MÉTRICAS CALCULADAS
  // ═══════════════════════════════════════════════════════════

  return {
    hmr,
    hlm,
    hmc,
    ponderacion,
    totalHoras,
    hdf,
    he,
    
    // Desgloses
    horasDiurnas: Math.floor(sumaHorasDiurnas),
    horasNocturnas: Math.floor(sumaHorasNocturnas),
    horasSabDomFest: Math.floor(sumaHorasSabDomFest),
    horasDescansoComp: Math.floor(horasDescansoComp),
    diasAusenciaLM_FLA,
    horasPermisos: Math.floor(horasPermisos),
  };
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN: Recalcular y guardar métricas
// ═══════════════════════════════════════════════════════════

export async function recalcularYGuardarMetricas(
  params: CalcularMetricasParams
): Promise<MetricasCalculadas> {
  const { publicacionId, usuarioId, mes, anio } = params;

  // 1. Calcular métricas
  const metricas = await calcularMetricasMensuales(params);

  // 2. Upsert en base de datos
  await prisma.metricasMensuales.upsert({
    where: {
      publicacionId_usuarioId_mes_anio: {
        publicacionId,
        usuarioId,
        mes,
        anio,
      },
    },
    create: {
      publicacionId,
      usuarioId,
      mes,
      anio,
      ...metricas,
    },
    update: {
      ...metricas,
      updatedAt: new Date(),
    },
  });

  return metricas;
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN: Recalcular métricas tras cambio en ausencias
// ═══════════════════════════════════════════════════════════

export async function recalcularMetricasTrasAusencia(
  ausenciaId: string
): Promise<void> {
  // 1. Obtener la ausencia con relaciones
  const ausencia = await prisma.ausencia.findUnique({
    where: { id: ausenciaId },
    include: {
      publicacion: {
        select: {
          id: true,
          mes: true,
          año: true,
        },
      },
    },
  });

  if (!ausencia) {
    throw new Error('Ausencia no encontrada');
  }

  // 2. Recalcular métricas del funcionario
  await recalcularYGuardarMetricas({
    publicacionId: ausencia.publicacionId,
    usuarioId: ausencia.usuarioId,
    mes: ausencia.publicacion.mes,
    anio: ausencia.publicacion.año,
  });
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN: Recalcular métricas de toda una publicación
// Útil cuando se cambia la versión de matriz
// ═══════════════════════════════════════════════════════════

export async function recalcularMetricasPublicacion(
  publicacionId: string
): Promise<number> {
  // 1. Obtener publicación
  const publicacion = await prisma.publicacionTurnos.findUnique({
    where: { id: publicacionId },
    select: {
      mes: true,
      año: true,
    },
  });

  if (!publicacion) {
    throw new Error('Publicación no encontrada');
  }

  // 2. Obtener todos los usuarios con asignaciones
  const usuariosConAsignaciones = await prisma.asignacionTurno.findMany({
    where: { publicacionId },
    select: {
      usuarioId: true,
    },
    distinct: ['usuarioId'],
  });

  // 3. Recalcular para cada usuario
  for (const { usuarioId } of usuariosConAsignaciones) {
    await recalcularYGuardarMetricas({
      publicacionId,
      usuarioId,
      mes: publicacion.mes,
      anio: publicacion.año,
    });
  }

  return usuariosConAsignaciones.length;
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN: Obtener métricas calculadas de un funcionario
// ═══════════════════════════════════════════════════════════

export async function obtenerMetricasFuncionario(
  publicacionId: string,
  usuarioId: string,
  mes: number,
  anio: number
): Promise<MetricasCalculadas | null> {
  const metricas = await prisma.metricasMensuales.findUnique({
    where: {
      publicacionId_usuarioId_mes_anio: {
        publicacionId,
        usuarioId,
        mes,
        anio,
      },
    },
  });

  if (!metricas) {
    // Si no existen, calcularlas
    return await recalcularYGuardarMetricas({
      publicacionId,
      usuarioId,
      mes,
      anio,
    });
  }

  return {
    hmr: metricas.hmr,
    hlm: metricas.hlm,
    hmc: metricas.hmc,
    ponderacion: metricas.ponderacion,
    totalHoras: metricas.totalHoras,
    hdf: metricas.hdf,
    he: metricas.he,
    horasDiurnas: metricas.horasDiurnas,
    horasNocturnas: metricas.horasNocturnas,
    horasSabDomFest: metricas.horasSabDomFest,
    horasDescansoComp: metricas.horasDescansoComp,
    diasAusenciaLM_FLA: metricas.diasAusenciaLM_FLA,
    horasPermisos: metricas.horasPermisos,
  };
}

