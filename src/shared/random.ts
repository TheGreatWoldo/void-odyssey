export type RandomNumberGenerator = () => number

export function createSeededRandom(seed: number): RandomNumberGenerator {
  let state = seed >>> 0

  return () => {
    state += 0x6d2b79f5

    let value = Math.imul(state ^ (state >>> 15), 1 | state)

    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function hashStringToSeed(input: string): number {
  let hash = 2166136261

  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}