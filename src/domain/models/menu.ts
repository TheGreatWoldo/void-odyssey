import type { SceneKey } from '@/shared/scene-key'

/**
 * A single icon slot on a menu button.
 * When `event` is set, clicking the icon fires that event instead of the button's event.
 */
export interface MenuIconSlot {
  /** Lucide icon name, e.g. "Rocket", "Star" */
  readonly icon: string
  /** If set, clicking this icon fires this event instead of the button event. */
  readonly event?: string
}

/**
 * A single node in the menu tree.
 */
export interface MenuItem {
  readonly id: string
  readonly label: string
  /** Icons shown before the label */
  readonly leadingIcons?: MenuIconSlot[]
  /** Icons shown after the label */
  readonly trailingIcons?: MenuIconSlot[]
  /**
   * Event string fired when this button is clicked (and not intercepted by an icon slot).
   * Omit only when this item has children (navigation to submenu is implicit).
   */
  readonly event?: string
  /**
   * Background scene shown when displaying this item's children.
   * Required when `children` is non-empty.
   */
  readonly sceneKey?: SceneKey
  readonly children?: MenuItem[]
}

/**
 * Root menu configuration loaded from JSON.
 */
export interface MenuConfig {
  /** SceneKey for the top-level menu screen */
  readonly sceneKey: SceneKey
  readonly items: MenuItem[]
}
