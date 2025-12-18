// Advanced Drug Interaction Service
// Uses RxNorm for drug normalization and NIH Drug Interaction API for accurate data

import {
    rxNormCache,
    nihInteractionCache,
    getRxNormCacheKey,
    getInteractionCacheKey
} from "./cache"
import { resolveGenericName } from "./generic-resolver"
import { resolveIndianBrand } from "./brand-mapper"

interface RxNormConcept {
    rxcui: string
    name: string
    tty: string // term type
}

interface DrugInteraction {
    severity: "high" | "moderate" | "low" | "unknown"
    description: string
    source: string
    minConcept?: { rxcui: string; name: string }[]
}

interface NormalizedDrug {
    originalName: string
    rxcui: string | null
    normalizedName: string
    synonyms: string[]
    apiError?: boolean
}

/**
 * Fetch with retry logic (3 attempts, 200ms delay)
 */
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url)
            if (response.ok) return response

            if (response.status === 429 || response.status >= 500) {
                await new Promise(r => setTimeout(r, 200))
                continue
            }
            return response
        } catch (error) {
            if (i === retries - 1) throw error
            await new Promise(r => setTimeout(r, 200))
        }
    }
    throw new Error(`Failed to fetch ${url}`)
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
    // Handle edge cases
    if (str1 === str2) return 1.0
    if (str1.length === 0 || str2.length === 0) return 0.0

    // Check if one string contains the other (partial match)
    if (str1.includes(str2) || str2.includes(str1)) {
        const shorter = Math.min(str1.length, str2.length)
        const longer = Math.max(str1.length, str2.length)
        return shorter / longer
    }

    // Calculate Levenshtein distance
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
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                )
            }
        }
    }

    const distance = matrix[str2.length][str1.length]
    const maxLength = Math.max(str1.length, str2.length)

    // Convert distance to similarity (0 to 1)
    return 1 - (distance / maxLength)
}


/**
 * Normalize a drug name using RxNorm API
 * Returns the RxCUI (unique identifier) and standardized name
 */
