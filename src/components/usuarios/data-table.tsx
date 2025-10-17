'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Search, Download, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { RolUsuario } from '@prisma/client'
import type { UsuarioWithRelations } from '@/lib/actions/usuarios'
import { deleteUsuario } from '@/lib/actions/usuarios'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { exportUsuariosToExcel } from './export-excel'

interface DataTableProps {
  data: UsuarioWithRelations[]
}

const rolColors: Record<RolUsuario, string> = {
  ADMIN_SISTEMA: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  JEFE_UNIDAD: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  SUPERVISOR_ATS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ATCO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ATCO_ENTRENAMIENTO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
}

const rolLabels: Record<RolUsuario, string> = {
  ADMIN_SISTEMA: 'Admin Sistema',
  JEFE_UNIDAD: 'Jefe Unidad',
  SUPERVISOR_ATS: 'Supervisor ATS',
  ATCO: 'Controlador',
  ATCO_ENTRENAMIENTO: 'ATCO Entrenamiento',
}

export function UsuariosDataTable({ data }: DataTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [userToDelete, setUserToDelete] = React.useState<UsuarioWithRelations | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Definir columnas
  const columns: ColumnDef<UsuarioWithRelations>[] = React.useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Seleccionar todo"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Seleccionar fila"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'rut',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            RUT
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue('rut') || '-'}</div>,
      },
      {
        accessorKey: 'nombre',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nombre Completo
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const usuario = row.original
          return (
            <div className="flex flex-col">
              <span className="font-medium">
                {usuario.nombre} {usuario.apellido}
              </span>
              {usuario.abreviatura && (
                <span className="text-sm text-muted-foreground">{usuario.abreviatura.codigo}</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="lowercase">{row.getValue('email')}</div>,
      },
      {
        accessorKey: 'numeroLicencia',
        header: 'Licencia',
        cell: ({ row }) => {
          const licencia = row.getValue('numeroLicencia') as string
          return licencia ? (
            <Badge variant="outline">{licencia}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )
        },
      },
      {
        accessorKey: 'rol',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Rol
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const rol = row.getValue('rol') as RolUsuario
          return (
            <Badge className={rolColors[rol]}>
              {rolLabels[rol]}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'unidad',
        header: 'Unidad',
        cell: ({ row }) => {
          const unidad = row.original.unidad
          return (
            <div className="text-sm">
              <div className="font-medium">{unidad.sigla}</div>
              <div className="text-muted-foreground truncate max-w-[150px]">{unidad.nombre}</div>
            </div>
          )
        },
      },
      {
        accessorKey: 'habilitaciones',
        header: 'Habilitaciones',
        cell: ({ row }) => {
          const habilitaciones = row.original.habilitaciones
          if (habilitaciones.length === 0) {
            return <span className="text-muted-foreground text-sm">Sin hab.</span>
          }
          return (
            <Badge variant="secondary" className="text-xs">
              {habilitaciones.length}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'activo',
        header: 'Estado',
        cell: ({ row }) => {
          const activo = row.getValue('activo') as boolean
          return (
            <Badge variant={activo ? 'default' : 'destructive'}>
              {activo ? 'Activo' : 'Inactivo'}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const usuario = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(usuario.id)}
                >
                  Copiar ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(`/usuarios/${usuario.id}`)}
                >
                  Ver detalles
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/usuarios/${usuario.id}/edit`)}
                >
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    setUserToDelete(usuario)
                    setDeleteDialogOpen(true)
                  }}
                >
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [router]
  )

  // Filtros personalizados
  React.useEffect(() => {
    const filters: ColumnFiltersState = []
    
    if (roleFilter !== 'all') {
      filters.push({ id: 'rol', value: roleFilter })
    }
    
    if (statusFilter !== 'all') {
      filters.push({ id: 'activo', value: statusFilter === 'active' })
    }
    
    setColumnFilters(filters)
  }, [roleFilter, statusFilter])

  // Configurar tabla
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: 'includesString',
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  // Manejar eliminación
  const handleDelete = async () => {
    if (!userToDelete) return
    
    setIsDeleting(true)
    const result = await deleteUsuario(userToDelete.id)
    
    if (result.success) {
      toast.success('Usuario eliminado correctamente')
      router.refresh()
    } else {
      toast.error(result.error || 'Error al eliminar usuario')
    }
    
    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  // Exportar a Excel
  const handleExport = async () => {
    try {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      const dataToExport = selectedRows.length > 0 
        ? selectedRows.map(row => row.original)
        : table.getFilteredRowModel().rows.map(row => row.original)
      
      exportUsuariosToExcel(dataToExport)
    } catch (error) {
      toast.error('Error al exportar datos')
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Barra de herramientas */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Búsqueda global */}
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
            />
          </div>
          
          {/* Filtro de rol */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="ADMIN_SISTEMA">Admin Sistema</SelectItem>
              <SelectItem value="JEFE_UNIDAD">Jefe Unidad</SelectItem>
              <SelectItem value="SUPERVISOR_ATS">Supervisor ATS</SelectItem>
              <SelectItem value="ATCO">Controlador</SelectItem>
              <SelectItem value="ATCO_ENTRENAMIENTO">ATCO Entren.</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Filtro de estado */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Acciones */}
        <div className="flex items-center space-x-2">
          {/* Selector de columnas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columnas <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Exportar */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={table.getFilteredRowModel().rows.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          
          {/* Nuevo usuario */}
          <Button
            size="sm"
            onClick={() => router.push('/usuarios/nuevo')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Información de selección */}
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {table.getFilteredSelectedRowModel().rows.length} de{' '}
            {table.getFilteredRowModel().rows.length} usuario(s) seleccionado(s)
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRowSelection({})}
          >
            Limpiar selección
          </Button>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {data.length} usuarios
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{' '}
              <strong>
                {userToDelete?.nombre} {userToDelete?.apellido}
              </strong>{' '}
              del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

