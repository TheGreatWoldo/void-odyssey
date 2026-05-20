import type { LucideIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

export const MODULE_ICON_BY_ID: Record<string, string> = {
  'reactor-core':     'Zap',
  'ion-engines':      'Gauge',
  'shield-generator': 'Shield',
  'sensor-array':     'Radar',
  'life-support':     'Wind',
  'water-reclaimer':  'Droplets',
  'repair-drones':    'Wrench',
  'plasma-cannon':    'Crosshair',
  'jump-drive':       'Navigation',
  'armor-plating':    'ShieldHalf',
  'nav-computer':     'Radio',
  'crew-quarters':    'Users',
  'medbay':           'HeartPulse',
  'fuel-scoop':       'Flame',
  'comms-array':      'Radio',
}

export function resolveModuleIcon(iconName: string | undefined): LucideIcon | null {
  if (!iconName) return null
  const icon = (LucideIcons as Record<string, unknown>)[iconName]
  return icon && (typeof icon === 'function' || typeof icon === 'object')
    ? (icon as LucideIcon)
    : null
}
