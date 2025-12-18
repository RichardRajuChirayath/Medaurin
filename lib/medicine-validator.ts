/**
 * UNIFIED MEDICINE VALIDATION MODULE
 * 
 * This module provides a single source of truth for medicine validation
 * across the entire application (OCR uploads AND manual entry).
 * 
 * VALIDATION RULES:
 * - A medicine is VALID if rxcui !== null OR fdaData !== null
 * - If BOTH fail → medicine is invalid
 * - Only validated medicines are cached
 * - Cache keys are normalized (lowercase + trimmed)
 * - TTL ensures fresh data
 */

import { rxNormCache, fdaDrugCache, getRxNormCacheKey, getDrugCacheKey } from "./cache"
import { resolveIndianBrand } from "./brand-mapper"
import { resolveGenericName } from "./generic-resolver"

// ============================================
// INTERFACES
// ============================================

export interface ValidatedMedicine {
    name: string                    // Original user input
    isValid: boolean               // True if found in RxNorm OR FDA
    rxcui: string | null          // RxNorm identifier
    normalizedName: string        // Standardized name from RxNorm
    fdaData: FDAData | null       // FDA information
    synonyms: string[]            // Alternative names from RxNorm
    reason?: string               // If invalid, why it failed
    apiError?: boolean            // NEW: True if validation failed due to API issues
    apiStatus?: string            // NEW: "api_error" or undefined
}

export interface FDAData {
    text: string
    genericName?: string[]
    brandName?: string[]
    pharmClass?: string[]
    sideEffects?: string[]
}

interface RxNormResponse {
    rxcui: string | null
    normalizedName: string
    synonyms: string[]
    apiError?: boolean
}

// ============================================
// RELIABILITY HELPERS
// ============================================

/**
 * Fetch with retry logic (3 attempts, 200ms delay)
 */
async function fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options)
            if (response.ok) return response

            // If 429 (Too Many Requests) or 5xx, retry
            if (response.status === 429 || response.status >= 500) {
                console.warn(`[Validator] API retry ${i + 1}/${retries} for ${url.substring(0, 50)}... (${response.status})`)
                await new Promise(r => setTimeout(r, 200)) // 200ms delay
                continue
            }

            // Other errors (404, 400) - return immediately
            return response
        } catch (error) {
            console.warn(`[Validator] Network retry ${i + 1}/${retries} for ${url.substring(0, 50)}...`)
            if (i === retries - 1) throw error
            await new Promise(r => setTimeout(r, 200))
        }
    }
    throw new Error(`Failed to fetch ${url} after ${retries} retries`)
}

/**
 * Simple concurrency limiter queue
 */
class LimitQueue {
    private queue: (() => Promise<any>)[] = []
    private activeCount = 0
    private concurrency: number

    constructor(concurrency: number) {
        this.concurrency = concurrency
    }

    add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            const wrapper = async () => {
                this.activeCount++
                try {
                    const result = await task()
                    resolve(result)
                } catch (err) {
                    reject(err)
                } finally {
                    this.activeCount--
                    this.next()
                }
            }

            if (this.activeCount < this.concurrency) {
                wrapper()
            } else {
                this.queue.push(wrapper)
            }
        })
    }

    private next() {
        if (this.queue.length > 0 && this.activeCount < this.concurrency) {
            const task = this.queue.shift()
            task?.()
        }
    }
}

// Global limiter for validation requests
const validationQueue = new LimitQueue(5)

// ============================================
// MAIN VALIDATION FUNCTION
// ============================================

/**
 * Validates a medicine name against RxNorm and FDA databases.
 * 
 * @param name - The medicine name to validate (from OCR or manual input)
 * @returns ValidatedMedicine object with validation status
 */
