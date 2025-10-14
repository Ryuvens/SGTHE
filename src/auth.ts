// src/auth.ts
import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt', // Usar JWT para sesiones (mejor para serverless)
  },
  ...authConfig,
})

