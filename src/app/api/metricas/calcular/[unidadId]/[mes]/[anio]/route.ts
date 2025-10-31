import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { calcularMetricasUnidad } from '@/lib/services/metricas.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { unidadId: string; mes: string; anio: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { unidadId, mes, anio } = params;
    const { searchParams } = new URL(request.url);
    const incluirOpcionales = searchParams.get('opcionales') === 'true';

    // Validar parámetros
    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);

    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return NextResponse.json(
        { error: 'Mes inválido. Debe estar entre 1 y 12' },
        { status: 400 }
      );
    }

    if (isNaN(anioNum) || anioNum < 2020 || anioNum > 2100) {
      return NextResponse.json(
        { error: 'Año inválido' },
        { status: 400 }
      );
    }

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

    // Calcular métricas
    const resultado = await calcularMetricasUnidad(
      unidadId,
      mesNum,
      anioNum,
      incluirOpcionales
    );

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error al calcular métricas:', error);
    return NextResponse.json(
      { error: 'Error al calcular métricas' },
      { status: 500 }
    );
  }
}
