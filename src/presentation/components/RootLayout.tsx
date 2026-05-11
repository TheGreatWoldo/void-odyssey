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
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 1920,
          height: 1080,
          flexShrink: 0,
          transformOrigin: 'center',
          transform: `scale(${scale})`,
          pointerEvents: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}
