import { describe, it, expect } from 'vitest'
import {
  hhmmToMinutes,
  minutesToHHMM,
  calcularHorasTrabajadas,
  horasAFormato,
  esHorarioNocturno,
  esDiaInhabil,
  obtenerDiasHabiles,
  calcularHorasObligadas,
} from './time'

describe('Time Utils', () => {
  describe('hhmmToMinutes', () => {
    it('debe convertir hhmm a minutos correctamente', () => {
      expect(hhmmToMinutes('0000')).toBe(0)
      expect(hhmmToMinutes('0100')).toBe(60)
      expect(hhmmToMinutes('0830')).toBe(510)
      expect(hhmmToMinutes('1200')).toBe(720)
      expect(hhmmToMinutes('2359')).toBe(1439)
    })
  })

  describe('minutesToHHMM', () => {
    it('debe convertir minutos a hhmm correctamente', () => {
      expect(minutesToHHMM(0)).toBe('0000')
      expect(minutesToHHMM(60)).toBe('0100')
      expect(minutesToHHMM(510)).toBe('0830')
      expect(minutesToHHMM(720)).toBe('1200')
      expect(minutesToHHMM(1439)).toBe('2359')
    })
  })

  describe('calcularHorasTrabajadas', () => {
    it('debe calcular horas en el mismo día', () => {
      expect(calcularHorasTrabajadas('0800', '1600')).toBe(8)
      expect(calcularHorasTrabajadas('0900', '1730')).toBe(8.5)
      expect(calcularHorasTrabajadas('1400', '2200')).toBe(8)
    })

    it('debe manejar cruce de medianoche', () => {
      expect(calcularHorasTrabajadas('2300', '0700')).toBe(8)
      expect(calcularHorasTrabajadas('2200', '0600')).toBe(8)
      expect(calcularHorasTrabajadas('2330', '0730')).toBe(8)
    })

    it('debe manejar turnos de 12 horas', () => {
      expect(calcularHorasTrabajadas('0800', '2000')).toBe(12)
      expect(calcularHorasTrabajadas('2000', '0800')).toBe(12)
    })
  })

  describe('horasAFormato', () => {
    it('debe formatear horas decimales a hh:mm', () => {
      expect(horasAFormato(8)).toBe('08:00')
      expect(horasAFormato(8.5)).toBe('08:30')
      expect(horasAFormato(12.25)).toBe('12:15')
      expect(horasAFormato(0.5)).toBe('00:30')
    })

    it('debe redondear minutos correctamente', () => {
      expect(horasAFormato(8.33)).toBe('08:20') // 8:19.8 → 8:20
      expect(horasAFormato(8.67)).toBe('08:40') // 8:40.2 → 8:40
    })
  })

  describe('esHorarioNocturno', () => {
    it('debe detectar horario nocturno (21:00-07:00)', () => {
      // Nocturno
      expect(esHorarioNocturno('2100')).toBe(true)
      expect(esHorarioNocturno('2300')).toBe(true)
      expect(esHorarioNocturno('0000')).toBe(true)
      expect(esHorarioNocturno('0300')).toBe(true)
      expect(esHorarioNocturno('0659')).toBe(true)

      // Diurno
      expect(esHorarioNocturno('0700')).toBe(false)
      expect(esHorarioNocturno('1200')).toBe(false)
      expect(esHorarioNocturno('1800')).toBe(false)
      expect(esHorarioNocturno('2059')).toBe(false)
    })
  })

  describe('esDiaInhabil', () => {
    it('debe detectar sábados y domingos', () => {
      const sabado = new Date(2025, 9, 18) // 18 Oct 2025 (sábado)
      const domingo = new Date(2025, 9, 19) // 19 Oct 2025 (domingo)
      const lunes = new Date(2025, 9, 20) // 20 Oct 2025 (lunes)

      expect(esDiaInhabil(sabado)).toBe(true)
      expect(esDiaInhabil(domingo)).toBe(true)
      expect(esDiaInhabil(lunes)).toBe(false)
    })

    it('debe detectar festivos', () => {
      const añoNuevo = new Date(2025, 0, 1) // 1 Enero 2025
      const festivos = [añoNuevo]

      expect(esDiaInhabil(añoNuevo, festivos)).toBe(true)
    })

    it('debe detectar días hábiles normales', () => {
      const martes = new Date(2025, 9, 21) // 21 Oct 2025 (martes)
      expect(esDiaInhabil(martes)).toBe(false)
    })
  })

  describe('obtenerDiasHabiles', () => {
    it('debe contar días hábiles correctamente (sin festivos)', () => {
      // Octubre 2025: 31 días
      // Total aproximado: 23 días hábiles
      const diasHabiles = obtenerDiasHabiles(10, 2025)
      expect(diasHabiles).toBeGreaterThanOrEqual(20)
      expect(diasHabiles).toBeLessThanOrEqual(23)
    })

    it('debe excluir festivos', () => {
      const festivos = [
        new Date(2025, 9, 15), // Festivo en mitad de semana
      ]
      const diasHabilesSinFestivos = obtenerDiasHabiles(10, 2025)
      const diasHabilesConFestivos = obtenerDiasHabiles(10, 2025, festivos)

      expect(diasHabilesConFestivos).toBe(diasHabilesSinFestivos - 1)
    })
  })

  describe('calcularHorasObligadas', () => {
    it('debe calcular horas obligadas del mes', () => {
      const diasHabiles = 23 // Octubre 2025 (aproximado)
      const horasEsperadas = diasHabiles * 8.8 // ≈ 202.4 horas

      const horasObligadas = calcularHorasObligadas(10, 2025)

      expect(horasObligadas).toBeGreaterThanOrEqual(176) // 20 días × 8.8
      expect(horasObligadas).toBeLessThanOrEqual(211) // 24 días × 8.8
    })

    it('debe usar jornada personalizada', () => {
      const horasObligadas = calcularHorasObligadas(10, 2025, 9.0)
      const horasObligadasEstandar = calcularHorasObligadas(10, 2025, 8.8)

      expect(horasObligadas).toBeGreaterThan(horasObligadasEstandar)
    })
  })
})

