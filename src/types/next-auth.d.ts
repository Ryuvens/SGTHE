// src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth'
import { Rol } from '@/generated/prisma'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      rol: Rol
      nombre: string
      apellido: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    rol: Rol
    nombre: string
    apellido: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    rol: Rol
    nombre: string
    apellido: string
  }
}


