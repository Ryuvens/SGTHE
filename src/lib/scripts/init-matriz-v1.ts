import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de inicialización: Crear versión v1.0 para todas las unidades
 * 
 * Este script:
 * 1. Obtiene todas las unidades existentes
 * 2. Para cada unidad:
 *    a. Crea MatrizTurnosVersion v1.0
 *    b. Asocia todos los TipoTurno existentes a v1.0
 *    c. Actualiza campos: devolucionHoras, horasDiurnas, horasNocturnas
 *    d. Asocia todas las PublicacionTurnos existentes a v1.0
 * 
 * IMPORTANTE: Este script es idempotente (se puede ejecutar múltiples veces)
 * 
 * @author Sistema SGTHE - DGAC Chile
 * @version 1.0.0
 * @date 2025-11-05
 */

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 FASE 2: Inicialización de Matrices de Turnos v1.0');
  console.log('═══════════════════════════════════════════════════════════\n');

  // PASO 1: Obtener todas las unidades
  const unidades = await prisma.unidad.findMany({
    select: {
      id: true,
      nombre: true,
      codigo: true,
    },
  });

  console.log(`📋 Unidades encontradas: ${unidades.length}\n`);

  if (unidades.length === 0) {
    console.log('⚠️  No hay unidades en el sistema. Nada que procesar.');
    return;
  }

  let unidadesProcesadas = 0;
  let unidadesOmitidas = 0;
  let tiposTurnoActualizados = 0;
  let publicacionesActualizadas = 0;

  for (const unidad of unidades) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏢 Procesando: ${unidad.nombre} (${unidad.codigo})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    // PASO 2: Verificar si ya existe v1.0 para esta unidad
    const versionExistente = await prisma.matrizTurnosVersion.findUnique({
      where: {
        unidadId_version: {
          unidadId: unidad.id,
          version: 'v1.0',
        },
      },
    });

    let matrizVersion;

    if (versionExistente) {
      console.log('   ⚠️  Versión v1.0 ya existe, usando existente');
      matrizVersion = versionExistente;
    } else {
      // PASO 3: Crear MatrizTurnosVersion v1.0
      
      // Obtener primer admin de la unidad como creador
      const primerAdmin = await prisma.usuario.findFirst({
        where: {
          unidadId: unidad.id,
          OR: [
            { rol: 'ADMIN_SISTEMA' },
            { rol: 'JEFE_UNIDAD' },
            { rol: 'SUPERVISOR_ATS' },
          ],
        },
        orderBy: {
          rol: 'asc', // Prioriza ADMIN_SISTEMA primero
        },
        select: { 
          id: true,
          nombre: true,
          rol: true,
        },
      });

      if (!primerAdmin) {
        console.log('   ❌ No se encontró usuario con permisos para esta unidad');
        console.log('   ⏭️  Saltando unidad...');
        unidadesOmitidas++;
        continue;
      }

      console.log(`   👤 Creador: ${primerAdmin.nombre} (${primerAdmin.rol})`);

      matrizVersion = await prisma.matrizTurnosVersion.create({
        data: {
          unidadId: unidad.id,
          version: 'v1.0',
          descripcion: 'Versión inicial - Migración automática del sistema',
          esActiva: true,
          esBloqueada: false,
          creadoPor: primerAdmin.id,
        },
      });

      console.log('   ✅ Versión v1.0 creada exitosamente');
    }

    // PASO 4: Obtener todos los TipoTurno de esta unidad sin versión
    const tiposTurnoSinVersion = await prisma.tipoTurno.findMany({
      where: {
        unidadId: unidad.id,
        matrizVersionId: null,
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
      },
    });

    console.log(`   📝 Tipos de turno a migrar: ${tiposTurnoSinVersion.length}`);

    // PASO 5: Actualizar cada tipo de turno
    let turnosActualizadosUnidad = 0;
    
    for (const tipoTurno of tiposTurnoSinVersion) {
      // Definir valores según código del turno
      const valoresPorCodigo = getValoresPorCodigo(tipoTurno.codigo);

      await prisma.tipoTurno.update({
        where: { id: tipoTurno.id },
        data: {
          matrizVersionId: matrizVersion.id,
          devolucionHoras: valoresPorCodigo.devolucionHoras,
          horasDiurnas: valoresPorCodigo.horasDiurnas,
          horasNocturnas: valoresPorCodigo.horasNocturnas,
          horasSabDomFest: valoresPorCodigo.horasSabDomFest,
        },
      });

      turnosActualizadosUnidad++;
      tiposTurnoActualizados++;
    }

    if (turnosActualizadosUnidad > 0) {
      console.log(`   ✅ ${turnosActualizadosUnidad} tipos de turno actualizados con v1.0`);
    }

    // PASO 6: Actualizar PublicacionTurnos sin versión
    const publicacionesSinVersion = await prisma.publicacionTurnos.findMany({
      where: {
        unidadId: unidad.id,
        matrizVersionId: null,
      },
      select: { 
        id: true,
        mes: true,
        año: true,
      },
    });

    if (publicacionesSinVersion.length > 0) {
      const resultado = await prisma.publicacionTurnos.updateMany({
        where: {
          id: {
            in: publicacionesSinVersion.map((p) => p.id),
          },
        },
        data: {
          matrizVersionId: matrizVersion.id,
        },
      });

      console.log(`   ✅ ${resultado.count} publicaciones actualizadas con v1.0`);
      publicacionesActualizadas += resultado.count;
    }

    unidadesProcesadas++;
  }

  // RESUMEN FINAL
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📊 RESUMEN:');
  console.log(`   • Unidades procesadas: ${unidadesProcesadas}`);
  console.log(`   • Unidades omitidas: ${unidadesOmitidas}`);
  console.log(`   • Tipos de turno actualizados: ${tiposTurnoActualizados}`);
  console.log(`   • Publicaciones actualizadas: ${publicacionesActualizadas}`);
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

