// Advanced Caching System for FDA and NIH API Data
// CACHING IS COMPLETELY DISABLED AS PER USER REQUEST
// All methods act as pass-throughs or no-ops to ensure fresh data every time.

// ============================================
// CACHE CONFIGURATION
// ============================================

const CACHE_CONFIG = {
    TTL: {
        FDA_DRUG: 0,
        RXNORM: 0,
        NIH_INTERACTION: 0,
        ANALYSIS: 0,
    },
    MAX_ENTRIES: {
        FDA_DRUG: 0,
        RXNORM: 0,
        NIH_INTERACTION: 0,
        ANALYSIS: 0,
    },
    // File-based cache directory
    CACHE_DIR: '.cache', // Kept for reference but unused
}

// ============================================
// CACHE ENTRY INTERFACE
// ============================================

interface CacheEntry<T> {
    data: T
    timestamp: number
    ttl: number
    hits: number
}

interface CacheStats {
    hits: number
    misses: number
    size: number
    lastCleanup: number
}

// ============================================
// IN-MEMORY CACHE (DISABLED)
// ============================================

class MemoryCache<T> {
    private stats: CacheStats = { hits: 0, misses: 0, size: 0, lastCleanup: Date.now() }

    constructor(maxEntries: number = 0, defaultTTL: number = 0) {
        // No-op
    }

    get(key: string): T | null {
        // Always miss
        this.stats.misses++
        return null
    }

    set(key: string, data: T, ttl?: number): void {
        // No-op
    }

    has(key: string): boolean {
        return false
    }

    delete(key: string): boolean {
        return false
    }

    clear(): void {
        // No-op
    }

    getStats(): CacheStats {
        return { ...this.stats, size: 0 }
    }

    private evictLRU(): void {
        // No-op
    }

    cleanup(): number {
        return 0
    }
}

// ============================================
// FILE-BASED PERSISTENT CACHE (DISABLED)
// ============================================

class FileCache<T> {
    constructor(namespace: string) {
        // No-op
    }

    async get(key: string): Promise<T | null> {
        return null
    }

    async set(key: string, data: T, ttl: number): Promise<void> {
        // No-op
    }

    async delete(key: string): Promise<boolean> {
        return false
    }

    async clear(): Promise<void> {
        // No-op
    }

    async cleanup(): Promise<number> {
        return 0
    }
}

// ============================================
// MULTI-TIER CACHE (DISABLED)
// ============================================

class MultiTierCache<T> {
    private memoryCache: MemoryCache<T>
    private fileCache: FileCache<T>
    private namespace: string

    constructor(
        namespace: string,
        maxMemoryEntries: number,
        defaultTTL: number
    ) {
        this.namespace = namespace
        this.memoryCache = new MemoryCache<T>(0, 0)
        this.fileCache = new FileCache<T>(namespace)
    }

    async get(key: string): Promise<T | null> {
        console.log(`[Cache:${this.namespace}] CACHE DISABLED - Skipping lookup for ${key.substring(0, 20)}...`)
        return null
    }

    async set(key: string, data: T, ttl?: number): Promise<void> {
        // No-op
    }

    async delete(key: string): Promise<void> {
        // No-op
    }

    async clear(): Promise<void> {
        // No-op
    }

    async cleanup(): Promise<{ memory: number; file: number }> {
        return { memory: 0, file: 0 }
    }

    getStats(): CacheStats {
        return this.memoryCache.getStats()
    }
}

// ============================================
// CACHE INSTANCES
// ============================================

// FDA Drug Data Cache
export const fdaDrugCache = new MultiTierCache<any>('fda-drugs', 0, 0)

// RxNorm Cache
export const rxNormCache = new MultiTierCache<any>('rxnorm', 0, 0)

// NIH Interaction Cache
export const nihInteractionCache = new MultiTierCache<any>('nih-interactions', 0, 0)

// Analysis Results Cache
export const analysisCache = new MultiTierCache<any>('analysis', 0, 0)

// ============================================
// CACHE UTILITIES
// ============================================

export function getDrugCacheKey(drugName: string): string {
    return `drug:${drugName.toLowerCase().trim()}`
}

export function getRxNormCacheKey(term: string): string {
    return `rxnorm:${term.toLowerCase().trim()}`
}

export function getInteractionCacheKey(rxcuis: string[]): string {
    return `interaction:${rxcuis.sort().join('+')}`
}

export function getAnalysisCacheKey(medicines: string[]): string {
    return `analysis:${medicines.map(m => m.toLowerCase().trim()).sort().join('|')}`
}

export async function cleanupAllCaches(): Promise<void> {
    console.log('[Cache] Cache cleanup ignored (Disabled)')
}

export function getAllCacheStats(): Record<string, CacheStats> {
    return {
        fdaDrug: fdaDrugCache.getStats(),
        rxNorm: rxNormCache.getStats(),
        nihInteraction: nihInteractionCache.getStats(),
        analysis: analysisCache.getStats(),
    }
}

export async function warmupCache(): Promise<void> {
    console.log('[Cache] Cache warmup ignored (Disabled)')
}
