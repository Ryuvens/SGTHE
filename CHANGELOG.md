# Changelog

Todos los cambios notables en este proyecto serán documentados aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### 🎯 Checkpoint CP-000 - 2025-01-15

#### Agregado
- Inicialización del repositorio SGTHE
- Estructura de documentación base
- Templates de GitHub para issues
- CHANGELOG para tracking de cambios

#### Configurado
- Git repository conectado a GitHub
- Branch strategy establecida
- Directorio de trabajo preparado

### 🎯 Checkpoint CP-001 - 2025-01-15

#### Agregado
- Inicialización de Next.js 14 con App Router
- Configuración de TypeScript 5.7
- Integración de Tailwind CSS 3.4
- Estructura de carpetas src/ con componentes base
- Layout principal con metadata SEO
- Página de inicio temporal
- Scripts de desarrollo (dev, build, start, lint)
- Configuración de ESLint para Next.js

#### Configurado
- package.json con 417 dependencias
- next.config.mjs con optimizaciones
- tailwind.config.js con variables CSS
- tsconfig.json con path aliases (@/*)
- PostCSS con Tailwind y Autoprefixer

#### Corregido
- Cambio de next.config.ts a next.config.mjs (compatibilidad)
- Cambio de tailwind.config.ts a tailwind.config.js

### 🎯 Checkpoint CP-002 - 2025-01-14

#### Infraestructura de Base de Datos 🗄️

**Prisma ORM:**
- Prisma 6.17.1 instalado como devDependency
- @prisma/client 6.17.1 instalado
- Cliente Prisma generado en src/generated/prisma (1.2 MB con tipos TypeScript)
- Soporte para edge runtime de Vercel
- 34 paquetes adicionales instalados

**Vercel Postgres:**
- Base de datos PostgreSQL configurada con Prisma Accelerate
- Connection pooling automático
- Optimizaciones de caché habilitadas
- DATABASE_URL configurada en .env (protegida)

**Schema Completo:**
- 13 modelos de datos creados (Usuario, TipoTurno, RolTurnos, AsignacionTurno, JornadaDiaria, HoraExtraordinaria, Compensacion, Ausencia, LimitesFatiga, HabilitacionControlador, CambioTurno, CategoriaDependencia, Configuracion)
- 8 enums PostgreSQL (Rol, EstadoRolTurnos, TipoRecargo, TipoCompensacion, EstadoCompensacion, TipoAusencia, EstadoCambioTurno, CategoriaHabilitacion)
- 408 líneas de schema basado en PRO DRH 22 y DAN 11

**Primera Migración:**
- Migración 20251014161803_init ejecutada
- 316 líneas SQL generadas
- 13 tablas creadas en Vercel Postgres
- 8 enums PostgreSQL creados
- Índices y constraints aplicados
- Base de datos sincronizada

**Seeds con Datos Iniciales:**
- 30 tipos de turnos del glosario oficial (D, N, S, OP, OE, CIC, A, AV, O, OV, DA, DV, DC, DN, FLA, L, E, EV, IA, IAV, ID, IN, IS, C, CV, PA, PAV, B, R, D11S)
- 4 categorías de dependencia (TWR, APP, ACC, FSS)
- Usuario administrador inicial (admin@dgac.cl)
- 11 configuraciones del sistema basadas en PRO DRH 22

**Herramientas de Desarrollo:**
- tsx 4.19.2 instalado para ejecutar TypeScript
- Scripts de seed configurados en package.json
- .env.example creado como template
- Prisma Studio disponible para visualización

#### Archivos Creados
- prisma/schema.prisma (408 líneas)
- prisma/seed.ts (459 líneas)
- prisma/migrations/20251014161803_init/migration.sql (316 líneas)
- .env.example (template público)
- src/generated/prisma/ (cliente generado - ignorado)

#### Normativa Implementada
- PRO DRH 22 (Ed. 3, Julio 2016): Cálculo de HH.EE. y compensaciones
- DAN 11 (Apéndice 6): Limitaciones horarias y gestión de fatiga
- PRO ATS 01: Administración de Servicios de Tránsito Aéreo

#### Estadísticas
- Paquetes totales: 480 (+60 nuevos)
- Vulnerabilidades: 0
- Líneas de SQL: 316
- Líneas de TypeScript: 867 (schema + seeds)
- Tamaño del cliente Prisma: ~1.2 MB

---

## Leyenda

- ✨ **Agregado**: Nuevas funcionalidades
- 🔧 **Cambiado**: Cambios en funcionalidades existentes
- 🗑️ **Deprecado**: Funcionalidades que se eliminarán pronto
- ❌ **Eliminado**: Funcionalidades eliminadas
- 🐛 **Corregido**: Corrección de bugs
- 🔒 **Seguridad**: Mejoras de seguridad
