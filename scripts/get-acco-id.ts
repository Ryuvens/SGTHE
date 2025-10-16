import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const acco = await prisma.unidad.findFirst({
    where: {
      codigo: 'ACCO',
    },
    select: {
      id: true,
      nombre: true,
      codigo: true,
    },
  })

  if (!acco) {
    console.error('❌ Unidad ACCO no encontrada')
    process.exit(1)
  }

  console.log('✅ Unidad ACCO encontrada:')
  console.log(`   ID: ${acco.id}`)
  console.log(`   Nombre: ${acco.nombre}`)
  console.log(`   Código: ${acco.codigo}`)
  console.log('\n📝 Actualiza este ID en src/app/kiosco/page.tsx')
  console.log(`   const UNIDAD_ACCO_ID = '${acco.id}'`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