export async function validateMedicineName(name: string): Promise<ValidatedMedicine> {
    console.log(`[Validator] Validating: "${name}"`)

    // Normalize the input: lowercase, trim, remove punctuation, collapse spaces
    const normalizedInput = name.toLowerCase()
        .replace(/[^\w\s]/g, " ") // Replace punctuation with space to avoid merging words
        .replace(/\s+/g, " ")     // Collapse spaces
        .trim()

    if (!normalizedInput || normalizedInput.length < 2) {
        return {
            name,
            isValid: false,
            rxcui: null,
            normalizedName: name,
            fdaData: null,
            synonyms: [],
            reason: "Medicine name too short or empty"
        }
    }

    // High-risk keywords for safety override
    const HIGH_RISK_KEYWORDS = ["acenocoumarol", "warfarin", "enoxaparin", "heparin", "dabigatran", "apixaban", "rivaroxaban", "acitrom", "clexane"]

    // Step 0: Check Indian Brand Mapper (Pre-validation)
    const indianBrand = resolveIndianBrand(normalizedInput)

    // If identified as an Indian brand, we use its generic name for further validation
    let validationQuery = normalizedInput
    let knownBrandName: string | undefined = undefined

    if (indianBrand) {
        console.log(`[Validator] 🇮🇳 Indian Brand Detected: "${name}" -> "${indianBrand.brandName}" (Generics: ${indianBrand.genericNames.join(', ')})`)
        validationQuery = indianBrand.genericNames[0].toLowerCase()
        knownBrandName = indianBrand.brandName
    }

    // Step 0.5: Generic Name Resolution (Synonyms & Spelling)
    const resolvedGeneric = await resolveGenericName(validationQuery)
    if (resolvedGeneric) {
        console.log(`[Validator] 🔄 Generic Resolved: "${validationQuery}" -> "${resolvedGeneric}"`)
        validationQuery = resolvedGeneric
    }

    // Step 1: Check RxNorm (using resolved name)
    const rxNormResult = await getRxNormData(validationQuery)

    // Step 2: Check FDA (for supplementary data like warnings, interactions)
    // NOTE: FDA presence does NOT determine validity - only RxNorm and Indian brands do
    const fdaResult = await getFDAData(validationQuery)

    // ============================================
    // STRICT VALIDATION RULE
    // ============================================
    // A medicine is VALID if and only if:
    // 1. Found in RxNorm (rxcui !== null) - Authoritative clinical drug database
    // 2. OR matched as Indian Brand - Local brand database
    //
    // FDA label presence does NOT make something a valid medicine
    // (FDA includes cosmetics, sanitizers, sunscreens, etc.)
    const isValid = rxNormResult.rxcui !== null || indianBrand !== null

    if (!isValid) {
        let reason = "Not found in RxNorm or Indian Brand database"

        if (rxNormResult.apiError) {
            reason = "Temporary validation API failure"
            console.log(`[Validator] ⚠️ API Error: "${name}" - marking as temporary failure`)
            return {
                name,
                isValid: false,
                rxcui: null,
                normalizedName: name,
                fdaData: fdaResult,
                synonyms: [],
                reason,
                apiError: true,
                apiStatus: "api_error"
            }
        }

        if (fdaResult !== null) {
            reason = "Found in FDA labels but NOT recognized as a medicine (may be a cosmetic, sanitizer, or OTC product)"
        }

        // Check if it might be a high-risk medicine based on fuzzy matching
        const potentialHighRisk = HIGH_RISK_KEYWORDS.find(keyword =>
            calculateSimilarity(normalizedInput, keyword) >= 0.6 // Loose match to catch it
        )

        if (potentialHighRisk) {
            reason = `High-risk medicine detected (${potentialHighRisk}) — manual verification required. Please check spelling carefully.`
            console.log(`[Validator] 🚨 High-Risk Override: "${name}" looks like "${potentialHighRisk}"`)
        }

        return {
            name,
            isValid: false,
            rxcui: null,
            normalizedName: name,
            fdaData: fdaResult, // Still return FDA data for info, but doesn't affect validity
            synonyms: [],
            reason
        }
    }

    console.log(`[Validator] ✅ VALID: "${name}" - ${indianBrand ? 'Indian Brand' : 'RxNorm'}`)

    // Step 4: Return validated medicine
    return {
        name: knownBrandName || name, // Use proper casing from DB if available
        isValid: true,
        rxcui: rxNormResult.rxcui,
        normalizedName: rxNormResult.normalizedName || (indianBrand ? indianBrand.genericNames[0] : name),
        fdaData: fdaResult, // Supplementary data for warnings, not for validation
        synonyms: rxNormResult.synonyms
    }
}


