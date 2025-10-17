'use server'

import { PrismaClient, RolUsuario, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ============= SCHEMAS DE VALIDACIÓN =============

const CreateUsuarioSchema = z.object({
  rut: z.string()
    .regex(/^\d{7,8}-[\dkK]$/, 'RUT inválido')
    .transform(val => val.toUpperCase()),
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'Apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').toLowerCase(),
  numeroLicencia: z.string().optional(),
  rol: z.nativeEnum(RolUsuario),
  unidadId: z.string(),
  activo: z.boolean().default(true),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  pin: z.string().optional(),
})

const UpdateUsuarioSchema = CreateUsuarioSchema.partial().omit({ password: true })

export type CreateUsuarioInput = z.infer<typeof CreateUsuarioSchema>
export type UpdateUsuarioInput = z.infer<typeof UpdateUsuarioSchema>

// ============= TIPOS DE RESPUESTA =============

export type ActionResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
}

export type UsuarioWithRelations = Prisma.UsuarioGetPayload<{
  include: {
    unidad: true
    habilitaciones: {
      include: {
        unidad: true
      }
    }
    abreviatura: true
  }
}>

// ============= FUNCIONES AUXILIARES =============

function validateRut(rut: string): boolean {
  const cleanRut = rut.replace(/[.-]/g, '')
  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1).toUpperCase()
  
  let sum = 0
  let multiple = 2
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiple
    multiple = multiple === 7 ? 2 : multiple + 1
  }
  
  const expectedDv = 11 - (sum % 11)
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString()
  
  return dv === calculatedDv
}

// ============= ACCIONES DEL SERVIDOR =============

// Obtener todos los usuarios con filtros
export async function getUsuarios(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  rol?: RolUsuario,
  activo?: boolean
): Promise<ActionResponse<{
  usuarios: UsuarioWithRelations[]
  total: number
  pages: number
}>> {
  try {
    const skip = (page - 1) * pageSize
    
    const where: Prisma.UsuarioWhereInput = {
      AND: [
        search ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { apellido: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { rut: { contains: search } },
          ]
        } : {},
        rol ? { rol } : {},
        activo !== undefined ? { activo } : {},
      ]
    }
    
    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        include: {
          unidad: true,
          habilitaciones: {
            include: {
              unidad: true
            }
          },
          abreviatura: true,
        },
        skip,
        take: pageSize,
        orderBy: [
          { apellido: 'asc' },
          { nombre: 'asc' }
        ]
      }),
      prisma.usuario.count({ where })
    ])
    
    return {
      success: true,
      data: {
        usuarios,
        total,
        pages: Math.ceil(total / pageSize)
      }
    }
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return {
      success: false,
      error: 'Error al obtener usuarios'
    }
  }
}

// Obtener un usuario por ID
export async function getUsuarioById(id: string): Promise<ActionResponse<UsuarioWithRelations>> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        unidad: true,
        habilitaciones: {
          include: {
            unidad: true
          }
        },
        abreviatura: true,
      }
    })
    
    if (!usuario) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      }
    }
    
    return {
      success: true,
      data: usuario
    }
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return {
      success: false,
      error: 'Error al obtener usuario'
    }
  }
}

// Crear nuevo usuario
export async function createUsuario(input: CreateUsuarioInput): Promise<ActionResponse<UsuarioWithRelations>> {
  try {
    // Validar entrada
    const validatedData = CreateUsuarioSchema.parse(input)
    
    // Validar RUT chileno
    if (!validateRut(validatedData.rut)) {
      return {
        success: false,
        error: 'RUT inválido'
      }
    }
    
    // Verificar duplicados
    const existing = await prisma.usuario.findFirst({
      where: {
        OR: [
          { rut: validatedData.rut },
          { email: validatedData.email }
        ]
      }
    })
    
    if (existing) {
      return {
        success: false,
        error: existing.rut === validatedData.rut 
          ? 'Ya existe un usuario con este RUT' 
          : 'Ya existe un usuario con este email'
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        ...validatedData,
        password: hashedPassword,
      },
      include: {
        unidad: true,
        habilitaciones: {
          include: {
            unidad: true
          }
        },
        abreviatura: true,
      }
    })
    
    revalidatePath('/usuarios')
    
    return {
      success: true,
      data: usuario
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message
      }
    }
    console.error('Error al crear usuario:', error)
    return {
      success: false,
      error: 'Error al crear usuario'
    }
  }
}

