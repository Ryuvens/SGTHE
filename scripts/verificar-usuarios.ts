import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verificarUsuarios() {
  try {
    console.log('👥 Verificando usuarios disponibles...\n')
    
    const unidad = await prisma.unidad.findFirst({
      where: { codigo: 'ACCO' }
    })
    
    if (!unidad) {
      console.log('❌ No se encontró la unidad ACCO')
      return
    }
    
    const usuarios = await prisma.usuario.findMany({
      where: {
        unidadId: unidad.id,
        activo: true,
      },
      include: {
        abreviatura: {
          select: {
            codigo: true
          }
        }
      },
      orderBy: {
        apellido: 'asc'
      }
    })
    
    console.log(`📊 Total usuarios activos en ${unidad.nombre}: ${usuarios.length}\n`)
    
    if (usuarios.length === 0) {
      console.log('⚠️  No hay usuarios en esta unidad para asignar turnos')
      console.log('💡 Se necesitarían crear usuarios de prueba\n')
    } else {
      console.log('✅ Usuarios disponibles para asignar turnos:\n')
      usuarios.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nombre} ${user.apellido}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Abreviatura: ${user.abreviatura?.codigo || 'N/A'}`)
        console.log(`   Rol: ${user.rol}`)
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verificarUsuarios()

