# 📋 VALIDACIÓN DEL SISTEMA SGTHE

**Sistema:** SGTHE - Sistema de Gestión de Turnos y Horas Extraordinarias  
**Versión:** 1.0.0  
**Fecha validación:** Noviembre 2025  
**Normativa:** PRO DRH 22 (Ed. 3 / JUL.2016)  

---

## ✅ CASOS DE PRUEBA - CÁLCULO DE MÉTRICAS

### **CASO 1: Sin Ausencias (Escenario Base)**

**Datos de entrada:**
- Mes: Noviembre 2025 (20 días hábiles)
- Asignaciones:
  - 10 × D (12h diurnas c/u) = 120h diurnas
  - 8 × N (0.5h diurnas + 3h nocturnas) = 4h diurnas + 24h nocturnas
  - 2 × S (1.5h diurnas + 7h nocturnas) = 3h diurnas + 14h nocturnas
  - 1 × DC (12h devolución)
  - 1 × DA (9h devolución)
- Ausencias: NINGUNA

**Cálculos esperados:**
```typescript
HMR = Math.floor(120 + 4 + 3 + 24 + 14) = 165h
HLM = Math.floor(20 × 8.8) = 176h (sin descuentos)
DC = 12 + 9 = 21h
HMC = Math.floor(176 - 21) = 155h
Nocturnas/Inhábiles = 24 + 14 = 38h
HMC (155h) < HMR (165h) → Ponderación = Math.floor(38 × 0.5) = 19h
Total Horas = 0 (HMC < HMR)
HDF = Math.floor(155 - 127) = 28h (faltantes)
HE = Math.floor(19 - 28) = -9h → 0h (no puede ser negativo)
```

**Resultado esperado:**
- ✅ HMR: **165h**
- ✅ HLM: **176h**
- ✅ HMC: **155h**
- ✅ Ponderación: **19h** (factor × 0.5)
- ✅ HE: **0h** (o -9h según implementación)

**Interpretación:**
- Funcionario trabajó menos horas de las obligadas (HMC 155 < HMR 165)
- Faltan 28 horas diurnas para cubrir la jornada mínima
- No se generan horas extras compensables

---

### **CASO 2: Con Licencia Médica (LM - 3 días)**

**Datos de entrada:**
- Mes: Noviembre 2025 (20 días hábiles)
- Asignaciones: (mismas que CASO 1)
- Ausencias:
  - 1 × LM: 3 días hábiles (05-11-2025 → 07-11-2025)

**Cálculos esperados:**
```typescript
HMR = 165h (sin cambios, las asignaciones son las mismas)
Días hábiles efectivos = 20 - 3 = 17 días
HLM = Math.floor(17 × 8.8) = Math.floor(149.6) = 149h ← AJUSTADO
DC = 21h
HMC = Math.floor(149 - 21) = 128h ← AJUSTADO
Nocturnas/Inhábiles = 38h
HMC (128h) < HMR (165h) → Ponderación = Math.floor(38 × 0.5) = 19h
Total Horas = 0
HDF = Math.floor(128 - 127) = 1h
HE = Math.floor(19 - 1) = 18h
```

**Resultado esperado:**
- ✅ HLM ajustado: **149h** (descontó 3 días = 26.4h)
- ✅ HMC ajustado: **128h**
- ✅ HE: **18h** (ahora SÍ hay horas extras)

**Validación clave:**
- ✅ LM descuenta correctamente de HLM
- ✅ El descuento de HLM afecta a HMC
- ✅ Con HMC más bajo, ahora HE > 0

---

### **CASO 3: Con Permiso Administrativo (PA - 9 horas)**

**Datos de entrada:**
- Mes: Noviembre 2025 (20 días hábiles)
- Asignaciones: (mismas que CASO 1)
- Ausencias:
  - 1 × PA: 9 horas (05-11-2025)

**Cálculos esperados:**
```typescript
HMR = 165h (sin cambios)
HLM = 176h (sin cambios, PA no afecta días)
DC = 21h
Horas Permisos = 9h
HMC = Math.floor(176 - 21 - 9) = 146h ← AJUSTADO
Nocturnas/Inhábiles = 38h
HMC (146h) < HMR (165h) → Ponderación = Math.floor(38 × 0.5) = 19h
Total Horas = 0
HDF = Math.floor(146 - 127) = 19h
HE = Math.floor(19 - 19) = 0h
```

