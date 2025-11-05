import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// ═══════════════════════════════════════════════════════════
// GET: Obtener un tipo de turno por ID
// ═══════════════════════════════════════════════════════════

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener tipo de turno
    const tipoTurno = await prisma.tipoTurno.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        duracionHoras: true,
        devolucionHoras: true,
        horasDiurnas: true,
        horasNocturnas: true,
        horasSabDomFest: true,
        matrizVersion: {
          select: {
            esBloqueada: true,
            version: true,
          },
        },
      },
    });

    if (!tipoTurno) {
      return NextResponse.json(
        { message: 'Tipo de turno no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(tipoTurno);
  } catch (error) {
    console.error('Error al obtener tipo de turno:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════
// PATCH: Actualizar un tipo de turno
// ═══════════════════════════════════════════════════════════

export async function PATCH(
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

    // 3. Verificar permisos
    const rolesPermitidos = ['ADMIN_SISTEMA', 'JEFE_UNIDAD'];
    if (!rolesPermitidos.includes(usuario.rol)) {
      return NextResponse.json(
        { message: 'No tienes permisos para editar tipos de turno' },
        { status: 403 }
      );
    }

    // 4. Obtener tipo de turno con versión
    const tipoTurno = await prisma.tipoTurno.findUnique({
      where: { id: params.id },
      include: {
        matrizVersion: true,
      },
    });

    if (!tipoTurno) {
      return NextResponse.json(
        { message: 'Tipo de turno no encontrado' },
        { status: 404 }
      );
    }

    // 5. Verificar que la versión no esté bloqueada
    if (tipoTurno.matrizVersion?.esBloqueada) {
      return NextResponse.json(
        { message: 'No se puede editar una versión bloqueada. Cree una nueva versión para hacer cambios.' },
        { status: 400 }
      );
    }

    // 6. Parsear body
    const body = await request.json();
    const { nombre, duracionHoras, devolucionHoras, horasDiurnas, horasNocturnas, horasSabDomFest } = body;

    // 7. Validación adicional: horasDiurnas + horasNocturnas <= duracionHoras
    if (duracionHoras && horasDiurnas && horasNocturnas) {
      if (horasDiurnas + horasNocturnas > duracionHoras) {
        return NextResponse.json(
          { message: 'Horas diurnas + nocturnas no puede exceder duración total' },
          { status: 400 }
        );
      }
    }

    // 8. Actualizar tipo de turno
    const tipoActualizado = await prisma.tipoTurno.update({
      where: { id: params.id },
      data: {
        nombre,
        duracionHoras,
        devolucionHoras,
        horasDiurnas,
        horasNocturnas,
        horasSabDomFest,
        modificadoPor: usuario.id,
      },
    });

    return NextResponse.json({
      message: 'Tipo de turno actualizado correctamente',
      data: tipoActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar tipo de turno:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

