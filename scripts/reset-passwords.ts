/**
 * Script de emergencia para resetear contraseñas
 * Ejecutar: npx tsx scripts/reset-passwords.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPasswords() {
  console.log('🔐 Reseteando contraseñas...\n')

  try {
    // Lista de usuarios para resetear
    const usuarios = [
      { email: 'admin@dgac.gob.cl', password: 'Admin123!' },
      { email: 'jperezsilva@dgac.gob.cl', password: 'NuevaPass123!' },
    ]

    for (const userData of usuarios) {
      // Buscar usuario
      const user = await prisma.usuario.findUnique({
        where: { email: userData.email }
      })

      if (!user) {
        console.log(`⚠️  Usuario ${userData.email} no existe - omitiendo`)
        continue
      }

      // Hashear nueva contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // Actualizar
      await prisma.usuario.update({
        where: { email: userData.email },
        data: { password: hashedPassword }
      })

      console.log(`✅ ${userData.email}`)
      console.log(`   Nueva contraseña: ${userData.password}`)
      console.log(`   Hash guardado: ${hashedPassword.substring(0, 20)}...`)
      console.log('')
    }

    console.log('🎉 Contraseñas reseteadas correctamente!\n')
    console.log('Puedes hacer login con:')
    usuarios.forEach(u => {
      console.log(`  📧 ${u.email}`)
      console.log(`  🔑 ${u.password}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error al resetear contraseñas:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetPasswords()