/**
 * Retorna valores de horas según código oficial DGAC ACCO
 * Basado en: ABREVIATURAS_Y_HORARIOS_ROL_DE_TURNOS_-_TURNOS_ACCO.pdf
 * Análisis: ANÁLISIS_Y_VALIDACIÓN_FÓRMULAS_SGTHE_.pdf
 * Total: 31 códigos oficiales (3+5+4+7+5+3+4)
 */
function getValoresPorCodigo(codigo: string) {
  const mapeo: Record<string, {
    devolucionHoras: number;
    horasDiurnas: number;
    horasNocturnas: number;
    horasSabDomFest?: number;
  }> = {
    // ═══════════════════════════════════════════════════════════
    // GRUPO 1: TURNOS OPERATIVOS (3)
    // ═══════════════════════════════════════════════════════════
    'D': { devolucionHoras: 0, horasDiurnas: 12, horasNocturnas: 0 },
    'N': { devolucionHoras: 0, horasDiurnas: 0.5, horasNocturnas: 3 },
    'S': { devolucionHoras: 0, horasDiurnas: 1.5, horasNocturnas: 7 },
    
    // ═══════════════════════════════════════════════════════════
    // GRUPO 2: DESCANSOS COMPLEMENTARIOS (5)
    // ═══════════════════════════════════════════════════════════
    'DA': { devolucionHoras: 9, horasDiurnas: 0, horasNocturnas: 0 },
    'DV': { devolucionHoras: 8, horasDiurnas: 0, horasNocturnas: 0 },
    'DC': { devolucionHoras: 12, horasDiurnas: 0, horasNocturnas: 0 },
    'DN': { devolucionHoras: 3.5, horasDiurnas: 0, horasNocturnas: 0 },
    'DS': { devolucionHoras: 8.5, horasDiurnas: 0, horasNocturnas: 0 },
    
    // ═══════════════════════════════════════════════════════════
    // GRUPO 3: ADMINISTRATIVOS (4)
    // ═══════════════════════════════════════════════════════════
    'A': { devolucionHoras: 0, horasDiurnas: 9, horasNocturnas: 0 },
    'AV': { devolucionHoras: 0, horasDiurnas: 8, horasNocturnas: 0 },
    'C': { devolucionHoras: 0, horasDiurnas: 9, horasNocturnas: 0 },
    'CV': { devolucionHoras: 0, horasDiurnas: 8, horasNocturnas: 0 },
    
    // ═══════════════════════════════════════════════════════════
    // GRUPO 4: INSTRUCCIÓN (7)
    // ═══════════════════════════════════════════════════════════
    'IA': { devolucionHoras: 0, horasDiurnas: 9, horasNocturnas: 0 },
    'IAV': { devolucionHoras: 0, horasDiurnas: 8, horasNocturnas: 0 },
    'ID': { devolucionHoras: 0, horasDiurnas: 12, horasNocturnas: 0 },
    'IN': { devolucionHoras: 0, horasDiurnas: 0.5, horasNocturnas: 3 },
    'IS': { devolucionHoras: 0, horasDiurnas: 1.5, horasNocturnas: 7 },
    'E': { devolucionHoras: 0, horasDiurnas: 9, horasNocturnas: 0 },
    'EV': { devolucionHoras: 0, horasDiurnas: 8, horasNocturnas: 0 },
    
    // ═══════════════════════════════════════════════════════════
    // GRUPO 5: OPERACIONALES (5)
    // ═══════════════════════════════════════════════════════════
    'OP': { devolucionHoras: 0, horasDiurnas: 12, horasNocturnas: 0 },
    'OE': { devolucionHoras: 0, horasDiurnas: 12, horasNocturnas: 0 },
    'O': { devolucionHoras: 0, horasDiurnas: 9, horasNocturnas: 0 },
    'OV': { devolucionHoras: 0, horasDiurnas: 8, horasNocturnas: 0 },
    'CIC': { devolucionHoras: 0, horasDiurnas: 12, horasNocturnas: 0 },
    
    // ═══════════════════════════════════════════════════════════
    // GRUPO 6: ESPECIALES (3)
    // ═══════════════════════════════════════════════════════════
    'D11S': { devolucionHoras: 0, horasDiurnas: 9.5, horasNocturnas: 0 },
    'B': { devolucionHoras: 0, horasDiurnas: 9, horasNocturnas: 0 },
    'R': { devolucionHoras: 0, horasDiurnas: 4, horasNocturnas: 0 },
    
    // ═══════════════════════════════════════════════════════════
    // GRUPO 7: AUSENCIAS (4)
    // Nota: PA y PAV tienen horas porque descuentan del HMC
    // FLA y L descuentan del HLM por días (0 horas trabajadas)
    // ═══════════════════════════════════════════════════════════
    'FLA': { devolucionHoras: 0, horasDiurnas: 0, horasNocturnas: 0 },
    'L': { devolucionHoras: 0, horasDiurnas: 0, horasNocturnas: 0 },
    'PA': { devolucionHoras: 0, horasDiurnas: 9, horasNocturnas: 0 },
    'PAV': { devolucionHoras: 0, horasDiurnas: 8, horasNocturnas: 0 },
  };

  if (codigo in mapeo) {
    return mapeo[codigo];
  }

  console.warn(`   ⚠️  Código "${codigo}" no encontrado en mapeo oficial ACCO (31 códigos)`);
  return {
    devolucionHoras: 0,
    horasDiurnas: 0,
    horasNocturnas: 0,
  };
}

// ═══════════════════════════════════════════════════════════
// EJECUCIÓN DEL SCRIPT
// ═══════════════════════════════════════════════════════════

main()
  .catch((e) => {
    console.error('\n❌ ERROR EN MIGRACIÓN:', e);
    console.error('\nStack trace:', e.stack);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Desconectando Prisma...');
    await prisma.$disconnect();
    console.log('✅ Desconexión exitosa\n');
  });

