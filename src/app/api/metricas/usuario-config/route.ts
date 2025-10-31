import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const configuracionMetricasSchema = z.object({
  metricasVisibles: z.array(z.string()).min(5, 'Debe incluir al menos las 5 métricas CORE'),
  ordenMetricas: z.array(z.number()).min(5, 'Debe incluir orden para las métricas CORE'),
});

// GET - Obtener configuración del usuario actual
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    let configuracion = await prisma.configuracionMetricas.findUnique({
      where: { userId },
    });

    // Si no existe configuración, retornar valores por defecto
    if (!configuracion) {
      const configDefault = {
        userId,
        metricasVisibles: ['HT', 'HE', 'SA', 'HCP', 'HAC'], // Solo CORE por defecto
        ordenMetricas: [0, 1, 2, 3, 4], // Orden natural
        esDefault: true,
      };
      
      return NextResponse.json(configDefault);
    }

    return NextResponse.json({
      ...configuracion,
      metricasVisibles: configuracion.metricasVisibles as string[],
      ordenMetricas: configuracion.ordenMetricas as number[],
      esDefault: false,
    });
  } catch (error) {
    console.error('Error al obtener configuración de métricas:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración de métricas' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración del usuario actual
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const validacion = configuracionMetricasSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: validacion.error.issues },
        { status: 400 }
      );
    }

    const { metricasVisibles, ordenMetricas } = validacion.data;

    // Validar que incluya las métricas CORE obligatorias
    const metricasCORE = ['HT', 'HE', 'SA', 'HCP', 'HAC'];
    const faltanCORE = metricasCORE.filter(m => !metricasVisibles.includes(m));

    if (faltanCORE.length > 0) {
      return NextResponse.json(
        { 
          error: 'Faltan métricas CORE obligatorias', 
          faltantes: faltanCORE 
        },
        { status: 400 }
      );
    }

    // Validar que el número de orden coincida con el número de métricas
    if (ordenMetricas.length !== metricasVisibles.length) {
      return NextResponse.json(
        { error: 'El array de orden debe tener la misma longitud que las métricas visibles' },
        { status: 400 }
      );
    }

    // Validar que no haya índices duplicados
    const indicesUnicos = new Set(ordenMetricas);
    if (indicesUnicos.size !== ordenMetricas.length) {
      return NextResponse.json(
        { error: 'No puede haber índices de orden duplicados' },
        { status: 400 }
      );
    }

    // Crear o actualizar configuración (upsert)
    const configuracion = await prisma.configuracionMetricas.upsert({
      where: { userId },
      create: {
        userId,
        metricasVisibles: metricasVisibles as any,
        ordenMetricas: ordenMetricas as any,
      },
      update: {
        metricasVisibles: metricasVisibles as any,
        ordenMetricas: ordenMetricas as any,
      },
    });

    return NextResponse.json({
      ...configuracion,
      metricasVisibles: configuracion.metricasVisibles as string[],
      ordenMetricas: configuracion.ordenMetricas as number[],
    });
  } catch (error) {
    console.error('Error al actualizar configuración de métricas:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración de métricas' },
      { status: 500 }
    );
  }
}

// DELETE - Restablecer a configuración por defecto
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verificar si existe configuración
    const configuracionExistente = await prisma.configuracionMetricas.findUnique({
      where: { userId },
    });

    if (configuracionExistente) {
      // Eliminar configuración personalizada
      await prisma.configuracionMetricas.delete({
        where: { userId },
      });
    }

    // Retornar configuración por defecto
    return NextResponse.json({
      userId,
      metricasVisibles: ['HT', 'HE', 'SA', 'HCP', 'HAC'],
      ordenMetricas: [0, 1, 2, 3, 4],
      esDefault: true,
      message: 'Configuración restablecida a valores por defecto',
    });
  } catch (error) {
    console.error('Error al restablecer configuración:', error);
    return NextResponse.json(
      { error: 'Error al restablecer configuración' },
      { status: 500 }
    );
  }
}