// Actualizar usuario
export async function updateUsuario(
  id: string, 
  input: UpdateUsuarioInput
): Promise<ActionResponse<UsuarioWithRelations>> {
  try {
    // Validar entrada
    const validatedData = UpdateUsuarioSchema.parse(input)
    
    // Verificar que el usuario existe
    const existing = await prisma.usuario.findUnique({
      where: { id }
    })
    
    if (!existing) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      }
    }
    
    // Validar RUT si se está actualizando
    if (validatedData.rut && !validateRut(validatedData.rut)) {
      return {
        success: false,
        error: 'RUT inválido'
      }
    }
    
    // Verificar duplicados si se actualiza RUT o email
    if (validatedData.rut || validatedData.email) {
      const duplicate = await prisma.usuario.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                validatedData.rut ? { rut: validatedData.rut } : {},
                validatedData.email ? { email: validatedData.email } : {}
              ]
            }
          ]
        }
      })
      
      if (duplicate) {
        return {
          success: false,
          error: 'RUT o email ya está en uso'
        }
      }
    }
    
    // Actualizar usuario
    const usuario = await prisma.usuario.update({
      where: { id },
      data: validatedData,
      include: {
        unidad: true,
        habilitaciones: {
          include: {
            unidad: true
          }
        },
        abreviatura: true,
      }
    })
    
    revalidatePath('/usuarios')
    
    return {
      success: true,
      data: usuario
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message
      }
    }
    console.error('Error al actualizar usuario:', error)
    return {
      success: false,
      error: 'Error al actualizar usuario'
    }
  }
}

// Cambiar contraseña
export async function updatePassword(input: {
  userId: string
  currentPassword?: string
  newPassword: string
  isAdmin?: boolean
}): Promise<ActionResponse> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: input.userId }
    })
    
    if (!usuario) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      }
    }
    
    // Si no es admin, verificar contraseña actual
    if (!input.isAdmin && input.currentPassword) {
      const isValid = await bcrypt.compare(input.currentPassword, usuario.password)
      if (!isValid) {
        return {
          success: false,
          error: 'Contraseña actual incorrecta'
        }
      }
    }
    
    // Validar nueva contraseña
    const passwordSchema = z.string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
    
    passwordSchema.parse(input.newPassword)
    
    // Hash y actualizar
    const hashedPassword = await bcrypt.hash(input.newPassword, 12)
    
    await prisma.usuario.update({
      where: { id: input.userId },
      data: { 
        password: hashedPassword,
      }
    })
    
    return {
      success: true,
      data: { message: 'Contraseña actualizada correctamente' }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message
      }
    }
    console.error('Error al cambiar contraseña:', error)
    return {
      success: false,
      error: 'Error al cambiar contraseña'
    }
  }
}

// Eliminar usuario (soft delete)
export async function deleteUsuario(id: string): Promise<ActionResponse> {
  try {
    // Verificar que no sea el último admin
    const usuario = await prisma.usuario.findUnique({
      where: { id }
    })
    
    if (!usuario) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      }
    }
    
    if (usuario.rol === 'ADMIN_SISTEMA') {
      const adminCount = await prisma.usuario.count({
        where: {
          rol: 'ADMIN_SISTEMA',
          activo: true,
          id: { not: id }
        }
      })
      
      if (adminCount === 0) {
        return {
          success: false,
          error: 'No se puede eliminar el último administrador'
        }
      }
    }
    
    // Soft delete
    await prisma.usuario.update({
      where: { id },
      data: { 
        activo: false,
        email: `deleted_${Date.now()}_${usuario.email}` // Evitar conflictos
      }
    })
    
    revalidatePath('/usuarios')
    
    return {
      success: true,
      data: { message: 'Usuario eliminado correctamente' }
    }
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return {
      success: false,
      error: 'Error al eliminar usuario'
    }
  }
}

// Exportar usuarios a formato JSON (para Excel)
export async function exportUsuarios(
  filters?: {
    rol?: RolUsuario
    activo?: boolean
  }
): Promise<ActionResponse<any[]>> {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: filters,
      include: {
        unidad: true,
        habilitaciones: {
          include: {
            unidad: true
          }
        },
        abreviatura: true,
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    })
    
    // Formatear para exportación
    const exportData = usuarios.map(u => ({
      RUT: u.rut || '',
      Nombre: u.nombre,
      Apellido: u.apellido,
      'Nombre Completo': `${u.nombre} ${u.apellido}`,
      Email: u.email,
      'Abreviatura': u.abreviatura?.codigo || '',
      'N° Licencia': u.numeroLicencia || '',
      Rol: getRolLabel(u.rol),
      Unidad: u.unidad.nombre,
      Estado: u.activo ? 'Activo' : 'Inactivo',
      Habilitaciones: u.habilitaciones.length,
      'Fecha Registro': u.createdAt.toISOString().split('T')[0]
    }))
    
    return {
      success: true,
      data: exportData
    }
  } catch (error) {
    console.error('Error al exportar usuarios:', error)
    return {
      success: false,
      error: 'Error al exportar usuarios'
    }
  }
}

// Helper para obtener label de rol
function getRolLabel(rol: RolUsuario): string {
  const labels: Record<RolUsuario, string> = {
    ADMIN_SISTEMA: 'Administrador del Sistema',
    JEFE_UNIDAD: 'Jefe de Unidad',
    SUPERVISOR_ATS: 'Supervisor ATS',
    ATCO: 'Controlador',
    ATCO_ENTRENAMIENTO: 'Controlador en Entrenamiento',
  }
  return labels[rol]
}

