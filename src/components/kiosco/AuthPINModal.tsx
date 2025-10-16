'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import type { KioscoSession } from '@/types/kiosco'

const authPINSchema = z.object({
  iniciales: z.string().min(2, 'Selecciona tu código'),
  pin: z.string().length(4, 'PIN debe tener 4 dígitos').regex(/^\d+$/, 'Solo números'),
})

type AuthPINForm = z.infer<typeof authPINSchema>

interface AuthPINModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (session: KioscoSession) => void
  unidadId: string
  actionTitle?: string
}

// Lista de iniciales disponibles (esto debería venir de la API)
const INICIALES_DISPONIBLES = [
  { value: 'JMC', label: 'JMC - Jorge Morgado' },
  { value: 'IFN', label: 'IFN - Ivan Fernandez' },
  { value: 'MSM', label: 'MSM - Marcelo Silva' },
  { value: 'APN', label: 'APN - Alexis Pacheco' },
  { value: 'CAT', label: 'CAT - Claudia Armijo' },
  { value: 'CCM', label: 'CCM - Cristian Cortes' },
  { value: 'ACS', label: 'ACS - Alex Carrillo' },
  { value: 'CLA', label: 'CLA - Christian Larrondo' },
  { value: 'CPR', label: 'CPR - Christian Plummer' },
  { value: 'DCJ', label: 'DCJ - Dino Canales' },
  { value: 'GTM', label: 'GTM - Giselle Tello' },
  { value: 'IOG', label: 'IOG - Ivonne Orrego' },
  { value: 'JAM', label: 'JAM - Jenny Moraga' },
  { value: 'JVB', label: 'JVB - Jesenia Valenzuela' },
  { value: 'PCA', label: 'PCA - Patricio Concha' },
  { value: 'UGA', label: 'UGA - Ursula Garrido' },
  { value: 'FSG', label: 'FSG - Felipe Serrano' },
  { value: 'RHE', label: 'RHE - Ruben Hernandez' },
  { value: 'MMJ', label: 'MMJ - Maria Molina' },
]

export function AuthPINModal({
  open,
  onOpenChange,
  onSuccess,
  unidadId,
  actionTitle = 'Acción',
}: AuthPINModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AuthPINForm>({
    resolver: zodResolver(authPINSchema),
  })

  const autenticarPIN = trpc.atc6.autenticarPIN.useMutation({
    onSuccess: (data) => {
      const session: KioscoSession = {
        usuarioId: data.usuario.id,
        nombre: data.usuario.nombre,
        apellido: data.usuario.apellido,
        iniciales: data.usuario.iniciales,
        unidadId: data.usuario.unidad.id,
        unidadNombre: data.usuario.unidad.nombre,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30000), // 30 segundos
      }

      toast.success(`Bienvenido, ${session.nombre}`)
      onSuccess(session)
      onOpenChange(false)
      reset()
    },
    onError: (error) => {
      toast.error('Error de autenticación', {
        description: error.message || 'PIN o código incorrecto',
      })
      setIsSubmitting(false)
    },
  })

  const onSubmit = async (data: AuthPINForm) => {
    setIsSubmitting(true)
    await autenticarPIN.mutateAsync({
      iniciales: data.iniciales,
      pin: data.pin,
      unidadId,
    })
    setIsSubmitting(false)
  }

  const inicialesSeleccionadas = watch('iniciales')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Confirma tu identidad
          </DialogTitle>
          <DialogDescription>
            Para realizar la acción: <strong>{actionTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Selector de iniciales */}
          <div className="space-y-2">
            <Label htmlFor="iniciales">Código ATCO</Label>
            <Select
              value={inicialesSeleccionadas}
              onValueChange={(value) => setValue('iniciales', value)}
            >
              <SelectTrigger id="iniciales">
                <SelectValue placeholder="Selecciona tu código..." />
              </SelectTrigger>
              <SelectContent>
                {INICIALES_DISPONIBLES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.iniciales && (
              <p className="text-sm text-red-500">{errors.iniciales.message}</p>
            )}
          </div>

          {/* Input de PIN */}
          <div className="space-y-2">
            <Label htmlFor="pin">PIN (4 dígitos)</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              className="text-center text-2xl tracking-widest"
              {...register('pin')}
              autoComplete="off"
            />
            {errors.pin && (
              <p className="text-sm text-red-500">{errors.pin.message}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                reset()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !inicialesSeleccionadas}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </div>
        </form>

        {/* Ayuda */}
        <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          <p className="font-medium">💡 Ayuda</p>
          <p className="mt-1 text-xs">
            Selecciona tu código ATCO e ingresa tu PIN de 4 dígitos. Si no recuerdas
            tu PIN, contacta al jefe de unidad.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

