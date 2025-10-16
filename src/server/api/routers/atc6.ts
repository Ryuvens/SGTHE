import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { ATC6Service } from '../services/atc6.service'
import {
  crearRegistroATC6Schema,
  actualizarRegistroATC6Schema,
  listarRegistrosATC6Schema,
  obtenerConsolidadoMensualSchema,
  detectarAlertasVCPSchema,
  autenticarPINSchema,
} from '../validators/atc6.validator'

/**
 * Router tRPC para ATC-6
 */
export const atc6Router = createTRPCRouter({
  /**
   * Crear un nuevo registro ATC-6
   */
  crear: protectedProcedure
    .input(crearRegistroATC6Schema)
    .mutation(async ({ ctx, input }) => {
      const service = new ATC6Service(ctx.db)
      return await service.crearRegistro(input)
    }),

  /**
   * Actualizar un registro ATC-6 existente
   */
  actualizar: protectedProcedure
    .input(actualizarRegistroATC6Schema)
    .mutation(async ({ ctx, input }) => {
      const service = new ATC6Service(ctx.db)
      return await service.actualizarRegistro(input)
    }),

  /**
   * Listar registros ATC-6 con filtros
   */
  listar: protectedProcedure
    .input(listarRegistrosATC6Schema)
    .query(async ({ ctx, input }) => {
      const service = new ATC6Service(ctx.db)
      return await service.listarRegistros(input)
    }),

  /**
   * Obtener un registro por ID
   */
  obtenerPorId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.registroATC6.findUnique({
        where: { id: input.id },
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
      })
    }),

  /**
   * Eliminar un registro ATC-6
   */
  eliminar: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        eliminadoPor: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new ATC6Service(ctx.db)
      return await service.eliminarRegistro(input.id, input.eliminadoPor)
    }),

  /**
   * Obtener consolidado mensual
   */
  consolidadoMensual: protectedProcedure
    .input(obtenerConsolidadoMensualSchema)
    .query(async ({ ctx, input }) => {
      const service = new ATC6Service(ctx.db)
      return await service.obtenerConsolidadoMensual(input)
    }),

  /**
   * Detectar alertas VCP
   */
  alertasVCP: protectedProcedure
    .input(detectarAlertasVCPSchema)
    .query(async ({ ctx, input }) => {
      const service = new ATC6Service(ctx.db)
      return await service.detectarAlertasVCP(input)
    }),

  /**
   * Autenticar con PIN (Modo Kiosco)
   */
  autenticarPIN: protectedProcedure
    .input(autenticarPINSchema)
    .mutation(async ({ ctx, input }) => {
      // Buscar usuario por iniciales y PIN
      const usuario = await ctx.db.usuario.findFirst({
        where: {
          pin: input.pin,
          unidadId: input.unidadId,
          activo: true,
          abreviatura: {
            codigo: input.iniciales,
            activa: true,
          },
        },
        include: {
          abreviatura: true,
          unidad: true,
        },
      })

      if (!usuario) {
        throw new Error('Credenciales inválidas')
      }

      return {
        success: true,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          iniciales: usuario.abreviatura!.codigo,
          unidad: usuario.unidad,
        },
      }
    }),

  /**
   * Obtener registros de hoy por unidad (para dashboard)
   */
  registrosHoy: protectedProcedure
    .input(z.object({ unidadId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      const mañana = new Date(hoy)
      mañana.setDate(mañana.getDate() + 1)

      return await ctx.db.registroATC6.findMany({
        where: {
          unidadId: input.unidadId,
          fecha: {
            gte: hoy,
            lt: mañana,
          },
        },
        include: {
          usuario: {
            select: {
              nombre: true,
              apellido: true,
            },
          },
          puestoTrabajo: true,
        },
        orderBy: {
          horaInicio: 'desc',
        },
      })
    }),
})

