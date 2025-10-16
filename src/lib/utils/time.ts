/**
 * Utilidades para manejo de tiempo en formato ATC
 */

/**
 * Convierte hhmm a minutos
 * @param hhmm - Hora en formato hhmm (ej: "0830", "1430")
 * @returns Minutos desde medianoche
 */
export function hhmmToMinutes(hhmm: string): number {
  const horas = parseInt(hhmm.substring(0, 2), 10)
  const minutos = parseInt(hhmm.substring(2, 4), 10)
  return horas * 60 + minutos
}

/**
 * Convierte minutos a hhmm
 * @param minutos - Minutos desde medianoche
 * @returns Hora en formato hhmm
 */
export function minutesToHHMM(minutos: number): string {
  const horas = Math.floor(minutos / 60)
  const mins = minutos % 60
  return `${horas.toString().padStart(2, '0')}${mins.toString().padStart(2, '0')}`
}

/**
 * Calcula la diferencia entre dos horas en formato hhmm
 * Maneja correctamente el cruce de medianoche
 * @param inicio - Hora inicio (hhmm)
 * @param fin - Hora fin (hhmm)
 * @returns Horas trabajadas (decimal)
 */
export function calcularHorasTrabajadas(inicio: string, fin: string): number {
  let minutosInicio = hhmmToMinutes(inicio)
  let minutosFin = hhmmToMinutes(fin)

  // Si el fin es menor que el inicio, asumimos cruce de medianoche
  if (minutosFin < minutosInicio) {
    minutosFin += 24 * 60 // Agregar 24 horas
  }

  const diferenciaMinutos = minutosFin - minutosInicio
  return diferenciaMinutos / 60 // Convertir a horas
}

/**
 * Formatea horas decimales a formato hh:mm
 * @param horas - Horas en formato decimal (ej: 8.5)
 * @returns Formato hh:mm (ej: "08:30")
 */
export function horasAFormato(horas: number): string {
  const horasEnteras = Math.floor(horas)
  const minutos = Math.round((horas - horasEnteras) * 60)
  return `${horasEnteras.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
}

/**
 * Valida si una hora está en rango nocturno (21:00 - 07:00)
 * @param hhmm - Hora en formato hhmm
 * @returns true si es nocturno
 */
export function esHorarioNocturno(hhmm: string): boolean {
  const minutos = hhmmToMinutes(hhmm)
  // Nocturno: 21:00 (1260 min) hasta 07:00 (420 min)
  return minutos >= 1260 || minutos < 420
}

/**
 * Valida si una fecha es día inhábil (sábado, domingo o festivo)
 * @param fecha - Fecha a validar
 * @param festivosChile - Array de fechas festivas (opcional)
 * @returns true si es inhábil
 */
export function esDiaInhabil(fecha: Date, festivosChile?: Date[]): boolean {
  const diaSemana = fecha.getDay()

  // Sábado (6) o Domingo (0)
  if (diaSemana === 0 || diaSemana === 6) {
    return true
  }

  // Verificar si es festivo
  if (festivosChile) {
    return festivosChile.some(
      (festivo) =>
        festivo.getDate() === fecha.getDate() &&
        festivo.getMonth() === fecha.getMonth() &&
        festivo.getFullYear() === fecha.getFullYear()
    )
  }

  return false
}

/**
 * Obtiene los días hábiles de un mes
 * @param mes - Mes (1-12)
 * @param año - Año
 * @param festivosChile - Array de fechas festivas
 * @returns Número de días hábiles
 */
export function obtenerDiasHabiles(
  mes: number,
  año: number,
  festivosChile?: Date[]
): number {
  const primerDia = new Date(año, mes - 1, 1)
  const ultimoDia = new Date(año, mes, 0)

  let diasHabiles = 0
  for (let dia = primerDia; dia <= ultimoDia; dia.setDate(dia.getDate() + 1)) {
    if (!esDiaInhabil(new Date(dia), festivosChile)) {
      diasHabiles++
    }
  }

  return diasHabiles
}

/**
 * Calcula las horas obligadas del mes según días hábiles
 * @param mes - Mes (1-12)
 * @param año - Año
 * @param horasPorDia - Horas por día (default: 8.8)
 * @param festivosChile - Array de fechas festivas
 * @returns Horas obligadas del mes
 */
export function calcularHorasObligadas(
  mes: number,
  año: number,
  horasPorDia: number = 8.8,
  festivosChile?: Date[]
): number {
  const diasHabiles = obtenerDiasHabiles(mes, año, festivosChile)
  return diasHabiles * horasPorDia
}

/**
 * Festivos de Chile 2024-2025
 * NOTA: En producción, esto debería venir de una BD o API
 */
export const FESTIVOS_CHILE_2024: Date[] = [
  new Date(2024, 0, 1),   // Año Nuevo
  new Date(2024, 2, 29),  // Viernes Santo (ejemplo)
  new Date(2024, 2, 30),  // Sábado Santo
  new Date(2024, 4, 1),   // Día del Trabajo
  new Date(2024, 4, 21),  // Glorias Navales
  new Date(2024, 5, 20),  // Día del Indígena (ejemplo)
  new Date(2024, 6, 16),  // Virgen del Carmen
  new Date(2024, 7, 15),  // Asunción de la Virgen
  new Date(2024, 8, 18),  // Independencia
  new Date(2024, 8, 19),  // Glorias del Ejército
  new Date(2024, 9, 12),  // Encuentro de Dos Mundos (ejemplo)
  new Date(2024, 9, 31),  // Día de las Iglesias Evangélicas
  new Date(2024, 10, 1),  // Día de Todos los Santos
  new Date(2024, 11, 8),  // Inmaculada Concepción
  new Date(2024, 11, 25), // Navidad
]

export const FESTIVOS_CHILE_2025: Date[] = [
  new Date(2025, 0, 1),   // Año Nuevo
  new Date(2025, 3, 18),  // Viernes Santo
  new Date(2025, 3, 19),  // Sábado Santo
  new Date(2025, 4, 1),   // Día del Trabajo
  new Date(2025, 4, 21),  // Glorias Navales
  new Date(2025, 5, 20),  // Día del Indígena
  new Date(2025, 6, 16),  // Virgen del Carmen
  new Date(2025, 7, 15),  // Asunción de la Virgen
  new Date(2025, 8, 18),  // Independencia
  new Date(2025, 8, 19),  // Glorias del Ejército
  new Date(2025, 9, 12),  // Encuentro de Dos Mundos
  new Date(2025, 9, 31),  // Día de las Iglesias Evangélicas
  new Date(2025, 10, 1),  // Día de Todos los Santos
  new Date(2025, 11, 8),  // Inmaculada Concepción
  new Date(2025, 11, 25), // Navidad
]

/**
 * Obtiene los festivos según el año
 */
export function obtenerFestivosChile(año: number): Date[] {
  if (año === 2024) return FESTIVOS_CHILE_2024
  if (año === 2025) return FESTIVOS_CHILE_2025
  return [] // En producción: consultar BD
}

