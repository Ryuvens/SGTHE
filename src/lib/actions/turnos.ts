// src/lib/actions/turnos.ts
'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { auth } from '@/auth'

const prisma = new PrismaClient()

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const CreatePublicacionSchema = z.object({
  unidadId: z.string().cuid(),
  mes: z.number().min(1).max(12),
  año: z.number().min(2024).max(2030),
  fechaInicio: z.date(),
  fechaFin: z.date(),
})

const AsignarTurnoSchema = z.object({
  publicacionId: z.string().cuid(),
  usuarioId: z.string().cuid(),
  tipoTurnoId: z.string().cuid(),
  fecha: z.date(),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  duracion: z.number().optional(),
  esNocturno: z.boolean().default(false),
  esDiaInhabil: z.boolean().default(false),
  esFestivo: z.boolean().default(false),
  observaciones: z.string().optional(),
})

// ============================================
// TIPOS
// ============================================

export type PublicacionWithDetails = Awaited<ReturnType<typeof getPublicacion>>['data']

// ============================================
// PUBLICACIONES
// ============================================

/**
 * Obtener todos los roles mensuales (para página principal)
 */
export async function getRolesMenuales() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'No autenticado', data: [] }
    }

    // Por ahora, obtener todas las publicaciones
    // TODO: Filtrar por unidad del usuario
    const roles = await prisma.publicacionTurnos.findMany({
      include: {
        unidad: {
          select: {
            nombre: true,
            codigo: true,
          }
        },
        _count: {
          select: { asignaciones: true }
        }
      },
      orderBy: [
        { año: 'desc' },
        { mes: 'desc' }
      ]
    })
    
    return { success: true, data: roles }
  } catch (error) {
    console.error('Error al obtener roles mensuales:', error)
    return { success: false, error: 'Error al obtener roles', data: [] }
  }
}

/**
 * Obtener todas las publicaciones de una unidad
 */
export async function getPublicaciones(unidadId: string) {
  try {
    const publicaciones = await prisma.publicacionTurnos.findMany({
      where: { unidadId },
      include: {
        unidad: true,
        asignaciones: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                rut: true,
              }
            },
            tipoTurno: true,
          }
        },
      },
      orderBy: [
        { año: 'desc' },
        { mes: 'desc' },
      ]
    })

    return { success: true, data: publicaciones }
  } catch (error) {
    console.error('Error al obtener publicaciones:', error)
    return { success: false, error: 'Error al obtener publicaciones' }
  }
}

/**
 * Obtener una publicación específica por ID
 */
export async function getPublicacion(id: string) {
  try {
    const publicacion = await prisma.publicacionTurnos.findUnique({
      where: { id },
      include: {
        unidad: true,
        asignaciones: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                rut: true,
              }
            },
            tipoTurno: true,
          },
          orderBy: [
            { fecha: 'asc' },
            { usuario: { apellido: 'asc' } }
          ]
        },
      },
    })

    if (!publicacion) {
      return { success: false, error: 'Publicación no encontrada' }
    }

    return { success: true, data: publicacion }
  } catch (error) {
    console.error('Error al obtener publicación:', error)
    return { success: false, error: 'Error al obtener publicación' }
  }
}

/**
 * Obtener publicación por mes y año
 */
export async function getPublicacionPorPeriodo(
  unidadId: string,
  mes: number,
  año: number
) {
  try {
    const publicacion = await prisma.publicacionTurnos.findFirst({
      where: {
        unidadId,
        mes,
        año,
      },
      include: {
        unidad: true,
        asignaciones: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                rut: true,
              }
            },
            tipoTurno: true,
          },
          orderBy: [
            { fecha: 'asc' },
            { usuario: { apellido: 'asc' } }
          ]
        },
      },
    })

    return { success: true, data: publicacion }
  } catch (error) {
    console.error('Error al obtener publicación:', error)
    return { success: false, error: 'Error al obtener publicación' }
  }
}

/**
 * Crear nueva publicación de turnos
 */
