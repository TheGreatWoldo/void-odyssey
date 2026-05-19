import { SHIP_ENTRIES, SHIP_MAP_CANVAS } from '@/application/hooks/ship-catalog'
import { useGameService } from '@/application/hooks/useGameService'
import { useRouteGraphParams } from '@/application/hooks/useRouteNavigation'
import { useShipSelection } from '@/application/hooks/useShipSelection'
import { type CarouselApi, Carousel, CarouselContent, CarouselItem } from '@/presentation/components/ui/carousel'
import { MENU_ANIMATIONS_ENABLED, MENU_EXIT_BUFFER_MS, MENU_ITEM_DURATION_MS } from '@/shared/menu-animation'
import { SceneKey } from '@/shared/scene-key'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

const EXIT_DURATION_MS = MENU_ITEM_DURATION_MS

// Available pixel area for map images inside the carousel card
// (slide h-[620px] − py-5*2 − name-row ~60px; width: max-w-3xl 768px − pl-4 − px-6*2)
const MAP_AREA_W = 680
const MAP_AREA_H = 500

// Single uniform scale so the largest map fits exactly — all maps share this factor,
// giving identical visual section size across all ships.
const MAP_SCALE = Math.min(MAP_AREA_W / SHIP_MAP_CANVAS.width, MAP_AREA_H / SHIP_MAP_CANVAS.height)

function SelectShipPage() {
    const service = useGameService()
    const navigate = useNavigate()
    const { routeSeed } = useRouteGraphParams()
    const { setSelectedShipId } = useShipSelection()
    const [exiting, setExiting] = useState(false)
    const [api, setApi] = useState<CarouselApi>()
    const [index, setIndex] = useState(0)

    useEffect(() => {
        service.goToScene(SceneKey.CyanOnRed).catch((err: unknown) => {
            console.error('goToScene failed:', err)
        })
    }, [service])

    useEffect(() => {
        if (!api) return
        const onSelect = () => setIndex(api.selectedScrollSnap())
        api.on('select', onSelect)
        return () => { api.off('select', onSelect) }
    }, [api])

    const navigateWithExit = (action: () => void) => {
        if (exiting) return
        if (!MENU_ANIMATIONS_ENABLED) { action(); return }
        setExiting(true)
        setTimeout(action, EXIT_DURATION_MS + MENU_EXIT_BUFFER_MS)
    }

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault()
        navigateWithExit(() => {
            navigate({ to: '/', search: { menu: 'play' } }).catch(() => {})
        })
    }

    return (
        <div className="pointer-events-none absolute inset-0 text-white flex flex-col">

            {/* Header */}
            <div className="flex items-center border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
                <div className="flex-1 flex flex-col items-center">
                    <h1 className="text-center text-[2.5rem] font-bold tracking-widest uppercase text-white/80 leading-none">
                        Select Ship
                    </h1>

                    <div className="mt-1 flex items-center gap-2 text-xs tracking-widest uppercase text-white/50">
                        <span>Seed: {routeSeed || 'auto'}</span>
                        <button
                            type="button"
                            onClick={() => {
                                const seedToCopy = routeSeed || 'auto'

                                navigator.clipboard.writeText(seedToCopy).catch(() => {})
                            }}
                            className="pointer-events-auto text-white/50 hover:text-white transition-colors"
                            aria-label="Copy seed"
                            title="Copy seed"
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div
                className="pointer-events-auto flex-1 flex flex-col items-center px-4 py-4 gap-3"
                style={{
                    animation: !MENU_ANIMATIONS_ENABLED ? undefined : exiting
                        ? `fade-out-down ${EXIT_DURATION_MS}ms ease both`
                        : `fade-in-up ${MENU_ITEM_DURATION_MS}ms ease both`,
                }}
            >
                <div className="flex-1 flex items-stretch w-full gap-4 overflow-hidden">

                    {/* Prev arrow */}
                    <button
                        type="button"
                        onClick={() => api?.scrollPrev()}
                        className="flex-none flex items-center justify-center w-40 bg-black/60 border border-white/20 text-white/50 hover:bg-black/80 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={28} />
                    </button>

                    <Carousel
                        opts={{ loop: true }}
                        setApi={setApi}
                        className="flex-1 min-w-0 h-full"
                    >
                    <CarouselContent className="items-stretch h-full">
                        {SHIP_ENTRIES.map(entry => (
                            <CarouselItem key={entry.id} className="h-full">
                                <div className="flex flex-col gap-4 border border-white/20 bg-black/90 px-6 py-5 h-full">

                                    {/* Name + stats */}
                                    <div className="flex items-center justify-between flex-none">
                                        <span className="text-2xl uppercase tracking-wider text-white/90">
                                            {entry.name}
                                        </span>
                                        <span className="text-xs uppercase tracking-widest text-white/40 border border-white/20 px-2 py-1">
                                            {entry.roomCount} rooms
                                        </span>
                                    </div>

                                    {/* Map image — uniform scale, centered */}
                                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={entry.mapPng}
                                            alt={`${entry.name} map`}
                                            width={Math.round(entry.naturalWidth * MAP_SCALE)}
                                            height={Math.round(entry.naturalHeight * MAP_SCALE)}
                                            style={{ imageRendering: 'pixelated' }}
                                        />
                                    </div>

                                    {/* Description */}
                                    {entry.description && (
                                        <p className="text-white/50 text-sm leading-relaxed tracking-wide flex-none">
                                            {entry.description}
                                        </p>
                                    )}

                                    {/* Dot indicators */}
                                    <div className="flex-none flex justify-center gap-2 pt-1">
                                        {SHIP_ENTRIES.map((s, i) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => api?.scrollTo(i)}
                                                className="w-2 h-2 rounded-full transition-colors"
                                                style={{ background: i === index ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)' }}
                                            />
                                        ))}
                                    </div>

                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    </Carousel>

                    {/* Next arrow */}
                    <button
                        type="button"
                        onClick={() => api?.scrollNext()}
                        className="flex-none flex items-center justify-center w-40 bg-black/60 border border-white/20 text-white/50 hover:bg-black/80 hover:text-white transition-colors"
                    >
                        <ChevronRight size={28} />
                    </button>

                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-8 border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
                <a
                    href="/"
                    onClick={handleBack}
                    className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
                >
                    ← Back
                </a>

                <button
                    type="button"
                    onClick={() => navigateWithExit(() => {
                        setSelectedShipId(SHIP_ENTRIES[index].id)
                        navigate({ to: '/play/select-route' }).catch(() => {})
                    })}
                    className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
                >
                    Next <ChevronRight size={20} />
                </button>
            </div>

        </div>
    )
}

export const Route = createFileRoute('/_canvas/play/select-ship')({
    component: SelectShipPage,
})
