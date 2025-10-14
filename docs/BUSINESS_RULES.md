# 📐 Reglas de Negocio - SGTHE

> Documentación completa de las reglas de negocio según normativa PRO DRH 22 (Edición 3, Julio 2016) de la DGAC

## Índice
1. [Constantes del Sistema](#constantes-del-sistema)
2. [Cálculo de HLM](#cálculo-de-hlm)
3. [Cálculo de Horas Extraordinarias](#cálculo-de-horas-extraordinarias)
4. [Compensaciones](#compensaciones)
5. [Ausencias y Permisos](#ausencias-y-permisos)
6. [Prescripción](#prescripción)

## Constantes del Sistema

### Horarios de Jornada
```typescript
HORA_INICIO_DIURNO = 07:00
HORA_FIN_DIURNO = 21:00
HORA_INICIO_NOCTURNO = 21:00
HORA_FIN_NOCTURNO = 07:00 (día siguiente)
```

### Factores de Cálculo
```typescript
FACTOR_HLM = 8.8
// HLM = Días Hábiles × 8.8

DIVISOR_VALOR_HORA = 190
// Valor Hora = (Sueldo + Asignaciones) / 190
```

### Recargos por Tipo de Jornada
```typescript
RECARGO_DIURNO = 25%      // Horas extras diurnas
RECARGO_NOCTURNO = 50%    // Horas extras nocturnas
RECARGO_SABADO = 50%      // Trabajo en sábado
RECARGO_DOMINGO = 50%     // Trabajo en domingo
RECARGO_FESTIVO = 50%     // Trabajo en día festivo
```

### Límites
```typescript
MAX_HORAS_DIA = 24
MAX_HORAS_MES_EXTRAORDINARIAS = 200  // Límite razonable
```

### Prescripción
```typescript
PRESCRIPCION_DESCANSO_MESES = 24     // 2 años
PRESCRIPCION_PAGO_MESES = 6          // 6 meses
```

## Cálculo de HLM

**HLM (Horario Legal Mensual)**: Cantidad de horas que un funcionario debe trabajar en un mes.

### Fórmula Base
```
HLM = Días Hábiles del Mes × 8.8
```

### Ajustes al HLM
El HLM se ajusta en caso de:

1. **Feriado Legal**: Se descuentan los días hábiles del feriado
2. **Licencia Médica**: Se descuentan los días hábiles de la licencia
3. **Descanso Complementario**: Se descuentan las horas otorgadas
4. **Permisos Administrativos**: Se descuentan las horas del permiso

### Ejemplo
```
Mes: Junio 2024
Días hábiles: 20
HLM = 20 × 8.8 = 176 horas

Si el funcionario tiene:
- 3 días de feriado legal (3 días hábiles)
- Días hábiles efectivos = 20 - 3 = 17
- HLM ajustado = 17 × 8.8 = 149.6 horas
```

## Cálculo de Horas Extraordinarias

### Principio Base
Las horas extraordinarias se calculan de forma diferente según:

1. **Dentro del HLM**: Solo se paga el recargo (25% o 50%)
2. **Fuera del HLM**: Se paga hora completa + recargo

### Clasificación de Horas

#### 1. Horas Diurnas Normales
- Lunes a Viernes, 07:00 - 21:00
- Recargo: 25% si son extraordinarias

#### 2. Horas Nocturnas
- 21:00 - 07:00 cualquier día
- Recargo: 50%

#### 3. Horas en Sábado
- Todo el sábado
- Recargo: 50%

#### 4. Horas en Domingo
- Todo el domingo
- Recargo: 50%

#### 5. Horas en Festivos
- Días festivos oficiales
- Recargo: 50%

### Fórmulas de Cálculo

#### Para Personal en Turnos Rotativos
```typescript
// 1. Calcular total de horas trabajadas
Total_Horas = Horas_Diurnas + Horas_Nocturnas + Horas_Sab_Dom_Fest

// 2. Determinar horas dentro y fuera del HLM
Horas_Dentro_HLM = Min(Total_Horas, HLM_Ajustado)
Horas_Fuera_HLM = Max(0, Total_Horas - HLM_Ajustado)

// 3. Clasificar horas especiales (nocturnas/festivas)
Horas_Especiales_Total = Horas_Nocturnas + Horas_Sab + Horas_Dom + Horas_Fest

// 4. Horas especiales dentro del HLM (solo recargo)
Horas_Esp_Dentro = Min(Horas_Especiales_Total, Horas_Dentro_HLM)
Pago_Dentro_HLM = Horas_Esp_Dentro × Valor_Hora × 0.50

// 5. Horas especiales fuera del HLM (hora + recargo)
Horas_Esp_Fuera = Horas_Especiales_Total - Horas_Esp_Dentro
Pago_Esp_Fuera = Horas_Esp_Fuera × Valor_Hora × 1.50

// 6. Horas diurnas fuera del HLM
Horas_Diur_Fuera = Horas_Fuera_HLM - Horas_Esp_Fuera
Pago_Diur_Fuera = Horas_Diur_Fuera × Valor_Hora × 1.25

// 7. Total a pagar
Total_Pago = Pago_Dentro_HLM + Pago_Esp_Fuera + Pago_Diur_Fuera
```

#### Para Personal en Jornada Administrativa
```typescript
// Las horas extraordinarias son solo las que exceden la jornada normal
// Lunes-Jueves: 09:00 - 17:30 (8.5 horas efectivas = 9 - 0.5 colación)
// Viernes: 08:30 - 16:30 (8 horas efectivas)

Horas_Extras_Diurnas = Horas trabajadas después de 21:00 o antes de 07:00
Pago_Diurnas = Horas_Extras_Diurnas × Valor_Hora × 1.25

Horas_Extras_Nocturnas = Horas entre 21:00 y 07:00
Pago_Nocturnas = Horas_Extras_Nocturnas × Valor_Hora × 1.50

Total_Pago = Pago_Diurnas + Pago_Nocturnas
```

## Compensaciones

### Tipos de Compensación

#### 1. Descanso Complementario (Preferente)
```typescript
// Fórmula
Horas_Descanso = Horas_Extras × (1 + Recargo)

// Ejemplos
Horas_Diurnas_Extras = 10
Descanso_Diurno = 10 × 1.25 = 12.5 horas

Horas_Nocturnas_Extras = 8  
Descanso_Nocturno = 8 × 1.50 = 12 horas
```

#### 2. Pago en Remuneraciones (Excepcional)
Solo cuando el descanso no es posible por razones de buen servicio.

```typescript
Pago = Horas_Extras × Valor_Hora × (1 + Recargo)
```

### Reglas de Compensación

1. El descanso complementario debe otorgarse en horas completas
2. Los minutos que no completan una hora se descartan al calcular totales mensuales
3. El descanso debe programarse según necesidades institucionales
4. No se puede otorgar descanso en días que corresponden a "libre" en el turno

## Ausencias y Permisos

### Feriado Legal

- Se descuenta del total de días hábiles del mes
- Cálculo: `Nuevo_HLM = (Días_Hábiles - Días_Feriado) × 8.8`
- Para personal en turnos: se otorga por días completos

### Licencia Médica

- Se descuenta del total de días hábiles del mes
- Comienza desde las 00:00 del día indicado
- Da derecho a pago promedio de horas extras (si aplica)

### Permiso de Lactancia

- 1 hora diaria hasta que el hijo cumpla 2 años
- Se considera tiempo trabajado para todos los efectos
- NO se computa para cálculo de horas extraordinarias en turnos
- Puede dividirse en 2 porciones de 30 minutos

### Permisos Especiales

- **Permiso por Nacimiento**: Según ley
- **Permiso por Matrimonio**: Según ley
- **Permiso por Fallecimiento**: Según ley
- **Permiso Paternal**: Según ley
- **Permiso Gremial**: Se considera tiempo trabajado, pero no genera horas extras

### Descanso Complementario

- Se rebaja del HLM el total de horas del turno
- Ejemplo: Si turno es 12 horas, se rebajan 12 horas del HLM

## Prescripción

### Descanso Complementario
**Plazo**: 2 años desde la fecha en que se realizaron los trabajos extraordinarios

### Pago de Horas Extraordinarias
**Plazo**: 6 meses desde la fecha en que se realizaron los trabajos extraordinarios

### Interrupción de Prescripción
La prescripción se interrumpe con la presentación administrativa de la solicitud.

## Pago Promedio de Horas Extraordinarias

### Situaciones que generan pago promedio:

- Licencias médicas
- Feriado legal
- Permisos con goce de remuneraciones
- Otras causas legales de ausencia

### Cálculo del Promedio

#### Para Turnos Fijos
```typescript
Promedio = Horas_Extras_Mes_Anterior
```

#### Para Turnos Variables
```typescript
Promedio = Suma_Horas_Extras_12_Meses / 12

// Si hay menos de 12 meses de historial:
Promedio = Suma_Horas_Extras_Disponibles / Cantidad_Meses_Disponibles
```

### Aplicación del Promedio
```typescript
Valor_Diario_Promedio = Promedio_Mensual / 30
Pago_Promedio = Valor_Diario_Promedio × Días_Ausencia
```

## Días Especiales

### Media Jornada desde las 12:00
Los siguientes días son considerados con jornada hasta las 12:00:

- 17 de Septiembre
- 24 de Diciembre
- 31 de Diciembre

Cualquier trabajo realizado después de las 12:00 en estos días se considera extraordinario.

## Redondeo y Decimales

### Durante el Mes
Los cálculos intermedios se mantienen con decimales para precisión:
```typescript
Horas_Trabajadas = 10.5  // ✅ Se mantiene decimal
```

### Al Finalizar el Mes
Los totales se expresan en horas completas:
```typescript
Total_Horas_Mes = 192.7  // Se convierte a 192 horas
Minutos_Descartados = 0.7 × 60 = 42 minutos (se descartan)
```

### Para Descansos y Pagos
Se calculan con los decimales y luego se redondea al otorgar/pagar:
```typescript
Horas_Descanso_Calculadas = 25.3 horas
Horas_Descanso_Otorgadas = 25 horas (se descartan 0.3 horas = 18 minutos)
```

---

**Última actualización**: CP-000  
**Versión del documento**: 1.0.0  
**Normativa base**: PRO DRH 22 - Edición 3 (Julio 2016)
