// Advanced Caching System for FDA and NIH API Data
// Provides both in-memory and file-based caching for performance and reliability

import { promises as fs } from 'fs'
import path from 'path'

// ============================================
// CACHE CONFIGURATION
// ============================================

const CACHE_CONFIG = {
    // Time-to-live for different cache types (in milliseconds)
    TTL: {
        FDA_DRUG: 7 * 24 * 60 * 60 * 1000,      // 7 days for FDA drug data
        RXNORM: 30 * 24 * 60 * 60 * 1000,       // 30 days for RxNorm (rarely changes)
        NIH_INTERACTION: 7 * 24 * 60 * 60 * 1000, // 7 days for NIH interactions
        ANALYSIS: 24 * 60 * 60 * 1000,          // 24 hours for analysis results
    },
    // Maximum entries per cache type
    MAX_ENTRIES: {
        FDA_DRUG: 1000,
        RXNORM: 500,
        NIH_INTERACTION: 200,
        ANALYSIS: 100,
    },
    // File-based cache directory
    CACHE_DIR: '.cache',
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
// IN-MEMORY CACHE
// ============================================

class MemoryCache<T> {
    private cache: Map<string, CacheEntry<T>> = new Map()
    private stats: CacheStats = { hits: 0, misses: 0, size: 0, lastCleanup: Date.now() }
    private maxEntries: number
    private defaultTTL: number

    constructor(maxEntries: number = 500, defaultTTL: number = 24 * 60 * 60 * 1000) {
        this.maxEntries = maxEntries
        this.defaultTTL = defaultTTL
    }

    get(key: string): T | null {
        const entry = this.cache.get(key)

        if (!entry) {
            this.stats.misses++
            return null
        }

        // Check if expired
        if (Date.now() > entry.timestamp + entry.ttl) {
            this.cache.delete(key)
            this.stats.misses++
            return null
        }

        entry.hits++
        this.stats.hits++
        return entry.data
    }

    set(key: string, data: T, ttl?: number): void {
        // Evict if at capacity
        if (this.cache.size >= this.maxEntries) {
            this.evictLRU()
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
            hits: 0,
        })
        this.stats.size = this.cache.size
    }

    has(key: string): boolean {
        const entry = this.cache.get(key)
        if (!entry) return false
        if (Date.now() > entry.timestamp + entry.ttl) {
            this.cache.delete(key)
            return false
        }
        return true
    }

    delete(key: string): boolean {
        return this.cache.delete(key)
    }

    clear(): void {
        this.cache.clear()
        this.stats.size = 0
    }

    getStats(): CacheStats {
        return { ...this.stats, size: this.cache.size }
    }

    // Evict least recently used entries
    private evictLRU(): void {
        let minHits = Infinity
        let lruKey: string | null = null

        for (const [key, entry] of this.cache.entries()) {
            // First evict expired entries
            if (Date.now() > entry.timestamp + entry.ttl) {
                this.cache.delete(key)
                continue
            }

            if (entry.hits < minHits) {
                minHits = entry.hits
                lruKey = key
            }
        }

        if (lruKey) {
            this.cache.delete(lruKey)
        }
    }

    // Clean up expired entries
    cleanup(): number {
        let cleaned = 0
        const now = Date.now()

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.timestamp + entry.ttl) {
                this.cache.delete(key)
                cleaned++
            }
        }

        this.stats.lastCleanup = now
        this.stats.size = this.cache.size
        return cleaned
    }
}

// ============================================
// FILE-BASED PERSISTENT CACHE
// ============================================

class FileCache<T> {
    private cacheDir: string
    private namespace: string

    constructor(namespace: string) {
        this.namespace = namespace
        this.cacheDir = path.join(process.cwd(), CACHE_CONFIG.CACHE_DIR, namespace)
    }

    private async ensureDir(): Promise<void> {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true })
        } catch (error) {
            // Directory might already exist
        }
    }

    private getCacheFilePath(key: string): string {
        // Create safe filename from key
        const safeKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_')
        return path.join(this.cacheDir, `${safeKey}.json`)
    }

    async get(key: string): Promise<T | null> {
        try {
            const filePath = this.getCacheFilePath(key)
            const content = await fs.readFile(filePath, 'utf-8')
            const entry: CacheEntry<T> = JSON.parse(content)

            // Check if expired
            if (Date.now() > entry.timestamp + entry.ttl) {
                await this.delete(key)
                return null
            }

            return entry.data
        } catch (error) {
            return null
        }
    }

    async set(key: string, data: T, ttl: number): Promise<void> {
        try {
            await this.ensureDir()
            const filePath = this.getCacheFilePath(key)

            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                ttl,
                hits: 0,
            }

            await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8')
        } catch (error) {
            console.error(`[FileCache] Failed to write cache for ${key}:`, error)
        }
    }

    async delete(key: string): Promise<boolean> {
        try {
            const filePath = this.getCacheFilePath(key)
            await fs.unlink(filePath)
            return true
        } catch (error) {
            return false
        }
    }

    async clear(): Promise<void> {
        try {
            const files = await fs.readdir(this.cacheDir)
            await Promise.all(
                files.map(file => fs.unlink(path.join(this.cacheDir, file)))
            )
        } catch (error) {
            // Directory might not exist
        }
    }

    async cleanup(): Promise<number> {
        let cleaned = 0
        try {
            await this.ensureDir()
            const files = await fs.readdir(this.cacheDir)
            const now = Date.now()

            for (const file of files) {
                try {
                    const filePath = path.join(this.cacheDir, file)
                    const content = await fs.readFile(filePath, 'utf-8')
                    const entry: CacheEntry<T> = JSON.parse(content)

                    if (now > entry.timestamp + entry.ttl) {
                        await fs.unlink(filePath)
                        cleaned++
                    }
                } catch {
                    // Skip invalid files
                }
            }
        } catch (error) {
            // Directory might not exist
        }
        return cleaned
    }
}

