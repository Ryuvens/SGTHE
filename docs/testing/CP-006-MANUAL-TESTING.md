# 🧪 PLAN DE TESTING CP-006: MÓDULO DE USUARIOS

## ✅ PRE-REQUISITOS
- [x] Servidor corriendo en `http://localhost:3000`
- [ ] Usuario admin creado en la base de datos
- [ ] Al menos 1 unidad activa en la DB

---

## 📋 PASO 1: VERIFICACIÓN INICIAL

### Objetivo
Verificar que la página principal de usuarios carga correctamente.

### Pasos
1. Navega a `http://localhost:3000/usuarios`
2. Verifica que se muestren las 4 tarjetas de estadísticas:
   - Total Usuarios
   - Administradores
   - Supervisores
   - Controladores
3. Verifica que la tabla cargue (puede estar vacía)
4. Abre DevTools (F12) → Console
5. Confirma que no hay errores en rojo

### Resultado Esperado
- ✅ Página carga sin errores
- ✅ Estadísticas muestran números (pueden ser 0)
- ✅ Tabla muestra encabezados correctamente
- ✅ Botón "Nuevo Usuario" visible

### Captura
📸 Toma captura de pantalla si hay errores

---

## 📋 PASO 2: CREAR USUARIO - VALIDACIONES RUT

### Objetivo
Probar la validación del RUT chileno con dígito verificador.

### Pasos - TEST RUT INVÁLIDO
1. Click en "Nuevo Usuario"
2. Llena el formulario:
   - RUT: `12345678-0` ❌ (dígito verificador incorrecto)
   - Nombre: `Test`
   - Apellido: `Validación`
   - Email: `test@dgac.gob.cl`
   - Selecciona Unidad (cualquiera)
   - Rol: `ATCO`
   - Contraseña: `Admin123!`
   - Confirmar: `Admin123!`
3. Click en "Crear Usuario"

### Resultado Esperado
- ✅ Debe mostrar error: **"RUT inválido"**
- ✅ El formulario NO se envía
- ✅ El campo RUT queda marcado en rojo

### Captura
📸 Captura del error de validación

---

### Pasos - TEST RUT VÁLIDO
1. Corrige el RUT a: `11111111-1` ✅ (válido)
2. Click en "Crear Usuario"

### Resultado Esperado
- ✅ Mensaje de éxito: "Usuario creado correctamente"
- ✅ Redirección a `/usuarios`
- ✅ El nuevo usuario aparece en la tabla

---

## 📋 PASO 3: VALIDACIÓN DE CONTRASEÑA

### Objetivo
Verificar las reglas de contraseña segura.

### Pasos - CONTRASEÑA DÉBIL

1. Click en "Nuevo Usuario"
2. Llena los datos:
   - RUT: `22222222-2`
   - Nombre: `Pedro`
   - Apellido: `Soto`
   - Email: `psoto@dgac.gob.cl`
   - Unidad: (selecciona una)
   - Rol: `ATCO`
   - Contraseña: `abc123` ❌ (sin mayúscula)
   - Confirmar: `abc123`
3. Click en "Crear Usuario"

### Resultado Esperado
- ✅ Error: "Debe contener al menos una mayúscula"

---

### Pasos - CONTRASEÑAS NO COINCIDEN

1. Cambia:
   - Contraseña: `Admin123!`
   - Confirmar: `Admin456!` ❌ (diferente)
2. Click en "Crear Usuario"

### Resultado Esperado
- ✅ Error: "Las contraseñas no coinciden"

---

### Pasos - CONTRASEÑA VÁLIDA

1. Cambia:
   - Contraseña: `Admin123!`
   - Confirmar: `Admin123!` ✅
2. Click en "Crear Usuario"

### Resultado Esperado
- ✅ Usuario creado correctamente

---

## 📋 PASO 4: CREAR USUARIO COMPLETO

### Objetivo
Crear un usuario con todos los datos para las siguientes pruebas.

### Datos del Usuario
```
RUT:              11111111-1
Nombre:           Juan Carlos
Apellido:         Pérez González
Email:            jperez@dgac.gob.cl
N° Licencia:      10001
Unidad:           (selecciona ACCO u otra disponible)
Rol:              ATCO
PIN Kiosco:       1234
Contraseña:       Admin123!
Confirmar:        Admin123!
Estado:           Activo ✅
```

### Pasos
1. Click en "Nuevo Usuario"
2. Llena todos los campos según la tabla
3. Click en "Crear Usuario"

