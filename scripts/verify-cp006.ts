/**
 * Script de Verificación Automática CP-006
 * Valida que todos los componentes críticos estén implementados
 */

import { existsSync } from 'fs'
import { resolve } from 'path'

interface CheckResult {
  name: string
  status: 'PASS' | 'FAIL'
  message: string
}

const results: CheckResult[] = []

function check(name: string, condition: boolean, passMsg: string, failMsg: string) {
  results.push({
    name,
    status: condition ? 'PASS' : 'FAIL',
    message: condition ? passMsg : failMsg
  })
}

function fileExists(path: string): boolean {
  return existsSync(resolve(process.cwd(), path))
}

console.log('🔍 Verificando CP-006: Módulo de Usuarios...\n')

// ============= VERIFICAR ARCHIVOS =============
console.log('📁 Verificando archivos...')

check(
  'Server Actions',
  fileExists('src/lib/actions/usuarios.ts'),
  '✅ usuarios.ts encontrado',
  '❌ Falta src/lib/actions/usuarios.ts'
)

check(
  'DataTable Component',
  fileExists('src/components/usuarios/data-table.tsx'),
  '✅ data-table.tsx encontrado',
  '❌ Falta src/components/usuarios/data-table.tsx'
)

check(
  'UserForm Component',
  fileExists('src/components/usuarios/user-form.tsx'),
  '✅ user-form.tsx encontrado',
  '❌ Falta src/components/usuarios/user-form.tsx'
)

check(
  'Export Excel Component',
  fileExists('src/components/usuarios/export-excel.tsx'),
  '✅ export-excel.tsx encontrado',
  '❌ Falta src/components/usuarios/export-excel.tsx'
)

check(
  'Página Principal',
  fileExists('src/app/usuarios/page.tsx'),
  '✅ /usuarios/page.tsx encontrado',
  '❌ Falta src/app/usuarios/page.tsx'
)

check(
  'Página Nuevo Usuario',
  fileExists('src/app/usuarios/nuevo/page.tsx'),
  '✅ /usuarios/nuevo/page.tsx encontrado',
  '❌ Falta src/app/usuarios/nuevo/page.tsx'
)

check(
  'Página Detalle Usuario',
  fileExists('src/app/usuarios/[id]/page.tsx'),
  '✅ /usuarios/[id]/page.tsx encontrado',
  '❌ Falta src/app/usuarios/[id]/page.tsx'
)

check(
  'Página Editar Usuario',
  fileExists('src/app/usuarios/[id]/edit/page.tsx'),
  '✅ /usuarios/[id]/edit/page.tsx encontrado',
  '❌ Falta src/app/usuarios/[id]/edit/page.tsx'
)

// ============= VERIFICAR UI COMPONENTS =============
console.log('\n🎨 Verificando componentes UI...')

check(
  'Form Component',
  fileExists('src/components/ui/form.tsx'),
  '✅ form.tsx encontrado',
  '❌ Falta src/components/ui/form.tsx'
)

check(
  'Switch Component',
  fileExists('src/components/ui/switch.tsx'),
  '✅ switch.tsx encontrado',
  '❌ Falta src/components/ui/switch.tsx'
)

check(
  'Checkbox Component',
  fileExists('src/components/ui/checkbox.tsx'),
  '✅ checkbox.tsx encontrado',
  '❌ Falta src/components/ui/checkbox.tsx'
)

check(
  'Alert Dialog Component',
  fileExists('src/components/ui/alert-dialog.tsx'),
  '✅ alert-dialog.tsx encontrado',
  '❌ Falta src/components/ui/alert-dialog.tsx'
)

// ============= VERIFICAR DEPENDENCIAS =============
console.log('\n📦 Verificando dependencias...')

check(
  'package.json existe',
  fileExists('package.json'),
  '✅ package.json encontrado',
  '❌ Falta package.json'
)

// ============= MOSTRAR RESULTADOS =============
console.log('\n' + '='.repeat(50))
console.log('📊 RESULTADOS DE VERIFICACIÓN')
console.log('='.repeat(50) + '\n')

const passed = results.filter(r => r.status === 'PASS').length
const failed = results.filter(r => r.status === 'FAIL').length
const total = results.length

results.forEach(result => {
  const icon = result.status === 'PASS' ? '✅' : '❌'
  console.log(`${icon} ${result.name}`)
  console.log(`   ${result.message}`)
})

console.log('\n' + '='.repeat(50))
console.log(`✅ Pasados: ${passed}/${total}`)
console.log(`❌ Fallidos: ${failed}/${total}`)
console.log(`📈 Porcentaje: ${Math.round((passed / total) * 100)}%`)
console.log('='.repeat(50) + '\n')

if (failed === 0) {
  console.log('🎉 ¡TODOS LOS ARCHIVOS VERIFICADOS CORRECTAMENTE!')
  console.log('📝 Ahora procede con el testing manual usando:')
  console.log('   docs/testing/CP-006-MANUAL-TESTING.md')
  process.exit(0)
} else {
  console.log('⚠️  HAY ARCHIVOS FALTANTES O PROBLEMAS')
  console.log('🔧 Revisa los errores arriba y corrige antes de continuar')
  process.exit(1)
}