// ============================================
// MULTI-TIER CACHE (Memory + File)
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
        this.memoryCache = new MemoryCache<T>(maxMemoryEntries, defaultTTL)
        this.fileCache = new FileCache<T>(namespace)
    }

    async get(key: string): Promise<T | null> {
        // Try memory first (fastest)
        const memoryResult = this.memoryCache.get(key)
        if (memoryResult !== null) {
            console.log(`[Cache:${this.namespace}] Memory HIT for ${key.substring(0, 20)}...`)
            return memoryResult
        }

        // Try file cache (slower but persistent)
        const fileResult = await this.fileCache.get(key)
        if (fileResult !== null) {
            // Promote to memory cache
            this.memoryCache.set(key, fileResult)
            console.log(`[Cache:${this.namespace}] File HIT for ${key.substring(0, 20)}...`)
            return fileResult
        }

        console.log(`[Cache:${this.namespace}] MISS for ${key.substring(0, 20)}...`)
        return null
    }

    async set(key: string, data: T, ttl?: number): Promise<void> {
        const effectiveTTL = ttl || CACHE_CONFIG.TTL.FDA_DRUG

        // Write to both caches
        this.memoryCache.set(key, data, effectiveTTL)
        await this.fileCache.set(key, data, effectiveTTL)

        console.log(`[Cache:${this.namespace}] SET ${key.substring(0, 20)}...`)
    }

    async delete(key: string): Promise<void> {
        this.memoryCache.delete(key)
        await this.fileCache.delete(key)
    }

    async clear(): Promise<void> {
        this.memoryCache.clear()
        await this.fileCache.clear()
    }

    async cleanup(): Promise<{ memory: number; file: number }> {
        const memory = this.memoryCache.cleanup()
        const file = await this.fileCache.cleanup()
        return { memory, file }
    }

    getStats(): CacheStats {
        return this.memoryCache.getStats()
    }
}

// ============================================
// CACHE INSTANCES
// ============================================

// FDA Drug Data Cache
export const fdaDrugCache = new MultiTierCache<any>(
    'fda-drugs',
    CACHE_CONFIG.MAX_ENTRIES.FDA_DRUG,
    CACHE_CONFIG.TTL.FDA_DRUG
)

// RxNorm Cache
export const rxNormCache = new MultiTierCache<any>(
    'rxnorm',
    CACHE_CONFIG.MAX_ENTRIES.RXNORM,
    CACHE_CONFIG.TTL.RXNORM
)

// NIH Interaction Cache
export const nihInteractionCache = new MultiTierCache<any>(
    'nih-interactions',
    CACHE_CONFIG.MAX_ENTRIES.NIH_INTERACTION,
    CACHE_CONFIG.TTL.NIH_INTERACTION
)

// Analysis Results Cache
export const analysisCache = new MultiTierCache<any>(
    'analysis',
    CACHE_CONFIG.MAX_ENTRIES.ANALYSIS,
    CACHE_CONFIG.TTL.ANALYSIS
)

// ============================================
// CACHE UTILITIES
// ============================================

// Generate cache key for drug lookups
export function getDrugCacheKey(drugName: string): string {
    return `drug:${drugName.toLowerCase().trim()}`
}

// Generate cache key for RxNorm lookups
export function getRxNormCacheKey(term: string): string {
    return `rxnorm:${term.toLowerCase().trim()}`
}

// Generate cache key for interaction lookups
export function getInteractionCacheKey(rxcuis: string[]): string {
    return `interaction:${rxcuis.sort().join('+')}`
}

// Generate cache key for analysis results
export function getAnalysisCacheKey(medicines: string[]): string {
    return `analysis:${medicines.map(m => m.toLowerCase().trim()).sort().join('|')}`
}

// Clean up all caches
export async function cleanupAllCaches(): Promise<void> {
    console.log('[Cache] Running cleanup...')

    const results = await Promise.all([
        fdaDrugCache.cleanup(),
        rxNormCache.cleanup(),
        nihInteractionCache.cleanup(),
        analysisCache.cleanup(),
    ])

    console.log('[Cache] Cleanup complete:', results)
}

// Get stats for all caches
export function getAllCacheStats(): Record<string, CacheStats> {
    return {
        fdaDrug: fdaDrugCache.getStats(),
        rxNorm: rxNormCache.getStats(),
        nihInteraction: nihInteractionCache.getStats(),
        analysis: analysisCache.getStats(),
    }
}

// Warm up cache with common drugs
const COMMON_DRUGS = [
    'aspirin', 'ibuprofen', 'acetaminophen', 'metformin', 'lisinopril',
    'amlodipine', 'metoprolol', 'omeprazole', 'simvastatin', 'atorvastatin',
    'losartan', 'gabapentin', 'hydrochlorothiazide', 'sertraline', 'fluoxetine'
]

export async function warmupCache(): Promise<void> {
    console.log('[Cache] Starting cache warmup with common drugs...')
    // This would be called on server start to pre-populate cache
    // Implementation depends on your FDA fetch logic being imported here
}
