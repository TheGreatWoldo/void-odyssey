import { AUTO_COLORS } from '@/shared/ship-blueprint-editor';

export interface PaletteColorPickerProps {
  selectedColor: string
  onSelectColor: (color: string) => void
}

export function PaletteColorPicker({ selectedColor, onSelectColor }: PaletteColorPickerProps) {
  return (
    <div className="flex gap-2 px-1 pb-2 shrink-0">
      {AUTO_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onSelectColor(color)}
          className="w-8 h-8 rounded transition-transform"
          style={{
            backgroundColor: color,
            outline: color === selectedColor ? '2px solid white' : '2px solid transparent',
            outlineOffset: '2px',
          }}
        />
      ))}
    </div>
  )
}