export async function createPublicacion(
  input: z.infer<typeof CreatePublicacionSchema>
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'No autenticado' }
    }

    const validated = CreatePublicacionSchema.parse(input)

    // Verificar que no exista ya una publicación para ese período
    const existing = await prisma.publicacionTurnos.findFirst({
      where: {
        unidadId: validated.unidadId,
        mes: validated.mes,
        año: validated.año,
      }
    })

    if (existing) {
      return {
        success: false,
        error: `Ya existe una publicación para ${validated.mes}/${validated.año}`
      }
    }

    // Crear la publicación
    const publicacion = await prisma.publicacionTurnos.create({
      data: {
        unidadId: validated.unidadId,
        mes: validated.mes,
        año: validated.año,
        fechaInicio: validated.fechaInicio,
        fechaFin: validated.fechaFin,
        estado: 'BORRADOR',
        creadoPor: session.user.id,
      },
      include: {
        unidad: true,
      }
    })

    revalidatePath('/turnos')
    return { success: true, data: publicacion }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Error al crear publicación:', error)
    return { success: false, error: 'Error al crear publicación' }
  }
}

/**
 * Actualizar estado de publicación
 */
export async function updateEstadoPublicacion(
  id: string,
  nuevoEstado: 'BORRADOR' | 'PUBLICADO' | 'VIGENTE' | 'CERRADO'
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'No autenticado' }
    }

    const publicacion = await prisma.publicacionTurnos.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        ...(nuevoEstado === 'PUBLICADO' && {
          aprobadoPor: session.user.id,
          aprobadoAt: new Date(),
        }),
      }
    })

    revalidatePath('/turnos')
    return { success: true, data: publicacion }

  } catch (error) {
    console.error('Error al actualizar estado:', error)
    return { success: false, error: 'Error al actualizar estado' }
  }
}

/**
 * Eliminar publicación (solo si está en BORRADOR)
 */
export async function deletePublicacion(id: string) {
  try {
    const publicacion = await prisma.publicacionTurnos.findUnique({
      where: { id },
      select: { estado: true }
    })

    if (!publicacion) {
      return { success: false, error: 'Publicación no encontrada' }
    }

    if (publicacion.estado !== 'BORRADOR') {
      return {
        success: false,
        error: 'Solo se pueden eliminar publicaciones en borrador'
      }
    }

    await prisma.publicacionTurnos.delete({
      where: { id }
    })

    revalidatePath('/turnos')
    return { success: true }

  } catch (error) {
    console.error('Error al eliminar publicación:', error)
    return { success: false, error: 'Error al eliminar publicación' }
  }
}

// ============================================
// ASIGNACIONES DE TURNOS
// ============================================

/**
 * Asignar turno a un usuario en una fecha específica
 */
export async function asignarTurno(
  input: z.infer<typeof AsignarTurnoSchema>
) {
  try {
    const validated = AsignarTurnoSchema.parse(input)

    // Verificar que la publicación existe y está editable
    const publicacion = await prisma.publicacionTurnos.findUnique({
      where: { id: validated.publicacionId },
      select: { estado: true }
    })

    if (!publicacion) {
      return { success: false, error: 'Publicación no encontrada' }
    }

    if (publicacion.estado === 'CERRADO') {
      return { success: false, error: 'La publicación está cerrada' }
    }

    // Verificar si ya existe una asignación para ese usuario en esa fecha
    const existing = await prisma.asignacionTurno.findFirst({
      where: {
        publicacionId: validated.publicacionId,
        usuarioId: validated.usuarioId,
        fecha: validated.fecha,
      }
    })

    let asignacion

    if (existing) {
      // Actualizar asignación existente
      asignacion = await prisma.asignacionTurno.update({
        where: { id: existing.id },
        data: {
          tipoTurnoId: validated.tipoTurnoId,
          horaInicio: validated.horaInicio,
          horaFin: validated.horaFin,
          duracion: validated.duracion,
          esNocturno: validated.esNocturno,
          esDiaInhabil: validated.esDiaInhabil,
          esFestivo: validated.esFestivo,
          observaciones: validated.observaciones,
        },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            }
          },
          tipoTurno: true,
        }
      })
    } else {
      // Crear nueva asignación
      asignacion = await prisma.asignacionTurno.create({
        data: validated,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            }
          },
          tipoTurno: true,
        }
      })
    }

    revalidatePath('/turnos')
    return { success: true, data: asignacion }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Error al asignar turno:', error)
    return { success: false, error: 'Error al asignar turno' }
  }
}

