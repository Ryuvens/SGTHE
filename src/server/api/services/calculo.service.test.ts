import { describe, it, expect } from 'vitest'
import {
  calcularHorasRegistro,
  consolidarHorasPorSector,
  validarPericiaMensual,
  calcularPorcentajeControl,
  validarConflictosHorario,
} from './calculo.service'

describe('Calculo Service', () => {
  describe('calcularHorasRegistro', () => {
    it('debe calcular horas de un turno diurno', () => {
      const fecha = new Date(2025, 9, 21) // Martes 21 Oct 2025
      const resultado = calcularHorasRegistro('0800', '1600', fecha)

      expect(resultado.totalHoras).toBe(8)
      expect(resultado.totalHorasStr).toBe('08:00')
      expect(resultado.esNocturno).toBe(false)
      expect(resultado.esDiaInhabil).toBe(false)
    })

    it('debe detectar turno nocturno', () => {
      const fecha = new Date(2025, 9, 21) // Martes
      const resultado = calcularHorasRegistro('2300', '0700', fecha)

      expect(resultado.totalHoras).toBe(8)
      expect(resultado.esNocturno).toBe(true)
      expect(resultado.esDiaInhabil).toBe(false)
    })

    it('debe detectar día inhábil (domingo)', () => {
      const fecha = new Date(2025, 9, 19) // Domingo 19 Oct 2025
      const resultado = calcularHorasRegistro('0800', '1600', fecha)

      expect(resultado.totalHoras).toBe(8)
      expect(resultado.esNocturno).toBe(false)
      expect(resultado.esDiaInhabil).toBe(true)
    })

    it('debe manejar turnos largos (12 horas)', () => {
      const fecha = new Date(2025, 9, 21)
      const resultado = calcularHorasRegistro('0800', '2000', fecha)

      expect(resultado.totalHoras).toBe(12)
      expect(resultado.totalHorasStr).toBe('12:00')
    })
  })

  describe('consolidarHorasPorSector', () => {
    it('debe consolidar horas por sector correctamente', () => {
      const registros = [
        { sector: 'O' as const, totalHoras: 8.0 },
        { sector: 'O' as const, totalHoras: 7.5 },
        { sector: 'N' as const, totalHoras: 8.0 },
        { sector: 'ON' as const, totalHoras: 4.5 },
      ]

      const resultado = consolidarHorasPorSector(registros)

      expect(resultado.horasSectorO).toBe(15.5)
      expect(resultado.horasSectorN).toBe(8.0)
      expect(resultado.horasSectorON).toBe(4.5)
      expect(resultado.totalHoras).toBe(28.0)
    })

    it('debe ignorar registros sin totalHoras', () => {
      const registros = [
        { sector: 'O' as const, totalHoras: 8.0 },
        { sector: 'O' as const, totalHoras: null },
        { sector: 'N' as const, totalHoras: 8.0 },
      ]

      const resultado = consolidarHorasPorSector(registros)

      expect(resultado.horasSectorO).toBe(8.0)
      expect(resultado.horasSectorN).toBe(8.0)
      expect(resultado.totalHoras).toBe(16.0)
    })

    it('debe manejar array vacío', () => {
      const resultado = consolidarHorasPorSector([])

      expect(resultado.horasSectorO).toBe(0)
      expect(resultado.horasSectorN).toBe(0)
      expect(resultado.horasSectorON).toBe(0)
      expect(resultado.totalHoras).toBe(0)
    })
  })

  describe('validarPericiaMensual', () => {
    it('debe validar cumplimiento de horas mínimas', () => {
      const resultado = validarPericiaMensual(12.5, 10)

      expect(resultado.cumpleMinimo).toBe(true)
      expect(resultado.requiereVCP).toBe(false)
      expect(resultado.horasTotales).toBe(12.5)
      expect(resultado.horasMinimas).toBe(10)
      expect(resultado.diferencia).toBe(2.5)
    })

    it('debe detectar cuando no cumple mínimo', () => {
      const resultado = validarPericiaMensual(8.5, 10)

      expect(resultado.cumpleMinimo).toBe(false)
      expect(resultado.requiereVCP).toBe(true)
      expect(resultado.horasTotales).toBe(8.5)
      expect(resultado.horasMinimas).toBe(10)
      expect(resultado.diferencia).toBe(-1.5)
    })

    it('debe validar exactamente el mínimo', () => {
      const resultado = validarPericiaMensual(10, 10)

      expect(resultado.cumpleMinimo).toBe(true)
      expect(resultado.requiereVCP).toBe(false)
      expect(resultado.diferencia).toBe(0)
    })
  })

  describe('calcularPorcentajeControl', () => {
    it('debe calcular porcentaje correctamente', () => {
      expect(calcularPorcentajeControl(43, 164)).toBe(26) // 26.22% → 26%
      expect(calcularPorcentajeControl(80, 160)).toBe(50)
      expect(calcularPorcentajeControl(40, 100)).toBe(40)
    })

    it('debe manejar división por cero', () => {
      expect(calcularPorcentajeControl(10, 0)).toBe(0)
    })

    it('debe redondear correctamente', () => {
      expect(calcularPorcentajeControl(33, 100)).toBe(33)
      expect(calcularPorcentajeControl(66.6, 100)).toBe(67)
    })
  })

  describe('validarConflictosHorario', () => {
    const baseDate = new Date(2025, 9, 21)
    const otroUsuario = 'otro-usuario-id'
    const usuarioActual = 'usuario-actual-id'

    it('debe detectar solapamiento completo', () => {
      const nuevoRegistro = {
        fecha: baseDate,
        horaInicio: '0900',
        horaTermino: '1100',
        usuarioId: usuarioActual,
      }

      const registrosExistentes = [
        {
          id: 'reg-1',
          fecha: baseDate,
          horaInicio: '0800',
          horaTermino: '1200',
          usuarioId: usuarioActual,
        },
      ]

      const resultado = validarConflictosHorario(nuevoRegistro, registrosExistentes)

      expect(resultado.tieneConflicto).toBe(true)
      expect(resultado.mensaje).toContain('0800-1200')
    })

    it('debe detectar solapamiento parcial (inicio)', () => {
      const nuevoRegistro = {
        fecha: baseDate,
        horaInicio: '0730',
        horaTermino: '0930',
        usuarioId: usuarioActual,
      }

      const registrosExistentes = [
        {
          id: 'reg-1',
          fecha: baseDate,
          horaInicio: '0800',
          horaTermino: '1200',
          usuarioId: usuarioActual,
        },
      ]

      const resultado = validarConflictosHorario(nuevoRegistro, registrosExistentes)

      expect(resultado.tieneConflicto).toBe(true)
    })

    it('debe permitir registros sin conflicto', () => {
      const nuevoRegistro = {
        fecha: baseDate,
        horaInicio: '1300',
        horaTermino: '1500',
        usuarioId: usuarioActual,
      }

      const registrosExistentes = [
        {
          id: 'reg-1',
          fecha: baseDate,
          horaInicio: '0800',
          horaTermino: '1200',
          usuarioId: usuarioActual,
        },
      ]

      const resultado = validarConflictosHorario(nuevoRegistro, registrosExistentes)

      expect(resultado.tieneConflicto).toBe(false)
    })

    it('debe ignorar registros de otros usuarios', () => {
      const nuevoRegistro = {
        fecha: baseDate,
        horaInicio: '0900',
        horaTermino: '1100',
        usuarioId: usuarioActual,
      }

      const registrosExistentes = [
        {
          id: 'reg-1',
          fecha: baseDate,
          horaInicio: '0800',
          horaTermino: '1200',
          usuarioId: otroUsuario, // Diferente usuario
        },
      ]

      const resultado = validarConflictosHorario(nuevoRegistro, registrosExistentes)

      expect(resultado.tieneConflicto).toBe(false)
    })

    it('debe permitir registro sin hora término', () => {
      const nuevoRegistro = {
        fecha: baseDate,
        horaInicio: '0900',
        horaTermino: undefined,
        usuarioId: usuarioActual,
      }

      const registrosExistentes = [
        {
          id: 'reg-1',
          fecha: baseDate,
          horaInicio: '0800',
          horaTermino: '1200',
          usuarioId: usuarioActual,
        },
      ]

      const resultado = validarConflictosHorario(nuevoRegistro, registrosExistentes)

      expect(resultado.tieneConflicto).toBe(false)
    })
  })
})

