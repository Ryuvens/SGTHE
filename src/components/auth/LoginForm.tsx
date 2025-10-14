// src/components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { loginAction } from '@/app/actions/auth'
import Image from 'next/image'

export function LoginForm() {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await loginAction(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // Si no hay error, el usuario será redirigido por el server action
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
      {/* Logo y Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Image
            src="/logo-dgac.jpg"
            alt="DGAC Chile"
            width={120}
            height={120}
            priority
            className="object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sistema SGTHE
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestión de Turnos y Horas Extraordinarias
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Dirección General de Aeronáutica Civil - Chile
          </p>
        </div>
      </div>

      {/* Mensaje informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800 text-center">
          <span className="font-semibold">Acceso restringido:</span> Use su correo institucional @dgac.gob.cl
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 text-center">{error}</p>
          </div>
        )}

        {/* Email input */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Correo Electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="usuario@dgac.gob.cl"
            disabled={loading}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Password input */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            disabled={loading}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando sesión...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>

      {/* Footer links */}
      <div className="text-center space-y-2 pt-4 border-t">
        <p className="text-xs text-gray-500">
          ¿Problemas para acceder? Contacte al administrador del sistema
        </p>
      </div>
    </div>
  )
}

