import GameCanvas from '@/presentation/components/GameCanvas'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => <GameCanvas sceneKey="orangeOnBlack" />,
})
