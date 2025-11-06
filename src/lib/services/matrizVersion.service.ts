import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════
// TIPOS Y CONSTANTES
// ═══════════════════════════════════════════════════════════

export type TipoVersion = 'minor' | 'major';

export interface CrearVersionParams {
  unidadId: string;
  descripcion: string;
  creadoPor: string;
  tipo: TipoVersion;
}

export interface ClonarTiposTurnoParams {
  versionOrigenId: string;
  versionDestinoId: string;
  modificaciones?: Array<{
    codigo: string;
    cambios: {
      devolucionHoras?: number;
      horasDiurnas?: number;
      horasNocturnas?: number;
      horasSabDomFest?: number;
    };
  }>;
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN 1: Obtener versión activa de una unidad
// ═══════════════════════════════════════════════════════════

/**
 * Obtiene la versión activa de matriz para una unidad
 * @param unidadId - ID de la unidad
 * @returns MatrizTurnosVersion activa o null si no existe
 */
export async function getVersionActiva(unidadId: string) {
  return await prisma.matrizTurnosVersion.findFirst({
    where: {
      unidadId,
      esActiva: true,
    },
    include: {
      tiposTurno: {
        where: { activo: true },
        orderBy: { orden: 'asc' },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN 2: Obtener historial de versiones
// ═══════════════════════════════════════════════════════════

/**
 * Obtiene todas las versiones de una unidad ordenadas por fecha
 * @param unidadId - ID de la unidad
 * @returns Array de versiones (más reciente primero)
 */
export async function getHistorialVersiones(unidadId: string) {
  return await prisma.matrizTurnosVersion.findMany({
    where: { unidadId },
    include: {
      creador: {
        select: {
          nombre: true,
          apellido: true,
          email: true,
        },
      },
      _count: {
        select: {
          tiposTurno: true,
          publicaciones: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN 3: Calcular siguiente número de versión
// ═══════════════════════════════════════════════════════════

/**
 * Calcula el siguiente número de versión según tipo (minor/major)
 * @param versionActual - Versión actual (ej: "v1.2")
 * @param tipo - Tipo de incremento ('minor' o 'major')
 * @returns Nueva versión (ej: "v1.3" o "v2.0")
 */
function calcularSiguienteVersion(versionActual: string, tipo: TipoVersion): string {
  // Extraer números: "v1.2" -> [1, 2]
  const match = versionActual.match(/v(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Formato de versión inválido: ${versionActual}`);
  }

  const [, majorStr, minorStr] = match;
  const major = parseInt(majorStr, 10);
  const minor = parseInt(minorStr, 10);

  if (tipo === 'major') {
    return `v${major + 1}.0`;
  } else {
    return `v${major}.${minor + 1}`;
  }
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN 4: Clonar tipos de turno entre versiones
// ═══════════════════════════════════════════════════════════

/**
 * Clona todos los tipos de turno de una versión origen a una destino
 * Opcionalmente aplica modificaciones a códigos específicos
 * @param params - Parámetros de clonación
 * @returns Cantidad de tipos clonados
 */
async function clonarTiposTurno(params: ClonarTiposTurnoParams): Promise<number> {
  const { versionOrigenId, versionDestinoId, modificaciones = [] } = params;

  // Obtener todos los tipos de turno de la versión origen
  const tiposOrigen = await prisma.tipoTurno.findMany({
    where: { matrizVersionId: versionOrigenId },
  });

  // Crear mapa de modificaciones para acceso rápido
  const mapaModificaciones = new Map(
    modificaciones.map((m) => [m.codigo, m.cambios])
  );

  // Clonar cada tipo de turno
  for (const tipoOrigen of tiposOrigen) {
    const modificacion = mapaModificaciones.get(tipoOrigen.codigo);

    await prisma.tipoTurno.create({
      data: {
        matrizVersionId: versionDestinoId,
        unidadId: tipoOrigen.unidadId,
        codigo: tipoOrigen.codigo,
        nombre: tipoOrigen.nombre,
        descripcion: tipoOrigen.descripcion,
        horaInicio: tipoOrigen.horaInicio,
        horaFin: tipoOrigen.horaFin,
        duracionHoras: tipoOrigen.duracionHoras,
        
        // Aplicar modificaciones si existen, sino usar valores originales
        devolucionHoras: modificacion?.devolucionHoras ?? tipoOrigen.devolucionHoras,
        horasDiurnas: modificacion?.horasDiurnas ?? tipoOrigen.horasDiurnas,
        horasNocturnas: modificacion?.horasNocturnas ?? tipoOrigen.horasNocturnas,
        horasSabDomFest: modificacion?.horasSabDomFest ?? tipoOrigen.horasSabDomFest,
        
        esOperativo: tipoOrigen.esOperativo,
        esNocturno: tipoOrigen.esNocturno,
        esDiaInhabil: tipoOrigen.esDiaInhabil,
        color: tipoOrigen.color,
        activo: tipoOrigen.activo,
        orden: tipoOrigen.orden,
        validaciones: tipoOrigen.validaciones ?? Prisma.JsonNull,
        creadoPor: tipoOrigen.creadoPor,
      },
    });
  }

  return tiposOrigen.length;
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN 5: Crear nueva versión de matriz
// ═══════════════════════════════════════════════════════════

/**
 * Crea una nueva versión de matriz clonando la versión activa
 * Bloquea la versión anterior automáticamente
 * @param params - Parámetros de creación
 * @returns Nueva versión creada con estadísticas
 */
export async function crearNuevaVersion(params: CrearVersionParams) {
  const { unidadId, descripcion, creadoPor, tipo } = params;

  // 1. Obtener versión activa actual
  const versionActual = await getVersionActiva(unidadId);
  if (!versionActual) {
    throw new Error(`No existe versión activa para la unidad ${unidadId}`);
  }

  // 2. Calcular número de nueva versión
  const nuevaVersionNumero = calcularSiguienteVersion(versionActual.version, tipo);

  // 3. Verificar que no exista ya
  const versionExistente = await prisma.matrizTurnosVersion.findUnique({
    where: {
      unidadId_version: {
        unidadId,
        version: nuevaVersionNumero,
      },
    },
  });

  if (versionExistente) {
    throw new Error(`La versión ${nuevaVersionNumero} ya existe para esta unidad`);
  }

  // 4. Usar transacción para garantizar atomicidad
  const resultado = await prisma.$transaction(async (tx) => {
    // 4.1. Bloquear versión anterior
    await tx.matrizTurnosVersion.update({
      where: { id: versionActual.id },
      data: {
        esActiva: false,
        esBloqueada: true,
      },
    });

    // 4.2. Crear nueva versión
    const nuevaVersion = await tx.matrizTurnosVersion.create({
      data: {
        unidadId,
        version: nuevaVersionNumero,
        descripcion,
        esActiva: true,
        esBloqueada: false,
        creadoPor,
      },
    });

    // 4.3. Clonar todos los tipos de turno
    const cantidadClonados = await clonarTiposTurno({
      versionOrigenId: versionActual.id,
      versionDestinoId: nuevaVersion.id,
    });

    return {
      version: nuevaVersion,
      tiposTurnoClonados: cantidadClonados,
      versionAnterior: versionActual.version,
    };
  });

  return resultado;
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN 6: Aplicar nueva versión a publicación en curso
// ═══════════════════════════════════════════════════════════

/**
 * Actualiza una publicación para usar nueva versión de matriz
 * ADVERTENCIA: Esto recalculará todas las métricas
 * @param publicacionId - ID de la publicación a actualizar
 * @param nuevaVersionId - ID de la nueva versión a aplicar
 */
export async function aplicarVersionAPublicacion(
  publicacionId: string,
  nuevaVersionId: string
) {
  // Verificar que la publicación existe
  const publicacion = await prisma.publicacionTurnos.findUnique({
    where: { id: publicacionId },
    include: {
      asignaciones: true,
    },
  });

  if (!publicacion) {
    throw new Error(`Publicación ${publicacionId} no encontrada`);
  }

  // Verificar que la nueva versión existe y está activa
  const nuevaVersion = await prisma.matrizTurnosVersion.findUnique({
    where: { id: nuevaVersionId },
  });

  if (!nuevaVersion || !nuevaVersion.esActiva) {
    throw new Error(`Versión ${nuevaVersionId} no válida o no activa`);
  }

  // Actualizar publicación
  await prisma.publicacionTurnos.update({
    where: { id: publicacionId },
    data: { matrizVersionId: nuevaVersionId },
  });

  // TODO FASE 8-9: Aquí se llamará a recalcularMetricas(publicacionId)
  
  return {
    publicacionId,
    nuevaVersionId,
    asignacionesAfectadas: publicacion.asignaciones.length,
  };
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN 7: Validar si se puede modificar matriz
// ═══════════════════════════════════════════════════════════

/**
 * Valida si la versión activa puede ser modificada
 * @param unidadId - ID de la unidad
 * @returns true si se puede modificar, false si está bloqueada
 */
export async function puedeModificarMatriz(unidadId: string): Promise<boolean> {
  const versionActiva = await getVersionActiva(unidadId);
  
  if (!versionActiva) {
    return false;
  }

  return !versionActiva.esBloqueada;
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN 8: Obtener versión específica por número
// ═══════════════════════════════════════════════════════════

/**
 * Obtiene una versión específica por su número
 * @param unidadId - ID de la unidad
 * @param version - Número de versión (ej: "v1.0")
 * @returns Versión encontrada o null
 */
export async function getVersionPorNumero(unidadId: string, version: string) {
  return await prisma.matrizTurnosVersion.findUnique({
    where: {
      unidadId_version: { unidadId, version },
    },
    include: {
      tiposTurno: {
        where: { activo: true },
        orderBy: { orden: 'asc' },
      },
      creador: {
        select: {
          nombre: true,
          apellido: true,
        },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN AUXILIAR: Obtener estadísticas de versión
// ═══════════════════════════════════════════════════════════

/**
 * Obtiene estadísticas de uso de una versión específica
 * @param versionId - ID de la versión
 * @returns Estadísticas de uso
 */
export async function getEstadisticasVersion(versionId: string) {
  const version = await prisma.matrizTurnosVersion.findUnique({
    where: { id: versionId },
    include: {
      _count: {
        select: {
          tiposTurno: true,
          publicaciones: true,
        },
      },
    },
  });

  if (!version) {
    throw new Error(`Versión ${versionId} no encontrada`);
  }

  // Contar publicaciones cerradas vs vigentes
  const publicacionesCerradas = await prisma.publicacionTurnos.count({
    where: {
      matrizVersionId: versionId,
      estado: 'CERRADO',
    },
  });

  const publicacionesVigentes = await prisma.publicacionTurnos.count({
    where: {
      matrizVersionId: versionId,
      estado: {
        in: ['PUBLICADO', 'VIGENTE'],
      },
    },
  });

  return {
    version: version.version,
    esActiva: version.esActiva,
    esBloqueada: version.esBloqueada,
    totalTiposTurno: version._count.tiposTurno,
    totalPublicaciones: version._count.publicaciones,
    publicacionesCerradas,
    publicacionesVigentes,
    fechaCreacion: version.createdAt,
  };
}

// ═══════════════════════════════════════════════════════════
// EXPORTACIONES ADICIONALES
// ═══════════════════════════════════════════════════════════

/**
 * Objeto con todas las funciones del servicio para fácil importación
 */
export const MatrizVersionService = {
  getVersionActiva,
  getHistorialVersiones,
  crearNuevaVersion,
  aplicarVersionAPublicacion,
  puedeModificarMatriz,
  getVersionPorNumero,
  getEstadisticasVersion,
};