### Resultado Esperado
- ✅ Mensaje: "Usuario creado correctamente"
- ✅ Redirección a `/usuarios`
- ✅ Usuario "Juan Carlos Pérez González" visible en tabla
- ✅ Estadísticas actualizadas:
  - Total Usuarios: incrementó
  - Controladores: incrementó

---

## 📋 PASO 5: BÚSQUEDA Y FILTROS

### Objetivo
Probar el sistema de búsqueda y filtros combinados.

### Test 5.1 - BÚSQUEDA GLOBAL

| Búsqueda | Resultado Esperado |
|----------|-------------------|
| `juan` | ✅ Encuentra "Juan Carlos Pérez" |
| `11111111` | ✅ Encuentra por RUT |
| `jperez` | ✅ Encuentra por email |
| `xyz123` | ✅ "No se encontraron usuarios" |

### Test 5.2 - FILTRO POR ROL

1. Selecciona filtro "Controlador"
   - ✅ Muestra solo ATCOs
2. Selecciona "Administrador del Sistema"
   - ✅ Muestra solo admins (o vacío si no hay)
3. Selecciona "Todos los roles"
   - ✅ Muestra todos

### Test 5.3 - FILTRO POR ESTADO

1. Selecciona "Activos"
   - ✅ Muestra solo usuarios activos
2. Selecciona "Inactivos"
   - ✅ Vacío si no hay usuarios inactivos
3. Selecciona "Todos"
   - ✅ Muestra todos

### Test 5.4 - FILTROS COMBINADOS

1. Busca "juan" + Filtro "Controlador"
   - ✅ Debe mostrar solo Juan Carlos si es ATCO
2. Limpia búsqueda
   - ✅ Debe mostrar todos los ATCOs

---

## 📋 PASO 6: EDITAR USUARIO

### Objetivo
Modificar datos de un usuario existente sin cambiar contraseña.

### Pasos
1. Busca "Juan Carlos Pérez"
2. Click en menú ⋮ (tres puntos) → **"Editar"**
3. Modifica:
   - Apellido: `Pérez Silva` (cambio)
   - Email: `jperezsilva@dgac.gob.cl` (cambio)
   - Rol: `SUPERVISOR_ATS` (cambio)
4. **NO toques** los campos de contraseña (dejarlos vacíos)
5. Click en "Actualizar Usuario"

### Resultado Esperado
- ✅ Mensaje: "Usuario actualizado correctamente"
- ✅ Redirección a `/usuarios`
- ✅ Cambios reflejados en la tabla:
  - Nombre: "Juan Carlos **Pérez Silva**"
  - Email: "jperezsilva@dgac.gob.cl"
- ✅ Estadísticas actualizadas:
  - Supervisores: incrementó +1
  - Controladores: decrementó -1

---

## 📋 PASO 7: VER DETALLE DE USUARIO

### Objetivo
Verificar la página de detalle con toda la información.

### Pasos
1. Busca "Juan Carlos Pérez Silva"
2. Click en menú ⋮ → **"Ver detalles"**

### Verifica que se muestre:

#### Card: Datos Personales
- ✅ RUT: 11111111-1
- ✅ Abreviatura: (si tiene)
- ✅ Email: jperezsilva@dgac.gob.cl
- ✅ N° Licencia: 10001
- ✅ Unidad: (nombre completo)

#### Card: Información del Sistema
- ✅ Rol: Badge "Supervisor ATS" (azul)
- ✅ Estado: Badge "Activo" (verde)
- ✅ Fecha de registro: (fecha actual)
- ✅ Última actualización: (fecha actual)

#### Card: Habilitaciones
- ✅ Mensaje: "No tiene habilitaciones registradas" (o lista si tiene)

### Botones Visibles
- ✅ "← Volver" (arriba izquierda)
- ✅ "Editar" (arriba derecha)

---

## 📋 PASO 8: CAMBIAR CONTRASEÑA

### Objetivo
Probar el cambio de contraseña en modo edición.

### Pasos
1. Desde el detalle de Juan Carlos, click en "Editar"
2. Click en botón **"Cambiar Contraseña"**
3. Aparecen 2 campos nuevos:
   - Nueva Contraseña
   - Confirmar Contraseña
4. Ingresa:
   - Nueva: `NuevaPass123!`
   - Confirmar: `NuevaPass123!`
5. Click en "Actualizar Usuario"