**Resultado esperado:**
- ✅ HLM: **176h** (sin cambios, PA no afecta HLM)
- ✅ HMC ajustado: **146h** (descontó 9h de PA)
- ✅ HE: **0h** (justo alcanza el equilibrio)

**Validación clave:**
- ✅ PA descuenta de HMC, NO de HLM
- ✅ El impacto es solo en horas, no en días

---

### **CASO 4: Combinado (LM 3 días + PA 9 horas)**

**Datos de entrada:**
- Mes: Noviembre 2025 (20 días hábiles)
- Asignaciones: (mismas que CASO 1)
- Ausencias:
  - 1 × LM: 3 días hábiles
  - 1 × PA: 9 horas

**Cálculos esperados:**
```typescript
HMR = 165h
Días hábiles efectivos = 20 - 3 = 17 días
HLM = Math.floor(17 × 8.8) = 149h ← AJUSTADO por LM
DC = 21h
Horas Permisos = 9h
HMC = Math.floor(149 - 21 - 9) = 119h ← DOBLEMENTE AJUSTADO
Nocturnas/Inhábiles = 38h
HMC (119h) < HMR (165h) → Ponderación = Math.floor(38 × 0.5) = 19h
Total Horas = 0
HDF = Math.floor(119 - 127) = -8h (negativo = sobran horas diurnas)
HE = Math.floor(19 - (-8)) = 27h
```

**Resultado esperado:**
- ✅ HLM: **149h** (LM descontó 26.4h)
- ✅ HMC: **119h** (también PA descontó 9h)
- ✅ HE: **27h** (acumulación de ambos descuentos)

**Validación clave:**
- ✅ Ausencias se acumulan correctamente
- ✅ LM afecta HLM, PA afecta HMC
- ✅ Ambos descuentos llevan a HE positivo

---

### **CASO 5: HMC ≥ HMR (Ponderación × 1.5)**

**Datos de entrada:**
- Mes: Noviembre 2025 (20 días hábiles)
- Asignaciones:
  - 12 × D (12h diurnas) = 144h diurnas
  - 8 × N (0.5h + 3h nocturnas) = 4h diurnas + 24h nocturnas
  - Sin DC/DA (sin descansos compensatorios)
- Ausencias: NINGUNA

**Cálculos esperados:**
```typescript
HMR = Math.floor(144 + 4 + 24) = 172h
HLM = Math.floor(20 × 8.8) = 176h
DC = 0h
HMC = Math.floor(176 - 0) = 176h
Nocturnas = 24h
HMC (176h) > HMR (172h) → Ponderación = Math.floor(24 × 1.5) = 36h ← FACTOR × 1.5
Total Horas = Math.floor(172 + 36) = 208h
HDF = 0h (HMC ≥ HMR)
HE = Math.floor(208 - 176) = 32h
```

**Resultado esperado:**
- ✅ Ponderación × 1.5 aplicada: **36h** (no × 0.5)
- ✅ Total Horas: **208h**
- ✅ HE: **32h**

**Validación clave:**
- ✅ Factor de ponderación cambia según HMC vs HMR
- ✅ × 0.5 cuando HMC < HMR (funcionario trabajó más de lo obligado)
- ✅ × 1.5 cuando HMC ≥ HMR (funcionario cumplió la jornada)

---

## ⚠️ CASOS EDGE A VALIDAR

### **EDGE 1: Ausencia con fecha fin < fecha inicio**
**Acción:** Intentar crear ausencia con:
- fechaInicio: 2025-11-10
- fechaFin: 2025-11-05

**Resultado esperado:**
- ❌ Error de validación Zod
- ❌ Mensaje: "La fecha de fin debe ser posterior o igual a la fecha de inicio"
- ❌ No se crea en BD

**Validar:**
```typescript
// En RegistrarAusenciaModal.tsx
.refine((data) => data.fechaFin >= data.fechaInicio, {
  message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio',
  path: ['fechaFin'],
})
```