/**
 * Batch validate multiple medicines efficiently
 * 
 * @param names - Array of medicine names
 * @returns Array of ValidatedMedicine objects
 */
export async function validateMedicines(names: string[]): Promise<ValidatedMedicine[]> {
    console.log(`[Validator] Batch validating ${names.length} medicines...`)

    const results = await Promise.all(
        names.map(name => validationQueue.add(() => validateMedicineName(name)))
    )

    const validCount = results.filter(r => r.isValid).length
    const invalidCount = results.length - validCount

    console.log(`[Validator] Batch complete: ${validCount} valid, ${invalidCount} invalid`)

    return results
}

/**
 * Deduplicate validated medicines by rxcui
 * Medicines with the same rxcui are considered identical
 * 
 * @param medicines - Array of validated medicines
 * @returns Deduplicated array
 */
export function deduplicateMedicines(medicines: ValidatedMedicine[]): ValidatedMedicine[] {
    const seen = new Set<string>()
    const deduplicated: ValidatedMedicine[] = []

    for (const med of medicines) {
        // Skip invalid medicines
        if (!med.isValid) continue

        // Use rxcui for deduplication if available
        const key = med.rxcui || med.normalizedName.toLowerCase()

        if (!seen.has(key)) {
            seen.add(key)
            deduplicated.push(med)
        } else {
            console.log(`[Validator] Duplicate detected: "${med.name}" (same as existing entry)`)
        }
    }

    return deduplicated
}

/**
 * Strict FDA validation - checks if query matches ACTUAL medicine names
 * 
 * FDA search returns results if the word appears ANYWHERE in the label
 * (warnings, directions, packaging, company info, etc.)
 * 
 * This function ensures we ONLY accept matches where the query word
 * matches the START of a real medicine name (genericName or brandName).
 * 
 * @param query - The search query (normalized)
 * @param fdaData - FDA data (may be null)
 * @returns true if query matches actual medicine name, false otherwise
 */
export function isFDAValidName(query: string, fdaData: FDAData | null): boolean {
    if (!fdaData) {
        console.log(`[FDA Validator] No FDA data provided`)
        return false
    }

    const q = query.toLowerCase().trim()

    // Collect all real medicine names from FDA response
    const names: string[] = []

    if (fdaData.genericName) {
        names.push(...fdaData.genericName.map(n => n.toLowerCase()))
    }

    if (fdaData.brandName) {
        names.push(...fdaData.brandName.map(n => n.toLowerCase()))
    }

    if (names.length === 0) {
        console.log(`[FDA Validator] ❌ No genericName or brandName in FDA data for "${query}"`)
        return false
    }

    // Check if query matches the START of any real medicine name
    const isMatch = names.some(name => {
        // Must match from the beginning of the name
        const matches = name.startsWith(q)

        if (matches) {
            console.log(`[FDA Validator] ✅ "${query}" matches medicine name "${name}"`)
        }

        return matches
    })

    if (!isMatch) {
        console.log(`[FDA Validator] ❌ "${query}" found in label but NOT in medicine names: [${names.join(', ')}]`)
    }

    return isMatch
}

// ============================================

// RxNorm DATA FETCHING
// ============================================

/**
 * Get RxNorm data with strict validation
 */
