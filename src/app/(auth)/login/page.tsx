// src/app/(auth)/login/page.tsx
import LoginForm from '@/components/auth/LoginForm'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  // Si ya hay sesión, redirigir al dashboard
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  return <LoginForm />
}


