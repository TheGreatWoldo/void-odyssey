export const SceneKey = {
  OrangeOnBlack: 'orangeOnBlack',
  BlackOnOrange: 'blackOnOrange',
  YellowOnPurple: 'yellowOnPurple',
  CyanOnRed: 'cyanOnRed',
  OrangeOnBlue: 'orangeOnBlue',
  MagentaOnBlack: 'magentaOnBlack',
  GreenOnBlack: 'greenOnBlack',
  ShipBlueprintEditor: 'shipBlueprintEditor',
  ShipView: 'shipView',
} as const

export type SceneKey = typeof SceneKey[keyof typeof SceneKey]
