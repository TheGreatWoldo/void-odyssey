import { BackgroundSceneArgs } from '../background-scene-args';
import { backgroundColorArgsCatalog } from './background-color-args-catalog';

export const backgroundSceneArgsCatalog = {
  // Main menu — "Solar Wind": amber nebula drifting right on near-black slate
  orangeOnBlack: new BackgroundSceneArgs({
    actorColor: backgroundColorArgsCatalog.twAmber,
    backgroundColor: backgroundColorArgsCatalog.twSlate950,
    minSpeed: 15,
    maxSpeed: 80,
    minSize: 15,
    maxSize: 100,
    angleBase: 0,
    angleTolerance: 20,
    spawnIntervalMs: 300,
  }),
  // Hangar — "Rust Belt": cool slate debris on burnt orange
  blackOnOrange: new BackgroundSceneArgs({
    actorColor: backgroundColorArgsCatalog.twSlate,
    backgroundColor: backgroundColorArgsCatalog.twOrange950,
    minSpeed: 10,
    maxSpeed: 60,
    minSize: 30,
    maxSize: 160,
    angleBase: 90,
    angleTolerance: 10,
    spawnIntervalMs: 400,
  }),
  // Missions — "Nebula Core": amber particles in deep violet space
  yellowOnPurple: new BackgroundSceneArgs({
    actorColor: backgroundColorArgsCatalog.twYellow,
    backgroundColor: backgroundColorArgsCatalog.twViolet950,
    minSpeed: 25,
    maxSpeed: 150,
    minSize: 8,
    maxSize: 70,
    angleBase: 180,
    angleTolerance: 25,
    spawnIntervalMs: 90,
  }),
  // Play — "Solar Flare": electric cyan on deep crimson, high energy
  cyanOnRed: new BackgroundSceneArgs({
    actorColor: backgroundColorArgsCatalog.twCyan,
    backgroundColor: backgroundColorArgsCatalog.twRose950,
    minSpeed: 25,
    maxSpeed: 140,
    minSize: 5,
    maxSize: 55,
    angleBase: 270,
    angleTolerance: 30,
    spawnIntervalMs: 80,
  }),
  // Crew — "Deep Current": orange on deep navy, complementary pair
  orangeOnBlue: new BackgroundSceneArgs({
    actorColor: backgroundColorArgsCatalog.twOrange,
    backgroundColor: backgroundColorArgsCatalog.twBlue950,
    minSpeed: 15,
    maxSpeed: 90,
    minSize: 20,
    maxSize: 120,
    angleBase: 135,
    angleTolerance: 20,
    spawnIntervalMs: 270,
  }),
  // Settings — "Void Pulse": fuchsia on deep magenta-black
  magentaOnBlack: new BackgroundSceneArgs({
    actorColor: backgroundColorArgsCatalog.twFuchsia,
    backgroundColor: backgroundColorArgsCatalog.twFuchsia950,
    minSpeed: 20,
    maxSpeed: 120,
    minSize: 10,
    maxSize: 90,
    angleBase: 45,
    angleTolerance: 15,
    spawnIntervalMs: 120,
  }),
  // Codex — "Bioluminescence": emerald on deep forest, slow organic drift
  greenOnBlack: new BackgroundSceneArgs({
    actorColor: backgroundColorArgsCatalog.twEmerald,
    backgroundColor: backgroundColorArgsCatalog.twEmerald950,
    minSpeed: 8,
    maxSpeed: 55,
    minSize: 8,
    maxSize: 75,
    angleBase: 315,
    angleTolerance: 35,
    spawnIntervalMs: 220,
  }),
};
