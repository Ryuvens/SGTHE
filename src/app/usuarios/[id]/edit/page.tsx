import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserForm } from '@/components/usuarios/user-form'
import { getUsuarioById } from '@/lib/actions/usuarios'
import Link from 'next/link'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface EditUsuarioPageProps {
  params: {
    id: string
  }
}

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

export default async function EditUsuarioPage({ params }: EditUsuarioPageProps) {
  const result = await getUsuarioById(params.id)
  const unidades = await getUnidades()
  
  if (!result.success || !result.data) {
    notFound()
  }

  const usuario = result.data

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
          <h2 className="text-3xl font-bold tracking-tight">Editar Usuario</h2>
          <p className="text-muted-foreground">
            Actualiza la información de {usuario.nombre} {usuario.apellido}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <UserForm usuario={usuario} isEdit unidades={unidades} />
    </div>
  )
}

