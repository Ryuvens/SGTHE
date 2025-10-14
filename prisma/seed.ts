// prisma/seed.ts
// Seeds iniciales para SGTHE - Sistema de Gestión de Turnos y Horas Extraordinarias
// Basado en: PRO DRH 22 (Ed. 3, Julio 2016), DAN 11 (Apéndice 6), PRO ATS 01

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seeds...')

  // ==================== 1. TIPOS DE TURNO (30) ====================
  console.log('📋 Creando tipos de turnos...')

  const tiposTurno = [
    // TURNOS OPERACIONALES
    {
      codigo: 'D',
      nombre: 'Turno Día',
      descripcion: 'Turno diurno operacional',
      horaInicio: '08:30',
      horaFin: '20:30',
      duracionTotal: 12.0,
      horasDiurnas: 12.0,
      horasNocturnas: 0.0,
      esOperacional: true,
    },
    {
      codigo: 'N',
      nombre: 'Turno Noche',
      descripcion: 'Turno nocturno',
      horaInicio: '20:30',
      horaFin: '00:00',
      duracionTotal: 3.5,
      horasDiurnas: 0.5,
      horasNocturnas: 3.0,
      esOperacional: true,
    },
    {
      codigo: 'S',
      nombre: 'Turno Saliente',
      descripcion: 'Turno saliente nocturno',
      horaInicio: '00:00',
      horaFin: '08:30',
      duracionTotal: 8.5,
      horasDiurnas: 1.5,
      horasNocturnas: 7.0,
      esOperacional: true,
    },
    {
      codigo: 'OP',
      nombre: 'Operacional',
      descripcion: 'Turno operacional estándar',
      horaInicio: '07:30',
      horaFin: '19:30',
      duracionTotal: 12.0,
      horasDiurnas: 12.0,
      horasNocturnas: 0.0,
      esOperacional: true,
    },
    {
      codigo: 'OE',
      nombre: 'Operaciones Extendido',
      descripcion: 'Turno operacional extendido',
      horaInicio: '08:30',
      horaFin: '20:30',
      duracionTotal: 12.0,
      horasDiurnas: 12.0,
      horasNocturnas: 0.0,
      esOperacional: true,
    },
    {
      codigo: 'CIC',
      nombre: 'Día CIC',
      descripcion: 'Turno día CIC',
      horaInicio: '08:30',
      horaFin: '20:30',
      duracionTotal: 12.0,
      horasDiurnas: 12.0,
      horasNocturnas: 0.0,
      esOperacional: true,
    },

    // TURNOS ADMINISTRATIVOS
    {
      codigo: 'A',
      nombre: 'Admin L-J',
      descripcion: 'Administrativo Lunes a Jueves',
      horaInicio: '08:00',
      horaFin: '17:00',
      duracionTotal: 9.0,
      horasDiurnas: 9.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'AV',
      nombre: 'Admin Viernes',
      descripcion: 'Administrativo Viernes',
      horaInicio: '08:00',
      horaFin: '16:30',
      duracionTotal: 8.5,
      horasDiurnas: 8.5,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'O',
      nombre: 'Día Op L-J',
      descripcion: 'Día operativo Lunes a Jueves',
      horaInicio: '08:30',
      horaFin: '17:30',
      duracionTotal: 9.0,
      horasDiurnas: 9.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'OV',
      nombre: 'Día Op Viernes',
      descripcion: 'Día operativo Viernes',
      horaInicio: '08:30',
      horaFin: '16:00',
      duracionTotal: 7.5,
      horasDiurnas: 7.5,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },

    // DESCANSOS COMPLEMENTARIOS
    {
      codigo: 'DA',
      nombre: 'Desc. Comp. L-J',
      descripcion: 'Descanso complementario Lunes a Jueves',
      horaInicio: '00:00',
      horaFin: '00:00',
      duracionTotal: 0.0,
      horasDiurnas: 0.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esDescanso: true,
      horasCompensadas: 9.0,
    },
    {
      codigo: 'DV',
      nombre: 'Desc. Comp. Viernes',
      descripcion: 'Descanso complementario Viernes',
      horaInicio: '00:00',
      horaFin: '00:00',
      duracionTotal: 0.0,
      horasDiurnas: 0.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esDescanso: true,
      horasCompensadas: 8.0,
    },
    {
      codigo: 'DC',
      nombre: 'Desc. Comp. 12h',
      descripcion: 'Descanso complementario 12 horas',
      horaInicio: '00:00',
      horaFin: '00:00',
      duracionTotal: 0.0,
      horasDiurnas: 0.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esDescanso: true,
      horasCompensadas: 12.0,
    },
    {
      codigo: 'DN',
      nombre: 'Desc. Comp. 4h',
      descripcion: 'Descanso complementario 4 horas',
      horaInicio: '00:00',
      horaFin: '00:00',
      duracionTotal: 0.0,
      horasDiurnas: 0.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esDescanso: true,
      horasCompensadas: 4.0,
    },

    // AUSENCIAS
    {
      codigo: 'FLA',
      nombre: 'Feriado Legal Anual',
      descripcion: 'Feriado legal anual',
      horaInicio: '00:00',
      horaFin: '00:00',
      duracionTotal: 0.0,
      horasDiurnas: 0.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAusencia: true,
    },
    {
      codigo: 'L',
      nombre: 'Licencia Médica',
      descripcion: 'Licencia médica',
      horaInicio: '00:00',
      horaFin: '00:00',
      duracionTotal: 0.0,
      horasDiurnas: 0.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAusencia: true,
    },

    // ACTIVIDADES ESPECIALES
    {
      codigo: 'E',
      nombre: 'Entrenamiento L-J',
      descripcion: 'Entrenamiento Lunes a Jueves',
      horaInicio: '08:00',
      horaFin: '17:00',
      duracionTotal: 9.0,
      horasDiurnas: 9.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'EV',
      nombre: 'Entrenamiento Viernes',
      descripcion: 'Entrenamiento Viernes',
      horaInicio: '08:00',
      horaFin: '16:30',
      duracionTotal: 8.5,
      horasDiurnas: 8.5,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'IA',
      nombre: 'Instrucción Admin L-J',
      descripcion: 'Instrucción administrativa Lunes a Jueves',
      horaInicio: '08:00',
      horaFin: '17:00',
      duracionTotal: 9.0,
      horasDiurnas: 9.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'IAV',
      nombre: 'Instrucción Admin Viernes',
      descripcion: 'Instrucción administrativa Viernes',
      horaInicio: '08:00',
      horaFin: '16:30',
      duracionTotal: 8.5,
      horasDiurnas: 8.5,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'ID',
      nombre: 'Instrucción Día',
      descripcion: 'Instrucción turno día',
      horaInicio: '08:30',
      horaFin: '20:30',
      duracionTotal: 12.0,
      horasDiurnas: 12.0,
      horasNocturnas: 0.0,
      esOperacional: true,
    },
    {
      codigo: 'IN',
      nombre: 'Instrucción Noche',
      descripcion: 'Instrucción turno noche',
      horaInicio: '20:30',
      horaFin: '00:00',
      duracionTotal: 3.5,
      horasDiurnas: 0.5,
      horasNocturnas: 3.0,
      esOperacional: true,
    },
    {
      codigo: 'IS',
      nombre: 'Instrucción Saliente',
      descripcion: 'Instrucción turno saliente',
      horaInicio: '00:00',
      horaFin: '08:30',
      duracionTotal: 8.5,
      horasDiurnas: 1.5,
      horasNocturnas: 7.0,
      esOperacional: true,
    },
    {
      codigo: 'C',
      nombre: 'Comisión L-J',
      descripcion: 'Comisión de servicio Lunes a Jueves',
      horaInicio: '08:00',
      horaFin: '17:00',
      duracionTotal: 9.0,
      horasDiurnas: 9.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'CV',
      nombre: 'Comisión Viernes',
      descripcion: 'Comisión de servicio Viernes',
      horaInicio: '08:00',
      horaFin: '16:30',
      duracionTotal: 8.5,
      horasDiurnas: 8.5,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'PA',
      nombre: 'Permiso Admin L-J',
      descripcion: 'Permiso administrativo Lunes a Jueves',
      horaInicio: '08:00',
      horaFin: '17:00',
      duracionTotal: 9.0,
      horasDiurnas: 9.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'PAV',
      nombre: 'Permiso Admin Viernes',
      descripcion: 'Permiso administrativo Viernes',
      horaInicio: '08:00',
      horaFin: '16:30',
      duracionTotal: 8.5,
      horasDiurnas: 8.5,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'B',
      nombre: 'Berlitz',
      descripcion: 'Clases de inglés Berlitz',
      horaInicio: '08:00',
      horaFin: '17:00',
      duracionTotal: 9.0,
      horasDiurnas: 9.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'R',
      nombre: 'Reunión Op',
      descripcion: 'Reunión operacional',
      horaInicio: '08:00',
      horaFin: '12:00',
      duracionTotal: 4.0,
      horasDiurnas: 4.0,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
    {
      codigo: 'D11S',
      nombre: 'Día 11 sept',
      descripcion: 'Día 11 de septiembre (feriado institucional)',
      horaInicio: '08:00',
      horaFin: '17:30',
      duracionTotal: 9.5,
      horasDiurnas: 9.5,
      horasNocturnas: 0.0,
      esOperacional: false,
      esAdministrativo: true,
    },
  ]

  for (const turno of tiposTurno) {
    await prisma.tipoTurno.upsert({
      where: { codigo: turno.codigo },
      update: {},
      create: turno,
    })
  }

  console.log(`✅ ${tiposTurno.length} tipos de turnos creados`)

  // ==================== 2. CATEGORÍAS DE DEPENDENCIA ====================
  console.log('🏢 Creando categorías de dependencia...')

  const categorias: Array<{
    codigo: string
    nombre: string
    descripcion: string
    categoria: 'TWR' | 'APP' | 'ACC' | 'FSS'
  }> = [
    {
      codigo: 'TWR',
      nombre: 'Torre de Control',
      descripcion: 'Control de tráfico en aeródromo',
      categoria: 'TWR',
    },
    {
      codigo: 'APP',
      nombre: 'Control de Aproximación',
      descripcion: 'Control de aproximación y salida',
      categoria: 'APP',
    },
    {
      codigo: 'ACC',
      nombre: 'Control de Área',
      descripcion: 'Control de área (en ruta)',
      categoria: 'ACC',
    },
    {
      codigo: 'FSS',
      nombre: 'Estación de Servicio de Vuelo',
      descripcion: 'Información aeronáutica y meteorológica',
      categoria: 'FSS',
    },
  ]

  for (const cat of categorias) {
    await prisma.categoriaDependencia.upsert({
      where: { codigo: cat.codigo },
      update: {},
      create: cat,
    })
  }

  console.log(`✅ ${categorias.length} categorías de dependencia creadas`)

  // ==================== 3. USUARIO ADMIN ====================
  console.log('👤 Creando usuario administrador...')

  // Hash de password para "admin123" (cambiar en producción)
  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Primero, actualizar usuario existente si tiene el email viejo
  const existingAdmin = await prisma.usuario.findUnique({
    where: { email: 'admin@dgac.cl' },
  })

  if (existingAdmin) {
    // Actualizar email y agregar campos de autenticación
    await prisma.usuario.update({
      where: { id: existingAdmin.id },
      data: {
        email: 'admin@dgac.gob.cl', // Actualizar email
        emailVerified: new Date(),   // Agregar verificación
        activo: true,                // Asegurar que está activo
        password: hashedPassword,    // Hash real
      },
    })
    console.log('✅ Usuario admin actualizado (email: admin@dgac.gob.cl, password: admin123)')
  } else {
    // Crear nuevo admin si no existe
    await prisma.usuario.upsert({
      where: { email: 'admin@dgac.gob.cl' },
      update: {
        emailVerified: new Date(),
        activo: true,
        password: hashedPassword,
      },
      create: {
        email: 'admin@dgac.gob.cl',
        nombre: 'Administrador',
        apellido: 'Sistema',
        rut: '11111111-1',
        password: hashedPassword,
        rol: 'ADMIN',
        activo: true,
        emailVerified: new Date(),
      },
    })
    console.log('✅ Usuario admin creado (email: admin@dgac.gob.cl, password: admin123)')
  }

  console.log('⚠️  IMPORTANTE: Cambiar password en producción')

  // ==================== 4. CONFIGURACIONES ====================
  console.log('⚙️ Creando configuraciones del sistema...')

  const configuraciones = [
    {
      clave: 'HLM_DIAS_HABILES_FACTOR',
      valor: '8.8',
      tipo: 'number',
      descripcion: 'Factor de multiplicación para días hábiles en HLM',
    },
    {
      clave: 'VALOR_HORA_DIVISOR',
      valor: '190',
      tipo: 'number',
      descripcion: 'Divisor para cálculo de valor hora',
    },
    {
      clave: 'RECARGO_DIURNO',
      valor: '0.25',
      tipo: 'number',
      descripcion: 'Recargo porcentual para horas diurnas (25%)',
    },
    {
      clave: 'RECARGO_NOCTURNO',
      valor: '0.50',
      tipo: 'number',
      descripcion: 'Recargo porcentual para horas nocturnas (50%)',
    },
    {
      clave: 'RECARGO_FESTIVO',
      valor: '0.50',
      tipo: 'number',
      descripcion: 'Recargo porcentual para días festivos (50%)',
    },
    {
      clave: 'LIMITE_HORAS_MENSUALES',
      valor: '185',
      tipo: 'number',
      descripcion: 'Límite de horas mensuales según DAN 11',
    },
    {
      clave: 'LIMITE_HORAS_ANUALES',
      valor: '2230',
      tipo: 'number',
      descripcion: 'Límite de horas anuales según DAN 11 (NO SUPERABLE)',
    },
    {
      clave: 'LIMITE_DIAS_CONSECUTIVOS',
      valor: '3',
      tipo: 'number',
      descripcion: 'Límite de días consecutivos de trabajo',
    },
    {
      clave: 'DIAS_LIBRES_MINIMOS_MES',
      valor: '7',
      tipo: 'number',
      descripcion: 'Días libres mínimos al mes',
    },
    {
      clave: 'HORA_INICIO_NOCTURNO',
      valor: '21:00',
      tipo: 'string',
      descripcion: 'Hora de inicio del horario nocturno',
    },
    {
      clave: 'HORA_FIN_NOCTURNO',
      valor: '07:00',
      tipo: 'string',
      descripcion: 'Hora de fin del horario nocturno',
    },
  ]

  for (const config of configuraciones) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: {},
      create: config,
    })
  }

  console.log(`✅ ${configuraciones.length} configuraciones creadas`)

  console.log('\n🎉 Seeds completados exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seeds:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

