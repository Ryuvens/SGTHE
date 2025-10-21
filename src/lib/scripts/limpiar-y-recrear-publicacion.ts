import { PrismaClient } from '@prisma/client'
import { startOfMonth, endOfMonth } from 'date-fns'

const prisma = new PrismaClient()

async function limpiarYRecrear() {
  console.log('🧹 LIMPIANDO Y RECREANDO PUBLICACIÓN DE PRUEBA\n')
  
  // 1. Eliminar publicación existente (esto eliminará las asignaciones por CASCADE)
  console.log('🗑️ Eliminando publicación existente...')
  await prisma.publicacionTurnos.deleteMany({
    where: { id: 'cmgzt1ysf000110fmbrbyaq74' }
  })
  console.log('✅ Publicación eliminada\n')
  
  // 2. Verificar unidad y admin
  const unidad = await prisma.unidad.findFirst({
    where: { activa: true }
  })
  
  const admin = await prisma.usuario.findFirst({
    where: { rol: 'ADMIN_SISTEMA' }
  })
  
  if (!unidad || !admin) {
    console.error('❌ No se encontró unidad o admin')
    return
  }
  
  console.log(`✅ Unidad: ${unidad.nombre}`)
  console.log(`✅ Admin: ${admin.nombre} ${admin.apellido}\n`)
  
  // 3. Crear nueva publicación
  console.log('📝 Creando nueva publicación para Octubre 2025...')
  const publicacion = await prisma.publicacionTurnos.create({
    data: {
      id: 'cmgzt1ysf000110fmbrbyaq74', // Mantener el mismo ID para no cambiar URL
      mes: 10,
      año: 2025,
      unidadId: unidad.id,
      estado: 'BORRADOR',
      fechaInicio: startOfMonth(new Date(2025, 9)),
      fechaFin: endOfMonth(new Date(2025, 9)),
      creadoPor: admin.id,
    }
  })
  
  console.log(`✅ Publicación creada: ${publicacion.id}`)
  console.log(`   Período: Octubre 2025`)
  console.log(`   Estado: ${publicacion.estado}\n`)
  
  console.log('🎉 Listo para testing!')
  console.log('\n📋 Siguiente paso:')
  console.log('   1. Recargar página (F5) en el navegador')
  console.log('   2. Calendario estará vacío y listo para asignar turnos')
  console.log('   3. Arrastra tipos de turno desde el sidebar')
  console.log('   4. Prueba mover y eliminar turnos\n')
}

limpiarYRecrear()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

