import { createCallerFactory, createTRPCRouter } from './trpc'
import { atc6Router } from './routers/atc6'

/**
 * Router principal de la aplicación
 */
export const appRouter = createTRPCRouter({
  atc6: atc6Router,
})

// Export type definition of API
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 */
export const createCaller = createCallerFactory(appRouter)

