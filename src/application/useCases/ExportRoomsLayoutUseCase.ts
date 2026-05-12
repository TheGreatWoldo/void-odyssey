import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'
import type { Result } from '@/shared/result'
import { err, ok } from '@/shared/result'

export function exportRoomsLayout(layout: RoomsLayout): Result<void, Error> {
  try {
    const json = JSON.stringify(layout, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${layout.name}.rooms.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)

    URL.revokeObjectURL(url)

    return ok(undefined)
  } catch {
    return err(new Error('Failed to export layout'))
  }
}
