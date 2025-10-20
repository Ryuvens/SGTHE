'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, ArrowLeft, Copy, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createPublicacion, getPublicacionPorPeriodo, getUnidades } from '@/lib/actions/turnos'

const formSchema = z.object({
  mes: z.string().min(1, 'Selecciona un mes'),
  año: z.string().min(1, 'Selecciona un año'),
  unidadId: z.string().min(1, 'Selecciona una unidad'),
  observaciones: z.string().optional(),
})

export default function NuevoRolPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [duplicarAnterior, setDuplicarAnterior] = useState(false)
  const [unidades, setUnidades] = useState<Array<{ id: string; nombre: string; codigo: string }>>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mes: '',
      año: new Date().getFullYear().toString(),
      unidadId: '',
      observaciones: '',
    },
  })

  // Cargar unidades
  useEffect(() => {
    async function loadUnidades() {
      const result = await getUnidades()
      if (result.success && result.data) {
        setUnidades(result.data)
      }
    }
    loadUnidades()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Verificar si ya existe
      const existing = await getPublicacionPorPeriodo(
        values.unidadId,
        parseInt(values.mes),
        parseInt(values.año)
      )

      if (existing.data) {
        toast.error('Ya existe un rol para este período y unidad')
        setIsLoading(false)
        return
      }

      // Crear nueva publicación
      const result = await createPublicacion({
        mes: parseInt(values.mes),
        año: parseInt(values.año),
        unidadId: values.unidadId,
        observaciones: values.observaciones,
        duplicarAnterior: duplicarAnterior,
      })

      if (result.success && result.data) {
        toast.success('Rol mensual creado correctamente')
        router.push(`/turnos/${result.data.id}`)
      } else {
        toast.error(result.error || 'Error al crear el rol')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error inesperado al crear el rol')
    } finally {
      setIsLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i)
  
  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/turnos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Rol Mensual</h2>
          <p className="text-muted-foreground">
            Crear una nueva publicación de turnos mensuales
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información del Período
            </CardTitle>
            <CardDescription>
              Define el mes, año y unidad para el rol
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mes</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona mes" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="año"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Año</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona año" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="unidadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona unidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unidades.map((unidad) => (
                            <SelectItem key={unidad.id} value={unidad.id}>
                              {unidad.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Unidad operacional para este rol
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notas o consideraciones especiales para este período..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={duplicarAnterior ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDuplicarAnterior(!duplicarAnterior)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {duplicarAnterior ? 'Duplicando anterior' : 'Duplicar anterior'}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" asChild disabled={isLoading}>
                      <Link href="/turnos">
                        Cancelar
                      </Link>
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>Creando...</>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Crear Rol
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
            <CardDescription>
              Así se verá el rol mensual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Período</p>
              <p className="text-lg font-semibold capitalize">
                {form.watch('mes') && form.watch('año')
                  ? format(
                      new Date(parseInt(form.watch('año')), parseInt(form.watch('mes')) - 1),
                      'MMMM yyyy',
                      { locale: es }
                    )
                  : 'Sin seleccionar'}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Unidad</p>
              <p className="text-lg font-semibold">
                {unidades.find(u => u.id === form.watch('unidadId'))?.nombre || 'Sin seleccionar'}
              </p>
            </div>

            {form.watch('observaciones') && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Observaciones</p>
                <p className="text-sm text-muted-foreground italic">
                  {form.watch('observaciones')}
                </p>
              </div>
            )}

            {duplicarAnterior && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  📋 Se copiarán las asignaciones del mes anterior
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Podrás modificarlas después de crear el rol
                </p>
              </div>
            )}

            <div className="rounded-lg bg-muted p-4 mt-6">
              <p className="text-xs text-muted-foreground">
                El rol se creará en estado <span className="font-semibold">BORRADOR</span>.
                Podrás gestionarlo y publicarlo cuando esté listo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

