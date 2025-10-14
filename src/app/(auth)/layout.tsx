// src/app/(auth)/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Autenticación - SGTHE',
  description: 'Sistema de Gestión de Turnos y Horas Extraordinarias - DGAC Chile',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}


