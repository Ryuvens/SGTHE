import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { unidadId: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { unidadId } = params;

    const configuracion = await prisma.configuracionUnidad.findUnique({
      where: { unidadId },
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

    // Si no existe configuración, retornar valores por defecto
    if (!configuracion) {
      return NextResponse.json({
        unidadId,
        jornadaMensualEstandar: 180,
        porcentajePagoHE: 70,
        esDefault: true,
      });
    }

    return NextResponse.json(configuracion);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración de unidad' },
      { status: 500 }
    );
  }
}
