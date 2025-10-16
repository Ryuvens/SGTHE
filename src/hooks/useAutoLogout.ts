'use client'

import { useEffect, useRef, useState } from 'react'

interface UseAutoLogoutOptions {
  timeoutMs: number // Tiempo en milisegundos
  onTimeout: () => void // Callback cuando expira el tiempo
  enabled?: boolean // Si está habilitado o no
}

/**
 * Hook para auto-logout después de inactividad
 * 
 * @example
 * ```tsx
 * const { resetTimer, timeLeft } = useAutoLogout({
 *   timeoutMs: 30000, // 30 segundos
 *   onTimeout: () => logout(),
 *   enabled: isAuthenticated,
 * })
 * ```
 */
export function useAutoLogout({
  timeoutMs,
  onTimeout,
  enabled = true,
}: UseAutoLogoutOptions) {
  const [timeLeft, setTimeLeft] = useState(timeoutMs)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const intervalRef = useRef<NodeJS.Timeout>()

  const resetTimer = () => {
    // Limpiar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (!enabled) return

    // Reset tiempo restante
    setTimeLeft(timeoutMs)

    // Actualizar contador cada segundo
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    // Timeout principal
    timeoutRef.current = setTimeout(() => {
      onTimeout()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, timeoutMs)
  }

  useEffect(() => {
    if (enabled) {
      resetTimer()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, timeoutMs])

  const timeLeftSeconds = Math.ceil(timeLeft / 1000)

  return {
    timeLeft,
    timeLeftSeconds,
    resetTimer,
  }
}

