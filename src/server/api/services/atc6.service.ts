import { type PrismaClient } from '@prisma/client'
import {
  calcularHorasRegistro,
  consolidarHorasPorSector,
  validarPericiaMensual,
  validarConflictosHorario,
} from './calculo.service'
import type {
  CrearRegistroATC6Input,
  ActualizarRegistroATC6Input,
  ListarRegistrosATC6Input,
  ObtenerConsolidadoMensualInput,
  DetectarAlertasVCPInput,
} from '../validators/atc6.validator'

/**
 * Servicio de lógica de negocio para ATC-6
 */
export class ATC6Service {
  constructor(private prisma: PrismaClient) {}

  /**
   * Crear un nuevo registro ATC-6
   */
  async crearRegistro(input: CrearRegistroATC6Input) {
    // Validar que el usuario existe y tiene las iniciales correctas
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: input.usuarioId },
      include: { abreviatura: true },
    })

    if (!usuario) {
      throw new Error('Usuario no encontrado')
    }

    if (!usuario.abreviatura || usuario.abreviatura.codigo !== input.iniciales) {
      throw new Error('Las iniciales no coinciden con el usuario')
    }

    // Validar conflictos de horario si hay hora término
    if (input.horaTermino) {
      const registrosExistentes = await this.prisma.registroATC6.findMany({
        where: {
          usuarioId: input.usuarioId,
          fecha: input.fecha,
        },
      })

      const conflicto = validarConflictosHorario(
        {
          fecha: input.fecha,
          horaInicio: input.horaInicio,
          horaTermino: input.horaTermino,
          usuarioId: input.usuarioId,
        },
        registrosExistentes
      )

      if (conflicto.tieneConflicto) {
        throw new Error(conflicto.mensaje)
      }
    }

    // Calcular horas si hay hora término
    let totalHoras: number | undefined
    let totalHorasStr: string | undefined
    let esNocturno = input.esNocturno
    let esDiaInhabil = input.esDiaInhabil

    if (input.horaTermino) {
      const calculo = calcularHorasRegistro(
        input.horaInicio,
        input.horaTermino,
        input.fecha
      )
      totalHoras = calculo.totalHoras
      totalHorasStr = calculo.totalHorasStr
      esNocturno = calculo.esNocturno
      esDiaInhabil = calculo.esDiaInhabil
    }

    // Crear registro
    const registro = await this.prisma.registroATC6.create({
      data: {
        ...input,
        totalHoras,
        totalHorasStr,
        esNocturno,
        esDiaInhabil,
        esValido: true,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        puestoTrabajo: true,
      },
    })

    // Si hay hora término, actualizar consolidado mensual
    if (input.horaTermino) {
      await this.actualizarConsolidadoMensual(
        input.usuarioId,
        input.unidadId,
        input.fecha.getMonth() + 1,
        input.fecha.getFullYear()
      )
    }

    return registro
  }

  /**
   * Actualizar un registro ATC-6 existente
   */
  async actualizarRegistro(input: ActualizarRegistroATC6Input) {
    const registroExistente = await this.prisma.registroATC6.findUnique({
      where: { id: input.id },
    })

    if (!registroExistente) {
      throw new Error('Registro no encontrado')
    }

    // Recalcular horas si se actualiza hora término
    let totalHoras = registroExistente.totalHoras
    let totalHorasStr = registroExistente.totalHorasStr
    let esNocturno = registroExistente.esNocturno
    let esDiaInhabil = registroExistente.esDiaInhabil

    if (input.horaTermino) {
      const calculo = calcularHorasRegistro(
        registroExistente.horaInicio,
        input.horaTermino,
        registroExistente.fecha
      )
      totalHoras = calculo.totalHoras
      totalHorasStr = calculo.totalHorasStr
      esNocturno = calculo.esNocturno
      esDiaInhabil = calculo.esDiaInhabil
    }

    const registroActualizado = await this.prisma.registroATC6.update({
      where: { id: input.id },
      data: {
        ...input,
        totalHoras,
        totalHorasStr,
        esNocturno,
        esDiaInhabil,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    })

    // Actualizar consolidado mensual
    if (input.horaTermino) {
      await this.actualizarConsolidadoMensual(
        registroExistente.usuarioId,
        registroExistente.unidadId,
        registroExistente.fecha.getMonth() + 1,
        registroExistente.fecha.getFullYear()
      )
    }

    return registroActualizado
  }

  /**
   * Listar registros ATC-6 con filtros
   */
  async listarRegistros(input: ListarRegistrosATC6Input) {
    const where: any = {
      unidadId: input.unidadId,
    }

    if (input.fecha) {
      where.fecha = input.fecha
    }

    if (input.fechaInicio && input.fechaFin) {
      where.fecha = {
        gte: input.fechaInicio,
        lte: input.fechaFin,
      }
    }

    if (input.usuarioId) {
      where.usuarioId = input.usuarioId
    }

    if (input.sector) {
      where.sector = input.sector
    }

    const [registros, total] = await Promise.all([
      this.prisma.registroATC6.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
          puestoTrabajo: true,
          instructor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
        orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
        take: input.limit,
        skip: input.offset,
      }),
      this.prisma.registroATC6.count({ where }),
    ])

    return {
      registros,
      total,
      limit: input.limit,
      offset: input.offset,
      hasMore: total > input.offset + input.limit,
    }
  }

  /**
   * Obtener consolidado mensual
   */
  async obtenerConsolidadoMensual(input: ObtenerConsolidadoMensualInput) {
    // Si se especifica usuario, devolver solo ese
    if (input.usuarioId) {
      const consolidado = await this.prisma.consolidadoATC6Mensual.findUnique({
        where: {
          usuarioId_mes_año: {
            usuarioId: input.usuarioId,
            mes: input.mes,
            año: input.año,
          },
        },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
        },
      })

      return consolidado ? [consolidado] : []
    }

    // Devolver todos los consolidados de la unidad
    const consolidados = await this.prisma.consolidadoATC6Mensual.findMany({
      where: {
        unidadId: input.unidadId,
        mes: input.mes,
        año: input.año,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
      orderBy: {
        totalHoras: 'desc',
      },
    })

    return consolidados
  }

  /**
   * Actualizar consolidado mensual de un usuario
   * Se ejecuta automáticamente cuando se crea/actualiza un registro
   */
  private async actualizarConsolidadoMensual(
    usuarioId: string,
    unidadId: string,
    mes: number,
    año: number
  ) {
    // Obtener todos los registros del mes
    const primerDia = new Date(año, mes - 1, 1)
    const ultimoDia = new Date(año, mes, 0, 23, 59, 59)

    const registros = await this.prisma.registroATC6.findMany({
      where: {
        usuarioId,
        unidadId,
        fecha: {
          gte: primerDia,
          lte: ultimoDia,
        },
      },
    })

    // Consolidar por sector
    const consolidado = consolidarHorasPorSector(registros)

    // Validar pericia
    const validacion = validarPericiaMensual(consolidado.totalHoras, 10)

    // Upsert consolidado
    await this.prisma.consolidadoATC6Mensual.upsert({
      where: {
        usuarioId_mes_año: {
          usuarioId,
          mes,
          año,
        },
      },
      create: {
        usuarioId,
        unidadId,
        mes,
        año,
        ...consolidado,
        cumpleMinimo: validacion.cumpleMinimo,
        requiereVCP: validacion.requiereVCP,
      },
      update: {
        ...consolidado,
        cumpleMinimo: validacion.cumpleMinimo,
        requiereVCP: validacion.requiereVCP,
        recalculadoAt: new Date(),
      },
    })
  }

  /**
   * Detectar alertas VCP (< horas mínimas)
   */
  async detectarAlertasVCP(input: DetectarAlertasVCPInput) {
    const consolidados = await this.prisma.consolidadoATC6Mensual.findMany({
      where: {
        unidadId: input.unidadId,
        mes: input.mes,
        año: input.año,
        requiereVCP: true,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            numeroLicencia: true,
          },
        },
      },
      orderBy: {
        totalHoras: 'asc',
      },
    })

    return consolidados.map((c) => ({
      usuarioId: c.usuarioId,
      usuario: c.usuario,
      horasTotales: c.totalHoras,
      horasMinimas: input.horasMinimasRequeridas,
      diferencia: c.totalHoras - input.horasMinimasRequeridas,
      requiereVCP: true,
    }))
  }

  /**
   * Eliminar un registro ATC-6
   */
  async eliminarRegistro(id: string, eliminadoPor: string) {
    const registro = await this.prisma.registroATC6.findUnique({
      where: { id },
    })

    if (!registro) {
      throw new Error('Registro no encontrado')
    }

    await this.prisma.registroATC6.delete({
      where: { id },
    })

    // Recalcular consolidado mensual
    await this.actualizarConsolidadoMensual(
      registro.usuarioId,
      registro.unidadId,
      registro.fecha.getMonth() + 1,
      registro.fecha.getFullYear()
    )

    return { success: true, message: 'Registro eliminado correctamente' }
  }
}

