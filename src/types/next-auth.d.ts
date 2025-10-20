// src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth'
import { RolUsuario } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      rol: RolUsuario
      nombre: string
      apellido: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    rol: RolUsuario
    nombre: string
    apellido: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    rol: RolUsuario
    nombre: string
    apellido: string
  }
}


