import type { MenuConfig } from '@/shared/menu'
import { SceneKey } from '@/shared/scene-key'

export const defaultMenuConfig: MenuConfig = {
  sceneKey: SceneKey.OrangeOnBlack,
  title: 'Void Odyssey',
  items: [
    {
      id: 'play',
      label: 'Play',
      leadingIcons: [{ icon: 'Rocket' }],
      children: [
        {
          id: 'new-game',
          label: 'New Game',
          leadingIcons: [{ icon: 'Play' }],
          event: 'play:new-game',
        },
        {
          id: 'start-from-seed',
          label: 'Start from seed',
          leadingIcons: [{ icon: 'Copy' }],
          event: 'play:start-from-seed',
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      leadingIcons: [{ icon: 'Settings' }],
      event: 'settings:video',
    },
    {
      id: 'quit',
      label: 'Quit',
      leadingIcons: [{ icon: 'X' }],
      event: 'app:quit',
    },
  ],
}
