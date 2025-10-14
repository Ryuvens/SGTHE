export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold text-center mb-4">
          🛫 SGTHE
        </h1>
        <p className="text-xl text-center mb-8">
          Sistema de Gestión de Turnos y Horas Extraordinarias
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">
            ✅ Checkpoint CP-001 Completado
          </h2>
          <ul className="space-y-2">
            <li>✅ Next.js 14 configurado</li>
            <li>✅ TypeScript habilitado</li>
            <li>✅ Tailwind CSS integrado</li>
            <li>✅ App Router activo</li>
            <li>✅ Estructura base creada</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

