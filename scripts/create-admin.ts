/**
 * Script para crear usuario administrador del sistema
 * Ejecutar: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Creando usuario administrador...\n')

  try {
    // Verificar si ya existe un admin
    const existingAdmin = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: 'admin@dgac.gob.cl' },
          { rut: '99999999-9' }
        ]
      }
    })

    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario admin:')
      console.log(`   ID: ${existingAdmin.id}`)
      console.log(`   Email: ${existingAdmin.email}`)
      console.log(`   Rol: ${existingAdmin.rol}`)
      console.log(`   Activo: ${existingAdmin.activo}`)
      
      if (existingAdmin.rol !== 'ADMIN_SISTEMA') {
        console.log('\n🔄 Actualizando rol a ADMIN_SISTEMA...')
        await prisma.usuario.update({
          where: { id: existingAdmin.id },
          data: { 
            rol: 'ADMIN_SISTEMA',
            activo: true 
          }
        })
        console.log('✅ Rol actualizado correctamente')
      }
      
      return
    }

    // Obtener la primera unidad activa
    const unidad = await prisma.unidad.findFirst({
      where: { activa: true }
    })

    if (!unidad) {
      console.error('❌ No hay unidades activas en el sistema')
      console.log('   Primero crea una unidad con: npx prisma db seed')
      process.exit(1)
    }

    console.log(`📍 Unidad seleccionada: ${unidad.nombre}`)

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('Admin123!', 12)

    // Crear usuario admin
    const admin = await prisma.usuario.create({
      data: {
        email: 'admin@dgac.gob.cl',
        nombre: 'Administrador',
        apellido: 'del Sistema',
        rut: '99999999-9',
        password: hashedPassword,
        pin: '0000',
        rol: 'ADMIN_SISTEMA',
        unidadId: unidad.id,
        activo: true,
      }
    })

    console.log('\n✅ Usuario administrador creado exitosamente!\n')
    console.log('📝 Credenciales:')
    console.log('   Email:    admin@dgac.gob.cl')
    console.log('   Password: Admin123!')
    console.log('   PIN:      0000')
    console.log('   Rol:      ADMIN_SISTEMA')
    console.log(`   ID:       ${admin.id}`)
    console.log('\n🔐 Por seguridad, cambia la contraseña después del primer login')

  } catch (error) {
    console.error('\n❌ Error al crear admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

