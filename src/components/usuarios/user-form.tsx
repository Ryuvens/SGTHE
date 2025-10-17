'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { RolUsuario } from '@prisma/client'
import { toast } from 'sonner'
import { Loader2, Save, X, User, Mail, Key, Shield, Hash, CreditCard } from 'lucide-react'

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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createUsuario, updateUsuario, type UsuarioWithRelations } from '@/lib/actions/usuarios'

// Schema de validación
const formSchema = z.object({
  rut: z.string()
    .min(9, 'RUT debe tener al menos 9 caracteres')
    .max(12, 'RUT debe tener máximo 12 caracteres')
    .regex(/^\d{7,8}-[\dkK]$/, 'Formato de RUT inválido (ej: 12345678-9)'),
  nombre: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre debe tener máximo 50 caracteres'),
  apellido: z.string()
    .min(2, 'Apellido debe tener al menos 2 caracteres')
    .max(50, 'Apellido debe tener máximo 50 caracteres'),
  email: z.string()
    .email('Email inválido')
    .min(5, 'Email debe tener al menos 5 caracteres'),
  numeroLicencia: z.string().optional(),
  rol: z.nativeEnum(RolUsuario),
  unidadId: z.string().min(1, 'Debes seleccionar una unidad'),
  activo: z.boolean(),
  pin: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (!data.password) return true
  return data.password.length >= 8
}, {
  message: 'La contraseña debe tener al menos 8 caracteres',
  path: ['password'],
}).refine((data) => {
  if (!data.password) return true
  return /[A-Z]/.test(data.password)
}, {
  message: 'La contraseña debe contener al menos una mayúscula',
  path: ['password'],
}).refine((data) => {
  if (!data.password) return true
  return /[0-9]/.test(data.password)
}, {
  message: 'La contraseña debe contener al menos un número',
  path: ['password'],
}).refine((data) => {
  if (!data.password) return true
  return data.password === data.confirmPassword
}, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

interface UserFormProps {
  usuario?: UsuarioWithRelations
  isEdit?: boolean
  unidades?: Array<{ id: string; nombre: string; sigla: string }>
}

export function UserForm({ usuario, isEdit = false, unidades = [] }: UserFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  // Configurar formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rut: usuario?.rut || '',
      nombre: usuario?.nombre || '',
      apellido: usuario?.apellido || '',
      email: usuario?.email || '',
      numeroLicencia: usuario?.numeroLicencia || '',
      rol: usuario?.rol || 'ATCO',
      unidadId: usuario?.unidadId || (unidades[0]?.id || ''),
      activo: usuario?.activo ?? true,
      pin: usuario?.pin || '',
      password: '',
      confirmPassword: '',
    },
  })

  // Formatear RUT automáticamente
  const formatRut = (value: string) => {
    // Eliminar caracteres no numéricos excepto K
    let cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase()
    
    // Si tiene más de 8 dígitos, insertar guión
    if (cleaned.length > 1) {
      const body = cleaned.slice(0, -1)
      const dv = cleaned.slice(-1)
      if (body.length >= 7) {
        return `${body}-${dv}`
      }
    }
    return cleaned
  }

  // Manejar envío
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Preparar datos
      const data: any = {
        rut: values.rut.toUpperCase(),
        nombre: values.nombre,
        apellido: values.apellido,
        email: values.email.toLowerCase(),
        numeroLicencia: values.numeroLicencia || undefined,
        rol: values.rol,
        unidadId: values.unidadId,
        activo: values.activo,
        pin: values.pin || undefined,
      }

      // Solo incluir password si es nuevo usuario o si se está cambiando
      if (!isEdit && values.password) {
        data.password = values.password
      } else if (isEdit && !values.password) {
        // En edición, si no hay password, no la incluimos
        delete data.password
      }

      let result
      if (isEdit && usuario) {
        result = await updateUsuario(usuario.id, data)
      } else {
        // Para nuevo usuario, password es requerido
        if (!values.password) {
          form.setError('password', {
            type: 'manual',
            message: 'La contraseña es requerida para nuevos usuarios',
          })
          setIsLoading(false)
          return
        }
        data.password = values.password
        result = await createUsuario(data)
      }

      if (result.success) {
        toast.success(
          isEdit 
            ? 'Usuario actualizado correctamente' 
            : 'Usuario creado correctamente'
        )
        router.push('/usuarios')
        router.refresh()
      } else {
        toast.error(result.error || 'Error al guardar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error inesperado al guardar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Datos personales del funcionario
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CreditCard className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="12345678-9"
                        className="pl-8"
                        onChange={(e) => {
                          const formatted = formatRut(e.target.value)
                          field.onChange(formatted)
                        }}
                        maxLength={12}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Formato: 12345678-9
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numeroLicencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>N° Licencia (Opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Hash className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input {...field} placeholder="10001" className="pl-8" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Número de licencia ATC
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Juan Carlos" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Pérez González" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Institucional</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="jperez@dgac.gob.cl"
                        className="pl-8"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Correo institucional DGAC
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN Kiosco (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="1234"
                      maxLength={4}
                    />
                  </FormControl>
                  <FormDescription>
                    PIN de 4 dígitos para modo kiosco
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Configuración de Acceso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configuración de Acceso
            </CardTitle>
            <CardDescription>
              Rol, unidad y permisos del usuario en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="unidadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unidades.map(unidad => (
                          <SelectItem key={unidad.id} value={unidad.id}>
                            {unidad.sigla} - {unidad.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Unidad a la que pertenece
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol del Sistema</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ATCO">Controlador</SelectItem>
                        <SelectItem value="ATCO_ENTRENAMIENTO">ATCO en Entrenamiento</SelectItem>
                        <SelectItem value="SUPERVISOR_ATS">Supervisor ATS</SelectItem>
                        <SelectItem value="JEFE_UNIDAD">Jefe de Unidad</SelectItem>
                        <SelectItem value="ADMIN_SISTEMA">Administrador del Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define los permisos del usuario
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Usuario Activo
                    </FormLabel>
                    <FormDescription>
                      Permitir acceso al sistema
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Contraseña (solo para nuevos usuarios o cambio de contraseña) */}
            {(!isEdit || showPassword) && (
              <>
                <Separator />
                <div className="space-y-4">
                  {isEdit && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Dejar en blanco para mantener la contraseña actual
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowPassword(false)
                          form.setValue('password', '')
                          form.setValue('confirmPassword', '')
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar cambio
                      </Button>
                    </div>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {isEdit ? 'Nueva Contraseña' : 'Contraseña'}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="••••••••"
                                className="pl-8"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Mín. 8 caracteres, 1 mayúscula, 1 número
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="••••••••"
                                className="pl-8"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}

            {isEdit && !showPassword && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPassword(true)}
              >
                <Key className="mr-2 h-4 w-4" />
                Cambiar Contraseña
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/usuarios')}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}

