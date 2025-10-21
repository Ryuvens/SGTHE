import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Tipos de turno según documento oficial DGAC
const TIPOS_TURNO_OFICIALES = [
  { codigo: 'A', nombre: 'Administrativo (Lunes a Jueves)', horaInicio: '08:00', horaFin: '17:00', duracionHoras: 9, esOperativo: false },
  { codigo: 'AV', nombre: 'Administrativo (Viernes)', horaInicio: '08:00', horaFin: '16:30', duracionHoras: 8, esOperativo: false },
  { codigo: 'OP', nombre: 'Operacional', horaInicio: '07:30', horaFin: '19:30', duracionHoras: 12, esOperativo: true },
  { codigo: 'OE', nombre: 'Operaciones Extendido', horaInicio: '08:30', horaFin: '20:30', duracionHoras: 12, esOperativo: true },
  { codigo: 'D', nombre: 'Turno Día', horaInicio: '08:30', horaFin: '20:30', duracionHoras: 12, esOperativo: true },
  { codigo: 'N', nombre: 'Turno Noche', horaInicio: '20:30', horaFin: '00:00', duracionHoras: 3.5, esOperativo: true, esNocturno: true },
  { codigo: 'S', nombre: 'Turno Saliente Noche', horaInicio: '00:00', horaFin: '08:30', duracionHoras: 8.5, esOperativo: true, esNocturno: true },
  { codigo: 'DA', nombre: 'Descanso Complementario (Lunes a Jueves)', horaInicio: '08:00', horaFin: '17:00', duracionHoras: 0, esOperativo: false },
  { codigo: 'DV', nombre: 'Descanso Complementario (Viernes)', horaInicio: '08:00', horaFin: '18:00', duracionHoras: 0, esOperativo: false },
  { codigo: 'DC', nombre: 'Descanso Complementario (12 Horas)', horaInicio: '08:30', horaFin: '20:30', duracionHoras: 0, esOperativo: false },
  { codigo: 'E', nombre: 'Entrenamiento (Lunes a Jueves)', horaInicio: '08:30', horaFin: '17:30', duracionHoras: 9, esOperativo: false },
  { codigo: 'L', nombre: 'Licencia médica', horaInicio: '', horaFin: '', duracionHoras: 0, esOperativo: false },
  { codigo: 'FLA', nombre: 'Feriado Legal Anual', horaInicio: '', horaFin: '', duracionHoras: 0, esOperativo: false },
  { codigo: 'C', nombre: 'Comisión (Lunes a Jueves)', horaInicio: '08:00', horaFin: '17:00', duracionHoras: 9, esOperativo: false },
  { codigo: 'R', nombre: 'Reunión Operacional', horaInicio: '09:00', horaFin: '13:00', duracionHoras: 4, esOperativo: false },
]

// Colores para visualización (coherentes con el sistema)
const COLORES_TURNO: Record<string, string> = {
  'A': '#3B82F6',   // Azul - Administrativo
  'AV': '#60A5FA',  // Azul claro
  'D': '#F59E0B',   // Naranja - Día
  'N': '#6366F1',   // Índigo - Noche
  'S': '#8B5CF6',   // Violeta - Saliente
  'OP': '#10B981',  // Verde - Operacional
  'OE': '#059669',  // Verde oscuro
  'DA': '#6B7280',  // Gris - Descansos
  'DV': '#9CA3AF',  
  'DC': '#D1D5DB',
  'E': '#EC4899',   // Rosa - Entrenamiento
  'L': '#EF4444',   // Rojo - Licencia
  'FLA': '#FBBF24', // Amarillo - Feriado
  'C': '#0EA5E9',   // Cyan - Comisión
  'R': '#A78BFA',   // Púrpura - Reunión
}

async function cargarTiposTurnoOficiales() {
  try {
    console.log('🔄 Cargando Tipos de Turno Oficiales DGAC...\n')
    
    // Obtener todas las unidades
    const unidades = await prisma.unidad.findMany({
      where: { activa: true }
    })
    
    if (unidades.length === 0) {
      console.log('❌ No hay unidades activas. Crea una unidad primero.')
      return
    }
    
    console.log(`📍 Unidades encontradas: ${unidades.length}\n`)
    
    for (const unidad of unidades) {
      console.log(`\n🏢 Procesando: ${unidad.nombre} (${unidad.codigo})`)
      console.log('─'.repeat(60))
      
      // Actualizar o crear tipos de turno oficiales
      let actualizados = 0
      let creados = 0
      
      for (const tipo of TIPOS_TURNO_OFICIALES) {
        const existente = await prisma.tipoTurno.findFirst({
          where: {
            unidadId: unidad.id,
            codigo: tipo.codigo
          }
        })
        
        if (existente) {
          // Actualizar existente
          await prisma.tipoTurno.update({
            where: { id: existente.id },
            data: {
              nombre: tipo.nombre,
              descripcion: `Tipo de turno oficial DGAC: ${tipo.nombre}`,
              horaInicio: tipo.horaInicio || null,
              horaFin: tipo.horaFin || null,
              duracionHoras: tipo.duracionHoras,
              esOperativo: tipo.esOperativo,
              esNocturno: tipo.esNocturno || false,
              esDiaInhabil: false,
              color: COLORES_TURNO[tipo.codigo] || '#6B7280',
              activo: true,
              orden: TIPOS_TURNO_OFICIALES.indexOf(tipo),
              modificadoPor: 'system',
            }
          })
          actualizados++
          console.log(`   🔄 ${tipo.codigo.padEnd(4)} - ${tipo.nombre} (actualizado)`)
        } else {
          // Crear nuevo
          await prisma.tipoTurno.create({
            data: {
              unidadId: unidad.id,
              codigo: tipo.codigo,
              nombre: tipo.nombre,
              descripcion: `Tipo de turno oficial DGAC: ${tipo.nombre}`,
              horaInicio: tipo.horaInicio || null,
              horaFin: tipo.horaFin || null,
              duracionHoras: tipo.duracionHoras,
              esOperativo: tipo.esOperativo,
              esNocturno: tipo.esNocturno || false,
              esDiaInhabil: false,
              color: COLORES_TURNO[tipo.codigo] || '#6B7280',
              activo: true,
              orden: TIPOS_TURNO_OFICIALES.indexOf(tipo),
              creadoPor: 'system',
            }
          })
          creados++
          console.log(`   ✅ ${tipo.codigo.padEnd(4)} - ${tipo.nombre} (nuevo)`)
        }
      }
      
      console.log(`\n   📊 Actualizados: ${actualizados} | Creados: ${creados} | Total: ${actualizados + creados}`)
    }
    
    console.log('\n' + '═'.repeat(60))
    console.log('✅ TIPOS DE TURNO OFICIALES CARGADOS EXITOSAMENTE')
    console.log('═'.repeat(60))
    console.log('\n📋 Resumen de Tipos de Turno:\n')
    
    const resumen = TIPOS_TURNO_OFICIALES.map(t => ({
      Código: t.codigo,
      Nombre: t.nombre,
      Horario: t.horaInicio && t.horaFin ? `${t.horaInicio}-${t.horaFin}` : 'Variable',
      Horas: `${t.duracionHoras}h`,
      Tipo: t.esOperativo ? 'Operativo' : 'No Operativo'
    }))
    
    console.table(resumen)
    
    console.log('\n🎯 Siguiente paso: Refresca la página de edición de turnos')
    console.log('   Los nuevos tipos aparecerán en el sidebar\n')
    
  } catch (error) {
    console.error('\n❌ Error al cargar tipos de turno:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar
cargarTiposTurnoOficiales()

