// src/data/turnos-config.ts
import { ConfiguracionTurno, TipoTurno } from '@/types/turnos'

// Configuraciones de turnos según glosario oficial DAN 11
export const CONFIGURACIONES_TURNOS: Record<TipoTurno, ConfiguracionTurno> = {
  DIA_COMPLETO: {
    tipo: 'DIA_COMPLETO',
    nombre: 'Día Completo',
    codigo: 'DC',
    horaInicio: '08:00',
    horaFin: '20:00',
    duracionHoras: 12,
    esNocturno: false,
    color: '#3b82f6', // blue-500
    descripcion: 'Turno diurno de 12 horas (08:00 - 20:00)'
  },
  DIA_LARGO: {
    tipo: 'DIA_LARGO',
    nombre: 'Día Largo',
    codigo: 'DL',
    horaInicio: '08:00',
    horaFin: '22:00',
    duracionHoras: 14,
    esNocturno: false,
    color: '#2563eb', // blue-600
    descripcion: 'Turno diurno extendido de 14 horas (08:00 - 22:00)'
  },
  NOCHE: {
    tipo: 'NOCHE',
    nombre: 'Noche',
    codigo: 'N',
    horaInicio: '20:00',
    horaFin: '08:00',
    duracionHoras: 12,
    esNocturno: true,
    color: '#1e3a8a', // blue-900
    descripcion: 'Turno nocturno de 12 horas (20:00 - 08:00)'
  },
  NOCHE_LARGA: {
    tipo: 'NOCHE_LARGA',
    nombre: 'Noche Larga',
    codigo: 'NL',
    horaInicio: '20:00',
    horaFin: '10:00',
    duracionHoras: 14,
    esNocturno: true,
    color: '#1e293b', // slate-900
    descripcion: 'Turno nocturno extendido de 14 horas (20:00 - 10:00)'
  },
  DESCANSO: {
    tipo: 'DESCANSO',
    nombre: 'Descanso',
    codigo: 'DESC',
    horaInicio: '00:00',
    horaFin: '00:00',
    duracionHoras: 0,
    esNocturno: false,
    color: '#10b981', // green-500
    descripcion: 'Día de descanso compensatorio'
  },
  LIBRE: {
    tipo: 'LIBRE',
    nombre: 'Libre',
    codigo: 'L',
    horaInicio: '00:00',
    horaFin: '00:00',
    duracionHoras: 0,
    esNocturno: false,
    color: '#6b7280', // gray-500
    descripcion: 'Día libre programado'
  },
  SALIENTE: {
    tipo: 'SALIENTE',
    nombre: 'Saliente',
    codigo: 'S',
    horaInicio: '00:00',
    horaFin: '08:00',
    duracionHoras: 8,
    esNocturno: true,
    color: '#8b5cf6', // violet-500
    descripcion: 'Turno saliente (finaliza turno nocturno)'
  }
}

// Helper para obtener configuración de turno
export function getConfiguracionTurno(tipo: TipoTurno): ConfiguracionTurno {
  return CONFIGURACIONES_TURNOS[tipo]
}

// Lista de tipos de turno para selectores
export const TIPOS_TURNO_OPTIONS = Object.values(CONFIGURACIONES_TURNOS).map(config => ({
  value: config.tipo,
  label: config.nombre,
  codigo: config.codigo,
  color: config.color
}))

