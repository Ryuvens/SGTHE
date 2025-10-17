'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function TurnosPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <Construction className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-center">En Construcción</CardTitle>
          <CardDescription className="text-center">
            El rol de turnos estará disponible pronto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => router.push('/kiosco')}
          >
            ← Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

