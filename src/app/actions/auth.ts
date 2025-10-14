// src/app/actions/auth.ts
'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validaciones básicas
  if (!email || !password) {
    return {
      error: 'Email y contraseña son requeridos',
    }
  }

  // Validar dominio institucional
  if (!email.endsWith('@dgac.gob.cl')) {
    return {
      error: 'Debe usar su correo institucional @dgac.gob.cl',
    }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            error: 'Credenciales inválidas',
          }
        default:
          return {
            error: 'Error al iniciar sesión. Intente nuevamente.',
          }
      }
    }
    throw error
  }

  // Si llegamos aquí, el login fue exitoso
  redirect('/dashboard')
}

