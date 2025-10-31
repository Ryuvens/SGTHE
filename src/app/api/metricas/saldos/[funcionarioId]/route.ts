import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { funcionarioId: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { funcionarioId } = params;
    const { searchParams } = new URL(request.url);
    const anio = searchParams.get('anio');
    const mes = searchParams.get('mes');

    // Construir filtros
    const where: any = { funcionarioId };
    
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
      { error: 'Error al obtener saldos de funcionario' },
      { status: 500 }
    );
  }
}
