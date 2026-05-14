import { EditorTool } from '@/shared/ship-blueprint-editor';

const TOOLS: { key: EditorTool; label: string; title: string }[] = [
  { key: EditorTool.Room, label: 'Room', title: 'Paint sections onto a room' },
  { key: EditorTool.Door, label: 'Door', title: 'Toggle door edges between sections' },
]

export interface PaletteToolSelectorProps {
  tool: EditorTool
  onToolChange: (tool: EditorTool) => void
}

export function PaletteToolSelector({ tool, onToolChange }: PaletteToolSelectorProps) {
  return (
    <div className="flex gap-1 px-1 pb-2 shrink-0">
      {TOOLS.map((t) => (
        <button
          key={t.key}
          title={t.title}
          onClick={() => onToolChange(t.key)}
          className={[
            'text-xs px-3 py-1.5 rounded transition-colors flex-1',
            tool === t.key
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600',
          ].join(' ')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
