import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function verifyAuthFix() {
  console.log('\n🔍 VERIFICACIÓN FINAL DEL SISTEMA DE AUTENTICACIÓN\n')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar que los usuarios existen
    console.log('\n1️⃣  VERIFICANDO USUARIOS EN BD...')
    
    const admin = await prisma.usuario.findUnique({
      where: { email: 'admin@dgac.gob.cl' }
    })
    
    const testUser = await prisma.usuario.findUnique({
      where: { email: 'jperezsilva@dgac.gob.cl' }
    })

    if (!admin) {
      console.log('   ❌ FALLO: Usuario admin NO existe')
      return
    }
    console.log('   ✅ Admin existe:', admin.email)

    if (!testUser) {
      console.log('   ❌ FALLO: Usuario de prueba NO existe')
      return
    }
    console.log('   ✅ Usuario de prueba existe:', testUser.email)

    // 2. Verificar hashes de contraseñas
    console.log('\n2️⃣  VERIFICANDO HASHES DE CONTRASEÑAS...')
    
    const adminPasswordValid = await bcrypt.compare('Admin123!', admin.password)
    console.log('   Admin password check:', adminPasswordValid ? '✅ VÁLIDA' : '❌ INVÁLIDA')
    
    const testPasswordValid = await bcrypt.compare('NuevaPass123!', testUser.password)
    console.log('   Test user password check:', testPasswordValid ? '✅ VÁLIDA' : '❌ INVÁLIDA')

    // 3. Verificar que los usuarios estén activos
    console.log('\n3️⃣  VERIFICANDO ESTADO DE USUARIOS...')
    
    console.log('   Admin activo:', admin.activo ? '✅ SÍ' : '❌ NO')
    console.log('   Test user activo:', testUser.activo ? '✅ SÍ' : '❌ NO')

    // 4. Verificar roles
    console.log('\n4️⃣  VERIFICANDO ROLES...')
    
    console.log('   Admin rol:', admin.rol === 'ADMIN_SISTEMA' ? '✅ CORRECTO (ADMIN_SISTEMA)' : `❌ INCORRECTO (${admin.rol})`)
    console.log('   Test user rol:', testUser.rol === 'SUPERVISOR_ATS' ? '✅ CORRECTO (SUPERVISOR_ATS)' : `❌ INCORRECTO (${testUser.rol})`)

    // 5. Verificar unidades
    console.log('\n5️⃣  VERIFICANDO UNIDADES...')
    
    console.log('   Admin unidadId:', admin.unidadId ? `✅ ${admin.unidadId}` : '❌ SIN UNIDAD')
    console.log('   Test user unidadId:', testUser.unidadId ? `✅ ${testUser.unidadId}` : '❌ SIN UNIDAD')

    // 6. Verificar que el schema NO tiene emailVerified
    console.log('\n6️⃣  VERIFICANDO SCHEMA PRISMA...')
    
    // @ts-expect-error - Si emailVerified existiera, esto no daría error
    const hasEmailVerified = 'emailVerified' in admin
    console.log('   Campo emailVerified existe:', hasEmailVerified ? '❌ SÍ (PROBLEMA!)' : '✅ NO (CORRECTO)')

    // RESUMEN FINAL
    console.log('\n' + '=' .repeat(60))
    console.log('\n📊 RESUMEN FINAL:\n')
    
    const allChecks = [
      admin !== null,
      testUser !== null,
      adminPasswordValid,
      testPasswordValid,
      admin.activo,
      testUser.activo,
      admin.rol === 'ADMIN_SISTEMA',
      !hasEmailVerified
    ]
    
    const passedChecks = allChecks.filter(Boolean).length
    const totalChecks = allChecks.length

    if (passedChecks === totalChecks) {
      console.log('🎉 ¡TODAS LAS VERIFICACIONES PASARON! (' + passedChecks + '/' + totalChecks + ')')
      console.log('\n✅ EL SISTEMA DE AUTENTICACIÓN ESTÁ FUNCIONANDO CORRECTAMENTE')
      console.log('\n🔐 CREDENCIALES LISTAS PARA USAR:')
      console.log('\n   Admin:')
      console.log('   📧 admin@dgac.gob.cl')
      console.log('   🔑 Admin123!')
      console.log('\n   Usuario de prueba:')
      console.log('   📧 jperezsilva@dgac.gob.cl')
      console.log('   🔑 NuevaPass123!')
      console.log('\n🚀 PUEDES PROCEDER A PROBAR EL LOGIN EN http://localhost:3000/login')
    } else {
      console.log('⚠️  ALGUNAS VERIFICACIONES FALLARON (' + passedChecks + '/' + totalChecks + ')')
      console.log('\n❌ NECESITAS REVISAR LOS ERRORES ANTERIORES')
    }

    console.log('\n' + '=' .repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA VERIFICACIÓN:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAuthFix()