---

### **EDGE 2: Tipo de turno con suma de horas > duración**
**Acción:** Editar tipo "N" con:
- duracionHoras: 8
- horasDiurnas: 6
- horasNocturnas: 5
- Suma: 11h > 8h (inválido)

**Resultado esperado:**
- ❌ Error de validación Zod
- ❌ Mensaje: "Horas diurnas + nocturnas no puede exceder duración total"
- ❌ No se guarda en BD

**Validar:**
```typescript
// En EditarTipoTurnoModal.tsx
.refine((data) => {
  if (data.duracionHoras && data.horasDiurnas && data.horasNocturnas) {
    return data.horasDiurnas + data.horasNocturnas <= data.duracionHoras;
  }
  return true;
})
```

---

### **EDGE 3: Crear versión cuando ya existe**
**Acción:** Intentar crear v1.1 cuando ya existe v1.1

**Resultado esperado:**
- ❌ Error 409 Conflict
- ❌ Mensaje: "La versión v1.1 ya existe para esta unidad"
- ❌ No se crea duplicado

**Validar:**
```typescript
// En matrizVersion.service.ts
const versionExistente = await prisma.matrizTurnosVersion.findUnique({
  where: { unidadId_version: { unidadId, version: nuevaVersionNumero } },
});

if (versionExistente) {
  throw new Error(`La versión ${nuevaVersionNumero} ya existe...`);
}
```

---

### **EDGE 4: Eliminar ausencia que no existe**
**Acción:** DELETE /api/admin/ausencias/invalid-id-12345

**Resultado esperado:**
- ❌ Error 404 Not Found
- ❌ Mensaje: "Ausencia no encontrada"
- ❌ No crash del servidor

**Validar:**
```typescript
// En [id]/route.ts
const ausencia = await prisma.ausencia.findUnique({ where: { id: params.id } });

if (!ausencia) {
  return NextResponse.json(
    { message: 'Ausencia no encontrada' },
    { status: 404 }
  );
}
```

---

### **EDGE 5: Mes sin días hábiles (caso teórico)**
**Acción:** Calcular métricas para mes hipotético con 0 días hábiles

**Resultado esperado:**
- ✅ HLM = 0h (no crash)
- ✅ HMC = 0h - DC - Permisos (puede ser negativo)
- ✅ Cálculos no fallan
- ✅ No división por cero

**Validar:**
```typescript
// En metricasCompletas.service.ts
const diasHabilesEfectivos = Math.max(0, diasHabilesMes - diasAusenciaLM_FLA);
const hlm = Math.floor(diasHabilesEfectivos * 8.8);
// Si diasHabilesEfectivos = 0 → hlm = 0 (correcto)
```

---

## 🔄 FLUJOS CRÍTICOS A VALIDAR

### **FLUJO 1: Registro de Ausencia → Recálculo Automático**

**Pasos:**
1. Usuario → `/admin/ausencias`
2. Clic en "Registrar Ausencia"
3. Seleccionar funcionario: Juan Pérez
4. Seleccionar tipo: LM (Licencia Médica)
5. Fechas: 2025-11-05 → 2025-11-07 (3 días hábiles)
6. Observaciones: "Gripe fuerte"
7. Clic en "Registrar"

**Validar:**
- ✅ Toast aparece: "Ausencia registrada correctamente, 3 días hábiles"
- ✅ Modal se cierra automáticamente
- ✅ Página se recarga (window.location.reload())
- ✅ Ausencia aparece en tabla
- ✅ Console log: "✅ Recalculando métricas tras ausencia..."
- ✅ BD: Registro en tabla `ausencias`
- ✅ BD: Registro actualizado en tabla `metricas_mensuales` con HLM ajustado

**Query de validación:**
```sql
SELECT * FROM ausencias WHERE "usuarioId" = 'juan-id' ORDER BY "createdAt" DESC LIMIT 1;
SELECT * FROM metricas_mensuales WHERE "usuarioId" = 'juan-id' ORDER BY "updatedAt" DESC LIMIT 1;
```

---

