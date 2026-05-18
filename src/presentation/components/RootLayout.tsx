import { useUiScale } from '@/application/hooks/useUiScale'
import type { ReactNode } from 'react'

interface RootLayoutProps {
  children: ReactNode
}

export function RootLayout({ children }: RootLayoutProps) {
  const scale = useUiScale()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 1600,
          height: 900,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          pointerEvents: 'none',
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}
