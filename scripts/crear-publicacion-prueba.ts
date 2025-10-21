import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function crearPublicacionPrueba() {
  try {
    console.log('🚀 Iniciando creación de publicación de prueba...\n')
    
    // 1. Verificar/Crear Unidad
    console.log('📍 Paso 1: Verificando unidad...')
    let unidad = await prisma.unidad.findFirst({
      where: { activa: true }
    })
    
    if (!unidad) {
      console.log('   ⚠️  No hay unidades. Creando una...')
      unidad = await prisma.unidad.create({
        data: {
          codigo: 'ACCO-SCEL',
          nombre: 'Centro de Control de Área Oceánico',
          sigla: 'ACC-O',
          tipoProfesion: 'ATC',
          activa: true,
          horarioOperacion: 'H24',
        }
      })
      console.log(`   ✅ Unidad creada: ${unidad.nombre} (${unidad.codigo})`)
    } else {
      console.log(`   ✅ Unidad encontrada: ${unidad.nombre} (${unidad.codigo})`)
    }
    
    // 2. Verificar/Crear Tipos de Turno
    console.log('\n🔄 Paso 2: Verificando tipos de turno...')
    const tiposTurnoExistentes = await prisma.tipoTurno.count({
      where: { unidadId: unidad.id }
    })
    
    if (tiposTurnoExistentes === 0) {
      console.log('   ⚠️  No hay tipos de turno. Creando tipos básicos...')
      
      const tiposTurno = [
        { codigo: 'M', nombre: 'Mañana', horaInicio: '08:00', horaFin: '16:00', duracionHoras: 8, color: '#3B82F6' },
        { codigo: 'T', nombre: 'Tarde', horaInicio: '16:00', horaFin: '00:00', duracionHoras: 8, color: '#F59E0B' },
        { codigo: 'N', nombre: 'Noche', horaInicio: '00:00', horaFin: '08:00', duracionHoras: 8, color: '#6366F1', esNocturno: true },
        { codigo: 'D', nombre: 'Descanso', duracionHoras: 0, color: '#10B981', esOperativo: false },
        { codigo: 'L', nombre: 'Libre', duracionHoras: 0, color: '#6B7280', esOperativo: false },
      ]
      
      for (const tipo of tiposTurno) {
        await prisma.tipoTurno.create({
          data: {
            ...tipo,
            unidadId: unidad.id,
            activo: true,
            orden: tiposTurno.indexOf(tipo),
            creadoPor: 'system'
          }
        })
      }
      console.log(`   ✅ ${tiposTurno.length} tipos de turno creados`)
    } else {
      console.log(`   ✅ ${tiposTurnoExistentes} tipos de turno encontrados`)
    }
    
    // 3. Obtener usuario admin
    console.log('\n👤 Paso 3: Buscando usuario creador...')
    const admin = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: 'admin@dgac.gob.cl' },
          { rol: 'ADMIN_SISTEMA' }
        ]
      }
    })
    
    if (!admin) {
      console.log('   ❌ No se encontró un usuario admin')
      return
    }
    console.log(`   ✅ Usuario encontrado: ${admin.email}`)
    
    // 4. Crear Publicación
    console.log('\n📅 Paso 4: Creando publicación de turnos...')
    const ahora = new Date()
    const mes = 10 // Octubre
    const año = 2025
    
    const publicacion = await prisma.publicacionTurnos.create({
      data: {
        mes,
        año,
        unidadId: unidad.id,
        estado: 'BORRADOR',
        fechaInicio: new Date(año, mes - 1, 1),
        fechaFin: new Date(año, mes, 0),
        creadoPor: admin.id,
      }
    })
    
    console.log('\n✅ ¡PUBLICACIÓN CREADA EXITOSAMENTE!\n')
    console.log('═'.repeat(60))
    console.log(`📋 ID:              ${publicacion.id}`)
    console.log(`📅 Período:         Octubre ${año}`)
    console.log(`🏢 Unidad:          ${unidad.nombre}`)
    console.log(`📊 Estado:          ${publicacion.estado}`)
    console.log(`👤 Creado por:      ${admin.email}`)
    console.log('═'.repeat(60))
    console.log('\n🌐 URLs para Testing:\n')
    console.log(`   📊 Ver:     http://localhost:3001/turnos/${publicacion.id}`)
    console.log(`   ✏️  Editar:  http://localhost:3001/turnos/${publicacion.id}/editar`)
    console.log('\n🎯 Siguiente paso: Navega a la URL de Editar para probar el drag & drop\n')
    
    return publicacion
    
  } catch (error) {
    console.error('\n❌ Error al crear publicación:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar
crearPublicacionPrueba()

