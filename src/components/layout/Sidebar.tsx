// src/components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  Settings,
  FileText,
  Menu,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react'
import { toast } from 'sonner'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Rol de Turnos',
    href: '/turnos',
    icon: Calendar,
  },
  {
    title: 'Horas Extraordinarias',
    href: '/horas-extras',
    icon: Clock,
  },
  {
    title: 'Usuarios',
    href: '/usuarios',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'Reportes',
    href: '/reportes',
    icon: FileText,
  },
  {
    title: 'Configuración',
    href: '/configuracion',
    icon: Settings,
    adminOnly: true,
  },
]

interface SidebarProps {
  userRole?: string
}

function SidebarContent({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.adminOnly && userRole !== 'ADMIN') {
      return false
    }
    return true
  })

  const handleNavigation = (title: string, isActive: boolean) => {
    if (!isActive) {
      toast.info(`Navegando a ${title}`, {
        duration: 2000,
      })
    }
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    const themeNames: Record<string, string> = {
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema'
    }
    toast.success('Tema cambiado', {
      description: `Tema ${themeNames[newTheme]} activado`,
      duration: 2000,
    })
  }

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Laptop },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="flex-1 px-3 py-4">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight dark:text-white">
          Menú
        </h2>
        <div className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => handleNavigation(item.title, isActive)}
              >
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100'
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Theme Section */}
      <div className="px-3 pb-4">
        <Separator className="mb-4" />
        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Tema
          </p>
          {themeOptions.map((option) => {
            const Icon = option.icon
            const isActive = theme === option.value

            return (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Sidebar para Desktop
export function Sidebar({ userRole }: SidebarProps) {
  return (
    <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-white border-r dark:bg-slate-900 dark:border-slate-800">
      <SidebarContent userRole={userRole} />
    </div>
  )
}

// Mobile Sidebar con Sheet
export function MobileSidebar({ userRole }: SidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SidebarContent userRole={userRole} />
      </SheetContent>
    </Sheet>
  )
}