async function getRxNormData(medicineName: string): Promise<RxNormResponse> {
    const cacheKey = getRxNormCacheKey(medicineName)

    // Check cache
    const cached = await rxNormCache.get(cacheKey)
    if (cached !== null) {
        console.log(`[RxNorm] Cache HIT: "${medicineName}"`)

        // IMPORTANT: Verify cached data is valid
        if (cached.rxcui !== null && cached.rxcui !== undefined) {
            return {
                rxcui: cached.rxcui,
                normalizedName: cached.name || medicineName,
                synonyms: cached.synonyms || []
            }
        } else {
            // Cached data is invalid (null rxcui) - return it as-is (still a valid cache entry)
            return {
                rxcui: null,
                normalizedName: medicineName,
                synonyms: []
            }
        }
    }

    // Fetch from API
    console.log(`[RxNorm] Cache MISS: "${medicineName}" - fetching...`)

    try {
        const response = await fetchWithRetry(
            `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(medicineName)}&maxEntries=1`
        )

        if (!response.ok) {
            throw new Error("RxNorm API error")
        }

        const data = await response.json()
        const candidates = data?.approximateGroup?.candidate

        if (!candidates || candidates.length === 0) {
            // No match found - cache the negative result
            console.log(`[RxNorm] ❌ No match for "${medicineName}"`)
            await rxNormCache.set(cacheKey, { rxcui: null, name: medicineName, synonyms: [] })

            return {
                rxcui: null,
                normalizedName: medicineName,
                synonyms: []
            }
        }

        const bestMatch = candidates[0]

        // Validate that the match has required fields
        if (!bestMatch.rxcui || !bestMatch.name) {
            console.log(`[RxNorm] ❌ Invalid response data`)
            await rxNormCache.set(cacheKey, { rxcui: null, name: medicineName, synonyms: [] })

            return {
                rxcui: null,
                normalizedName: medicineName,
                synonyms: []
            }
        }

        // Similarity check to prevent false positives (STRICT 90% THRESHOLD)
        const similarity = calculateSimilarity(medicineName.toLowerCase(), bestMatch.name.toLowerCase())
        const threshold = 0.9

        if (similarity < threshold) {
            console.log(`[RxNorm] ❌ Similarity too low: ${(similarity * 100).toFixed(1)}% < ${threshold * 100}%`)
            await rxNormCache.set(cacheKey, { rxcui: null, name: medicineName, synonyms: [] })

            return {
                rxcui: null,
                normalizedName: medicineName,
                synonyms: []
            }
        }

        // Valid match found
        console.log(`[RxNorm] ✅ Match: "${medicineName}" → "${bestMatch.name}" (${(similarity * 100).toFixed(1)}%)`)

        // Get synonyms
        const synonyms = await getDrugSynonyms(bestMatch.rxcui)

        // ONLY cache valid results
        const validResult = {
            rxcui: bestMatch.rxcui,
            name: bestMatch.name,
            synonyms
        }

        await rxNormCache.set(cacheKey, validResult)

        return {
            rxcui: bestMatch.rxcui,
            normalizedName: bestMatch.name,
            synonyms
        }

    } catch (error) {
        console.error(`[RxNorm] Error fetching "${medicineName}":`, error)

        return {
            rxcui: null,
            normalizedName: medicineName,
            synonyms: [],
            apiError: true
        }
    }
}

/**
 * Get drug synonyms from RxNorm
 */
async function getDrugSynonyms(rxcui: string): Promise<string[]> {
    try {
        const response = await fetch(
            `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/allrelated.json`
        )

        if (!response.ok) return []

        const data = await response.json()
        const conceptGroups = data?.allRelatedGroup?.conceptGroup || []

        const synonyms: string[] = []
        for (const group of conceptGroups) {
            if (group.conceptProperties) {
                for (const prop of group.conceptProperties) {
                    if (prop.name && !synonyms.includes(prop.name.toLowerCase())) {
                        synonyms.push(prop.name.toLowerCase())
                    }
                }
            }
        }

        return synonyms.slice(0, 10)
    } catch {
        return []
    }
}

// ============================================
// FDA DATA FETCHING
// ============================================

/**
 * Get FDA data with validation
 */
