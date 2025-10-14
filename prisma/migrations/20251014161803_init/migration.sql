-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'SUPERVISOR', 'ENCARGADO_PERSONAL', 'CONTROLADOR');

-- CreateEnum
CREATE TYPE "EstadoRolTurnos" AS ENUM ('BORRADOR', 'PUBLICADO', 'APROBADO', 'CERRADO');

-- CreateEnum
CREATE TYPE "TipoRecargo" AS ENUM ('DIURNO', 'NOCTURNO', 'FESTIVO');

-- CreateEnum
CREATE TYPE "TipoCompensacion" AS ENUM ('DESCANSO_COMPLEMENTARIO', 'PAGO_HORAS_EXTRAS', 'PAGO_PROMEDIO_LICENCIA');

-- CreateEnum
CREATE TYPE "EstadoCompensacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'PAGADA');

-- CreateEnum
CREATE TYPE "TipoAusencia" AS ENUM ('FERIADO_LEGAL', 'LICENCIA_MEDICA', 'PERMISO_ADMINISTRATIVO', 'PERMISO_SIN_GOCE', 'COMISION_SERVICIO');

-- CreateEnum
CREATE TYPE "EstadoCambioTurno" AS ENUM ('SOLICITADO', 'APROBADO', 'RECHAZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CategoriaHabilitacion" AS ENUM ('TWR', 'APP', 'ACC', 'FSS');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'CONTROLADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "sueldo" DECIMAL(10,2),
    "asignacionesSalariales" DECIMAL(10,2),
    "valorHora" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoTurno" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "duracionTotal" DECIMAL(4,2) NOT NULL,
    "horasDiurnas" DECIMAL(4,2) NOT NULL,
    "horasNocturnas" DECIMAL(4,2) NOT NULL,
    "esOperacional" BOOLEAN NOT NULL DEFAULT true,
    "esAdministrativo" BOOLEAN NOT NULL DEFAULT false,
    "esDescanso" BOOLEAN NOT NULL DEFAULT false,
    "esAusencia" BOOLEAN NOT NULL DEFAULT false,
    "horasCompensadas" DECIMAL(4,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoTurno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolTurnos" (
    "id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "año" INTEGER NOT NULL,
    "estado" "EstadoRolTurnos" NOT NULL DEFAULT 'BORRADOR',
    "fechaPublicacion" TIMESTAMP(3),
    "fechaAprobacion" TIMESTAMP(3),
    "fechaCierre" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolTurnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsignacionTurno" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "rolTurnosId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipoTurnoId" TEXT NOT NULL,
    "horaInicioReal" TEXT,
    "horaFinReal" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsignacionTurno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JornadaDiaria" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "horasTrabajadas" DECIMAL(4,2) NOT NULL,
    "horasDiurnas" DECIMAL(4,2) NOT NULL,
    "horasNocturnas" DECIMAL(4,2) NOT NULL,
    "dentroHLM" BOOLEAN NOT NULL DEFAULT true,
    "esFestivo" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JornadaDiaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoraExtraordinaria" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "horasExtras" DECIMAL(4,2) NOT NULL,
    "tipoRecargo" "TipoRecargo" NOT NULL,
    "porcentajeRecargo" DECIMAL(3,0) NOT NULL,
    "horasConRecargo" DECIMAL(5,2) NOT NULL,
    "montoAPagar" DECIMAL(10,2),
    "dentroHLM" BOOLEAN NOT NULL DEFAULT false,
    "mes" INTEGER NOT NULL,
    "año" INTEGER NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HoraExtraordinaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compensacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoCompensacion" NOT NULL,
    "estado" "EstadoCompensacion" NOT NULL DEFAULT 'PENDIENTE',
    "horasACompensar" DECIMAL(5,2) NOT NULL,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAprobacion" TIMESTAMP(3),
    "fechaEjecucion" DATE,
    "montoAPagar" DECIMAL(10,2),
    "fechaPago" TIMESTAMP(3),
    "mes" INTEGER NOT NULL,
    "año" INTEGER NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compensacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ausencia" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoAusencia" NOT NULL,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE NOT NULL,
    "diasTotales" INTEGER NOT NULL,
    "documentoRespaldo" TEXT,
    "observaciones" TEXT,
    "aprobada" BOOLEAN NOT NULL DEFAULT false,
    "fechaAprobacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ausencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimitesFatiga" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "año" INTEGER NOT NULL,
    "horasMensuales" DECIMAL(5,2) NOT NULL,
    "diasConsecutivos" INTEGER NOT NULL DEFAULT 0,
    "horasAnuales" DECIMAL(6,2) NOT NULL,
    "alertaMensual" BOOLEAN NOT NULL DEFAULT false,
    "alertaAnual" BOOLEAN NOT NULL DEFAULT false,
    "alertaConsecutivos" BOOLEAN NOT NULL DEFAULT false,
    "ultimoDescanso" DATE,
    "horasDescanso" DECIMAL(3,1),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LimitesFatiga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabilitacionControlador" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "dependenciaId" TEXT NOT NULL,
    "fechaHabilitacion" DATE NOT NULL,
    "fechaVencimiento" DATE,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HabilitacionControlador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CambioTurno" (
    "id" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "reemplazanteId" TEXT NOT NULL,
    "fechaTurno" DATE NOT NULL,
    "estado" "EstadoCambioTurno" NOT NULL DEFAULT 'SOLICITADO',
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRespuesta" TIMESTAMP(3),
    "motivoSolicitud" TEXT NOT NULL,
    "motivoRechazo" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CambioTurno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaDependencia" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" "CategoriaHabilitacion" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaDependencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_rut_key" ON "Usuario"("rut");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_rut_idx" ON "Usuario"("rut");

-- CreateIndex
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "TipoTurno_codigo_key" ON "TipoTurno"("codigo");

-- CreateIndex
CREATE INDEX "TipoTurno_codigo_idx" ON "TipoTurno"("codigo");

-- CreateIndex
CREATE INDEX "TipoTurno_esOperacional_idx" ON "TipoTurno"("esOperacional");

-- CreateIndex
CREATE INDEX "RolTurnos_estado_idx" ON "RolTurnos"("estado");

-- CreateIndex
CREATE INDEX "RolTurnos_mes_año_idx" ON "RolTurnos"("mes", "año");

-- CreateIndex
CREATE UNIQUE INDEX "RolTurnos_mes_año_key" ON "RolTurnos"("mes", "año");

-- CreateIndex
CREATE INDEX "AsignacionTurno_fecha_idx" ON "AsignacionTurno"("fecha");

-- CreateIndex
CREATE INDEX "AsignacionTurno_usuarioId_fecha_idx" ON "AsignacionTurno"("usuarioId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionTurno_rolTurnosId_usuarioId_fecha_key" ON "AsignacionTurno"("rolTurnosId", "usuarioId", "fecha");

-- CreateIndex
CREATE INDEX "JornadaDiaria_usuarioId_fecha_idx" ON "JornadaDiaria"("usuarioId", "fecha");

-- CreateIndex
CREATE INDEX "JornadaDiaria_fecha_idx" ON "JornadaDiaria"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "JornadaDiaria_usuarioId_fecha_key" ON "JornadaDiaria"("usuarioId", "fecha");

-- CreateIndex
CREATE INDEX "HoraExtraordinaria_usuarioId_mes_año_idx" ON "HoraExtraordinaria"("usuarioId", "mes", "año");

-- CreateIndex
CREATE INDEX "HoraExtraordinaria_fecha_idx" ON "HoraExtraordinaria"("fecha");

-- CreateIndex
CREATE INDEX "Compensacion_usuarioId_estado_idx" ON "Compensacion"("usuarioId", "estado");

-- CreateIndex
CREATE INDEX "Compensacion_mes_año_idx" ON "Compensacion"("mes", "año");

-- CreateIndex
CREATE INDEX "Ausencia_usuarioId_fechaInicio_idx" ON "Ausencia"("usuarioId", "fechaInicio");

-- CreateIndex
CREATE INDEX "Ausencia_tipo_idx" ON "Ausencia"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "LimitesFatiga_usuarioId_key" ON "LimitesFatiga"("usuarioId");

-- CreateIndex
CREATE INDEX "LimitesFatiga_mes_año_idx" ON "LimitesFatiga"("mes", "año");

-- CreateIndex
CREATE UNIQUE INDEX "LimitesFatiga_usuarioId_mes_año_key" ON "LimitesFatiga"("usuarioId", "mes", "año");

-- CreateIndex
CREATE INDEX "HabilitacionControlador_usuarioId_idx" ON "HabilitacionControlador"("usuarioId");

-- CreateIndex
CREATE INDEX "HabilitacionControlador_dependenciaId_idx" ON "HabilitacionControlador"("dependenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "HabilitacionControlador_usuarioId_dependenciaId_key" ON "HabilitacionControlador"("usuarioId", "dependenciaId");

-- CreateIndex
CREATE INDEX "CambioTurno_solicitanteId_estado_idx" ON "CambioTurno"("solicitanteId", "estado");

-- CreateIndex
CREATE INDEX "CambioTurno_reemplazanteId_estado_idx" ON "CambioTurno"("reemplazanteId", "estado");

-- CreateIndex
CREATE INDEX "CambioTurno_fechaTurno_idx" ON "CambioTurno"("fechaTurno");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaDependencia_codigo_key" ON "CategoriaDependencia"("codigo");

-- CreateIndex
CREATE INDEX "CategoriaDependencia_codigo_idx" ON "CategoriaDependencia"("codigo");

-- CreateIndex
CREATE INDEX "CategoriaDependencia_categoria_idx" ON "CategoriaDependencia"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "Configuracion_clave_key" ON "Configuracion"("clave");

-- CreateIndex
CREATE INDEX "Configuracion_clave_idx" ON "Configuracion"("clave");

-- AddForeignKey
ALTER TABLE "AsignacionTurno" ADD CONSTRAINT "AsignacionTurno_rolTurnosId_fkey" FOREIGN KEY ("rolTurnosId") REFERENCES "RolTurnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionTurno" ADD CONSTRAINT "AsignacionTurno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionTurno" ADD CONSTRAINT "AsignacionTurno_tipoTurnoId_fkey" FOREIGN KEY ("tipoTurnoId") REFERENCES "TipoTurno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JornadaDiaria" ADD CONSTRAINT "JornadaDiaria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoraExtraordinaria" ADD CONSTRAINT "HoraExtraordinaria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compensacion" ADD CONSTRAINT "Compensacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ausencia" ADD CONSTRAINT "Ausencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimitesFatiga" ADD CONSTRAINT "LimitesFatiga_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabilitacionControlador" ADD CONSTRAINT "HabilitacionControlador_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabilitacionControlador" ADD CONSTRAINT "HabilitacionControlador_dependenciaId_fkey" FOREIGN KEY ("dependenciaId") REFERENCES "CategoriaDependencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CambioTurno" ADD CONSTRAINT "CambioTurno_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CambioTurno" ADD CONSTRAINT "CambioTurno_reemplazanteId_fkey" FOREIGN KEY ("reemplazanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
