import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserForm } from '@/components/usuarios/user-form'
import Link from 'next/link'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Obtener unidades disponibles
async function getUnidades() {
  const unidades = await prisma.unidad.findMany({
    where: { activa: true },
    select: {
      id: true,
      nombre: true,
      sigla: true,
    },
    orderBy: { nombre: 'asc' },
  })
  return unidades
}

export default async function NuevoUsuarioPage() {
  const unidades = await getUnidades()

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
        >
          <Link href="/usuarios">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Usuario</h2>
          <p className="text-muted-foreground">
            Registra un nuevo funcionario en el sistema
          </p>
        </div>
      </div>

      {/* Formulario */}
      <UserForm unidades={unidades} />
    </div>
  )
}

