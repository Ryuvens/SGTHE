// src/app/dashboard/page.tsx
import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { user } = session

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header con logout */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard SGTHE</h1>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>

        {/* Card de bienvenida */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="border-l-4 border-green-500 bg-green-50 p-4">
            <p className="text-sm text-green-800">
              ✅ <strong>Autenticación exitosa</strong> - Dashboard en construcción
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Bienvenido, {user.nombre} {user.apellido}
            </h2>
            
            <div className="space-y-2 text-gray-600">
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">Rol:</span>{' '}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {user.rol}
                </span>
              </p>
              <p>
                <span className="font-medium">ID:</span>{' '}
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {user.id}
                </code>
              </p>
            </div>
          </div>
        </div>

        {/* Info de testing */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Modo desarrollo:</strong> Este dashboard es temporal. Los módulos se implementarán en los siguientes checkpoints.
          </p>
        </div>
      </div>
    </div>
  )
}
