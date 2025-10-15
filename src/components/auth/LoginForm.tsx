// src/components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import { loginAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader2, Mail, Lock } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      className="w-full" 
      disabled={pending}
      size="lg"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Iniciando sesión...
        </>
      ) : (
        'Iniciar Sesión'
      )}
    </Button>
  )
}

export default function LoginForm() {
  const [error, setError] = useState<string>('')

  async function handleSubmit(formData: FormData) {
    setError('')
    const result = await loginAction(formData)
    
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-4 pb-8">
          {/* Logo DGAC */}
          <div className="flex justify-center">
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4 shadow-lg">
              <Image
                src="/logo-dgac.png"
                alt="Logo DGAC"
                fill
                className="object-contain p-3"
                priority
              />
            </div>
          </div>

          {/* Título y descripción */}
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Sistema SGTHE
            </CardTitle>
            <CardDescription className="text-base">
              Gestión de Turnos y Horas Extraordinarias
            </CardDescription>
          </div>

          {/* Badge informativo */}
          <div className="flex justify-center">
            <Badge variant="outline" className="text-xs font-normal px-3 py-1">
              <Mail className="mr-1.5 h-3 w-3" />
              Use su correo institucional @dgac.gob.cl
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 flex items-start gap-3 animate-in fade-in-50 duration-300">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Error de autenticación</p>
                  <p className="text-sm opacity-90 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Correo Electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="usuario@dgac.gob.cl"
                  required
                  autoComplete="email"
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>

          {/* Footer info */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Dirección General de Aeronáutica Civil
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              © 2025 DGAC - Todos los derechos reservados
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
