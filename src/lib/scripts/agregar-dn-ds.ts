import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function agregarDNDS() {
  console.log('🔍 Verificando unidad...')
  const unidad = await prisma.unidad.findFirst({
    where: { activa: true }
  })
  
  if (!unidad) {
    console.error('❌ No se encontró ninguna unidad activa')
    return
  }
  
  console.log(`✅ Unidad encontrada: ${unidad.nombre}\n`)
  
  // Verificar si DN ya existe y eliminarlo si es necesario
  const dnExistente = await prisma.tipoTurno.findFirst({
    where: { 
      unidadId: unidad.id,
      codigo: 'DN' 
    }
  })
  
  if (dnExistente) {
    console.log('🗑️  Eliminando DN existente (será recreado con valores correctos)...')
    await prisma.tipoTurno.delete({
      where: { id: dnExistente.id }
    })
  }
  
  // Verificar si DS ya existe
  const dsExistente = await prisma.tipoTurno.findFirst({
    where: { 
      unidadId: unidad.id,
      codigo: 'DS' 
    }
  })
  
  if (dsExistente) {
    console.log('✅ DS ya existe, no se recreará\n')
  }
  
  console.log('✅ Agregando tipos de turno DN y DS...\n')
  
  const tiposNuevos = [
    {
      codigo: 'DN',
      nombre: 'Descanso Complementario Turno Noche (3.5 Horas)',
      horaInicio: '20:30',
      horaFin: '00:00',
      duracionHoras: 0,
      devolucionHoras: 3.5,
      color: '#4B5563', // Gris oscuro
      esOperativo: false,
      esNocturno: true
    },
    {
      codigo: 'DS', 
      nombre: 'Descanso Complementario Turno Saliente Noche (8.5 Horas)',
      horaInicio: '00:00',
      horaFin: '08:30',
      duracionHoras: 0,
      devolucionHoras: 8.5,
      color: '#374151', // Gris más oscuro
      esOperativo: false,
      esNocturno: true
    }
  ]
  
  for (const tipo of tiposNuevos) {
    // Solo crear si no existe
    const existe = await prisma.tipoTurno.findFirst({
      where: {
        unidadId: unidad.id,
        codigo: tipo.codigo
      }
    })
    
    if (existe) {
      console.log(`⏭️  ${tipo.codigo} ya existe, saltando...`)
      continue
    }
    
    await prisma.tipoTurno.create({
      data: {
        unidadId: unidad.id,
        codigo: tipo.codigo,
        nombre: tipo.nombre,
        horaInicio: tipo.horaInicio,
        horaFin: tipo.horaFin,
        duracionHoras: tipo.duracionHoras,
        activo: true,
        color: tipo.color,
        esOperativo: tipo.esOperativo,
        esNocturno: tipo.esNocturno,
        creadoPor: 'SYSTEM',
        orden: 999 // Al final
      }
    })
    console.log(`✅ ${tipo.codigo.padEnd(5)} - ${tipo.nombre}`)
  }
  
  // Verificar total
  const total = await prisma.tipoTurno.count({
    where: { unidadId: unidad.id }
  })
  
  console.log(`\n✅ Total tipos de turno en base de datos: ${total}`)
  
  // Listar todos los tipos actuales
  const todos = await prisma.tipoTurno.findMany({
    where: { unidadId: unidad.id },
    orderBy: { codigo: 'asc' },
    select: { codigo: true, nombre: true }
  })
  
  console.log('\n📋 Tipos de turno actuales:')
  todos.forEach(t => console.log(`   ${t.codigo.padEnd(5)} - ${t.nombre}`))
}

agregarDNDS()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