### Resultado Esperado
- ✅ Mensaje: "Usuario actualizado correctamente"
- ✅ (Opcional) Cierra sesión e intenta login:
  - Email: jperezsilva@dgac.gob.cl
  - Contraseña vieja: Admin123! → ❌ Debe fallar
  - Contraseña nueva: NuevaPass123! → ✅ Debe funcionar

---

## 📋 PASO 9: EXPORTAR A EXCEL

### Objetivo
Verificar la exportación con múltiples hojas.

### Test 9.1 - EXPORTAR SELECCIONADOS

1. En `/usuarios`, selecciona 2 usuarios con los checkboxes
2. Verifica que aparece: "2 de X usuario(s) seleccionado(s)"
3. Click en botón **"Exportar"**

### Resultado Esperado
- ✅ Se descarga archivo: `usuarios_YYYYMMDD_HHMMSS.xlsx`
- ✅ Toast: "Exportado correctamente: 2 usuarios"

### Abre el archivo Excel y verifica:

#### Hoja 1: "Usuarios"
- ✅ Columnas: RUT, Nombre, Apellido, Email, Abreviatura, N° Licencia, Rol, Unidad, Estado
- ✅ 2 filas de datos (los seleccionados)

#### Hoja 2: "Habilitaciones"
- ✅ Columnas: RUT, Nombre Completo, Tipo Habilitación, Unidad, Fechas, Estado
- ✅ Datos de habilitaciones (si los usuarios tienen)

#### Hoja 3: "Resumen"
- ✅ Métricas:
  - Total de Usuarios
  - Usuarios Activos
  - Usuarios Inactivos
  - Por rol (5 categorías)
  - Con/Sin Licencia
  - Total Habilitaciones

#### Hoja 4: "Información"
- ✅ Fecha de Generación
- ✅ Sistema: SGTHE
- ✅ Módulo: Gestión de Usuarios
- ✅ Total de Registros

---

### Test 9.2 - EXPORTAR TODOS

1. Limpia la selección (si hay)
2. Click en "Exportar" sin seleccionar nada

### Resultado Esperado
- ✅ Exporta **todos** los usuarios de la tabla
- ✅ Toast muestra el total: "Exportado correctamente: X usuarios"

---

## 📋 PASO 10: ELIMINAR USUARIO - VALIDACIONES

### Objetivo
Probar el soft delete y la protección del último admin.

### Test 10.1 - PROTECCIÓN ÚLTIMO ADMIN

**Solo si existe 1 único usuario ADMIN en el sistema:**

1. Busca el usuario admin
2. Click en menú ⋮ → **"Eliminar"**

### Resultado Esperado
- ✅ Error: "No se puede eliminar el último administrador"
- ✅ El usuario NO se elimina

---

### Test 10.2 - ELIMINAR USUARIO NORMAL

1. Crea un usuario temporal:
   ```
   RUT:      22222222-2
   Nombre:   Temporal
   Apellido: Para Eliminar
   Email:    temp@dgac.gob.cl
   Rol:      ATCO
   Password: Temp123!
   ```
2. Guarda el usuario
3. Busca "Temporal"
4. Click en menú ⋮ → **"Eliminar"**
5. Aparece dialog: "¿Estás seguro?"
   - Mensaje: "Se eliminará permanentemente el usuario **Temporal Para Eliminar**"
6. Click en **"Eliminar"** (botón rojo)

### Resultado Esperado
- ✅ Toast: "Usuario eliminado correctamente"
- ✅ El usuario desaparece de la tabla
- ✅ Estadísticas actualizadas:
  - Total Usuarios: decrementó -1
  - Controladores: decrementó -1
- ✅ (En DB) El registro tiene `activo: false` (soft delete)

---

## 📋 PASO 11: RESPONSIVE Y DARK MODE

### Test 11.1 - RESPONSIVE MÓVIL

1. Abre DevTools (F12)
2. Click en ícono de dispositivo móvil
3. Cambia a "iPhone SE" (375px)

### Verifica:
- ✅ Tabla horizontal con scroll
- ✅ Botones se apilan verticalmente
- ✅ Filtros funcionan en móvil
- ✅ Sidebar colapsa a menú hamburguesa

---

### Test 11.2 - DARK MODE

1. Si tu app tiene dark mode, actívalo
2. Navega por todas las páginas de usuarios

