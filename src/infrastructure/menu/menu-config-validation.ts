import type { MenuConfig, MenuIconSlot, MenuItem } from '@/shared/menu'
import { err, ok, type Result } from '@/shared/result'
import { SceneKey } from '@/shared/scene-key'

const sceneKeys = new Set(Object.values(SceneKey))

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidSceneKey(value: unknown): value is SceneKey {
  return typeof value === 'string' && sceneKeys.has(value as SceneKey)
}

function validateIconSlots(value: unknown, path: string): Result<MenuIconSlot[] | undefined, string> {
  if (value === undefined) return ok(undefined)
  if (!Array.isArray(value)) return err(`${path} must be an array when provided`)

  const slots: MenuIconSlot[] = []

  for (let i = 0; i < value.length; i++) {
    const slot = value[i]
    if (!isRecord(slot)) return err(`${path}[${i}] must be an object`)

    if (typeof slot.icon !== 'string' || slot.icon.trim().length === 0) {
      return err(`${path}[${i}].icon must be a non-empty string`)
    }

    if (slot.event !== undefined && typeof slot.event !== 'string') {
      return err(`${path}[${i}].event must be a string when provided`)
    }

    slots.push({
      icon: slot.icon,
      event: typeof slot.event === 'string' ? slot.event : undefined,
    })
  }

  return ok(slots)
}

function validateMenuItem(value: unknown, path: string): Result<MenuItem, string> {
  if (!isRecord(value)) return err(`${path} must be an object`)

  if (typeof value.id !== 'string' || value.id.trim().length === 0) {
    return err(`${path}.id must be a non-empty string`)
  }

  if (typeof value.label !== 'string' || value.label.trim().length === 0) {
    return err(`${path}.label must be a non-empty string`)
  }

  if (value.event !== undefined && typeof value.event !== 'string') {
    return err(`${path}.event must be a string when provided`)
  }

  if (value.sceneKey !== undefined && !isValidSceneKey(value.sceneKey)) {
    return err(`${path}.sceneKey is invalid`)
  }

  const leadingIconsResult = validateIconSlots(value.leadingIcons, `${path}.leadingIcons`)
  if (!leadingIconsResult.ok) return leadingIconsResult

  const trailingIconsResult = validateIconSlots(value.trailingIcons, `${path}.trailingIcons`)
  if (!trailingIconsResult.ok) return trailingIconsResult

  let children: MenuItem[] | undefined
  if (value.children !== undefined) {
    if (!Array.isArray(value.children)) {
      return err(`${path}.children must be an array when provided`)
    }

    children = []
    for (let i = 0; i < value.children.length; i++) {
      const childResult = validateMenuItem(value.children[i], `${path}.children[${i}]`)
      if (!childResult.ok) return childResult
      children.push(childResult.value)
    }
  }

  if (children?.length && !isValidSceneKey(value.sceneKey)) {
    return err(`${path}.sceneKey must be provided when children are present`)
  }

  const item: MenuItem = {
    id: value.id,
    label: value.label,
    leadingIcons: leadingIconsResult.value,
    trailingIcons: trailingIconsResult.value,
    event: typeof value.event === 'string' ? value.event : undefined,
    sceneKey: value.sceneKey as MenuItem['sceneKey'],
    children,
  }

  return ok(item)
}

export function validateMenuConfig(value: unknown): Result<MenuConfig, string> {
  if (!isRecord(value)) return err('Menu config must be an object')

  if (!isValidSceneKey(value.sceneKey)) return err('Menu config sceneKey is invalid')
  if (typeof value.title !== 'string' || value.title.trim().length === 0) {
    return err('Menu config title must be a non-empty string')
  }

  if (!Array.isArray(value.items)) return err('Menu config items must be an array')

  const items: MenuItem[] = []
  for (let i = 0; i < value.items.length; i++) {
    const itemResult = validateMenuItem(value.items[i], `items[${i}]`)
    if (!itemResult.ok) return itemResult
    items.push(itemResult.value)
  }

  return ok({
    sceneKey: value.sceneKey,
    title: value.title,
    items,
  })
}
