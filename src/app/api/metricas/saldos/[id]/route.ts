import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const saldoUpdateSchema = z.object({
  saldoAnterior: z.number().optional(),
  horasTrabajadas: z.number().optional(),
  horasExtras: z.number().optional(),
  horasCompensables: z.number().optional(),
  horasAcumuladas: z.number().optional(),
  motivo: z.string().optional(),
  observaciones: z.string().optional(),
  documentoRespaldo: z.string().url().optional().nullable(),
});

// GET - Obtener un saldo específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    const saldo = await prisma.saldoHorasFuncionario.findUnique({
      where: { id },
      include: {
        funcionario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            rut: true,
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
    });

    if (!saldo) {
      return NextResponse.json(
        { error: 'Saldo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(saldo);
  } catch (error) {
    console.error('Error al obtener saldo:', error);
    return NextResponse.json(
      { error: 'Error al obtener saldo' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un saldo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const validacion = saldoUpdateSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: validacion.error.issues },
        { status: 400 }
      );
    }

    // Verificar que el saldo existe
    const saldoExistente = await prisma.saldoHorasFuncionario.findUnique({
      where: { id },
    });

    if (!saldoExistente) {
      return NextResponse.json(
        { error: 'Saldo no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el saldo
    const saldoActualizado = await prisma.saldoHorasFuncionario.update({
      where: { id },
      data: validacion.data,
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

    return NextResponse.json(saldoActualizado);
  } catch (error) {
    console.error('Error al actualizar saldo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar saldo' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un saldo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verificar que el saldo existe
    const saldoExistente = await prisma.saldoHorasFuncionario.findUnique({
      where: { id },
    });

    if (!saldoExistente) {
      return NextResponse.json(
        { error: 'Saldo no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el saldo
    await prisma.saldoHorasFuncionario.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Saldo eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar saldo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar saldo' },
      { status: 500 }
    );
  }
}