/**
 * Eliminar asignación de turno
 */
export async function eliminarAsignacion(id: string) {
  try {
    // Verificar que la asignación existe y la publicación es editable
    const asignacion = await prisma.asignacionTurno.findUnique({
      where: { id },
      include: {
        publicacion: {
          select: { estado: true }
        }
      }
    })

    if (!asignacion) {
      return { success: false, error: 'Asignación no encontrada' }
    }

    if (asignacion.publicacion.estado === 'CERRADO') {
      return { success: false, error: 'La publicación está cerrada' }
    }

    await prisma.asignacionTurno.delete({
      where: { id }
    })

    revalidatePath('/turnos')
    return { success: true }

  } catch (error) {
    console.error('Error al eliminar asignación:', error)
    return { success: false, error: 'Error al eliminar asignación' }
  }
}

/**
 * Obtener asignaciones de un usuario en un período
 */
export async function getAsignacionesUsuario(
  usuarioId: string,
  fechaInicio: Date,
  fechaFin: Date
) {
  try {
    const asignaciones = await prisma.asignacionTurno.findMany({
      where: {
        usuarioId,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        }
      },
      include: {
        tipoTurno: true,
        publicacion: {
          select: {
            mes: true,
            año: true,
            estado: true,
          }
        }
      },
      orderBy: {
        fecha: 'asc'
      }
    })

    return { success: true, data: asignaciones }

  } catch (error) {
    console.error('Error al obtener asignaciones:', error)
    return { success: false, error: 'Error al obtener asignaciones' }
  }
}

// ============================================
// TIPOS DE TURNO
// ============================================

/**
 * Obtener tipos de turno de una unidad
 */
export async function getTiposTurno(unidadId: string) {
  try {
    const tipos = await prisma.tipoTurno.findMany({
      where: {
        unidadId,
        activo: true,
      },
      orderBy: {
        orden: 'asc'
      }
    })

    return { success: true, data: tipos }

  } catch (error) {
    console.error('Error al obtener tipos de turno:', error)
    return { success: false, error: 'Error al obtener tipos de turno' }
  }
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Duplicar publicación del mes anterior como plantilla
 */
export async function duplicarPublicacion(
  publicacionOrigenId: string,
  nuevoMes: number,
  nuevoAño: number
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'No autenticado' }
    }

    // Obtener publicación origen
    const origen = await prisma.publicacionTurnos.findUnique({
      where: { id: publicacionOrigenId },
      include: {
        asignaciones: true,
      }
    })

    if (!origen) {
      return { success: false, error: 'Publicación origen no encontrada' }
    }

    // Verificar que no exista publicación para el nuevo período
    const existing = await prisma.publicacionTurnos.findFirst({
      where: {
        unidadId: origen.unidadId,
        mes: nuevoMes,
        año: nuevoAño,
      }
    })

    if (existing) {
      return {
        success: false,
        error: `Ya existe una publicación para ${nuevoMes}/${nuevoAño}`
      }
    }

    // Calcular fechas del nuevo período
    const fechaInicio = startOfMonth(new Date(nuevoAño, nuevoMes - 1))
    const fechaFin = endOfMonth(fechaInicio)

    // Crear nueva publicación
    const nuevaPublicacion = await prisma.publicacionTurnos.create({
      data: {
        unidadId: origen.unidadId,
        mes: nuevoMes,
        año: nuevoAño,
        fechaInicio,
        fechaFin,
        estado: 'BORRADOR',
        creadoPor: session.user.id,
      }
    })

    // TODO: Aquí podrías copiar las asignaciones ajustando las fechas
    // Por ahora solo creamos la publicación vacía

    revalidatePath('/turnos')
    return { success: true, data: nuevaPublicacion }

  } catch (error) {
    console.error('Error al duplicar publicación:', error)
    return { success: false, error: 'Error al duplicar publicación' }
  }
}

