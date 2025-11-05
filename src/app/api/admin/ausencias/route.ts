import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { recalcularMetricasTrasAusencia } from '@/lib/services/metricasCompletas.service';

// ═══════════════════════════════════════════════════════════
// FUNCIÓN AUXILIAR: Calcular días hábiles
// ═══════════════════════════════════════════════════════════

function calcularDiasHabiles(fechaInicio: Date, fechaFin: Date): number {
  let dias = 0;
  const current = new Date(fechaInicio);
  
  while (current <= fechaFin) {
    const dayOfWeek = current.getDay();
    // Lunes a Viernes (1-5)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dias++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return dias;
}

// ═══════════════════════════════════════════════════════════
// POST: Crear nueva ausencia
// ═══════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    // 1. Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
    });

    if (!usuario) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    // 3. Parsear body
    const body = await request.json();
    const { funcionarioId, tipo, fechaInicio, fechaFin, observaciones, publicacionId } = body;

    // 4. Validar campos requeridos
    if (!funcionarioId || !tipo) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos: funcionarioId y tipo' },
        { status: 400 }
      );
    }

    // 5. Validar tipo de ausencia
    const tiposValidos = ['LM', 'FLA', 'PA', 'PG', 'OTRO'];
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { message: 'Tipo de ausencia inválido' },
        { status: 400 }
      );
    }

    // 6. Determinar si es ausencia por días (LM, FLA) o por horas (PA, PG, OTRO)
    const esPorDias = ['LM', 'FLA'].includes(tipo);

    let ausenciaData: any = {
      usuarioId: funcionarioId,
      tipo,
      observaciones: observaciones || null,
      creadoPor: usuario.id,
    };

    if (esPorDias) {
      // Ausencias por días (LM, FLA)
      if (!fechaInicio || !fechaFin) {
        return NextResponse.json(
          { message: 'Se requieren fechaInicio y fechaFin para ausencias por días' },
          { status: 400 }
        );
      }

      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      if (fin < inicio) {
        return NextResponse.json(
          { message: 'La fecha de fin debe ser posterior a la fecha de inicio' },
          { status: 400 }
        );
      }

      const diasHabiles = calcularDiasHabiles(inicio, fin);

      ausenciaData = {
        ...ausenciaData,
        fechaInicio: inicio,
        fechaFin: fin,
        diasHabiles,
      };
    } else {
      // Ausencias por horas (PA, PG, OTRO)
      // Por ahora, si se proporciona fechaInicio, la usamos como fecha única
      if (fechaInicio) {
        ausenciaData.fecha = new Date(fechaInicio);
      }
      // El campo horas se puede agregar después manualmente o calcularse
      ausenciaData.horas = 0; // Por defecto
    }

    // 7. Si hay publicacionId, asociar
    if (publicacionId) {
      ausenciaData.publicacionId = publicacionId;
    }

    // 8. Crear ausencia
    const ausencia = await prisma.ausencia.create({
      data: ausenciaData,
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    // 9. Recalcular métricas tras registrar ausencia
    try {
      await recalcularMetricasTrasAusencia(ausencia.id);
    } catch (error) {
      console.error('Error al recalcular métricas:', error);
      // No fallar el registro, solo log
    }

    return NextResponse.json({
      message: 'Ausencia registrada correctamente',
      ...ausencia,
    });
  } catch (error) {
    console.error('Error al crear ausencia:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