### **FLUJO 2: Eliminación de Ausencia → Recálculo Automático**

**Pasos:**
1. Usuario → `/admin/ausencias`
2. Localizar ausencia de Juan Pérez (LM 3 días)
3. Clic en botón 🗑️ eliminar
4. Confirmar en alert del navegador
5. Esperar respuesta

**Validar:**
- ✅ Confirmación descriptiva aparece
- ✅ Toast: "Ausencia eliminada correctamente"
- ✅ Página se recarga
- ✅ Ausencia desaparece de tabla
- ✅ Console log: "✅ Recalculando métricas tras eliminación..."
- ✅ BD: Ausencia eliminada
- ✅ BD: `metricas_mensuales` actualizado (HLM vuelve a 176h)

---

### **FLUJO 3: Widget de Ausencias en Panel Editar**

**Pasos:**
1. Registrar ausencias para el mes actual (si no hay)
2. Usuario → `/turnos/[id]/editar`
3. Esperar carga completa de la página

**Validar:**
- ✅ Widget aparece después del "Panel de Métricas"
- ✅ Widget es sticky (queda pegado al scroll)
- ✅ Header muestra: "5 ausencia(s) registrada(s) para noviembre de 2025"
- ✅ Alert de impacto visible: "• X día(s) descontados de HLM (Yh)"
- ✅ Agrupación por tipo visible (LM 🔴, FLA 🔵, etc.)
- ✅ Botón "Gestionar" lleva a `/admin/ausencias`
- ✅ Si no hay ausencias: widget NO se renderiza (no ocupa espacio)

---

### **FLUJO 4: CRUD de Tipos de Turno**

**Pasos:**
1. Usuario → `/admin/matriz-turnos`
2. Verificar tabla editable visible con 31 tipos
3. Seleccionar tipo "D" → Clic en ícono ✏️ editar
4. Modal se abre
5. Modificar "horasDiurnas" de 12 a 13
6. Clic en "Guardar Cambios"

**Validar:**
- ✅ Modal se abre con datos pre-cargados
- ✅ Loading spinner durante fetch de datos
- ✅ Formulario editable con 6 campos
- ✅ Toast: "Tipo de turno actualizado correctamente"
- ✅ Modal se cierra
- ✅ Página se recarga
- ✅ Valor 13 persiste en tabla
- ✅ BD: Campo `horasDiurnas` = 13 para tipo "D"

**Validar validaciones:**
- Intentar poner horasDiurnas = 15, horasNocturnas = 10, duracionHoras = 12
- ❌ Error: "Horas diurnas + nocturnas no puede exceder duración total"

---

### **FLUJO 5: Historial de Versiones**

**Pasos:**
1. Usuario → `/admin/matriz-turnos/historial`
2. Verificar lista de versiones

**Validar:**
- ✅ Versiones ordenadas de más reciente a más antigua
- ✅ Badge "Activa" en versión v1.0 (o la que esté activa)
- ✅ Badge "Bloqueada" en versiones anteriores
- ✅ Metadata correcta:
  - Fecha de creación en español
  - Creador: nombre del usuario
  - Tipos de turno: 31 códigos
  - Publicaciones: cantidad correcta
3. Clic en "Nueva Versión"
4. Modal se abre
5. Seleccionar tipo: **Minor**
6. Descripción: "Test de validación del sistema"
7. Clic en "Crear Versión"

**Validar:**
- ✅ Toast: "Versión v1.1 creada correctamente, 31 tipos de turno clonados"
- ✅ Página se recarga
- ✅ Timeline muestra:
  - v1.1 [✓ Activa] (más reciente)
  - v1.0 [🔒 Bloqueada]
- ✅ BD: v1.0 tiene `esActiva=false`, `esBloqueada=true`
- ✅ BD: v1.1 tiene `esActiva=true`, `esBloqueada=false`
- ✅ BD: 31 tipos de turno clonados con `matrizVersionId` apuntando a v1.1

---

## 🎯 CHECKLIST DE VALIDACIÓN COMPLETA

