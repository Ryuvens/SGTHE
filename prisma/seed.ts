import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed con estructura REAL del ACCO...')

  // ============================================
  // 1. CREAR UNIDAD ACCO
  // ============================================
  console.log('📍 Creando unidad ACCO...')

  const acco = await prisma.unidad.create({
    data: {
      nombre: 'Centro de Control de Área Oceánico',
      codigo: 'ACCO',
      sigla: 'ACCO',
      tipoProfesion: 'ATC',
      activa: true,
      horarioOperacion: 'H24',
    },
  })

  await prisma.configuracionUnidadATS.create({
    data: {
      unidadId: acco.id,
      horarioOperacion: 'H24',
      dotacionRequerida: 6,
    },
  })

  // ============================================
  // 2. PUESTOS DE TRABAJO
  // ============================================
  console.log('🏢 Creando puestos de trabajo...')

  await prisma.puestoTrabajo.create({
    data: {
      unidadId: acco.id,
      nombre: 'Sector Oscar',
      codigo: 'ACC-O',
      tipo: 'ACC',
      horarioOperacion: 'H24',
      dotacionRequerida: 6,
      activo: true,
    },
  })

  await prisma.puestoTrabajo.create({
    data: {
      unidadId: acco.id,
      nombre: 'Sector November',
      codigo: 'ACC-N',
      tipo: 'ACC',
      horarioOperacion: 'H24',
      dotacionRequerida: 6,
      activo: true,
    },
  })

  // ============================================
  // 3. TIPOS DE TURNO
  // ============================================
  console.log('⏰ Creando tipos de turno...')

  const tiposTurno = [
    { codigo: 'D', nombre: 'Día', descripcion: 'Turno diurno', horaInicio: '07:00', horaFin: '15:00', duracionHoras: 8.0, esOperativo: true, esNocturno: false, color: '#FFD700' },
    { codigo: 'N', nombre: 'Noche', descripcion: 'Turno nocturno', horaInicio: '23:00', horaFin: '07:00', duracionHoras: 8.0, esOperativo: true, esNocturno: true, color: '#1E3A8A' },
    { codigo: 'S', nombre: 'Servicio', descripcion: 'Turno de servicio', horaInicio: '08:00', horaFin: '20:00', duracionHoras: 12.0, esOperativo: true, esNocturno: false, color: '#10B981' },
    { codigo: 'f', nombre: 'Franca', descripcion: 'Día franco/descanso', horaInicio: null, horaFin: null, duracionHoras: 0, esOperativo: false, esNocturno: false, color: '#9CA3AF' },
    { codigo: 'AL', nombre: 'Asunto Laboral', descripcion: 'Asunto laboral', horaInicio: null, horaFin: null, duracionHoras: 0, esOperativo: false, esNocturno: false, color: '#F59E0B' },
    { codigo: 'A', nombre: 'Administración', descripcion: 'Turno administrativo', horaInicio: '08:00', horaFin: '17:00', duracionHoras: 9.0, esOperativo: false, esNocturno: false, color: '#8B5CF6' },
    { codigo: 'DC', nombre: 'Día de Control', descripcion: 'Día completo de control', horaInicio: '08:00', horaFin: '20:00', duracionHoras: 12.0, esOperativo: true, esNocturno: false, color: '#06B6D4' },
    { codigo: 'ID', nombre: 'Instrucción/Docencia', descripcion: 'Actividad de instrucción', horaInicio: '08:00', horaFin: '17:00', duracionHoras: 9.0, esOperativo: false, esNocturno: false, color: '#EC4899' },
    { codigo: 'PO', nombre: 'Posición Operativa', descripcion: 'En posición operativa', horaInicio: '08:00', horaFin: '20:00', duracionHoras: 12.0, esOperativo: true, esNocturno: false, color: '#14B8A6' },
  ]

  for (const tipo of tiposTurno) {
    await prisma.tipoTurno.create({
      data: { ...tipo, unidadId: acco.id, creadoPor: 'SYSTEM', orden: tiposTurno.indexOf(tipo) },
    })
  }

  // ============================================
  // 4. FUNCIONARIOS (20)
  // ============================================
  console.log('👥 Creando funcionarios...')

  const funcionarios = [
    { nombre: 'Jorge', apellido: 'Morgado Carvallo', email: 'jmorgadoc@dgac.gob.cl', iniciales: 'JMC', rol: 'JEFE_UNIDAD', licencia: '10000' },
    { nombre: 'Ivan', apellido: 'Fernandez Navarrete', email: 'ifernandez@dgac.gob.cl', iniciales: 'IFN', rol: 'SUPERVISOR_ATS', licencia: '10001' },
    { nombre: 'Marcelo Rumaldo', apellido: 'Silva Meza', email: 'msilvam@dgac.gob.cl', iniciales: 'MSM', rol: 'ATCO', licencia: '10002' },
    { nombre: 'Rigoberto Alexis', apellido: 'Pacheco Navarro', email: 'apacheco@dgac.gob.cl', iniciales: 'APN', rol: 'ATCO', licencia: '10003' },
    { nombre: 'Claudia Alejandra', apellido: 'Armijo Tobar', email: 'carmijo@dgac.gob.cl', iniciales: 'CAT', rol: 'ATCO', licencia: '10004' },
    { nombre: 'Cristian Eduardo', apellido: 'Cortes Mancilla', email: 'ccortes@dgac.gob.cl', iniciales: 'CCM', rol: 'ATCO', licencia: '10005' },
    { nombre: 'Alex Mauricio', apellido: 'Carrillo Sanhueza', email: 'acarrillo@dgac.gob.cl', iniciales: 'ACS', rol: 'ATCO', licencia: '10006' },
    { nombre: 'Christian Marcos', apellido: 'Larrondo Ahumada', email: 'clarrondo@dgac.gob.cl', iniciales: 'CLA', rol: 'ATCO', licencia: '10007' },
    { nombre: 'Christian Clinton', apellido: 'Plummer Ruiz', email: 'cplummer@dgac.gob.cl', iniciales: 'CPR', rol: 'ATCO', licencia: '10008' },
    { nombre: 'Dino Orlando', apellido: 'Canales Julio', email: 'dcanales@dgac.gob.cl', iniciales: 'DCJ', rol: 'ATCO', licencia: '10009' },
    { nombre: 'Giselle Andrea', apellido: 'Tello Munoz', email: 'gtello@dgac.gob.cl', iniciales: 'GTM', rol: 'ATCO', licencia: '10010' },
    { nombre: 'Ivonne Marlene', apellido: 'Orrego Gallardo', email: 'iorrego@dgac.gob.cl', iniciales: 'IOG', rol: 'ATCO', licencia: '10011' },
    { nombre: 'Jenny Andrea', apellido: 'Moraga Canales', email: 'jmoraga@dgac.gob.cl', iniciales: 'JAM', rol: 'ATCO', licencia: '10012' },
    { nombre: 'Jesenia Del Carmen', apellido: 'Valenzuela Bavestrello', email: 'jvalenzuelab@dgac.gob.cl', iniciales: 'JVB', rol: 'ATCO', licencia: '10013' },
    { nombre: 'Patricio Danilo', apellido: 'Concha Arellano', email: 'pconcha@dgac.gob.cl', iniciales: 'PCA', rol: 'ATCO', licencia: '10014' },
    { nombre: 'Ursula Mercedes', apellido: 'Garrido Arias', email: 'ugarrido@dgac.gob.cl', iniciales: 'UGA', rol: 'ATCO', licencia: '10015' },
    { nombre: 'Felipe Ernesto', apellido: 'Serrano Gallardo', email: 'fserrano@dgac.gob.cl', iniciales: 'FSG', rol: 'ATCO', licencia: '10016' },
    { nombre: 'Ruben Eliseo', apellido: 'Hernandez Espinoza', email: 'rhernandez@dgac.gob.cl', iniciales: 'RHE', rol: 'ATCO', licencia: '10017' },
    { nombre: 'Maria Bernarda', apellido: 'Molina Julia', email: 'mmolina@dgac.gob.cl', iniciales: 'MMJ', rol: 'ATCO', licencia: '10018' },
  ]

  const passwordHash = await bcrypt.hash('DGAC2024', 10)

  for (const func of funcionarios) {
    const usuario = await prisma.usuario.create({
      data: {
        email: func.email,
        nombre: func.nombre,
        apellido: func.apellido,
        numeroLicencia: func.licencia,
        password: passwordHash,
        pin: '1234',
        rol: func.rol as any,
        unidadId: acco.id,
        activo: true,
        validezMedica: new Date('2025-12-31'),
        validezLinguistica: new Date('2026-12-31'),
      },
    })

    await prisma.abreviaturaATCO.create({
      data: { codigo: func.iniciales, usuarioId: usuario.id, activa: true },
    })

    if (func.rol !== 'JEFE_UNIDAD') {
      await prisma.habilitacion.create({
        data: {
          usuarioId: usuario.id,
          unidadId: acco.id,
          tipoHabilitacion: 'ACC',
          dependencias: ['ACC-O', 'ACC-N'],
          fechaInicio: new Date('2024-01-01'),
          activa: true,
          requierePericia: true,
          horasMinimasMes: 10,
          otorgadaPor: 'SYSTEM',
        },
      })
    }

    const rolDisplay = func.rol === 'JEFE_UNIDAD' ? '👑' : func.rol === 'SUPERVISOR_ATS' ? '⭐' : '✈️ '
    console.log(`  ${rolDisplay} ${func.iniciales} - ${func.nombre} ${func.apellido}`)
  }

  // ============================================
  // 5. PUNTOS FIX (44)
  // ============================================
  console.log('\n🗺️  Creando puntos FIX...')

  const puntosFIX = [
    { codigo: 'ITANO', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'TIRLO', tipo: 'WAYPOINT' as const, categoria: 'NAC' as const },
    { codigo: 'ROBIK', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'LOKOL', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'SUGRO', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'XONAT', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'NEDOM', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'TOGUP', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'EDSUK', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'OSOGU', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'VUNPA', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'KEXEM', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'KIDOX', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'MUGUK', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'ETADI', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'VALUM', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'USAVI', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'PUMPI', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'IPA', tipo: 'WAYPOINT' as const, categoria: 'NAC' as const },
    { codigo: 'HANPI', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'SAKOB', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'SAURI', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'JURAK', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'ESDIN', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'ALDAX', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'ANPUK', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'ASEPU', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'ATEDA', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'ELASA', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'IREMI', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'ISPEL', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'LIVOR', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'SORTA', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: 'SULNA', tipo: 'WAYPOINT' as const, categoria: 'INT' as const },
    { codigo: '075WRNAV', tipo: 'LONGITUDINAL' as const, categoria: 'INT' as const },
    { codigo: '080W', tipo: 'LONGITUDINAL' as const, categoria: 'INT' as const },
    { codigo: '090W', tipo: 'LONGITUDINAL' as const, categoria: 'INT' as const },
    { codigo: '100W', tipo: 'LONGITUDINAL' as const, categoria: 'INT' as const },
    { codigo: '110W', tipo: 'LONGITUDINAL' as const, categoria: 'INT' as const },
    { codigo: '120W', tipo: 'LONGITUDINAL' as const, categoria: 'INT' as const },
    { codigo: '131W', tipo: 'LONGITUDINAL' as const, categoria: 'INT' as const },
    { codigo: 'TCP UL401', tipo: 'TCP' as const, categoria: 'INT' as const },
    { codigo: 'VFR', tipo: 'VFR' as const, categoria: 'OTROS' as const },
    { codigo: 'OTROS', tipo: 'OTROS' as const, categoria: 'OTROS' as const },
  ]

  for (const punto of puntosFIX) {
    await prisma.puntoFIX.create({
      data: { ...punto, unidadId: acco.id, activo: true, orden: puntosFIX.indexOf(punto), creadoPor: 'SYSTEM' },
    })
  }

  console.log('\n✅ Seed completado!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📍 Unidad: ${acco.nombre}`)
  console.log(`👥 Funcionarios: 19`)
  console.log(`🗺️  Puntos FIX: 44`)
  console.log(`⏰ Tipos de turno: 9`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
