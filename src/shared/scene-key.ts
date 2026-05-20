export const SceneKey = {
  OrangeOnBlack: 'orangeOnBlack',
  BlackOnOrange: 'blackOnOrange',
  YellowOnPurple: 'yellowOnPurple',
  CyanOnRed: 'cyanOnRed',
  OrangeOnBlue: 'orangeOnBlue',
  MagentaOnBlack: 'magentaOnBlack',
  GreenOnBlack: 'greenOnBlack',
  ShipView: 'shipView',
  RouteNavigation: 'routeNavigation',
} as const

export type SceneKey = typeof SceneKey[keyof typeof SceneKey]