### **Base de Datos:**
- [ ] Tabla `matriz_turnos_versiones` existe
- [ ] Tabla `ausencias` existe
- [ ] Tabla `metricas_mensuales` existe
- [ ] Constraint único `[publicacionId, usuarioId, mes, anio]` funciona
- [ ] Relaciones inversas correctas (Usuario ↔ Ausencias, etc.)
- [ ] Índices creados y funcionales

### **Servicios:**
- [ ] `calcularDiasHabilesMes(11, 2025)` retorna **20**
- [ ] `calcularMetricasMensuales()` retorna objeto con 12 propiedades
- [ ] Todas las fórmulas usan `Math.floor` (verificar en código)
- [ ] `recalcularMetricasTrasAusencia()` ejecuta sin crash
- [ ] `recalcularYGuardarMetricas()` hace upsert correctamente

### **APIs:**
- [ ] POST `/api/admin/ausencias` retorna status 200 + recalcula
- [ ] DELETE `/api/admin/ausencias/[id]` retorna 200 + recalcula
- [ ] GET `/api/admin/ausencias?publicacionId=...` filtra correctamente
- [ ] PATCH `/api/admin/tipos-turno/[id]` valida y actualiza
- [ ] POST `/api/admin/matriz-versiones` crea versión + clona tipos

### **UI Páginas:**
- [ ] `/admin/ausencias` renderiza tabla completa
- [ ] `/admin/matriz-turnos` muestra tipos de turno
- [ ] `/admin/matriz-turnos/historial` muestra timeline
- [ ] `/turnos/[id]/editar` integra widget de ausencias

### **UI Componentes:**
- [ ] `RegistrarAusenciaModal` valida fechas
- [ ] `EditarTipoTurnoModal` valida suma de horas
- [ ] `CrearVersionModal` valida descripción (mín 10 chars)
- [ ] `WidgetAusenciasMes` muestra impacto calculado
- [ ] `TablaAusencias` permite eliminar con confirmación

### **UX:**
- [ ] Toasts informativos en todas las acciones críticas
- [ ] Loading spinners visibles durante fetch
- [ ] Estados vacíos con mensajes descriptivos
- [ ] Confirmaciones antes de eliminar (navegador confirm)
- [ ] Validaciones con mensajes claros y específicos
- [ ] Console logs para debugging (pueden removerse en producción)

---

## 🐛 BUGS CONOCIDOS

### **Bug 1: [Si se encuentra alguno durante validación]**
- **Descripción:** [Detallar]
- **Reproducción:** [Pasos]
- **Impacto:** Bajo/Medio/Alto
- **Fix:** [Solución aplicada o pendiente]

---

## 📊 RESULTADOS DE VALIDACIÓN

### **Resumen:**
- ✅ Casos de prueba pasados: **X / 5**
- ✅ Casos edge validados: **X / 5**
- ✅ Flujos críticos funcionales: **X / 5**
- ✅ Checklist completado: **X / 6 categorías**

### **Estado del Sistema:**
```
✅ PRODUCCIÓN READY
⚠️ TESTING REQUIRED
❌ BUGS CRÍTICOS ENCONTRADOS
```

---

**Validación completada el:** [FECHA]  
**Validado por:** [NOMBRE]  
**Siguiente revisión:** [FECHA + 1 mes]

---

## 📝 NOTAS ADICIONALES

- Los cálculos usan `Math.floor` (truncado) según normativa PRO DRH 22
- Ausencias LM/FLA descuentan días de HLM (× 8.8h/día)
- Ausencias PA/PG/OTRO descuentan horas de HMC directamente
- Ponderación dinámica: × 0.5 cuando HMC < HMR, × 1.5 cuando HMC ≥ HMR
- Recálculo automático tras crear/eliminar ausencias (no requiere acción manual)

---

## 🔗 REFERENCIAS

- **PRO DRH 22:** Procedimiento oficial DGAC (Ed. 3 / JUL.2016)
- **ANÁLISIS_Y_VALIDACIÓN_FÓRMULAS_SGTHE_.pdf:** Documento de análisis de fórmulas
- **ABREVIATURAS_Y_HORARIOS_ROL_DE_TURNOS_-_TURNOS_ACCO.pdf:** 31 códigos oficiales

---

**Fin del documento de validación**

