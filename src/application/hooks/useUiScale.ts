import { useEffect, useState } from 'react'

const VIRTUAL_WIDTH = 1600
const VIRTUAL_HEIGHT = 900

function computeScale(): number {
  return Math.min(window.innerWidth / VIRTUAL_WIDTH, window.innerHeight / VIRTUAL_HEIGHT)
}

export function useUiScale(): number {
  const [scale, setScale] = useState<number>(computeScale)

  useEffect(() => {
    function onResize() {
      setScale(computeScale())
    }

    window.addEventListener('resize', onResize)

    return () => window.removeEventListener('resize', onResize)
  }, [])

  return scale
}
