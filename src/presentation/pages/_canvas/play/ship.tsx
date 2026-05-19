import { SHIP_ENTRIES } from '@/application/hooks/ship-catalog'
import { useActiveShip } from '@/application/hooks/useActiveShip'
import { useGameService } from '@/application/hooks/useGameService'
import { SceneKey } from '@/shared/scene-key'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

function ShipPage() {
    const service = useGameService()
    const navigate = useNavigate()
    const { ship, selectedShipId, initialise } = useActiveShip()

    const entry = SHIP_ENTRIES.find((e) => e.id === selectedShipId) ?? SHIP_ENTRIES[0]

    useEffect(() => {
        initialise(entry)

        service.loadShipView(entry.layout)
        service.goToScene(SceneKey.ShipView).catch((err: unknown) => {
            console.error('goToScene failed:', err)
        })

        return () => {
            service.goToScene(SceneKey.OrangeOnBlack).catch((err: unknown) => {
                console.error('goToScene cleanup failed:', err)
            })
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const capabilities = ship?.getCapabilities()
    const hull = ship?.getHull() ?? 0
    const shield = ship?.getShield() ?? 0

    return (
        <div className="pointer-events-none absolute inset-0 text-white flex flex-col">

            {/* Header */}
            <div className="flex items-center gap-4 border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
                <div className="flex-1 flex flex-col items-center">
                    <h1 className="text-center text-[2.5rem] font-bold tracking-widest uppercase text-white/80 leading-none">
                        {entry.name}
                    </h1>

                    <div className="mt-1 flex items-center gap-3 text-xs tracking-widest uppercase text-white/50">
                        <span>{entry.shipClass}</span>
                        <span className="border border-white/20 px-2 py-0.5">Docked</span>
                        <span>{entry.roomCount} Rooms</span>
                    </div>
                </div>
            </div>

            {/* Content — transparent centre shows ShipView backdrop; stats panel on the right */}
            <div className="flex-1 flex">

                {/* Transparent fill — Excalibur canvas shows through */}
                <div className="flex-1" />

                {/* Stats panel */}
                <div className="pointer-events-auto w-72 flex flex-col gap-4 border-l border-white/20 bg-black/80 backdrop-blur-[2px] px-5 py-5 overflow-y-auto">

                    {/* Integrity */}
                    <section>
                        <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2">Integrity</h2>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <StatRow label="Hull" value={hull} />
                            <StatRow label="Shield" value={shield} />
                        </div>
                    </section>

                    <div className="border-t border-white/10" />

                    {/* Propulsion */}
                    <section>
                        <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2">Propulsion</h2>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <StatRow label="Thrust"     value={capabilities?.maxThrust ?? 0} />
                            <StatRow label="Jump Range" value={capabilities?.maxJumpRange ?? 0} unit="LY" />
                        </div>
                    </section>

                    <div className="border-t border-white/10" />

                    {/* Combat */}
                    <section>
                        <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2">Combat</h2>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <StatRow label="Shield Gen"     value={capabilities?.maxShieldGeneration ?? 0} />
                            <StatRow label="Energy FP"      value={capabilities?.maxEnergyFirepower ?? 0} />
                            <StatRow label="Kinetic FP"     value={capabilities?.maxKineticFirepower ?? 0} />
                            <StatRow label="Total FP"       value={capabilities?.totalFirepower ?? 0} />
                        </div>
                    </section>

                    <div className="border-t border-white/10" />

                    {/* Systems */}
                    <section>
                        <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2">Systems</h2>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <StatRow label="Scan Range"  value={capabilities?.maxScanRange ?? 0} />
                            <StatRow label="Comms Range" value={capabilities?.maxCommsRange ?? 0} />
                            <StatRow label="Crew Cap."   value={capabilities?.maxCrewCapacity ?? 0} />
                        </div>
                    </section>

                </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-center border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
                <button
                    type="button"
                    onClick={() => navigate({ to: '/play/confirm-route' }).catch(() => {})}
                    className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
                >
                    ← Back
                </button>
            </div>

        </div>
    )
}

function StatRow({ label, value, unit }: { label: string; value: number; unit?: string }) {
    return (
        <>
            <span className="text-xs uppercase tracking-widest text-white/50">{label}</span>
            <span className="text-sm font-semibold text-white/90 tabular-nums text-right">
                {value}{unit ? ` ${unit}` : ''}
            </span>
        </>
    )
}

export const Route = createFileRoute('/_canvas/play/ship')({
    component: ShipPage,
})
