/**
 * Configuración principal de tRPC
 */
import { initTRPC, TRPCError } from '@trpc/server'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { db } from '@/server/db'
import { auth } from '@/auth'

/**
 * 1. CONTEXT
 */
export const createTRPCContext = async (opts?: FetchCreateContextFnOptions) => {
  const session = await auth()

  return {
    db,
    session,
  }
}

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * 3. ROUTER & PROCEDURE HELPERS
 */
export const createCallerFactory = t.createCallerFactory
export const createTRPCRouter = t.router

/**
 * Public procedure (sin autenticación)
 */
export const publicProcedure = t.procedure

/**
 * Protected procedure (requiere autenticación)
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

