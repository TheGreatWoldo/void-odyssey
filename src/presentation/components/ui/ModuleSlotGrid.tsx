const TOTAL_SLOTS = 9

interface ModuleSlotGridProps {
  filled: number
}

export function ModuleSlotGrid({ filled }: ModuleSlotGridProps) {
  return (
    <div className="grid grid-cols-3 gap-[3px] w-fit">
      {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 ${i < filled ? 'bg-white/80' : 'bg-white/15'}`}
        />
      ))}
    </div>
  )
}