### Verifica:
- ✅ Cards tienen fondo oscuro
- ✅ Texto legible (contraste suficiente)
- ✅ Badges se ven bien
- ✅ Tabla legible en modo oscuro
- ✅ Formularios tienen buen contraste

---

## 📋 PASO 12: VERIFICACIÓN DE CONSOLA

### Objetivo
Asegurar que no hay errores JavaScript.

### Pasos
1. Abre DevTools (F12) → **Console**
2. Navega por todas las páginas:
   - `/usuarios`
   - `/usuarios/nuevo`
   - `/usuarios/[id]`
   - `/usuarios/[id]/edit`
3. Realiza acciones (crear, editar, eliminar)

### Resultado Esperado
- ✅ **0 errores** en consola (texto rojo)
- ✅ Warnings amarillos son aceptables
- ✅ Logs azules son informativos

### Si hay errores:
📸 Copia el error completo y el stack trace

---

## 📋 PASO 13: VERIFICACIÓN DE NETWORK

### Objetivo
Confirmar que las API calls funcionan correctamente.

### Pasos
1. Abre DevTools (F12) → **Network**
2. Filtra por "Fetch/XHR"
3. Crea un usuario nuevo
4. Observa las requests

### Resultado Esperado
- ✅ Request a `/api/trpc/...` o server action
- ✅ Status: **200 OK**
- ✅ Response contiene `{ success: true, data: {...} }`

### Si falla:
- ❌ Status 500: Error en servidor
- ❌ Status 400: Validación falló
- 📸 Copia el response body del error

---

## 📊 TABLA DE RESULTADOS

Marca con ✅ o ❌ cada funcionalidad probada:

| # | Funcionalidad | Estado | Notas |
|---|---------------|--------|-------|
| 1 | Página principal carga | ⬜ | |
| 2 | Estadísticas muestran datos | ⬜ | |
| 3 | Crear usuario - RUT válido | ⬜ | |
| 4 | Validación RUT inválido | ⬜ | |
| 5 | Validación contraseña débil | ⬜ | |
| 6 | Validación contraseñas no coinciden | ⬜ | |
| 7 | Usuario aparece en tabla | ⬜ | |
| 8 | Búsqueda global funciona | ⬜ | |
| 9 | Filtro por rol funciona | ⬜ | |
| 10 | Filtro por estado funciona | ⬜ | |
| 11 | Filtros combinados funcionan | ⬜ | |
| 12 | Editar usuario sin password | ⬜ | |
| 13 | Ver detalle completo | ⬜ | |
| 14 | Cambiar contraseña | ⬜ | |
| 15 | Exportar a Excel (seleccionados) | ⬜ | |
| 16 | Exportar a Excel (todos) | ⬜ | |
| 17 | Excel tiene 4 hojas | ⬜ | |
| 18 | Protección último admin | ⬜ | |
| 19 | Eliminar usuario normal | ⬜ | |
| 20 | Responsive móvil | ⬜ | |
| 21 | Dark mode | ⬜ | |
| 22 | Sin errores en consola | ⬜ | |
| 23 | Network requests OK | ⬜ | |

---

## 🐛 REPORTE DE BUGS

Si encuentras errores, usa esta plantilla:

### Bug #1
- **Página:** `/usuarios/nuevo`
- **Acción:** Al crear usuario
- **Resultado esperado:** Usuario creado
- **Resultado actual:** Error 500
- **Error en consola:**
  ```
  [pegar error aquí]
  ```
- **Screenshot:** 📸 [adjuntar]

---

## ✅ CHECKLIST FINAL

Antes de dar por completado el testing:

- [ ] Todas las funcionalidades básicas funcionan
- [ ] Validaciones de formulario correctas
- [ ] Búsqueda y filtros operativos
- [ ] Exportación Excel genera archivo correcto
- [ ] Eliminación protege último admin
- [ ] Sin errores críticos en consola
- [ ] Responsive funciona en móvil
- [ ] Dark mode se ve bien (si aplica)

---

## 🎯 RESULTADO FINAL

### ✅ APROBADO si:
- 20+ funcionalidades marcadas como ✅
- 0 errores críticos
- Bugs menores documentados

### 🔧 NECESITA AJUSTES si:
- 15-19 funcionalidades ✅
- 1-2 errores críticos
- Múltiples bugs menores

### ❌ REQUIERE REVISIÓN si:
- <15 funcionalidades ✅
- 3+ errores críticos
- Funcionalidad core no funciona

---

**¡Buena suerte con el testing! 🚀**

