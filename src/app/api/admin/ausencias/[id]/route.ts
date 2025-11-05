import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { recalcularYGuardarMetricas } from '@/lib/services/metricasCompletas.service';

// ═══════════════════════════════════════════════════════════
// DELETE: Eliminar ausencia
// ═══════════════════════════════════════════════════════════

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener usuario con permisos
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
    });

    if (!usuario) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    // 3. Verificar permisos (opcional: solo roles específicos pueden eliminar)
    const rolesPermitidos = ['ADMIN_SISTEMA', 'JEFE_UNIDAD', 'SUPERVISOR_ATS'];
    if (!rolesPermitidos.includes(usuario.rol)) {
      return NextResponse.json(
        { message: 'No tienes permisos para eliminar ausencias' },
        { status: 403 }
      );
    }

    // 4. Verificar que la ausencia existe y obtener datos para recálculo
    const ausencia = await prisma.ausencia.findUnique({
      where: { id: params.id },
      include: {
        publicacion: {
          select: {
            id: true,
            mes: true,
            año: true,
          },
        },
      },
    });

    if (!ausencia) {
      return NextResponse.json(
        { message: 'Ausencia no encontrada' },
        { status: 404 }
      );
    }

    // 5. Guardar datos para recálculo
    const { publicacionId, usuarioId } = ausencia;
    const { mes, año: anio } = ausencia.publicacion;

    // 6. Eliminar ausencia
    await prisma.ausencia.delete({
      where: { id: params.id },
    });

    // 7. Recalcular métricas tras eliminar ausencia
    try {
      await recalcularYGuardarMetricas({
        publicacionId,
        usuarioId,
        mes,
        anio,
      });
    } catch (error) {
      console.error('Error al recalcular métricas:', error);
      // No fallar la eliminación, solo log
    }

    return NextResponse.json({
      message: 'Ausencia eliminada correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar ausencia:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

