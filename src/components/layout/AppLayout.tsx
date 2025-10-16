// src/components/layout/AppLayout.tsx
import { ReactNode } from 'react'
import Image from 'next/image'
import { Sidebar, MobileSidebar } from './Sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { signOut } from '@/auth'
import { ThemeToggle } from '@/components/theme-toggle'

interface AppLayoutProps {
  children: ReactNode
  user: {
    id: string
    nombre: string
    apellido: string
    email?: string | null
    rol: string
    image?: string | null
  }
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  // Obtener iniciales
  const getInitials = (nombre: string, apellido: string) => {
    const n = nombre?.charAt(0) || ''
    const a = apellido?.charAt(0) || ''
    return (n + a).toUpperCase() || 'US'
  }

  const initials = getInitials(user.nombre, user.apellido)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar Desktop */}
      <Sidebar userRole={user.rol} />

      {/* Main Content Area */}
      <div className="md:pl-64">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40 dark:bg-slate-900/80 dark:border-slate-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Mobile menu + Logo */}
              <div className="flex items-center gap-3">
                <MobileSidebar userRole={user.rol} />
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <Image
                      src="/logo-dgac.png"
                      alt="Logo DGAC"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Sistema SGTHE</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard</p>
                  </div>
                </div>
              </div>

              {/* Right side: Theme Toggle + User menu */}
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User menu */}
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 h-auto py-2 px-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.image || undefined} alt={user.nombre} />
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium">{user.nombre}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form
                      action={async () => {
                        'use server'
                        await signOut({ redirectTo: '/login' })
                      }}
                    >
                      <button type="submit" className="flex w-full items-center text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}

