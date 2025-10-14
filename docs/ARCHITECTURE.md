# 🏗️ Arquitectura del Sistema SGTHE

> Documentación técnica de la arquitectura del Sistema de Gestión de Turnos y Horas Extraordinarias

## Índice
1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura de Capas](#arquitectura-de-capas)
4. [Base de Datos](#base-de-datos)
5. [Seguridad](#seguridad)
6. [Escalabilidad](#escalabilidad)

## Visión General

SGTHE es una aplicación web full-stack construida con Next.js que implementa
el patrón de arquitectura de **tres capas**:

```
┌─────────────────────────────────────┐
│        CAPA DE PRESENTACIÓN         │
│   (Next.js App Router + React)      │
│   - Componentes UI                  │
│   - Páginas y Layouts               │
│   - Client Components               │
└─────────────────────────────────────┘
                 ↕️
┌─────────────────────────────────────┐
│        CAPA DE NEGOCIO              │
│   (Server Actions + API Routes)     │
│   - Lógica de negocio               │
│   - Cálculos de horas extras        │
│   - Validaciones                    │
└─────────────────────────────────────┘
                 ↕️
┌─────────────────────────────────────┐
│        CAPA DE DATOS                │
│      (Prisma + PostgreSQL)          │
│   - Modelos de datos                │
│   - Queries y Mutations             │
│   - Transacciones                   │
└─────────────────────────────────────┘
```

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript 5+
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: Zustand / React Context
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table v8
- **Charts**: Recharts
- **Drag & Drop**: dnd-kit
- **Date Handling**: date-fns

### Backend
- **Runtime**: Node.js 20+
- **API**: Next.js Server Actions + API Routes
- **Database**: PostgreSQL 16+
- **ORM**: Prisma 5+
- **Auth**: NextAuth.js v5
- **Validation**: Zod

### DevOps & Tools
- **Hosting**: Vercel
- **Database Hosting**: Vercel Postgres / Supabase
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions (futuro)
- **Package Manager**: npm / pnpm

## Arquitectura de Capas

*(Se completará en checkpoints posteriores)*

## Base de Datos

*(Se completará en CP-004 con el schema de Prisma)*

## Seguridad

*(Se completará en CP-005 con autenticación)*

## Escalabilidad

*(Se documentará durante el desarrollo)*

---

**Última actualización**: CP-000  
**Versión del documento**: 0.1.0
