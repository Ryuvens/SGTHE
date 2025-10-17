'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2, Save, X, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'
import { calcularHorasTrabajadas, horasAFormato } from '@/lib/utils/time'
import type { KioscoSession } from '@/types/kiosco'

// Schema de validación
const registroSchema = z.object({
  fecha: z.string().min(1, 'Fecha requerida'),
  sector: z.enum(['O', 'N', 'ON']).optional(),
  horaInicio: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3])[0-5][0-9]$/, 'Formato inválido (hhmm)'),
  horaTermino: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3])[0-5][0-9]$/, 'Formato inválido (hhmm)'),
  tipoActividad: z.enum([
    'CONTROLADOR_SECTOR',
    'CONTROLADOR_COORDINADOR',
    'SUPERVISOR_CONTROL',
    'INSTRUCTOR',
    'ATCO_ENTRENAMIENTO',
  ]),
  esEntrenamiento: z.boolean().optional(),
  esExamen: z.boolean().optional(),
})

type RegistroForm = z.infer<typeof registroSchema>

interface RegistroATC6FormProps {
  session: KioscoSession
  onCancel: () => void
  onSuccess: () => void
}

const SECTORES = [
  { value: 'O', label: 'Sector Oscar' },
  { value: 'N', label: 'Sector November' },
  { value: 'ON', label: 'Sector O+N (Refundido)' },
]

const TIPOS_ACTIVIDAD = [
  { value: 'CONTROLADOR_SECTOR', label: 'Controlador de Sector' },
  { value: 'CONTROLADOR_COORDINADOR', label: 'Controlador Coordinador' },
  { value: 'SUPERVISOR_CONTROL', label: 'Supervisor de Control' },
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'ATCO_ENTRENAMIENTO', label: 'ATCO en Entrenamiento' },
]

