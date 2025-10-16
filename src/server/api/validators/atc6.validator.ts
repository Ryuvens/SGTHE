import { z } from 'zod'

/**
 * Validadores para el módulo ATC-6
 */

// ============================================
// ENUMS
// ============================================

export const SectorATSEnum = z.enum(['O', 'N', 'ON'])
export const TurnoTypeEnum = z.enum(['DIURNO', 'NOCTURNO'])
export const TipoActividadControlEnum = z.enum([
  'CONTROLADOR_SECTOR',
  'CONTROLADOR_COORDINADOR',
  'SUPERVISOR_CONTROL',
  'INSTRUCTOR',
  'ATCO_ENTRENAMIENTO',
])
export const OrigenRegistroEnum = z.enum([
  'MANUAL',
  'IMPORTACION_EXCEL',
  'MIGRACION',
  'API',
])

// ============================================
// VALIDACIONES BÁSICAS
// ============================================

// Formato hhmm (0000-2359)
export const horaHHMMSchema = z
  .string()
  .regex(/^([0-1][0-9]|2[0-3])[0-5][0-9]$/, {
    message: 'Formato inválido. Debe ser hhmm (ej: 0800, 1430, 2359)',
  })

// Validar que hora término sea posterior a hora inicio
export const validarHoraTerminoSchema = z
  .object({
    horaInicio: horaHHMMSchema,
    horaTermino: horaHHMMSchema,
  })
  .refine(
    (data) => {
      const inicio = parseInt(data.horaInicio)
      const termino = parseInt(data.horaTermino)
      // Permitir cruces de medianoche (ej: 2300 → 0700)
      return termino !== inicio
    },
    {
      message: 'Hora término debe ser diferente a hora inicio',
      path: ['horaTermino'],
    }
  )

// ============================================
// SCHEMAS PRINCIPALES
// ============================================

/**
 * Schema para crear un registro ATC-6
 */
export const crearRegistroATC6Schema = z.object({
  // Contexto
  unidadId: z.string().cuid(),
  puestoTrabajoId: z.string().cuid().optional(),
  fecha: z.date(),
  sector: SectorATSEnum.optional(),
  turno: TurnoTypeEnum,

  // ATCO
  usuarioId: z.string().cuid(),
  iniciales: z
    .string()
    .min(2, 'Iniciales deben tener al menos 2 caracteres')
    .max(5, 'Iniciales no pueden tener más de 5 caracteres')
    .toUpperCase(),

  // Tiempos (UTC)
  horaInicio: horaHHMMSchema,
  horaTermino: horaHHMMSchema.optional(),

  // Tipo de actividad
  tipoActividad: TipoActividadControlEnum,

  // Entrenamiento/Examen
  esEntrenamiento: z.boolean().default(false),
  esExamen: z.boolean().default(false),
  instructorId: z.string().cuid().optional(),

  // Flags
  esNocturno: z.boolean().default(false),
  esDiaInhabil: z.boolean().default(false),

  // Origen
  origen: OrigenRegistroEnum.default('MANUAL'),
  creadoPor: z.string(),
})

/**
 * Schema para actualizar un registro ATC-6
 */
export const actualizarRegistroATC6Schema = z.object({
  id: z.string().cuid(),
  horaTermino: horaHHMMSchema.optional(),
  tipoActividad: TipoActividadControlEnum.optional(),
  esEntrenamiento: z.boolean().optional(),
  esExamen: z.boolean().optional(),
  instructorId: z.string().cuid().optional(),
  modificadoPor: z.string(),
})

/**
 * Schema para listar registros ATC-6
 */
export const listarRegistrosATC6Schema = z.object({
  unidadId: z.string().cuid(),
  fecha: z.date().optional(),
  fechaInicio: z.date().optional(),
  fechaFin: z.date().optional(),
  usuarioId: z.string().cuid().optional(),
  sector: SectorATSEnum.optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

/**
 * Schema para obtener consolidado mensual
 */
export const obtenerConsolidadoMensualSchema = z.object({
  unidadId: z.string().cuid(),
  mes: z.number().min(1).max(12),
  año: z.number().min(2000).max(2100),
  usuarioId: z.string().cuid().optional(),
})

/**
 * Schema para detectar alertas VCP
 */
export const detectarAlertasVCPSchema = z.object({
  unidadId: z.string().cuid(),
  mes: z.number().min(1).max(12),
  año: z.number().min(2000).max(2100),
  horasMinimasRequeridas: z.number().default(10),
})

/**
 * Schema para autenticación con PIN (Modo Kiosco)
 */
export const autenticarPINSchema = z.object({
  iniciales: z.string().min(2).max(5).toUpperCase(),
  pin: z.string().length(4, 'PIN debe tener 4 dígitos'),
  unidadId: z.string().cuid(),
})

/**
 * Schema para importar desde Excel
 */
export const importarExcelATC6Schema = z.object({
  unidadId: z.string().cuid(),
  mes: z.number().min(1).max(12),
  año: z.number().min(2000).max(2100),
  archivo: z.string(), // Base64 o URL del archivo
  importadoPor: z.string(),
})

// ============================================
// TIPOS INFERIDOS
// ============================================

export type CrearRegistroATC6Input = z.infer<typeof crearRegistroATC6Schema>
export type ActualizarRegistroATC6Input = z.infer<typeof actualizarRegistroATC6Schema>
export type ListarRegistrosATC6Input = z.infer<typeof listarRegistrosATC6Schema>
export type ObtenerConsolidadoMensualInput = z.infer<typeof obtenerConsolidadoMensualSchema>
export type DetectarAlertasVCPInput = z.infer<typeof detectarAlertasVCPSchema>
export type AutenticarPINInput = z.infer<typeof autenticarPINSchema>
export type ImportarExcelATC6Input = z.infer<typeof importarExcelATC6Schema>

