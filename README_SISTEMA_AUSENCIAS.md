# 🚀 SGTHE - Sistema de Gestión de Turnos y Horas Extraordinarias

Sistema integral para la gestión de turnos, cálculo de métricas mensuales y control de ausencias del personal de control de tránsito aéreo de la DGAC Chile, específicamente para el Centro de Control Oceánico de Santiago (ACCO).

**Versión:** 1.0.0  
**Fecha:** Noviembre 2025  
**Normativa:** PRO DRH 22 (Ed. 3 / JUL.2016)

---

## 📋 Índice

1. [Características](#características)
2. [Arquitectura](#arquitectura)
3. [Instalación](#instalación)
4. [Uso](#uso)
5. [Módulos](#módulos)
6. [Fórmulas de Cálculo](#fórmulas-de-cálculo)
7. [API](#api)
8. [Testing](#testing)
9. [Estructura del Proyecto](#estructura-del-proyecto)

---

## ✨ Características

### **🎯 Core del Sistema**
- ✅ **Versionamiento de Matriz de Turnos:** Sistema de versiones semánticas (v1.0, v1.1, v2.0) con bloqueo automático
- ✅ **31 Tipos de Turno Oficiales:** Códigos completos según normativa ACCO (D, N, S, DA, DV, DC, etc.)
- ✅ **Cálculo Automático de Métricas:** 9 fórmulas PRO DRH 22 implementadas con precisión
- ✅ **Gestión de Ausencias:** 5 tipos (LM, FLA, PA, PG, OTRO) con impacto automático en cálculo
- ✅ **Recálculo Automático:** Sistema reactivo que actualiza métricas tras cambios en ausencias

### **🎨 Panel Administrativo**
- ✅ **CRUD Tipos de Turno:** Edición inline con validaciones cruzadas
- ✅ **Historial de Versiones:** Timeline completo con metadata y estadísticas
- ✅ **Gestión de Ausencias:** Registro con date pickers, visualización agrupada y eliminación
- ✅ **Widget de Ausencias:** Integrado en panel de edición de turnos (sticky sidebar)

### **📊 Métricas Calculadas (PRO DRH 22)**
- ✅ **HMR:** Horario Mensual Realizado (suma bruta no ponderada)
- ✅ **HLM:** Horario Legal Mensual (ajustado por ausencias LM/FLA)
- ✅ **HMC:** Horario Mensual Corregido (HLM - DC - Permisos)
- ✅ **Ponderación:** Dinámica × 0.5 o × 1.5 según HMC vs HMR
- ✅ **Total Horas:** HMR + Ponderación (si HMC ≥ HMR)
- ✅ **HDF:** Horas Diurnas Faltantes
- ✅ **HE:** Horas Extras Ponderadas

---

## 🏗️ Arquitectura

### **Stack Tecnológico**
- **Frontend:** Next.js 15 (App Router), React 18, TypeScript 5
- **Backend:** Next.js API Routes, Prisma ORM 6.17
- **Base de Datos:** PostgreSQL 14+ (Vercel Postgres + Prisma Accelerate)
- **UI:** shadcn/ui, Tailwind CSS, Radix UI
- **Formularios:** react-hook-form, Zod
- **Drag & Drop:** @dnd-kit/core
- **Notificaciones:** Sonner (Toast)
- **Fechas:** date-fns con locale español

### **Patrones de Diseño**
- **Server Components:** Para páginas con datos iniciales
- **Client Components:** Para interactividad (modals, formularios, drag & drop)
- **API Routes:** Separación clara de lógica de backend
- **Service Layer:** Servicios reutilizables para lógica de negocio
- **Prisma Transactions:** Para operaciones atómicas (crear versión + bloquear anterior + clonar tipos)

---

## 🚀 Instalación

### **Prerrequisitos**
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### **Pasos**

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd sgthe
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales de BD
```

Contenido de `.env`:
```env
# Database (Vercel Postgres)
DATABASE_URL="postgresql://..."
POSTGRES_URL="postgresql://..."
DIRECT_DATABASE_URL="${POSTGRES_URL}"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key-aqui"
```

4. **Migrar la base de datos**
```bash
npx prisma db push
```

5. **Ejecutar script inicial de v1.0**
```bash
npx tsx src/lib/scripts/init-matriz-v1.ts
```

Resultado esperado:
```
🚀 FASE 2: Inicialización de Matrices de Turnos v1.0
═══════════════════════════════════════════════════════════

📋 Unidades encontradas: 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Procesando: ACCO (ACCO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   👤 Creador: Admin Sistema (ADMIN_SISTEMA)
   ✅ Versión v1.0 creada exitosamente
   📝 Tipos de turno a migrar: 31
   ✅ 31 tipos de turno actualizados con v1.0
   ✅ 12 publicaciones actualizadas con v1.0

🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE

📊 RESUMEN:
   • Unidades procesadas: 1
   • Tipos de turno actualizados: 31
   • Publicaciones actualizadas: 12
```

6. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

7. **Abrir en navegador**
```
http://localhost:3000
```

---

## 📖 Uso

### **1. Acceso al Sistema**
```
URL: http://localhost:3000/login
Credenciales: [Configurar según tu base de datos]
```

### **2. Gestión de Matriz de Turnos**
```
Ruta: /admin/matriz-turnos

Permisos requeridos: ADMIN_SISTEMA, JEFE_UNIDAD

Acciones:
- ✅ Ver 31 tipos de turno de la versión activa
- ✅ Editar valores (duracionHoras, devolucionHoras, horasDiurnas, horasNocturnas)
- ✅ Ver historial completo de versiones
- ✅ Crear nueva versión (minor: v1.0→v1.1, major: v1.0→v2.0)
- ✅ Validaciones automáticas (suma de horas, versiones duplicadas)
```

### **3. Gestión de Ausencias**
```
Ruta: /admin/ausencias

Permisos requeridos: Todos los roles (lectura), ADMIN_SISTEMA/JEFE_UNIDAD (escritura)

Acciones:
- ✅ Registrar ausencia (5 tipos: LM, FLA, PA, PG, OTRO)
- ✅ Ver ausencias de últimos 3 meses
- ✅ Eliminar ausencias (con confirmación)
- ✅ Ver impacto en métricas (cards resumen por tipo)
- ✅ Recálculo automático de métricas tras crear/eliminar
```

### **4. Panel de Edición de Turnos**
```
Ruta: /turnos/[id]/editar

Acciones:
- ✅ Arrastrar y soltar turnos en calendario
- ✅ Ver métricas calculadas en tiempo real
- ✅ Widget de ausencias del mes (sticky sidebar)
- ✅ Ver alertas de impacto (días/horas descontadas)
- ✅ Link rápido a gestión de ausencias
```

---

## 🧩 Módulos

### **1. Versionamiento de Matriz**
**Archivo:** `src/lib/services/matrizVersion.service.ts`

**Funciones principales:**
- `getVersionActiva(unidadId)` - Obtener versión activa con tipos de turno
- `getHistorialVersiones(unidadId)` - Timeline de todas las versiones
- `crearNuevaVersion(params)` - Crear nueva versión con clonación automática
- `aplicarVersionAPublicacion(...)` - Cambiar versión de una publicación

**Características:**
- Versionamiento semántico (v1.0, v1.1, v2.0)
- Bloqueo automático de versión anterior
- Clonación completa de 31 tipos de turno
- Transacción atómica (bloqueo + creación + clonación)
- Validaciones: versión duplicada, versión activa inexistente

---

### **2. Cálculo de Métricas**
**Archivo:** `src/lib/services/metricasCompletas.service.ts`

**Funciones principales:**
- `calcularMetricasMensuales(params)` - Implementa 9 fórmulas PRO DRH 22
- `recalcularYGuardarMetricas(params)` - Calcula y persiste en BD (upsert)
- `recalcularMetricasTrasAusencia(ausenciaId)` - Trigger tras ausencia
- `recalcularMetricasPublicacion(publicacionId)` - Recálculo masivo
- `obtenerMetricasFuncionario(...)` - Consulta con lazy loading

**Características:**
- 9 fórmulas PRO DRH 22 con `Math.floor` (truncado)
- Integración completa con ausencias (LM/FLA afectan HLM, PA/PG/OTRO afectan HMC)
- Ponderación dinámica: × 0.5 o × 1.5
- Desgloses para análisis (horasDiurnas, horasNocturnas, horasSabDomFest, etc.)
- Upsert automático en `metricas_mensuales`

---

### **3. Gestión de Ausencias**
**Páginas:**
- `/admin/ausencias` - Lista completa con CRUD
- Widget en `/turnos/[id]/editar` - Vista integrada

**Tipos Soportados:**
| Código | Nombre | Descuenta | Modo |
|--------|--------|-----------|------|
| **LM** | Licencia Médica | HLM | Por días |
| **FLA** | Feriado Legal Anual | HLM | Por días |
| **PA** | Permiso Administrativo | HMC | Por horas |
| **PG** | Permiso Gremial | HMC | Por horas |
| **OTRO** | Otros Permisos | HMC | Por horas |

**Características:**
- Date pickers con locale español
- Cálculo automático de días hábiles (L-V)
- Recálculo automático de métricas tras crear/eliminar
- Widget sticky en panel de edición
- Agrupación por tipo con colores distintivos
- Alert de impacto con cálculos (días × 8.8h)

---

## 📐 Fórmulas de Cálculo

**Documentación de Referencia:**
- PRO DRH 22 (Ed. 3 / JUL.2016)
- `ANÁLISIS_Y_VALIDACIÓN_FÓRMULAS_SGTHE_.pdf`
- `VALIDACION_SISTEMA.md` (casos de prueba)

**Implementación:** `src/lib/services/metricasCompletas.service.ts`

### **1. HMR (Horario Mensual Realizado)**
```typescript
HMR = Math.floor(
  Σ(Horas Diurnas trabajadas) + 
  Σ(Horas Nocturnas trabajadas) + 
  Σ(Horas Sáb/Dom/Fest trabajadas)
)
```
**Nota:** Suma BRUTA y NO ponderada

**Ejemplo:** 150.7h → **150h** (truncado)

---

### **2. HLM (Horario Legal Mensual - Ajustado por Ausencias)**
```typescript
Días hábiles efectivos = Max(0, Días hábiles del mes - Días ausencia LM/FLA)
HLM = Math.floor(Días hábiles efectivos × 8.8)
```

**Ejemplo:**
- Mes noviembre: 20 días hábiles
- Licencia Médica (LM): 3 días
- Días efectivos: 20 - 3 = **17 días**
- HLM = 17 × 8.8 = 149.6 → **149h**

---

### **3. HMC (Horario Mensual Corregido)**
```typescript
HMC = Math.floor(
  HLM - 
  Σ(Descansos Complementarios: DA, DV, DC, DN, DS) - 
  Σ(Horas Permisos: PA, PG, OTRO)
)
```

**Ejemplo:**
- HLM: 149h
- DC: 12h + 9h (DA) = 21h
- PA: 9h
- HMC = 149 - 21 - 9 = **119h**

---

### **4. PONDERACIÓN (Clave del Sistema PRO DRH 22)**
```typescript
Horas Nocturnas/Inhábiles = Σ(Horas Nocturnas) + Σ(Horas Sáb/Dom/Fest)

SI HMC < HMR:
  // Funcionario trabajó MÁS de lo obligado
  // Solo se compensa el 50% extra de las horas nocturnas/inhábiles
  PONDERACIÓN = Math.floor(Horas Nocturnas/Inhábiles × 0.5)
SINO:
  // Funcionario cumplió o excedió la jornada
  // Valor completo de la hora más 50% de recargo
  PONDERACIÓN = Math.floor(Horas Nocturnas/Inhábiles × 1.5)
```

**Ejemplo 1 (HMC < HMR):**
- HMC = 119h, HMR = 165h
- Nocturnas/Inhábiles = 38h
- Ponderación = 38 × 0.5 = **19h**

**Ejemplo 2 (HMC ≥ HMR):**
- HMC = 180h, HMR = 150h
- Nocturnas/Inhábiles = 40h
- Ponderación = 40 × 1.5 = **60h**

---

### **5. TOTAL HORAS (Ponderadas)**
```typescript
SI HMC ≥ HMR:
  TOTAL_HORAS = Math.floor(HMR + PONDERACIÓN)
SINO:
  TOTAL_HORAS = 0  // No se generan horas compensables
```

---

### **6. HDF (Horas Diurnas Faltantes)**
```typescript
SI HMC < HMR:
  HDF = Math.floor(HMC - Σ Horas Diurnas trabajadas)
SINO:
  HDF = 0
```

---

### **7. HE (Horas Extras Ponderadas)**
```typescript
SI HMC < HMR:
  HE = Math.floor(PONDERACIÓN - HDF)
SINO:
  HE = Math.floor(TOTAL_HORAS - HMC)
```

---

### **⚠️ CRÍTICO: Truncado (Math.floor)**

```typescript
✅ TODAS las fórmulas usan Math.floor (truncado)
❌ NUNCA usar Math.round (redondeo)

Razón: Normativa PRO DRH 22 especifica truncado explícitamente

Ejemplo:
  149.9h → Math.floor() = 149h ✅
  149.9h → Math.round() = 150h ❌
```

---

## 🔌 API

### **Ausencias**

#### **GET `/api/admin/ausencias`**
Listar ausencias con filtros opcionales

**Query Params:**
- `publicacionId` (opcional) - Filtrar por publicación específica
- `desde` (opcional) - Fecha inicio rango (formato: YYYY-MM-DD)
- `hasta` (opcional) - Fecha fin rango (formato: YYYY-MM-DD)

**Ejemplo:**
```bash
GET /api/admin/ausencias?publicacionId=pub-123&desde=2025-11-01&hasta=2025-11-30
```

**Respuesta:**
```json
[
  {
    "id": "aus-123",
    "tipo": "LM",
    "fechaInicio": "2025-11-05",
    "fechaFin": "2025-11-07",
    "diasHabiles": 3,
    "usuario": {
      "id": "user-456",
      "nombre": "Juan",
      "apellido": "Pérez",
      "rut": "12.345.678-9"
    }
  }
]
```

#### **POST `/api/admin/ausencias`**
Crear ausencia (recalcula métricas automáticamente)

**Body:**
```json
{
  "funcionarioId": "user-456",
  "tipo": "LM",
  "fechaInicio": "2025-11-05",
  "fechaFin": "2025-11-07",
  "observaciones": "Gripe fuerte",
  "publicacionId": "pub-123"
}
```

**Respuesta:**
```json
{
  "message": "Ausencia registrada correctamente",
  "id": "aus-789",
  "diasHabiles": 3,
  ...
}
```

**Side Effects:**
- ✅ Recalcula métricas del funcionario automáticamente
- ✅ Actualiza `metricas_mensuales` con HLM/HMC ajustados

#### **DELETE `/api/admin/ausencias/[id]`**
Eliminar ausencia (recalcula métricas automáticamente)

**Respuesta:**
```json
{
  "message": "Ausencia eliminada correctamente"
}
```

**Side Effects:**
- ✅ Recalcula métricas del funcionario automáticamente
- ✅ Restaura HLM/HMC a valores sin la ausencia

---

### **Tipos de Turno**

#### **GET `/api/admin/tipos-turno/[id]`**
Obtener tipo de turno por ID

**Respuesta:**
```json
{
  "id": "tipo-123",
  "codigo": "D",
  "nombre": "Turno Diurno",
  "duracionHoras": 12,
  "devolucionHoras": 0,
  "horasDiurnas": 12,
  "horasNocturnas": 0,
  "horasSabDomFest": null,
  "matrizVersion": {
    "esBloqueada": false,
    "version": "v1.0"
  }
}
```

#### **PATCH `/api/admin/tipos-turno/[id]`**
Actualizar tipo de turno

**Permisos:** ADMIN_SISTEMA, JEFE_UNIDAD

**Body:**
```json
{
  "nombre": "Turno Diurno Modificado",
  "duracionHoras": 13,
  "devolucionHoras": 0,
  "horasDiurnas": 13,
  "horasNocturnas": 0,
  "horasSabDomFest": null
}
```

**Validaciones:**
- ❌ No se puede editar si versión está bloqueada
- ❌ horasDiurnas + horasNocturnas no puede exceder duracionHoras

---

### **Versiones de Matriz**

#### **POST `/api/admin/matriz-versiones`**
Crear nueva versión (bloquea la anterior, clona tipos)

**Permisos:** ADMIN_SISTEMA, JEFE_UNIDAD

**Body:**
```json
{
  "unidadId": "unidad-123",
  "tipo": "minor",
  "descripcion": "Agregado turno especial 11S",
  "creadoPor": "user-admin"
}
```

**Respuesta:**
```json
{
  "message": "Versión creada correctamente",
  "version": {
    "id": "ver-456",
    "version": "v1.1",
    "esActiva": true,
    "esBloqueada": false
  },
  "tiposTurnoClonados": 31,
  "versionAnterior": "v1.0"
}
```

**Side Effects:**
- ✅ Versión anterior: `esActiva=false`, `esBloqueada=true`
- ✅ Nueva versión: `esActiva=true`, `esBloqueada=false`
- ✅ 31 tipos de turno clonados con nuevo `matrizVersionId`

---

## 🧪 Testing

### **Casos de Prueba**
Ver `VALIDACION_SISTEMA.md` para documentación completa.

**Resumen de casos:**
1. ✅ Sin ausencias (escenario base)
2. ✅ Con Licencia Médica (LM - 3 días)
3. ✅ Con Permiso Administrativo (PA - 9 horas)
4. ✅ Combinado (LM + PA)
5. ✅ HMC ≥ HMR (ponderación × 1.5)

**Casos Edge:**
1. ✅ Ausencia con fechas inválidas
2. ✅ Tipo de turno con validación fallida
3. ✅ Versión duplicada
4. ✅ Eliminación de recurso inexistente
5. ✅ Mes sin días hábiles

---

## 📁 Estructura del Proyecto

```
sgthe/
├── prisma/
│   └── schema.prisma                   # 7 modelos: MatrizTurnosVersion, Ausencia, MetricasMensuales, etc.
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── ausencias/
│   │   │   │   └── page.tsx            # UI gestión de ausencias
│   │   │   └── matriz-turnos/
│   │   │       ├── page.tsx            # CRUD tipos de turno
│   │   │       └── historial/
│   │   │           └── page.tsx        # Timeline de versiones
│   │   ├── turnos/
│   │   │   └── [id]/editar/
│   │   │       └── page.tsx            # Panel edición + widget ausencias
│   │   └── api/
│   │       └── admin/
│   │           ├── ausencias/
│   │           │   ├── route.ts        # GET, POST
│   │           │   └── [id]/route.ts   # DELETE
│   │           ├── tipos-turno/
│   │           │   └── [id]/route.ts   # GET, PATCH
│   │           └── matriz-versiones/
│   │               └── route.ts        # POST
│   ├── components/
│   │   ├── admin/
│   │   │   ├── TablaTiposTurnoEditable.tsx
│   │   │   ├── EditarTipoTurnoModal.tsx
│   │   │   ├── CrearVersionModal.tsx
│   │   │   ├── TablaAusencias.tsx
│   │   │   ├── RegistrarAusenciaModal.tsx
│   │   │   └── WidgetAusenciasMes.tsx
│   │   └── ui/                         # shadcn/ui components
│   ├── lib/
│   │   ├── services/
│   │   │   ├── matrizVersion.service.ts      # 9 funciones, 420 líneas
│   │   │   └── metricasCompletas.service.ts  # 6 funciones, 283 líneas
│   │   ├── scripts/
│   │   │   └── init-matriz-v1.ts             # Script migración inicial
│   │   ├── prisma.ts
│   │   └── auth.ts
│   └── types/
│       └── prodrh22/
│           └── metricas.types.ts
├── VALIDACION_SISTEMA.md               # Casos de prueba completos
├── README_SISTEMA_AUSENCIAS.md         # Este archivo
└── package.json

**Total:**
- 🗂️ Modelos Prisma: 7
- 🌐 API Routes: 6
- 🎨 Páginas: 4
- 🧩 Componentes Admin: 6
- ⚙️ Servicios: 2
- 📜 Scripts: 1
- 📝 Documentación: 2
```

---

## 🔐 Seguridad

### **Autenticación**
- NextAuth.js v5 con credenciales
- Sessions basadas en JWT
- Middleware de protección de rutas

### **Autorización**
- **ADMIN_SISTEMA:** Acceso completo
- **JEFE_UNIDAD:** Gestión de matriz y ausencias de su unidad
- **SUPERVISOR_ATS:** Lectura de ausencias, eliminación permitida
- **ATCO:** Solo lectura

### **Validaciones**
- Todas las APIs verifican autenticación
- Roles verificados en cada endpoint sensible
- Validación de pertenencia a unidad
- Validaciones de datos con Zod (cliente + servidor)

---

## 🎨 UI/UX

### **Componentes shadcn/ui Utilizados**
- Card, Button, Badge, Input, Textarea
- Dialog, Alert, Tooltip
- Select, Calendar, Popover
- Table, Skeleton
- Form (con react-hook-form integration)

### **Características UX**
- ✅ Loading states en todas las operaciones async
- ✅ Toast notifications descriptivos (Sonner)
- ✅ Confirmaciones antes de eliminar
- ✅ Estados vacíos con mensajes claros
- ✅ Validaciones en tiempo real
- ✅ Sticky widgets (sidebar)
- ✅ Responsive design (mobile/desktop)
- ✅ Dark mode compatible

---

## 📊 Base de Datos

### **Modelos Principales**

#### **MatrizTurnosVersion**
```prisma
- id, unidadId, version (v1.0, v1.1)
- esActiva, esBloqueada
- descripcion, creadoPor
- Relaciones: tiposTurno[], publicaciones[]
```

#### **TipoTurno**
```prisma
- id, matrizVersionId, unidadId, codigo
- duracionHoras, devolucionHoras
- horasDiurnas, horasNocturnas, horasSabDomFest
- esOperativo, esNocturno, esDiaInhabil
```

#### **Ausencia**
```prisma
- id, publicacionId, usuarioId, tipo (enum)
- fechaInicio, fechaFin, diasHabiles (para LM/FLA)
- fecha, horas (para PA/PG/OTRO)
- observaciones, creadoPor
```

#### **MetricasMensuales**
```prisma
- id, publicacionId, usuarioId, mes, anio
- hmr, hlm, hmc, ponderacion, totalHoras, hdf, he
- horasDiurnas, horasNocturnas, horasSabDomFest
- horasDescansoComp, diasAusenciaLM_FLA, horasPermisos
- Constraint único: [publicacionId, usuarioId, mes, anio]
```

---

## 🚦 Códigos de Turno Oficiales (31)

### **Turnos Operativos (3)**
- **D:** Turno Diurno (12h diurnas)
- **N:** Turno Nocturno (0.5h diurnas + 3h nocturnas)
- **S:** Turno Sábado/Domingo (1.5h diurnas + 7h nocturnas)

### **Descansos Complementarios (5)**
- **DA:** Descanso Administrativo (devuelve 9h)
- **DV:** Descanso Vacaciones (devuelve 8h)
- **DC:** Descanso Complementario (devuelve 12h)
- **DN:** Descanso Nocturno (devuelve 3.5h)
- **DS:** Descanso Semanal (devuelve 8.5h)

### **Administrativos (4)**
- **A:** Administrativo L-J (9h diurnas)
- **AV:** Administrativo Viernes (8h diurnas)
- **C:** Coordinador L-J (9h diurnas)
- **CV:** Coordinador Viernes (8h diurnas)

### **Instrucción (7)**
- **IA, IAV, ID, IN, IS, E, EV**

### **Operacionales (5)**
- **OP, OE, O, OV, CIC**

### **Especiales (3)**
- **D11S, B, R**

### **Ausencias (4)**
- **FLA, L, PA, PAV**

**Ver:** `src/lib/scripts/init-matriz-v1.ts` para valores completos

---

## 🤝 Contribución

### **Flujo de Trabajo Git**
1. Fork del proyecto
2. Crear branch feature (`git checkout -b feature/NombreFeature`)
3. Commit cambios (`git commit -m 'feat: Descripción'`)
4. Push a branch (`git push origin feature/NombreFeature`)
5. Abrir Pull Request

### **Estándares de Código**
- **TypeScript:** Tipado estricto, interfaces exportadas
- **ESLint:** Sin errores, sin warnings
- **Commits:** Convencionales (feat, fix, docs, refactor)
- **Documentación:** JSDoc en funciones complejas
- **Testing:** Casos de prueba documentados en `VALIDACION_SISTEMA.md`

---

## 📄 Licencia

Propiedad de DGAC Chile - Uso interno  
Sistema desarrollado para el Centro de Control Oceánico de Santiago (ACCO)

---

## 👥 Equipo

- **Desarrollo:** Sistema SGTHE
- **Normativa:** PRO DRH 22 (Dirección de Recursos Humanos - DGAC)
- **Unidad Piloto:** ACCO (Centro de Control Oceánico Santiago)
- **Validación:** Personal ACCO

---

## 🎉 Agradecimientos

A todo el equipo de ACCO por su colaboración en la validación de fórmulas, casos de prueba y retroalimentación durante el desarrollo del sistema.

---

## 📞 Contacto y Soporte

Para soporte técnico o consultas sobre el sistema:
- **Email:** [configurar]
- **Documentación:** Ver archivos `*.md` en el proyecto
- **Casos de Prueba:** `VALIDACION_SISTEMA.md`

---

## 🔗 Referencias

### **Documentos Oficiales**
1. **PRO DRH 22** (Ed. 3 / JUL.2016) - Procedimiento oficial DGAC
2. **ANÁLISIS_Y_VALIDACIÓN_FÓRMULAS_SGTHE_.pdf** - Análisis matemático de fórmulas
3. **ABREVIATURAS_Y_HORARIOS_ROL_DE_TURNOS_-_TURNOS_ACCO.pdf** - 31 códigos oficiales

### **Archivos del Proyecto**
- `VALIDACION_SISTEMA.md` - Casos de prueba completos
- `prisma/schema.prisma` - Modelos de base de datos
- `src/lib/services/metricasCompletas.service.ts` - Implementación de fórmulas

---

## 📈 Roadmap Futuro

### **v1.1 (Próxima versión menor)**
- [ ] Export de métricas a Excel
- [ ] Gráficos de tendencias mensuales
- [ ] Notificaciones por email tras ausencias
- [ ] Import masivo de ausencias desde Excel

### **v2.0 (Próxima versión mayor)**
- [ ] Módulo de nómina integrado
- [ ] Workflow de aprobaciones (Jefe → DRH)
- [ ] Firma digital de planillas
- [ ] Dashboard ejecutivo con KPIs

---

## 📊 Estadísticas del Desarrollo

- **Commits realizados:** 9
- **Archivos creados:** 25+
- **Líneas de código:** ~3,500+
- **Tiempo de desarrollo:** 7.5 horas
- **Fases completadas:** 9/11 (84%)
- **APIs implementadas:** 6 endpoints
- **Modelos Prisma:** 7 nuevos
- **Componentes:** 6 admin + widget

---

**Última actualización:** Noviembre 2025  
**Versión del documento:** 1.0.0  
**Mantenedor:** Sistema SGTHE

---

**Fin del README**

