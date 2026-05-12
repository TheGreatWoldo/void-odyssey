import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'
import type { Result } from '@/shared/result'
import { err, ok } from '@/shared/result'

export async function loadRoomsLayoutFromFile(
  file: File,
  loadLayout: (layout: RoomsLayout) => void,
): Promise<Result<void, Error>> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result

        if (typeof text !== 'string') {
          resolve(err(new Error('Failed to read file contents')))
          return
        }

        const parsed = JSON.parse(text) as unknown

        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('rooms' in parsed) ||
          !('mapSize' in parsed)
        ) {
          resolve(err(new Error('Invalid rooms layout file: missing required fields')))
          return
        }

        loadLayout(parsed as RoomsLayout)
        resolve(ok(undefined))
      } catch {
        resolve(err(new Error('Failed to parse JSON')))
      }
    }

    reader.onerror = () => {
      resolve(err(new Error('Failed to read file')))
    }

    reader.readAsText(file)
  })
}
