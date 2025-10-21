import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verificarPublicaciones() {
  try {
    console.log('🔍 Verificando publicaciones existentes...\n')
    
    const publicaciones = await prisma.publicacionTurnos.findMany({
      include: {
        unidad: {
          select: {
            nombre: true,
            codigo: true,
          }
        },
        _count: {
          select: {
            asignaciones: true
          }
        }
      },
      orderBy: [
        { año: 'desc' },
        { mes: 'desc' }
      ]
    })
    
    console.log(`📊 Total de publicaciones: ${publicaciones.length}\n`)
    
    if (publicaciones.length === 0) {
      console.log('❌ No hay publicaciones de turnos en la base de datos')
      console.log('💡 Se necesita crear una publicación de prueba\n')
    } else {
      console.log('✅ Publicaciones encontradas:\n')
      publicaciones.forEach((pub, index) => {
        console.log(`${index + 1}. ID: ${pub.id}`)
        console.log(`   Período: ${pub.mes}/${pub.año}`)
        console.log(`   Unidad: ${pub.unidad.nombre} (${pub.unidad.codigo})`)
        console.log(`   Estado: ${pub.estado}`)
        console.log(`   Asignaciones: ${pub._count.asignaciones}`)
        console.log(`   URL Ver: http://localhost:3001/turnos/${pub.id}`)
        console.log(`   URL Editar: http://localhost:3001/turnos/${pub.id}/editar`)
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verificarPublicaciones()

