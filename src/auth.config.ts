// src/auth.config.ts
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos')
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Validar dominio institucional @dgac.gob.cl
        if (!email.endsWith('@dgac.gob.cl')) {
          throw new Error('Debe usar su correo institucional @dgac.gob.cl')
        }

        // Buscar usuario en base de datos
        const user = await prisma.usuario.findUnique({
          where: { email },
        })

        if (!user) {
          throw new Error('Credenciales inválidas')
        }

        // Verificar que el usuario esté activo
        if (!user.activo) {
          throw new Error('Su cuenta está inactiva. Contacte al administrador')
        }

        // Verificar password
        if (!user.password) {
          throw new Error('Credenciales inválidas')
        }

        const isPasswordValid = await compare(password, user.password)

        if (!isPasswordValid) {
          throw new Error('Credenciales inválidas')
        }

        // Retornar usuario (NextAuth lo agregará al token/session)
        return {
          id: user.id,
          email: user.email,
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          rol: user.rol,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Al hacer login, agregar datos del usuario al token
      if (user) {
        token.id = user.id
        token.rol = user.rol
        token.nombre = user.nombre
        token.apellido = user.apellido
      }
      return token
    },

    async session({ session, token }) {
      // Exponer datos del token en la sesión (accesible en el cliente)
      if (token) {
        session.user.id = token.id as string
        session.user.rol = token.rol as any
        session.user.nombre = token.nombre as string
        session.user.apellido = token.apellido as string
      }
      return session
    },
  },
}