export async function normalizeDrugName(drugName: string): Promise<NormalizedDrug> {
    // 1. Strict Normalization (Pipeline)
    const normalizedInput = drugName
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()

    // 2. Check Indian Brand Mapper (Pre-validation)
    // This handles Dolo, Crocin, etc. by mapping to "acetaminophen" or similar
    const indianBrand = resolveIndianBrand(normalizedInput)
    let validationQuery = normalizedInput

    if (indianBrand) {
        console.log(`[Interaction] 🇮🇳 Indian Brand Detected: "${normalizedInput}" -> "${indianBrand.genericNames[0]}"`)
        validationQuery = indianBrand.genericNames[0].toLowerCase()
    }

    // 3. Resolve Generics (e.g. Paracetamol -> Acetaminophen)
    const resolvedGeneric = await resolveGenericName(validationQuery)
    const finalQuery = resolvedGeneric || validationQuery

    // Check persistent cache first using the FINAL query
    const cacheKey = getRxNormCacheKey(finalQuery)

    // Check persistent cache first
    const cachedData = await rxNormCache.get(cacheKey)
    if (cachedData) {
        console.log(`[RxNorm] Cache HIT for ${drugName}`)
        return {
            originalName: drugName,
            rxcui: cachedData.rxcui || null,
            normalizedName: cachedData.name || finalQuery,
            synonyms: cachedData.synonyms || []
        }
    }

    try {
        console.log(`[RxNorm] Cache MISS for ${finalQuery}, fetching from API...`)

        // RxNorm approximateTerm API for fuzzy matching
        const response = await fetchWithRetry(
            `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(finalQuery)}&maxEntries=1`
        )

        if (!response.ok) {
            throw new Error("RxNorm API error")
        }

        const data = await response.json()
        const candidates = data?.approximateGroup?.candidate

        if (candidates && candidates.length > 0) {
            const bestMatch = candidates[0]

            // Validate that the match has required fields
            if (!bestMatch || !bestMatch.rxcui || !bestMatch.name) {
                console.log(`[RxNorm] ❌ Invalid response data (missing rxcui or name)`)
                await rxNormCache.set(cacheKey, { rxcui: null, name: drugName, synonyms: [] })
                return {
                    originalName: drugName,
                    rxcui: null,
                    normalizedName: drugName,
                    synonyms: []
                }
            }

            // STRICT SIMILARITY CHECK: Prevent false positives like "hi" -> "tolnaftate"
            const similarity = calculateSimilarity(finalQuery, bestMatch.name.toLowerCase())
            const minSimilarity = 0.9

            console.log(`[RxNorm] Match found: "${finalQuery}" -> "${bestMatch.name}" (similarity: ${(similarity * 100).toFixed(1)}%)`)

            if (similarity < minSimilarity) {
                console.log(`[RxNorm] ❌ REJECTED: Similarity ${(similarity * 100).toFixed(1)}% is below threshold ${(minSimilarity * 100)}%`)
                await rxNormCache.set(cacheKey, { rxcui: null, name: finalQuery, synonyms: [] })
                return {
                    originalName: drugName,
                    rxcui: null,
                    normalizedName: finalQuery,
                    synonyms: []
                }
            }

            console.log(`[RxNorm] ✅ ACCEPTED: Match is sufficiently similar`)

            const synonyms = await getDrugSynonyms(bestMatch.rxcui)

            const result: NormalizedDrug = {
                originalName: drugName,
                rxcui: bestMatch.rxcui,
                normalizedName: bestMatch.name || finalQuery,
                synonyms
            }

            await rxNormCache.set(cacheKey, {
                rxcui: result.rxcui,
                name: result.normalizedName,
                synonyms: result.synonyms
            })

            return result
        }
    } catch (error) {
        console.error(`RxNorm lookup failed for ${finalQuery}:`, error)
        return {
            originalName: drugName,
            rxcui: null,
            normalizedName: finalQuery,
            synonyms: [],
            apiError: true
        }
    }

    // Cache the miss too to avoid repeated lookups
    await rxNormCache.set(cacheKey, { rxcui: null, name: finalQuery, synonyms: [] })

    return {
        originalName: drugName,
        rxcui: null,
        normalizedName: finalQuery,
        synonyms: []
    }
}

/**
 * Get drug synonyms using RxNorm
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

        return synonyms.slice(0, 10) // Limit to 10 synonyms
    } catch {
        return []
    }
}

/**
 * Get drug interactions from NIH Drug Interaction API
 * This uses the RxCUI to find known interactions
 * Results are cached for performance
 */
export async function getDrugInteractionsFromNIH(rxcuis: string[]): Promise<DrugInteraction[]> {
    if (rxcuis.length < 2) return []

    const cacheKey = getInteractionCacheKey(rxcuis)

    // Check cache first
    const cachedData = await nihInteractionCache.get(cacheKey)
    if (cachedData) {
        console.log(`[NIH] Cache HIT for interaction query`)
        return cachedData
    }

    try {
        console.log(`[NIH] Cache MISS, fetching from API...`)

        // NIH Drug Interaction API endpoint
        const rxcuiList = rxcuis.filter(Boolean).join("+")
        const response = await fetchWithRetry(
            `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuiList}`
        )

        if (!response.ok) {
            throw new Error("NIH Interaction API error")
        }

        const data = await response.json()
        const interactions: DrugInteraction[] = []

        // Parse full interaction type groups
        const interactionTypeGroups = data?.fullInteractionTypeGroup || []

        for (const group of interactionTypeGroups) {
            const interactionTypes = group?.fullInteractionType || []

            for (const interactionType of interactionTypes) {
                const interactionPairs = interactionType?.interactionPair || []

                for (const pair of interactionPairs) {
                    const severity = classifyNIHSeverity(pair.severity || pair.description)

                    interactions.push({
                        severity,
                        description: pair.description || "Potential interaction detected",
                        source: group.sourceName || "NIH",
                        minConcept: interactionType.minConcept
                    })
                }
            }
        }

        // Cache the results
        await nihInteractionCache.set(cacheKey, interactions)
        console.log(`[NIH] Cached ${interactions.length} interactions`)

        return interactions
    } catch (error) {
        console.error("NIH Drug Interaction API error:", error)
        return []
    }
}

