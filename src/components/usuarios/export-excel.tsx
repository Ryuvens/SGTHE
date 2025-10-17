'use client'

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import type { UsuarioWithRelations } from '@/lib/actions/usuarios'
import { RolUsuario } from '@prisma/client'

interface ExportOptions {
  filename?: string
  includeHabilitaciones?: boolean
  includeMetadata?: boolean
}

export function exportUsuariosToExcel(
  usuarios: UsuarioWithRelations[],
  options: ExportOptions = {}
) {
  const {
    filename = `usuarios_${format(new Date(), 'yyyyMMdd_HHmmss')}`,
    includeHabilitaciones = true,
    includeMetadata = true,
  } = options

  try {
    // Preparar datos para exportación
    const exportData = usuarios.map(usuario => {
      const baseData: any = {
        'RUT': usuario.rut || '',
        'Nombre': usuario.nombre,
        'Apellido': usuario.apellido,
        'Email': usuario.email,
        'Abreviatura': usuario.abreviatura?.codigo || '',
        'N° Licencia': usuario.numeroLicencia || '-',
        'Rol': getRolLabel(usuario.rol),
        'Unidad': usuario.unidad.nombre,
        'Estado': usuario.activo ? 'Activo' : 'Inactivo',
      }

      // Agregar habilitaciones si se solicita
      if (includeHabilitaciones && usuario.habilitaciones) {
        baseData['Cant. Habilitaciones'] = usuario.habilitaciones.length
      }

      // Agregar metadata si se solicita
      if (includeMetadata) {
        baseData['Fecha Registro'] = format(
          new Date(usuario.createdAt),
          'dd/MM/yyyy',
          { locale: es }
        )
        baseData['Última Actualización'] = format(
          new Date(usuario.updatedAt),
          'dd/MM/yyyy',
          { locale: es }
        )
      }

      return baseData
    })

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()

    // Hoja principal de usuarios
    const ws = XLSX.utils.json_to_sheet(exportData)

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 12 }, // RUT
      { wch: 15 }, // Nombre
      { wch: 20 }, // Apellido
      { wch: 30 }, // Email
      { wch: 10 }, // Abreviatura
      { wch: 12 }, // Licencia
      { wch: 25 }, // Rol
      { wch: 30 }, // Unidad
      { wch: 10 }, // Estado
    ]

    if (includeHabilitaciones) {
      colWidths.push({ wch: 15 }) // Cant. Habilitaciones
    }

    if (includeMetadata) {
      colWidths.push({ wch: 15 }) // Fecha Registro
      colWidths.push({ wch: 18 }) // Última Actualización
    }

    ws['!cols'] = colWidths

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios')

    // Si hay habilitaciones, crear hoja detallada
    if (includeHabilitaciones) {
      const habilitacionesData: any[] = []
      
      usuarios.forEach(usuario => {
        usuario.habilitaciones.forEach(hab => {
          habilitacionesData.push({
            'RUT': usuario.rut || '',
            'Nombre Completo': `${usuario.nombre} ${usuario.apellido}`,
            'Tipo Habilitación': hab.tipoHabilitacion,
            'Unidad': hab.unidad.nombre,
            'Fecha Inicio': format(
              new Date(hab.fechaInicio),
              'dd/MM/yyyy',
              { locale: es }
            ),
            'Fecha Vencimiento': hab.fechaVencimiento
              ? format(new Date(hab.fechaVencimiento), 'dd/MM/yyyy', { locale: es })
              : 'Sin vencimiento',
            'Estado': hab.activa ? 'Activa' : 'Inactiva',
            'Requiere Pericia': hab.requierePericia ? 'Sí' : 'No',
            'Horas Mínimas/Mes': hab.horasMinimasMes,
          })
        })
      })

      if (habilitacionesData.length > 0) {
        const wsHab = XLSX.utils.json_to_sheet(habilitacionesData)
        wsHab['!cols'] = [
          { wch: 12 }, // RUT
          { wch: 30 }, // Nombre
          { wch: 15 }, // Tipo
          { wch: 30 }, // Unidad
          { wch: 15 }, // Fecha Inicio
          { wch: 15 }, // Fecha Vencimiento
          { wch: 12 }, // Estado
          { wch: 18 }, // Requiere Pericia
          { wch: 18 }, // Horas Mínimas
        ]
        XLSX.utils.book_append_sheet(wb, wsHab, 'Habilitaciones')
      }
    }

    // Crear hoja de resumen
    const resumenData = [
      { 'Métrica': 'Total de Usuarios', 'Valor': usuarios.length },
      { 'Métrica': 'Usuarios Activos', 'Valor': usuarios.filter(u => u.activo).length },
      { 'Métrica': 'Usuarios Inactivos', 'Valor': usuarios.filter(u => !u.activo).length },
      { 'Métrica': 'Administradores', 'Valor': usuarios.filter(u => u.rol === 'ADMIN_SISTEMA').length },
      { 'Métrica': 'Jefes de Unidad', 'Valor': usuarios.filter(u => u.rol === 'JEFE_UNIDAD').length },
      { 'Métrica': 'Supervisores ATS', 'Valor': usuarios.filter(u => u.rol === 'SUPERVISOR_ATS').length },
      { 'Métrica': 'Controladores', 'Valor': usuarios.filter(u => u.rol === 'ATCO').length },
      { 'Métrica': 'ATCOs en Entrenamiento', 'Valor': usuarios.filter(u => u.rol === 'ATCO_ENTRENAMIENTO').length },
      { 'Métrica': 'Con Licencia', 'Valor': usuarios.filter(u => u.numeroLicencia).length },
      { 'Métrica': 'Sin Licencia', 'Valor': usuarios.filter(u => !u.numeroLicencia).length },
    ]

    if (includeHabilitaciones) {
      const totalHab = usuarios.reduce((acc, u) => acc + u.habilitaciones.length, 0)
      const avgHab = usuarios.length > 0 ? (totalHab / usuarios.length).toFixed(2) : '0'
      
      resumenData.push(
        { 'Métrica': 'Total Habilitaciones', 'Valor': totalHab as any },
        { 'Métrica': 'Promedio Hab. por Usuario', 'Valor': avgHab as any },
        { 'Métrica': 'Usuarios sin Habilitaciones', 
          'Valor': usuarios.filter(u => u.habilitaciones.length === 0).length }
      )
    }

    const wsResumen = XLSX.utils.json_to_sheet(resumenData)
    wsResumen['!cols'] = [{ wch: 30 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    // Agregar información del reporte
    const infoData = [
      { 'Campo': 'Fecha de Generación', 'Valor': format(new Date(), 'PPPp', { locale: es }) },
      { 'Campo': 'Sistema', 'Valor': 'SGTHE - Sistema de Gestión de Turnos y Horas Extraordinarias' },
      { 'Campo': 'Módulo', 'Valor': 'Gestión de Usuarios' },
      { 'Campo': 'Total de Registros', 'Valor': usuarios.length },
      { 'Campo': 'Formato', 'Valor': 'Microsoft Excel (.xlsx)' },
    ]

    const wsInfo = XLSX.utils.json_to_sheet(infoData)
    wsInfo['!cols'] = [{ wch: 25 }, { wch: 50 }]
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Información')

    // Generar archivo
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    
    // Guardar archivo
    saveAs(blob, `${filename}.xlsx`)
    
    toast.success(`Exportado correctamente: ${usuarios.length} usuarios`)
    
    return true
  } catch (error) {
    console.error('Error al exportar:', error)
    toast.error('Error al exportar usuarios a Excel')
    return false
  }
}

// Funciones auxiliares
function getRolLabel(rol: RolUsuario): string {
  const roles: Record<RolUsuario, string> = {
    ADMIN_SISTEMA: 'Administrador del Sistema',
    JEFE_UNIDAD: 'Jefe de Unidad',
    SUPERVISOR_ATS: 'Supervisor ATS',
    ATCO: 'Controlador',
    ATCO_ENTRENAMIENTO: 'Controlador en Entrenamiento',
  }
  return roles[rol]
}

