import { type NextRequest, NextResponse } from "next/server"
import {
    getAllCacheStats,
    cleanupAllCaches,
    fdaDrugCache,
    rxNormCache,
    nihInteractionCache,
    analysisCache
} from "@/lib/cache"

// GET: View cache statistics
export async function GET() {
    try {
        const stats = getAllCacheStats()

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            stats,
            summary: {
                totalHits: Object.values(stats).reduce((sum, s) => sum + s.hits, 0),
                totalMisses: Object.values(stats).reduce((sum, s) => sum + s.misses, 0),
                totalSize: Object.values(stats).reduce((sum, s) => sum + s.size, 0),
                hitRate: (() => {
                    const hits = Object.values(stats).reduce((sum, s) => sum + s.hits, 0)
                    const total = hits + Object.values(stats).reduce((sum, s) => sum + s.misses, 0)
                    return total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : 'N/A'
                })()
            }
        })
    } catch (error) {
        console.error("Cache stats error:", error)
        return NextResponse.json({ error: "Failed to get cache stats" }, { status: 500 })
    }
}

// POST: Manage cache (cleanup, clear)
export async function POST(request: NextRequest) {
    try {
        const { action, cacheType } = await request.json()

        switch (action) {
            case 'cleanup':
                // Clean up expired entries from all caches
                await cleanupAllCaches()
                return NextResponse.json({
                    success: true,
                    message: "Cache cleanup completed"
                })

            case 'clear':
                // Clear specific cache or all caches
                if (cacheType === 'fda') {
                    await fdaDrugCache.clear()
                } else if (cacheType === 'rxnorm') {
                    await rxNormCache.clear()
                } else if (cacheType === 'nih') {
                    await nihInteractionCache.clear()
                } else if (cacheType === 'analysis') {
                    await analysisCache.clear()
                } else if (cacheType === 'all') {
                    await Promise.all([
                        fdaDrugCache.clear(),
                        rxNormCache.clear(),
                        nihInteractionCache.clear(),
                        analysisCache.clear()
                    ])
                } else {
                    return NextResponse.json({
                        error: "Invalid cache type. Use: fda, rxnorm, nih, analysis, or all"
                    }, { status: 400 })
                }

                return NextResponse.json({
                    success: true,
                    message: `Cache ${cacheType} cleared successfully`
                })

            default:
                return NextResponse.json({
                    error: "Invalid action. Use: cleanup or clear"
                }, { status: 400 })
        }
    } catch (error) {
        console.error("Cache management error:", error)
        return NextResponse.json({ error: "Failed to manage cache" }, { status: 500 })
    }
}
