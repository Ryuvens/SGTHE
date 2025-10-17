/**
 * Script para crear abreviatura para el admin
 * Ejecutar: npx tsx scripts/create-admin-abreviatura.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Creando abreviatura para admin...\n')

  try {
    // Buscar usuario admin
    const admin = await prisma.usuario.findUnique({
      where: { email: 'admin@dgac.gob.cl' }
    })

    if (!admin) {
      console.error('❌ No se encontró el usuario admin')
      console.log('   Ejecuta primero: npx tsx scripts/create-admin.ts')
      process.exit(1)
    }

    // Verificar si ya tiene abreviatura
    const existingAbrev = await prisma.abreviaturaATCO.findUnique({
      where: { usuarioId: admin.id }
    })

    if (existingAbrev) {
      console.log('⚠️  El admin ya tiene abreviatura:')
      console.log(`   Código: ${existingAbrev.codigo}`)
      return
    }

    // Crear abreviatura
    const abreviatura = await prisma.abreviaturaATCO.create({
      data: {
        codigo: 'ADM',
        usuarioId: admin.id,
        activa: true,
      }
    })

    console.log('✅ Abreviatura creada exitosamente!')
    console.log(`   Código: ${abreviatura.codigo}`)
    console.log(`   Usuario: ${admin.nombre} ${admin.apellido}`)

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

