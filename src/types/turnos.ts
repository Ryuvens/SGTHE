// src/types/turnos.ts

// Tipos de turnos según glosario oficial DAN 11
export type TipoTurno = 
  | 'DIA_COMPLETO'
  | 'DIA_LARGO'
  | 'NOCHE'
  | 'NOCHE_LARGA'
  | 'DESCANSO'
  | 'LIBRE'
  | 'SALIENTE'

// Días de la semana
export type DiaSemana = 'LUN' | 'MAR' | 'MIE' | 'JUE' | 'VIE' | 'SAB' | 'DOM'

// Funcionario con sus datos básicos
export interface Funcionario {
  id: string
  rut?: string // Opcional - se agregará cuando esté disponible
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  segundoNombre?: string
  email: string
  rol: 'ADMIN' | 'SUPERVISOR' | 'CONTROLADOR'
  habilitaciones: string[] // TWR, APP, ACC, FSS
  activo: boolean
}

// Asignación de turno para un día específico
export interface AsignacionTurno {
  funcionarioId: string
  dia: number // 1-31
  tipoTurno: TipoTurno
  horaInicio?: string // "08:00"
  horaFin?: string // "20:00"
  observaciones?: string
}

// Publicación mensual de turnos
export interface PublicacionTurnos {
  id: string
  mes: number // 1-12
  anio: number // 2025
  unidad: string // "Centro Control Oceánico"
  estado: 'BORRADOR' | 'PUBLICADO' | 'CERRADO'
  asignaciones: AsignacionTurno[]
  creadoPor: string
  creadoEn: Date
  publicadoEn?: Date
}

// Resumen de cálculos mensuales según PRO DRH 22
export interface ResumenMensual {
  funcionarioId: string
  horaLegalMensual: number // HLM = días hábiles * 8.8
  horasTrabajadas: number
  horasDiurnas: number
  horasNocturnas: number
  horasSabDomFest: number
  horasGeneradas: number // Diferencia HT - HLM
  saldoAnterior: number
  horasDevolucion: number
  saldoActual: number
}

// Configuración de turno según glosario DAN 11
export interface ConfiguracionTurno {
  tipo: TipoTurno
  nombre: string
  codigo: string
  horaInicio: string
  horaFin: string
  duracionHoras: number
  esNocturno: boolean
  color: string // Para UI
  descripcion: string
}

