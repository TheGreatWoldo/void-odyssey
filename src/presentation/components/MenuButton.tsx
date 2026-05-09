import { Button } from '@/presentation/components/ui/button'
import { cn } from '@/shared/utils'
import type { LucideIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

function resolveIcon(name: string): LucideIcon | null {
  const icon = (LucideIcons as Record<string, unknown>)[name]
  return icon != null && (typeof icon === 'function' || typeof icon === 'object')
    ? (icon as LucideIcon)
    : null
}

interface IconSlot {
  icon: string
  event?: string
}

interface IconSlotGroupProps {
  slots: IconSlot[]
  onIconClick?: (event: string) => void
  className?: string
}

function IconSlotGroup({ slots, onIconClick, className }: IconSlotGroupProps) {
  return (
    <span className={cn('flex items-center gap-1', className)}>
      {slots.map((slot, i) => {
        const Icon = resolveIcon(slot.icon)
        if (!Icon) return null
        const clickable = !!slot.event && !!onIconClick
        return (
          <span
            key={i}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={
              clickable
                ? (e) => {
                    e.stopPropagation()
                    onIconClick!(slot.event!)
                  }
                : undefined
            }
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      onIconClick!(slot.event!)
                    }
                  }
                : undefined
            }
            className={cn(
              'inline-flex items-center',
              clickable && 'cursor-pointer rounded hover:opacity-70'
            )}
          >
            <Icon className="size-6" />
          </span>
        )
      })}
    </span>
  )
}

interface MenuButtonProps {
  label: string
  leadingIcons?: IconSlot[]
  trailingIcons?: IconSlot[]
  onClick: () => void
  onIconClick?: (event: string) => void
}

export function MenuButton({
  label,
  leadingIcons,
  trailingIcons,
  onClick,
  onIconClick,
}: MenuButtonProps) {
  const hasLeading = !!leadingIcons?.length
  const hasTrailing = !!trailingIcons?.length

  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="relative h-16 w-full min-w-64 border-white/30 bg-black/70 px-4 text-lg font-semibold tracking-wide text-white backdrop-blur-sm hover:bg-black/90 hover:border-white/60"
    >
      {/* Leading icons — absolute left so label stays truly centered */}
      {hasLeading && (
        <span className="absolute left-4 flex items-center">
          <IconSlotGroup slots={leadingIcons!} onIconClick={onIconClick} />
        </span>
      )}

      {/* Centered label */}
      <span className="flex-1 text-center">{label}</span>

      {/* Trailing icons — absolute right */}
      {hasTrailing && (
        <span className="absolute right-4 flex items-center">
          <IconSlotGroup slots={trailingIcons!} onIconClick={onIconClick} />
        </span>
      )}
    </Button>
  )
}
