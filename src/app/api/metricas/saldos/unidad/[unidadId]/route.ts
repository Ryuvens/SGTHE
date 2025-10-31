import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { calcularMetricasUnidad } from '@/lib/services/metricas.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { unidadId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { unidadId } = params;
    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get('mes') || '0');
    const anio = parseInt(searchParams.get('anio') || '0');

    if (!mes || !anio || mes < 1 || mes > 12) {
      return NextResponse.json(
        { error: 'Mes y año son requeridos y válidos' },
        { status: 400 }
      );
    }

    // Obtener todos los funcionarios activos de la unidad
    const funcionarios = await prisma.usuario.findMany({
      where: {
        unidadId,
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        rut: true,
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' },
      ],
    });

    // Calcular mes anterior
    let mesAnterior = mes - 1;
    let anioAnterior = anio;
    if (mesAnterior === 0) {
      mesAnterior = 12;
      anioAnterior = anio - 1;
    }

    // Obtener métricas del mes anterior para calcular HAC automático
    let metricasMesAnterior;
    try {
      metricasMesAnterior = await calcularMetricasUnidad(
        unidadId,
        mesAnterior,
        anioAnterior,
        false
      );
    } catch (error) {
      console.error('Error al calcular métricas del mes anterior:', error);
      // Si falla, continuar con saldos automáticos en 0
      metricasMesAnterior = { metricas: [] };
    }

    // Para cada funcionario, obtener su saldo automático (HAC del mes anterior)
    // y verificar si tiene ajuste manual para el mes actual
    const saldosPromises = funcionarios.map(async (funcionario) => {
      // 1. Buscar si tiene ajuste manual para este mes
      // Consideramos ajuste manual si tiene un registro con motivo
      const ajusteManual = await prisma.saldoHorasFuncionario.findUnique({
        where: {
          funcionarioId_mes_anio: {
            funcionarioId: funcionario.id,
            mes,
            anio,
          },
        },
      });

      // 2. Calcular saldo automático del mes anterior (HAC)
      const metricaFuncionario = metricasMesAnterior.metricas?.find(
        (m) => m.funcionarioId === funcionario.id
      );
      const saldoAutomatico = metricaFuncionario?.HAC || 0;

      return {
        funcionario,
        saldoAutomatico: Number(saldoAutomatico),
        ajusteManual: ajusteManual && ajusteManual.motivo 
          ? Number(ajusteManual.saldoAnterior) 
          : null,
        tieneAjusteManual: !!(ajusteManual && ajusteManual.motivo),
      };
    });

    const saldos = await Promise.all(saldosPromises);

    return NextResponse.json(saldos);
  } catch (error) {
    console.error('Error al obtener saldos:', error);
    return NextResponse.json(
      { error: 'Error al obtener saldos' },
      { status: 500 }
    );
  }
}
