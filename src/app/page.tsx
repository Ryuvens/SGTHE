// src/app/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function Home() {
  // Si hay sesión, ir al dashboard
  // Si no hay sesión, ir al login
  const session = await auth()
  
  if (session?.user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