async function getFDAData(medicineName: string): Promise<FDAData | null> {
    const cacheKey = getDrugCacheKey(medicineName)

    // Check cache
    const cached = await fdaDrugCache.get(cacheKey)
    if (cached !== null) {
        console.log(`[FDA] Cache HIT: "${medicineName}"`)

        // IMPORTANT: Verify cached data is valid
        // If isUnknown=true, it means FDA didn't find it
        if (cached.isUnknown === true) {
            return null
        }

        return {
            text: cached.text || "",
            genericName: cached.details?.genericName,
            brandName: cached.details?.brandName,
            pharmClass: cached.details?.pharmClass,
            sideEffects: cached.details?.sideEffects
        }
    }

    // Fetch from FDA
    console.log(`[FDA] Cache MISS: "${medicineName}" - fetching...`)

    try {
        const cleanName = normalizeFDASearchTerm(medicineName)

        // Try brand name search first
        let response = await fetchWithRetry(
            `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(cleanName)}"&limit=1`
        )

        let data = await response.json()

        // If no results, try substance name
        if (!data.results || data.results.length === 0) {
            response = await fetchWithRetry(
                `https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${encodeURIComponent(cleanName)}"&limit=1`
            )
            data = await response.json()
        }

        if (!data.results || data.results.length === 0) {
            console.log(`[FDA] ❌ No match for "${medicineName}"`)

            // Cache the negative result
            await fdaDrugCache.set(cacheKey, {
                text: "",
                isUnknown: true
            })

            return null
        }

        // Valid FDA data found
        const result = data.results[0]

        console.log(`[FDA] ✅ Match found for "${medicineName}"`)

        const fdaData: FDAData = {
            text: extractFDAText(result),
            genericName: result.openfda?.substance_name,
            brandName: result.openfda?.brand_name,
            pharmClass: result.openfda?.pharm_class_epc || result.openfda?.pharm_class_moa,
            sideEffects: extractSideEffects(result)
        }

        // ONLY cache valid FDA data
        await fdaDrugCache.set(cacheKey, {
            text: fdaData.text,
            details: {
                genericName: fdaData.genericName,
                brandName: fdaData.brandName,
                pharmClass: fdaData.pharmClass,
                sideEffects: fdaData.sideEffects
            },
            isUnknown: false
        })

        return fdaData

    } catch (error) {
        console.error(`[FDA] Error fetching "${medicineName}":`, error)

        return null
    }
}

/**
 * Normalize medicine name for FDA search
 */
function normalizeFDASearchTerm(name: string): string {
    return name
        .replace(/\b(\d+\.?\d*\s*(?:mg|ml|mcg|g|gm|iu|u))\b/gi, "") // Remove dosages
        .replace(/\b(tablet|capsule|injection|syrup|gel|cream|ointment|drops|solution)s?\b/gi, "") // Remove forms
        .replace(/[^\w\s]/gi, " ") // Remove special chars
        .replace(/\s+/g, " ") // Collapse spaces
        .trim()
}


/**
 * Extract relevant text from FDA result
 */
function extractFDAText(result: any): string {
    const sections = [
        "drug_interactions",
        "warnings",
        "warnings_and_cautions",
        "contraindications",
        "adverse_reactions",
        "boxed_warning"
    ]

    const texts: string[] = []

    for (const section of sections) {
        if (result[section]) {
            const data = Array.isArray(result[section]) ? result[section] : [result[section]]
            texts.push(...data)
        }
    }

    return texts.join(" ").substring(0, 5000)
}

/**
 * Extract side effects from FDA data
 */
function extractSideEffects(result: any): string[] {
    const effects = new Set<string>()

    // Extract from adverse_reactions section
    if (result.adverse_reactions) {
        const text = Array.isArray(result.adverse_reactions)
            ? result.adverse_reactions.join(" ")
            : result.adverse_reactions

        // Simple extraction - can be improved
        const matches = text.match(/\b[a-z]{4,}(?:ness|ing|tion|ache|pain|itis)\b/gi) || []

        matches.forEach((match: string) => {
            if (match.length > 3 && match.length < 30) {
                effects.add(match.toLowerCase())
            }
        })
    }

    return Array.from(effects).slice(0, 15)
}


// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate Levenshtein similarity between two strings
 * Returns 0 to 1 (1 = identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    if (str1.length === 0 || str2.length === 0) return 0.0

    // Check substring match
    if (str1.includes(str2) || str2.includes(str1)) {
        const shorter = Math.min(str1.length, str2.length)
        const longer = Math.max(str1.length, str2.length)
        return shorter / longer
    }

    // Levenshtein distance
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                )
            }
        }
    }

    const distance = matrix[str2.length][str1.length]
    const maxLength = Math.max(str1.length, str2.length)

    return 1 - (distance / maxLength)
}
