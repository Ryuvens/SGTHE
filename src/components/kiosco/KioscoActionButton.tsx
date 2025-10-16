'use client'

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import type { KioscoAction } from '@/types/kiosco'

interface KioscoActionButtonProps {
  action: KioscoAction
  onClick: () => void
}

export function KioscoActionButton({ action, onClick }: KioscoActionButtonProps) {
  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className={`rounded-lg p-3 ${action.color || 'bg-blue-100'}`}>
            {action.icon}
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>
        <CardTitle className="text-xl">{action.title}</CardTitle>
        <CardDescription>{action.description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

