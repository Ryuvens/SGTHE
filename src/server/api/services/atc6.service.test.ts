import { describe, it, expect, beforeEach } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'
import { type PrismaClient } from '@prisma/client'
import { ATC6Service } from './atc6.service'

describe('ATC6 Service', () => {
  let prisma: DeepMockProxy<PrismaClient>
  let service: ATC6Service

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>()
    service = new ATC6Service(prisma as any)
    mockReset(prisma)
  })

  describe('crearRegistro', () => {
    const mockUsuario = {
      id: 'user-1',
      email: 'ifernandez@dgac.gob.cl',
      nombre: 'Ivan',
      apellido: 'Fernandez',
      abreviatura: {
        codigo: 'IFN',
        activa: true,
      },
    }

    const inputBase = {
      unidadId: 'acco-1',
      fecha: new Date(2025, 9, 21),
      sector: 'O' as const,
      turno: 'DIURNO' as const,
      usuarioId: 'user-1',
      iniciales: 'IFN',
      horaInicio: '0800',
      horaTermino: '1600',
      tipoActividad: 'CONTROLADOR_SECTOR' as const,
      esEntrenamiento: false,
      esExamen: false,
      esNocturno: false,
      esDiaInhabil: false,
      origen: 'MANUAL' as const,
      creadoPor: 'user-1',
    }

    it('debe crear un registro ATC-6 correctamente', async () => {
      // Mock: buscar usuario
      prisma.usuario.findUnique.mockResolvedValue(mockUsuario as any)

      // Mock: buscar registros existentes (sin conflictos) - PRIMERA LLAMADA
      prisma.registroATC6.findMany.mockResolvedValueOnce([])

      // Mock: crear registro
      const mockRegistro = {
        id: 'reg-1',
        ...inputBase,
        totalHoras: 8.0,
        totalHorasStr: '08:00',
        esValido: true,
        usuario: {
          id: 'user-1',
          nombre: 'Ivan',
          apellido: 'Fernandez',
          email: 'ifernandez@dgac.gob.cl',
        },
        puestoTrabajo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prisma.registroATC6.create.mockResolvedValue(mockRegistro as any)

      // Mock: consolidado mensual - SEGUNDA LLAMADA a findMany
      prisma.registroATC6.findMany.mockResolvedValueOnce([mockRegistro] as any)
      prisma.consolidadoATC6Mensual.upsert.mockResolvedValue({} as any)

      // Ejecutar
      const resultado = await service.crearRegistro(inputBase)

      // Verificar
      expect(resultado).toBeDefined()
      expect(resultado.totalHoras).toBe(8.0)
      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { abreviatura: true },
      })
      expect(prisma.registroATC6.create).toHaveBeenCalled()
    })

    it('debe lanzar error si usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null)

      await expect(service.crearRegistro(inputBase)).rejects.toThrow(
        'Usuario no encontrado'
      )
    })

    it('debe lanzar error si iniciales no coinciden', async () => {
      const usuarioConOtrasIniciales = {
        ...mockUsuario,
        abreviatura: {
          codigo: 'XXX',
          activa: true,
        },
      }

      prisma.usuario.findUnique.mockResolvedValue(usuarioConOtrasIniciales as any)

      await expect(service.crearRegistro(inputBase)).rejects.toThrow(
        'Las iniciales no coinciden'
      )
    })

    it('debe detectar conflictos de horario', async () => {
      prisma.usuario.findUnique.mockResolvedValue(mockUsuario as any)

      // Mock: registro existente con conflicto
      const registroConflictivo = {
        id: 'reg-exist',
        usuarioId: 'user-1',
        fecha: new Date(2025, 9, 21),
        horaInicio: '0700',
        horaTermino: '1500',
      }

      prisma.registroATC6.findMany.mockResolvedValue([registroConflictivo] as any)

      await expect(service.crearRegistro(inputBase)).rejects.toThrow(
        /Conflicto con registro existente/
      )
    })
  })

  describe('listarRegistros', () => {
    it('debe listar registros con filtros', async () => {
      const mockRegistros = [
        {
          id: 'reg-1',
          fecha: new Date(2025, 9, 21),
          horaInicio: '0800',
          horaTermino: '1600',
          usuario: {
            nombre: 'Ivan',
            apellido: 'Fernandez',
          },
        },
      ]

      prisma.registroATC6.findMany.mockResolvedValue(mockRegistros as any)
      prisma.registroATC6.count.mockResolvedValue(1)

      const resultado = await service.listarRegistros({
        unidadId: 'acco-1',
        fecha: new Date(2025, 9, 21),
        limit: 50,
        offset: 0,
      })

      expect(resultado.registros).toHaveLength(1)
      expect(resultado.total).toBe(1)
      expect(resultado.hasMore).toBe(false)
    })
  })

  describe('obtenerConsolidadoMensual', () => {
    it('debe obtener consolidado de un usuario específico', async () => {
      const mockConsolidado = {
        usuarioId: 'user-1',
        mes: 10,
        año: 2025,
        horasSectorO: 15.5,
        horasSectorN: 8.0,
        horasSectorON: 4.5,
        totalHoras: 28.0,
        cumpleMinimo: true,
        requiereVCP: false,
      }

      prisma.consolidadoATC6Mensual.findUnique.mockResolvedValue(mockConsolidado as any)

      const resultado = await service.obtenerConsolidadoMensual({
        unidadId: 'acco-1',
        mes: 10,
        año: 2025,
        usuarioId: 'user-1',
      })

      expect(resultado).toHaveLength(1)
      expect(resultado[0]?.totalHoras).toBe(28.0)
    })

    it('debe obtener todos los consolidados de la unidad', async () => {
      const mockConsolidados = [
        {
          usuarioId: 'user-1',
          totalHoras: 28.0,
          usuario: { nombre: 'Ivan', apellido: 'Fernandez' },
        },
        {
          usuarioId: 'user-2',
          totalHoras: 20.5,
          usuario: { nombre: 'Jorge', apellido: 'Morgado' },
        },
      ]

      prisma.consolidadoATC6Mensual.findMany.mockResolvedValue(mockConsolidados as any)

      const resultado = await service.obtenerConsolidadoMensual({
        unidadId: 'acco-1',
        mes: 10,
        año: 2025,
      })

      expect(resultado).toHaveLength(2)
    })
  })

  describe('detectarAlertasVCP', () => {
    it('debe detectar ATCOs que requieren VCP', async () => {
      const mockAlertasVCP = [
        {
          usuarioId: 'user-1',
          totalHoras: 8.5,
          requiereVCP: true,
          usuario: {
            nombre: 'Test',
            apellido: 'User',
            email: 'test@dgac.gob.cl',
            numeroLicencia: '12345',
          },
        },
      ]

      prisma.consolidadoATC6Mensual.findMany.mockResolvedValue(mockAlertasVCP as any)

      const resultado = await service.detectarAlertasVCP({
        unidadId: 'acco-1',
        mes: 10,
        año: 2025,
        horasMinimasRequeridas: 10,
      })

      expect(resultado).toHaveLength(1)
      expect(resultado[0]?.requiereVCP).toBe(true)
      expect(resultado[0]?.diferencia).toBe(-1.5)
    })
  })

  describe('eliminarRegistro', () => {
    it('debe eliminar un registro y recalcular consolidado', async () => {
      const mockRegistro = {
        id: 'reg-1',
        usuarioId: 'user-1',
        unidadId: 'acco-1',
        fecha: new Date(2025, 9, 21),
      }

      prisma.registroATC6.findUnique.mockResolvedValue(mockRegistro as any)
      prisma.registroATC6.delete.mockResolvedValue(mockRegistro as any)
      prisma.registroATC6.findMany.mockResolvedValue([])
      prisma.consolidadoATC6Mensual.upsert.mockResolvedValue({} as any)

      const resultado = await service.eliminarRegistro('reg-1', 'user-admin')

      expect(resultado.success).toBe(true)
      expect(prisma.registroATC6.delete).toHaveBeenCalledWith({
        where: { id: 'reg-1' },
      })
    })

    it('debe lanzar error si registro no existe', async () => {
      prisma.registroATC6.findUnique.mockResolvedValue(null)

      await expect(
        service.eliminarRegistro('reg-inexistente', 'user-admin')
      ).rejects.toThrow('Registro no encontrado')
    })
  })
})

