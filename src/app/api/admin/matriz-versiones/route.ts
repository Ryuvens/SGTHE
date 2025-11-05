import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { crearNuevaVersion } from '@/lib/services/matrizVersion.service';

// ═══════════════════════════════════════════════════════════
// POST: Crear nueva versión de matriz
// ═══════════════════════════════════════════════════════════

export async function POST(request: Request) {
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
        { message: 'No tienes permisos para crear versiones de matriz' },
        { status: 403 }
      );
    }

    // 4. Parsear body
    const body = await request.json();
    const { unidadId, tipo, descripcion, creadoPor } = body;

    // 5. Validar campos requeridos
    if (!unidadId || !tipo || !descripcion || !creadoPor) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // 6. Validar tipo de versión
    if (!['minor', 'major'].includes(tipo)) {
      return NextResponse.json(
        { message: 'Tipo de versión inválido. Debe ser "minor" o "major"' },
        { status: 400 }
      );
    }

    // 7. Validar descripción
    if (descripcion.length < 10) {
      return NextResponse.json(
        { message: 'La descripción debe tener al menos 10 caracteres' },
        { status: 400 }
      );
    }

    // 8. Crear nueva versión usando el servicio
    const resultado = await crearNuevaVersion({
      unidadId,
      tipo,
      descripcion,
      creadoPor,
    });

    return NextResponse.json({
      message: 'Versión creada correctamente',
      ...resultado,
    });
  } catch (error) {
    console.error('Error al crear versión:', error);
    
    // Manejar errores específicos del servicio
    if (error instanceof Error) {
      if (error.message.includes('No existe versión activa')) {
        return NextResponse.json({ message: error.message }, { status: 404 });
      }
      if (error.message.includes('ya existe')) {
        return NextResponse.json({ message: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