/**
 * Classify NIH severity into our severity levels
 */
function classifyNIHSeverity(severityText: string): "high" | "moderate" | "low" | "unknown" {
    const text = (severityText || "").toLowerCase()

    // High severity keywords
    const highKeywords = [
        "contraindicated", "avoid", "do not use", "serious", "severe",
        "life-threatening", "fatal", "death", "black box", "major",
        "serotonin syndrome", "qt prolongation", "bleeding", "respiratory depression"
    ]

    // Moderate severity keywords
    const moderateKeywords = [
        "moderate", "caution", "monitor", "may increase", "may decrease",
        "adjustment", "significant", "important"
    ]

    for (const keyword of highKeywords) {
        if (text.includes(keyword)) return "high"
    }

    for (const keyword of moderateKeywords) {
        if (text.includes(keyword)) return "moderate"
    }

    if (text.includes("minor") || text.includes("low")) return "low"

    return "unknown"
}

/**
 * Advanced interaction analysis combining multiple sources
 */
export async function analyzeInteractionsAdvanced(
    medicines: Array<{ name: string; fdaText: string; genericName?: string[] }>
): Promise<DrugInteraction[]> {
    const allInteractions: DrugInteraction[] = []

    // Step 1: Normalize all drug names
    console.log("[Advanced Analysis] Normalizing drug names...")
    const normalizedDrugs = await Promise.all(
        medicines.map(m => normalizeDrugName(m.genericName?.[0] || m.name))
    )

    console.log("[Advanced Analysis] Normalized drugs:", normalizedDrugs.map(d => ({
        original: d.originalName,
        rxcui: d.rxcui,
        normalized: d.normalizedName
    })))

    // Step 2: Get interactions from NIH API using RxCUIs
    const validRxcuis = normalizedDrugs
        .map(d => d.rxcui)
        .filter((rxcui): rxcui is string => rxcui !== null)

    if (validRxcuis.length >= 2) {
        console.log("[Advanced Analysis] Fetching NIH interactions for RxCUIs:", validRxcuis)
        const nihInteractions = await getDrugInteractionsFromNIH(validRxcuis)

        console.log(`[Advanced Analysis] Found ${nihInteractions.length} NIH interactions`)
        allInteractions.push(...nihInteractions)
    }

    return allInteractions
}

/**
 * Get drug class information from RxNorm
 */
export async function getDrugClass(rxcui: string): Promise<string[]> {
    try {
        const response = await fetch(
            `https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=${rxcui}`
        )

        if (!response.ok) return []

        const data = await response.json()
        const classInfo = data?.rxclassDrugInfoList?.rxclassDrugInfo || []

        return classInfo.map((c: any) => c.rxclassMinConceptItem?.className).filter(Boolean)
    } catch {
        return []
    }
}

/**
 * Get disease contraindications via RxClass API (MEDRT)
 * https://rxnav.nlm.nih.gov/REST/rxclass/class/byDrugName.json?drugName={name}&relaSource=MEDRT&relas=CI_with
 * 
 * Returns a list of diseases that are contraindicated with this drug.
 */
export async function getDiseaseContraindications(drugName: string): Promise<string[]> {
    try {
        // Use RxClass API to find diseases linked via "CI_with" (Contraindicated With)
        const response = await fetchWithRetry(
            `https://rxnav.nlm.nih.gov/REST/rxclass/class/byDrugName.json?drugName=${encodeURIComponent(drugName)}&relaSource=MEDRT&relas=CI_with`
        )

        if (!response.ok) return []

        const data = await response.json()
        const infoList = data?.rxclassDrugInfoList?.rxclassDrugInfo || []

        const diseases: string[] = []
        for (const info of infoList) {
            // Filter strictly for DISEASE class types to avoid noise
            if (info.rxclassMinConceptItem?.classType === "DISEASE") {
                diseases.push(info.rxclassMinConceptItem.className)
            }
        }

        // Dedup
        return Array.from(new Set(diseases))
    } catch (error) {
        console.error(`RxClass API error for ${drugName}:`, error)
        return []
    }
}
