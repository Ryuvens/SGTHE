import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// LISTA COMPLETA DE 29 TIPOS DE TURNO OFICIALES
const TIPOS_TURNO_OFICIALES = [
  { codigo: 'A', nombre: 'Administrativo (Lunes a Jueves)', horaInicio: '08:00', horaFin: '17:00', totalHoras: 9, devolucionHoras: 0 },
  { codigo: 'AV', nombre: 'Administrativo (Viernes)', horaInicio: '08:00', horaFin: '16:00', totalHoras: 8, devolucionHoras: 0 },
  { codigo: 'OP', nombre: 'Operacional', horaInicio: '07:30', horaFin: '19:30', totalHoras: 12, devolucionHoras: 0 },
  { codigo: 'OE', nombre: 'Operaciones Extendido', horaInicio: '08:30', horaFin: '20:30', totalHoras: 12, devolucionHoras: 0 },
  { codigo: 'B', nombre: 'Berlitz', horaInicio: '08:00', horaFin: '17:00', totalHoras: 9, devolucionHoras: 0 },
  { codigo: 'CIC', nombre: 'Día CIC', horaInicio: '08:30', horaFin: '20:30', totalHoras: 12, devolucionHoras: 0 },
  { codigo: 'C', nombre: 'Comisión (Lunes a Jueves)', horaInicio: '08:00', horaFin: '17:00', totalHoras: 9, devolucionHoras: 0 },
  { codigo: 'CV', nombre: 'Comisión (Viernes)', horaInicio: '08:00', horaFin: '16:30', totalHoras: 8, devolucionHoras: 0 },
  { codigo: 'D', nombre: 'Turno Día', horaInicio: '08:30', horaFin: '20:30', totalHoras: 12, devolucionHoras: 0 },
  { codigo: 'D11S', nombre: 'Día 11sept', horaInicio: '08:30', horaFin: '18:20', totalHoras: 9.5, devolucionHoras: 0 },
  { codigo: 'DA', nombre: 'Descanso Complementario (Lunes a Jueves)', horaInicio: '08:00', horaFin: '17:00', totalHoras: 0, devolucionHoras: 9 },
  { codigo: 'DV', nombre: 'Descanso Complementario (Viernes)', horaInicio: '08:00', horaFin: '18:00', totalHoras: 0, devolucionHoras: 8 },
  { codigo: 'DC', nombre: 'Descanso Complementario (12 Horas)', horaInicio: '08:30', horaFin: '20:30', totalHoras: 0, devolucionHoras: 12 },
  { codigo: 'DN', nombre: 'Descanso Complementario (4 Horas)', horaInicio: '', horaFin: '', totalHoras: 0, devolucionHoras: 4 },
  { codigo: 'E', nombre: 'Entrenamiento (Lunes a Jueves)', horaInicio: '08:30', horaFin: '17:30', totalHoras: 9, devolucionHoras: 0 },
  { codigo: 'EV', nombre: 'Entrenamiento (Viernes)', horaInicio: '08:30', horaFin: '16:30', totalHoras: 8, devolucionHoras: 0 },
  { codigo: 'FLA', nombre: 'Feriado Legal Anual', horaInicio: '', horaFin: '', totalHoras: 0, devolucionHoras: 0 },
  { codigo: 'IA', nombre: 'Instrucción Administrativo (Lunes a Jueves)', horaInicio: '08:00', horaFin: '17:00', totalHoras: 9, devolucionHoras: 0 },
  { codigo: 'IAV', nombre: 'Instrucción Administrativo (Viernes)', horaInicio: '08:00', horaFin: '16:00', totalHoras: 8, devolucionHoras: 0 },
  { codigo: 'ID', nombre: 'Instrucción Día', horaInicio: '08:30', horaFin: '20:30', totalHoras: 12, devolucionHoras: 0 },
  { codigo: 'IN', nombre: 'Instrucción Noche', horaInicio: '20:30', horaFin: '00:00', totalHoras: 3.5, devolucionHoras: 0 },
  { codigo: 'IS', nombre: 'Instrucción Saliente', horaInicio: '00:00', horaFin: '08:30', totalHoras: 8.5, devolucionHoras: 0 },
  { codigo: 'L', nombre: 'Licencia médica', horaInicio: '', horaFin: '', totalHoras: 0, devolucionHoras: 0 },
  { codigo: 'N', nombre: 'Turno Noche', horaInicio: '20:30', horaFin: '00:00', totalHoras: 3.5, devolucionHoras: 0 },
  { codigo: 'S', nombre: 'Turno Saliente Noche', horaInicio: '00:00', horaFin: '08:30', totalHoras: 8.5, devolucionHoras: 0 },
  { codigo: 'O', nombre: 'Día Operacional (Lunes a Jueves)', horaInicio: '08:30', horaFin: '17:30', totalHoras: 9, devolucionHoras: 0 },
  { codigo: 'OV', nombre: 'Día Operacional (Viernes)', horaInicio: '08:30', horaFin: '16:00', totalHoras: 8, devolucionHoras: 0 },
  { codigo: 'PA', nombre: 'Permiso Administrativo (Lunes a Jueves)', horaInicio: '08:00', horaFin: '17:00', totalHoras: 9, devolucionHoras: 0 },
  { codigo: 'PAV', nombre: 'Permiso Administrativo (Viernes)', horaInicio: '08:00', horaFin: '16:00', totalHoras: 8, devolucionHoras: 0 },
  { codigo: 'R', nombre: 'Reunión Operacional', horaInicio: '09:00', horaFin: '13:00', totalHoras: 4, devolucionHoras: 0 }
]

