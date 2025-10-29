// scripts/diagnosticar-metricas.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 DIAGNÓSTICO DE MÉTRICAS HLM\n')

  // 1. Buscar usuarios Alex e Ivan
  console.log('📋 PASO 1: Buscar usuarios problemáticos')
  const alex = await prisma.usuario.findFirst({
    where: {
      nombre: { contains: 'Alex', mode: 'insensitive' },
      apellido: { contains: 'Carrillo', mode: 'insensitive' }
    },
    select: { id: true, nombre: true, apellido: true }
  })

  const ivan = await prisma.usuario.findFirst({
    where: {
      nombre: { contains: 'Ivan', mode: 'insensitive' },
      apellido: { contains: 'Fernandez', mode: 'insensitive' }
    },
    select: { id: true, nombre: true, apellido: true }
  })

  if (alex) {
    console.log('  ✅ Alex Mauricio Carrillo Sanhueza')
    console.log('     ID:', alex.id)
  } else {
    console.log('  ❌ Alex no encontrado')
  }

  if (ivan) {
    console.log('  ✅ Ivan Fernandez Navarrete')
    console.log('     ID:', ivan.id)
  } else {
    console.log('  ❌ Ivan no encontrado')
  }

  // 2. Buscar publicación de Octubre 2025
  console.log('\n📋 PASO 2: Buscar publicación de Octubre 2025')
  const publicacion = await prisma.publicacionTurnos.findFirst({
    where: {
      mes: 10,
      año: 2025
    },
    select: { id: true, mes: true, año: true, _count: { select: { asignaciones: true } } }
  })

  if (!publicacion) {
    console.log('  ❌ Publicación no encontrada')
    await prisma.$disconnect()
    return
  }

  console.log('  ✅ Publicación encontrada:')
  console.log('     ID:', publicacion.id)
  console.log('     Total asignaciones:', publicacion._count.asignaciones)

  // 3. Verificar turnos de Alex e Ivan
  if (alex) {
    console.log('\n📋 PASO 3: Turnos de Alex Carrillo')
    const turnosAlex = await prisma.asignacionTurno.findMany({
      where: {
        publicacionId: publicacion.id,
        usuarioId: alex.id
      },
      include: {
        tipoTurno: {
          select: { codigo: true, nombre: true }
        }
      }
    })
    console.log('  Cantidad de turnos:', turnosAlex.length)
    if (turnosAlex.length > 0) {
      turnosAlex.forEach(t => {
        console.log(`    - ${t.tipoTurno?.codigo}: ${t.fecha}`)
      })
    }
  }

  if (ivan) {
    console.log('\n📋 PASO 4: Turnos de Ivan Fernandez')
    const turnosIvan = await prisma.asignacionTurno.findMany({
      where: {
        publicacionId: publicacion.id,
        usuarioId: ivan.id
      },
      include: {
        tipoTurno: {
          select: { codigo: true, nombre: true }
        }
      }
    })
    console.log('  Cantidad de turnos:', turnosIvan.length)
    if (turnosIvan.length > 0) {
      turnosIvan.forEach(t => {
        console.log(`    - ${t.tipoTurno?.codigo}: ${t.fecha}`)
      })
    }
  }

  // 4. Listar TODAS las asignaciones de la publicación
  console.log('\n📋 PASO 5: Todas las asignaciones de la publicación')
  const todasLasAsignaciones = await prisma.asignacionTurno.findMany({
    where: { publicacionId: publicacion.id },
    include: {
      usuario: { select: { nombre: true, apellido: true } },
      tipoTurno: { select: { codigo: true } }
    },
    orderBy: [{ fecha: 'asc' }, { usuario: { apellido: 'asc' } }]
  })

  console.log('  Total asignaciones en BD:', todasLasAsignaciones.length)
  const groupedByUser = todasLasAsignaciones.reduce((acc, asig) => {
    const key = `${asig.usuario.nombre} ${asig.usuario.apellido}`
    if (!acc[key]) acc[key] = 0
    acc[key]++
    return acc
  }, {} as Record<string, number>)

  console.log('\n  Asignaciones por usuario:')
  Object.entries(groupedByUser).forEach(([nombre, count]) => {
    console.log(`    ${nombre}: ${count} turnos`)
  })

  console.log('\n✅ Diagnóstico completado')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

