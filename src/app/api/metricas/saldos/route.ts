import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const saldoSchema = z.object({
  funcionarioId: z.string().min(1, 'ID de funcionario es requerido'),
  mes: z.number().min(1).max(12, 'Mes debe estar entre 1 y 12'),
  anio: z.number().min(2020).max(2100, 'Año inválido'),
  saldoAnterior: z.number().default(0),
  horasTrabajadas: z.number().default(0),
  horasExtras: z.number().default(0),
  horasCompensables: z.number().default(0),
  horasAcumuladas: z.number().default(0),
  motivo: z.string().optional(),
  observaciones: z.string().optional(),
  documentoRespaldo: z.string().url().optional().nullable(),
});

// GET - Obtener todos los saldos (con filtros opcionales)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unidadId = searchParams.get('unidadId');
    const anio = searchParams.get('anio');
    const mes = searchParams.get('mes');

    const where: any = {};

    if (unidadId) {
      where.funcionario = {
        unidadId,
      };
    }

    if (anio) {
      where.anio = parseInt(anio);
    }

    if (mes) {
      where.mes = parseInt(mes);
    }

    const saldos = await prisma.saldoHorasFuncionario.findMany({
      where,
      include: {
        funcionario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            rut: true,
            unidadId: true,
            unidad: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
              },
            },
          },
        },
      },
      orderBy: [
        { anio: 'desc' },
        { mes: 'desc' },
      ],
    });

    return NextResponse.json(saldos);
  } catch (error) {
    console.error('Error al obtener saldos:', error);
    return NextResponse.json(
      { error: 'Error al obtener saldos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo saldo o guardar múltiples ajustes
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Si viene un array de ajustes, procesar múltiples ajustes
    if (body.ajustes && Array.isArray(body.ajustes)) {
      const { ajustes } = body;

      // Validar cada ajuste
      for (const ajuste of ajustes) {
        if (
          !ajuste.funcionarioId ||
          !ajuste.mes ||
          !ajuste.anio ||
          ajuste.saldoAnterior === undefined
        ) {
          return NextResponse.json(
            { error: 'Datos incompletos en los ajustes' },
            { status: 400 }
          );
        }

        // Validar rango
        if (ajuste.saldoAnterior < -999.9 || ajuste.saldoAnterior > 999.9) {
          return NextResponse.json(
            { error: 'El saldo debe estar entre -999.9 y 999.9' },
            { status: 400 }
          );
        }
      }

      // Guardar todos los ajustes usando transacción
      const resultado = await prisma.$transaction(
        ajustes.map((ajuste: any) =>
          prisma.saldoHorasFuncionario.upsert({
            where: {
              funcionarioId_mes_anio: {
                funcionarioId: ajuste.funcionarioId,
                mes: ajuste.mes,
                anio: ajuste.anio,
              },
            },
            update: {
              saldoAnterior: ajuste.saldoAnterior,
              motivo: ajuste.motivo || 'Ajuste manual',
              updatedAt: new Date(),
            },
            create: {
              funcionarioId: ajuste.funcionarioId,
              mes: ajuste.mes,
              anio: ajuste.anio,
              saldoAnterior: ajuste.saldoAnterior,
              horasTrabajadas: 0,
              horasExtras: 0,
              horasCompensables: 0,
              horasAcumuladas: 0,
              motivo: ajuste.motivo || 'Ajuste manual',
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        ajustesGuardados: resultado.length,
      });
    }

    // Si viene un objeto único, procesar como saldo individual (compatibilidad)
    const validacion = saldoSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: validacion.error.issues },
        { status: 400 }
      );
    }

    const datos = validacion.data;

    // Verificar que el funcionario existe
    const funcionario = await prisma.usuario.findUnique({
      where: { id: datos.funcionarioId },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: 'Funcionario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que no exista ya un saldo para ese mes/año
    const saldoExistente = await prisma.saldoHorasFuncionario.findUnique({
      where: {
        funcionarioId_mes_anio: {
          funcionarioId: datos.funcionarioId,
          mes: datos.mes,
          anio: datos.anio,
        },
      },
    });

    if (saldoExistente) {
      return NextResponse.json(
        { error: 'Ya existe un saldo para este funcionario en este período' },
        { status: 409 }
      );
    }

    // Crear el saldo
    const nuevoSaldo = await prisma.saldoHorasFuncionario.create({
      data: datos,
      include: {
        funcionario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            rut: true,
          },
        },
      },
    });

    return NextResponse.json(nuevoSaldo, { status: 201 });
  } catch (error) {
    console.error('Error al crear saldo:', error);
    return NextResponse.json(
      { error: 'Error al crear saldo' },
      { status: 500 }
    );
  }
}