export function RegistroATC6Form({ session, onCancel, onSuccess }: RegistroATC6FormProps) {
  const router = useRouter()
  const [totalHoras, setTotalHoras] = useState<string>('')
  const [isCalculating, setIsCalculating] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistroForm>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0], // Fecha de hoy
      sector: undefined,
      horaInicio: '',
      horaTermino: '',
      tipoActividad: 'CONTROLADOR_SECTOR',
      esEntrenamiento: false,
      esExamen: false,
    },
  })

  const horaInicio = watch('horaInicio')
  const horaTermino = watch('horaTermino')
  const sector = watch('sector')
  const tipoActividad = watch('tipoActividad')
  const esEntrenamiento = watch('esEntrenamiento')
  const esExamen = watch('esExamen')

  // Calcular horas automáticamente
  useEffect(() => {
    if (horaInicio && horaTermino) {
      // Validar formato
      const formatoValido = /^([0-1][0-9]|2[0-3])[0-5][0-9]$/.test(horaInicio) &&
                           /^([0-1][0-9]|2[0-3])[0-5][0-9]$/.test(horaTermino)
      
      if (formatoValido) {
        setIsCalculating(true)
        try {
          const horas = calcularHorasTrabajadas(horaInicio, horaTermino)
          setTotalHoras(horasAFormato(horas))
        } catch (error) {
          setTotalHoras('Error')
        } finally {
          setIsCalculating(false)
        }
      } else {
        setTotalHoras('')
      }
    } else {
      setTotalHoras('')
    }
  }, [horaInicio, horaTermino])

  const crearRegistro = trpc.atc6.crear.useMutation({
    onSuccess: () => {
      toast.success('Registro guardado exitosamente', {
        description: `${totalHoras} horas registradas en sector ${sector}`,
        duration: 3000,
      })
      onSuccess()
      router.push('/kiosco')
    },
    onError: (error) => {
      toast.error('Error al guardar registro', {
        description: error.message || 'Intenta nuevamente',
        duration: 4000,
      })
    },
  })

  const onSubmit = async (data: RegistroForm) => {
    // Validar sector
    if (!data.sector) {
      toast.error('Debes seleccionar un sector')
      return
    }

    // Validar que las horas sean diferentes
    if (data.horaInicio === data.horaTermino) {
      toast.error('Las horas de inicio y término deben ser diferentes')
      return
    }

    await crearRegistro.mutateAsync({
      unidadId: session.unidadId,
      fecha: new Date(data.fecha),
      sector: data.sector,
      turno: 'DIURNO', // Detectado automáticamente por el backend
      usuarioId: session.usuarioId,
      iniciales: session.iniciales,
      horaInicio: data.horaInicio,
      horaTermino: data.horaTermino,
      tipoActividad: data.tipoActividad,
      esEntrenamiento: data.esEntrenamiento || false,
      esExamen: data.esExamen || false,
      esNocturno: false, // Calculado automáticamente por el backend
      esDiaInhabil: false, // Calculado automáticamente por el backend
      origen: 'MANUAL',
      creadoPor: session.usuarioId,
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>📝 Registro ATC-6</CardTitle>
        <CardDescription>
          Registra tus horas de control - Usuario: {session.iniciales}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha *</Label>
            <Input
              id="fecha"
              type="date"
              {...register('fecha')}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.fecha && (
              <p className="text-sm text-red-500">{errors.fecha.message}</p>
            )}
          </div>

          {/* Sector */}
          <div className="space-y-2">
            <Label htmlFor="sector">Sector *</Label>
            <Select value={sector} onValueChange={(value) => setValue('sector', value as any)}>
              <SelectTrigger id="sector">
                <SelectValue placeholder="Selecciona un sector..." />
              </SelectTrigger>
              <SelectContent>
                {SECTORES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sector && (
              <p className="text-sm text-red-500">{errors.sector.message}</p>
            )}
          </div>

          {/* Horas */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Hora Inicio */}
            <div className="space-y-2">
              <Label htmlFor="horaInicio">
                Hora Inicio (UTC) *
                <span className="ml-2 text-xs text-muted-foreground">hhmm</span>
              </Label>
              <Input
                id="horaInicio"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="0800"
                className="font-mono text-lg"
                {...register('horaInicio')}
              />
              {errors.horaInicio && (
                <p className="text-sm text-red-500">{errors.horaInicio.message}</p>
              )}
            </div>

            {/* Hora Término */}
            <div className="space-y-2">
              <Label htmlFor="horaTermino">
                Hora Término (UTC) *
                <span className="ml-2 text-xs text-muted-foreground">hhmm</span>
              </Label>
              <Input
                id="horaTermino"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="1600"
                className="font-mono text-lg"
                {...register('horaTermino')}
              />
              {errors.horaTermino && (
                <p className="text-sm text-red-500">{errors.horaTermino.message}</p>
              )}
            </div>
          </div>

          {/* Total Calculado */}
          {totalHoras && (
            <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Total calculado:</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {isCalculating ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    totalHoras
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tipo de Actividad */}
          <div className="space-y-2">
            <Label htmlFor="tipoActividad">Tipo de Actividad *</Label>
            <Select
              value={tipoActividad}
              onValueChange={(value) => setValue('tipoActividad', value as any)}
            >
              <SelectTrigger id="tipoActividad">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ACTIVIDAD.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipoActividad && (
              <p className="text-sm text-red-500">{errors.tipoActividad.message}</p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                id="esEntrenamiento"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...register('esEntrenamiento')}
              />
              <Label htmlFor="esEntrenamiento" className="font-normal">
                Es entrenamiento
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="esExamen"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...register('esExamen')}
              />
              <Label htmlFor="esExamen" className="font-normal">
                Es examen
              </Label>
            </div>
          </div>

          {/* Información adicional */}
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">💡 Información</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Las horas deben ingresarse en formato UTC (hhmm)</li>
              <li>• El sistema detecta automáticamente si es turno nocturno</li>
              <li>• El sistema detecta automáticamente si es día inhábil</li>
              {esEntrenamiento && <li>• Registro marcado como entrenamiento</li>}
              {esExamen && <li>• Registro marcado como examen</li>}
            </ul>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !totalHoras}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Registro
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