async function fixTiposTurno() {
  console.log('🔍 Verificando unidad...')
  const unidad = await prisma.unidad.findFirst({
    where: { activa: true }
  })
  
  if (!unidad) {
    console.error('❌ No se encontró ninguna unidad activa')
    return
  }
  
  console.log(`✅ Unidad encontrada: ${unidad.nombre}\n`)
  
  // Primero eliminar todas las asignaciones de turno (para evitar error de FK)
  console.log('🗑️ Paso 1: Eliminando todas las asignaciones de turno existentes...')
  const deletedAsignaciones = await prisma.asignacionTurno.deleteMany({
    where: { 
      publicacion: { unidadId: unidad.id }
    }
  })
  console.log(`   Eliminadas: ${deletedAsignaciones.count} asignaciones de turno\n`)
  
  console.log('🗑️ Paso 2: Eliminando TODOS los tipos de turno existentes...')
  const deleted = await prisma.tipoTurno.deleteMany({
    where: { unidadId: unidad.id }
  })
  console.log(`   Eliminados: ${deleted.count} tipos de turno\n`)
  
  console.log('✅ Cargando los 29 tipos de turno oficiales DGAC...\n')
  
  for (const tipo of TIPOS_TURNO_OFICIALES) {
    await prisma.tipoTurno.create({
      data: {
        unidadId: unidad.id,
        codigo: tipo.codigo,
        nombre: tipo.nombre,
        horaInicio: tipo.horaInicio || null,
        horaFin: tipo.horaFin || null,
        duracionHoras: tipo.totalHoras,
        activo: true,
        color: obtenerColor(tipo.codigo),
        esOperativo: esOperativo(tipo.codigo),
        esNocturno: esNocturno(tipo.codigo),
        creadoPor: 'SYSTEM',
        orden: TIPOS_TURNO_OFICIALES.indexOf(tipo)
      }
    })
    const devolucion = tipo.devolucionHoras > 0 ? ` (Devuelve ${tipo.devolucionHoras}h)` : ''
    console.log(`✅ ${tipo.codigo.padEnd(5)} - ${tipo.nombre.padEnd(50)} (${tipo.totalHoras}h)${devolucion}`)
  }
  
  // Verificar que NO existan F ni PO
  const verificar = await prisma.tipoTurno.findMany({
    where: { 
      unidadId: unidad.id,
      codigo: { in: ['F', 'PO'] } 
    }
  })
  
  if (verificar.length > 0) {
    console.log('\n❌ ERROR: Se encontraron tipos incorrectos:', verificar)
  } else {
    console.log('\n✅ Verificado: No existen tipos F ni PO')
  }
  
  const total = await prisma.tipoTurno.count({
    where: { unidadId: unidad.id }
  })
  
  console.log(`\n✅ Total: ${total} tipos de turno cargados correctamente`)
  console.log(`✅ Esperados: ${TIPOS_TURNO_OFICIALES.length} tipos`)
  
  if (total === TIPOS_TURNO_OFICIALES.length) {
    console.log('\n🎉 ¡Todos los tipos de turno oficiales cargados exitosamente!')
  } else {
    console.log(`\n⚠️ ADVERTENCIA: Se esperaban ${TIPOS_TURNO_OFICIALES.length} pero se cargaron ${total}`)
  }
}

function obtenerColor(codigo: string): string {
  const colores: Record<string, string> = {
    // Administrativos - Azules
    'A': '#3B82F6', 'AV': '#60A5FA',
    // Operacionales - Verdes  
    'OP': '#10B981', 'OE': '#059669', 'O': '#34D399', 'OV': '#6EE7B7',
    // Turnos principales - Naranjas/Índigos
    'D': '#F59E0B', 'N': '#6366F1', 'S': '#8B5CF6',
    // Descansos - Grises
    'DA': '#6B7280', 'DV': '#9CA3AF', 'DC': '#D1D5DB', 'DN': '#E5E7EB',
    // Entrenamientos - Rosas
    'E': '#EC4899', 'EV': '#F472B6',
    // Instrucciones - Púrpuras
    'IA': '#A78BFA', 'IAV': '#C4B5FD', 'ID': '#8B5CF6', 'IN': '#7C3AED', 'IS': '#6D28D9',
    // Especiales
    'L': '#EF4444',    // Licencia - Rojo
    'FLA': '#FBBF24',  // Feriado - Amarillo
    'C': '#0EA5E9', 'CV': '#38BDF8', // Comisión - Cyan
    'PA': '#94A3B8', 'PAV': '#CBD5E1', // Permisos - Gris azulado
    'R': '#A855F7',    // Reunión - Púrpura
    'B': '#14B8A6',    // Berlitz - Teal
    'CIC': '#0891B2',  // CIC - Cyan oscuro
    'D11S': '#DC2626'  // 11 Sept - Rojo especial
  }
  return colores[codigo] || '#6B7280'
}

function esOperativo(codigo: string): boolean {
  const operativos = ['OP', 'OE', 'D', 'N', 'S', 'O', 'OV', 'ID', 'IN', 'IS', 'CIC']
  return operativos.includes(codigo)
}

function esNocturno(codigo: string): boolean {
  const nocturnos = ['N', 'S', 'IN', 'IS']
  return nocturnos.includes(codigo)
}

fixTiposTurno()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

