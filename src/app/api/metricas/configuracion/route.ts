import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const configuracionSchema = z.object({
  unidadId: z.string().min(1, 'ID de unidad es requerido'),
  jornadaMensualEstandar: z.number().min(120).max(240, 'Jornada debe estar entre 120 y 240 horas'),
  porcentajePagoHE: z.number().min(0).max(100, 'Porcentaje debe estar entre 0 y 100'),
});

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
    const validacion = configuracionSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: validacion.error.issues },
        { status: 400 }
      );
    }

    const { unidadId, jornadaMensualEstandar, porcentajePagoHE } = validacion.data;

    // Verificar que la unidad existe
    const unidad = await prisma.unidad.findUnique({
      where: { id: unidadId },
    });

    if (!unidad) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      );
    }

    // Crear o actualizar configuración (upsert)
    const configuracion = await prisma.configuracionUnidad.upsert({
      where: { unidadId },
      create: {
        unidadId,
        jornadaMensualEstandar,
        porcentajePagoHE,
      },
      update: {
        jornadaMensualEstandar,
        porcentajePagoHE,
      },
      include: {
        unidad: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
    });

    return NextResponse.json(configuracion, { status: 201 });
  } catch (error) {
    console.error('Error al crear/actualizar configuración:', error);
    return NextResponse.json(
      { error: 'Error al procesar la configuración' },
      { status: 500 }
    );
  }
}
