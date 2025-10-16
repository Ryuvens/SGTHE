import {
  calcularHorasTrabajadas,
  horasAFormato,
  esHorarioNocturno,
  esDiaInhabil,
  obtenerFestivosChile,
  calcularHorasObligadas,
} from '@/lib/utils/time'

/**
 * Servicio de cálculos para ATC-6
 */

export interface CalculoHorasResult {
  totalHoras: number
  totalHorasStr: string
  esNocturno: boolean
  esDiaInhabil: boolean
}

/**
 * Calcula las horas trabajadas entre inicio y término
 */
export function calcularHorasRegistro(
  horaInicio: string,
  horaTermino: string,
  fecha: Date
): CalculoHorasResult {
  const totalHoras = calcularHorasTrabajadas(horaInicio, horaTermino)
  const totalHorasStr = horasAFormato(totalHoras)

  // Determinar si es nocturno (cualquiera de las dos horas en rango nocturno)
  const esNocturno = esHorarioNocturno(horaInicio) || esHorarioNocturno(horaTermino)

  // Determinar si es día inhábil
  const festivosChile = obtenerFestivosChile(fecha.getFullYear())
  const esInhabil = esDiaInhabil(fecha, festivosChile)

  return {
    totalHoras,
    totalHorasStr,
    esNocturno,
    esDiaInhabil: esInhabil,
  }
}

/**
 * Consolida las horas por sector de un ATCO en un mes
 */
export interface ConsolidadoSectores {
  horasSectorO: number
  horasSectorN: number
  horasSectorON: number
  totalHoras: number
}

export function consolidarHorasPorSector(
  registros: Array<{
    sector?: 'O' | 'N' | 'ON' | null
    totalHoras: number | null
  }>
): ConsolidadoSectores {
  let horasSectorO = 0
  let horasSectorN = 0
  let horasSectorON = 0

  for (const registro of registros) {
    if (!registro.totalHoras) continue

    switch (registro.sector) {
      case 'O':
        horasSectorO += registro.totalHoras
        break
      case 'N':
        horasSectorN += registro.totalHoras
        break
      case 'ON':
        horasSectorON += registro.totalHoras
        break
    }
  }

  return {
    horasSectorO,
    horasSectorN,
    horasSectorON,
    totalHoras: horasSectorO + horasSectorN + horasSectorON,
  }
}

/**
 * Valida si un ATCO cumple con el mínimo de horas mensuales (DAN 11)
 */
export interface ValidacionPericia {
  cumpleMinimo: boolean
  requiereVCP: boolean
  horasTotales: number
  horasMinimas: number
  diferencia: number
}

export function validarPericiaMensual(
  horasTotales: number,
  horasMinimas: number = 10
): ValidacionPericia {
  const cumpleMinimo = horasTotales >= horasMinimas
  const requiereVCP = !cumpleMinimo
  const diferencia = horasTotales - horasMinimas

  return {
    cumpleMinimo,
    requiereVCP,
    horasTotales,
    horasMinimas,
    diferencia,
  }
}

/**
 * Calcula el porcentaje de horas de control vs horas trabajadas
 */
export function calcularPorcentajeControl(
  horasControl: number,
  horasTrabajadas: number
): number {
  if (horasTrabajadas === 0) return 0
  return Math.round((horasControl / horasTrabajadas) * 100)
}

/**
 * Obtiene las horas obligadas de un mes
 */
export function obtenerHorasObligadasMes(mes: number, año: number): number {
  return calcularHorasObligadas(mes, año, 8.8)
}

/**
 * Valida si un registro ATC-6 tiene conflictos con otros registros
 */
export interface ConflictoRegistro {
  tieneConflicto: boolean
  mensaje?: string
  registroConflictivo?: {
    id: string
    horaInicio: string
    horaTermino: string
  }
}

export function validarConflictosHorario(
  nuevoRegistro: {
    fecha: Date
    horaInicio: string
    horaTermino?: string
    usuarioId: string
  },
  registrosExistentes: Array<{
    id: string
    fecha: Date
    horaInicio: string
    horaTermino: string | null
    usuarioId: string
  }>
): ConflictoRegistro {
  // Filtrar solo registros del mismo usuario y fecha
  const registrosMismoDia = registrosExistentes.filter(
    (r) =>
      r.usuarioId === nuevoRegistro.usuarioId &&
      r.fecha.toDateString() === nuevoRegistro.fecha.toDateString() &&
      r.horaTermino !== null
  )

  if (!nuevoRegistro.horaTermino) {
    // No podemos validar conflictos sin hora término
    return { tieneConflicto: false }
  }

  for (const registroExistente of registrosMismoDia) {
    // Convertir a minutos para comparación
    const nuevoInicio = parseInt(nuevoRegistro.horaInicio)
    const nuevoFin = parseInt(nuevoRegistro.horaTermino)
    const existenteInicio = parseInt(registroExistente.horaInicio)
    const existenteFin = parseInt(registroExistente.horaTermino!)

    // Verificar solapamiento
    const haySolapamiento =
      (nuevoInicio >= existenteInicio && nuevoInicio < existenteFin) ||
      (nuevoFin > existenteInicio && nuevoFin <= existenteFin) ||
      (nuevoInicio <= existenteInicio && nuevoFin >= existenteFin)

    if (haySolapamiento) {
      return {
        tieneConflicto: true,
        mensaje: `Conflicto con registro existente (${registroExistente.horaInicio}-${registroExistente.horaTermino})`,
        registroConflictivo: {
          id: registroExistente.id,
          horaInicio: registroExistente.horaInicio,
          horaTermino: registroExistente.horaTermino!,
        },
      }
    }
  }

  return { tieneConflicto: false }
}

