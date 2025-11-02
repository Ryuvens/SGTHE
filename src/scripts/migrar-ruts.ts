import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DATOS_RUTS = [
  { nombreCompleto: "MORGADO CARVALLO JORGE LUIS RODOLFO", rut: "10408183-5" },
  { nombreCompleto: "FERNANDEZ NAVARRETE IVAN ALEXIS", rut: "12112707-5" },
  { nombreCompleto: "ARMIJO TOBAR CLAUDIA ALEJANDRA", rut: "13294186-9" },
  { nombreCompleto: "CANALES JULIO DINO ORLANDO", rut: "10459162-K" },
  { nombreCompleto: "CARRILLO SANHUEZA ALEX MAURICIO", rut: "13317985-2" },
  { nombreCompleto: "CONCHA ARELLANO PATRICIO DANILO", rut: "8711106-7" },
  { nombreCompleto: "CORTES MANCILLA CRISTIAN EDUARDO", rut: "13296486-1" },
  { nombreCompleto: "GARRIDO ARIAS URSULA MERCEDES", rut: "10167093-3" },
  { nombreCompleto: "HERNANDEZ ESPINOZA RUBÉN ELISEO", rut: "13884987-2" },
  { nombreCompleto: "LARRONDO AHUMADA CHRISTIAN MARCOS", rut: "12464430-5" },
  { nombreCompleto: "MORAGA CANALES JENNY ANDREA", rut: "13928390-2" },
  { nombreCompleto: "ORREGO GALLARDO IVONNE MARLENE", rut: "15429996-6" },
  { nombreCompleto: "PACHECO NAVARRO RIGOBERTO ALEXIS", rut: "14097837-K" },
  { nombreCompleto: "PEÑA VALENZUELA RODOLFO ANTONIO", rut: "8338953-2" },
  { nombreCompleto: "PLUMMER RUIZ CHRISTIAN CLINTON", rut: "16534873-8" },
  { nombreCompleto: "SERRANO GALLARDO FELIPE ERNESTO", rut: "12274610-6" },
  { nombreCompleto: "TELLO MUÑOZ GISELLE ANDREA", rut: "15642837-K" },
  { nombreCompleto: "VALENZUELA BAVESTRELLO JESENIA DEL CARMEN", rut: "13062757-9" },
  { nombreCompleto: "VILLAGRAN CONTRERAS GREGORIO CESAR", rut: "8260799-4" }
]

// Función para normalizar nombres (quitar acentos, mayúsculas, etc.)
function normalizarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .toUpperCase()
    .trim()
}

// Función para comparar nombres con tolerancia
function nombresCoinciden(nombre1: string, nombre2: string): boolean {
  const n1 = normalizarNombre(nombre1)
  const n2 = normalizarNombre(nombre2)
  
  // Comparación exacta
  if (n1 === n2) return true
  
  // Comparar por palabras (orden puede variar)
  const palabras1 = n1.split(' ').filter(p => p.length > 2)
  const palabras2 = n2.split(' ').filter(p => p.length > 2)
  
  // Si al menos 3 palabras coinciden
  const coincidencias = palabras1.filter(p => palabras2.includes(p)).length
  return coincidencias >= 3
}

async function migrarRUTs() {
  console.log('🚀 Iniciando migración de RUTs...\n')
  
  // 1. Obtener todos los usuarios de la BD
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      apellido: true,
      rut: true
    }
  })
  
  console.log(`📊 Usuarios en BD: ${usuarios.length}`)
  console.log(`📊 RUTs a migrar: ${DATOS_RUTS.length}\n`)
  
  let actualizados = 0
  let noEncontrados: string[] = []
  let yaConRUT = 0
  
  // 2. Para cada RUT, buscar el usuario correspondiente
  for (const dato of DATOS_RUTS) {
    const nombreCompleto = normalizarNombre(dato.nombreCompleto)
    
    // Buscar usuario por coincidencia de nombre
    const usuario = usuarios.find(u => {
      const nombreBD = normalizarNombre(`${u.apellido} ${u.nombre}`)
      return nombresCoinciden(nombreCompleto, nombreBD)
    })
    
    if (usuario) {
      if (usuario.rut) {
        console.log(`⚠️  ${dato.nombreCompleto} ya tiene RUT: ${usuario.rut}`)
        yaConRUT++
      } else {
        // Actualizar RUT
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { rut: dato.rut }
        })
        console.log(`✅ ${dato.nombreCompleto} → RUT: ${dato.rut}`)
        actualizados++
      }
    } else {
      console.log(`❌ NO encontrado: ${dato.nombreCompleto}`)
      noEncontrados.push(dato.nombreCompleto)
    }
  }
  
  // 3. Resumen
  console.log('\n═══════════════════════════════════════')
  console.log('📊 RESUMEN DE MIGRACIÓN')
  console.log('═══════════════════════════════════════')
  console.log(`✅ Actualizados: ${actualizados}`)
  console.log(`⚠️  Ya tenían RUT: ${yaConRUT}`)
  console.log(`❌ No encontrados: ${noEncontrados.length}`)
  
  if (noEncontrados.length > 0) {
    console.log('\n❌ Funcionarios no encontrados en BD:')
    noEncontrados.forEach(nombre => console.log(`   - ${nombre}`))
    console.log('\nℹ️  Verifica los nombres en la BD o ajusta el algoritmo de coincidencia')
  }
  
  console.log('\n✅ Migración completada')
}

// Ejecutar migración
migrarRUTs()
  .then(() => {
    prisma.$disconnect()
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error en migración:', error)
    prisma.$disconnect()
    process.exit(1)
  })

