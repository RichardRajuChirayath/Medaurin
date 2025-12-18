/**
 * GENERIC RESOLVER MODULE
 * 
 * Handles normalization of international generic names to US RxNorm standards.
 * 1. Checks local synonym map (e.g., Paracetamol -> Acetaminophen)
 * 2. Uses RxNorm spelling suggestion API for fuzzy matching/correction
 */

const GENERIC_SYNONYMS: Record<string, string> = {
    // Pain/Fever
    "paracetamol": "acetaminophen",
    "pcm": "acetaminophen",

    // Antibiotics
    "amoxycillin": "amoxicillin",
    "sulphamethoxazole": "sulfamethoxazole",
    "cephalexin": "cefalexin",

    // Cardiovascular
    "adrenaline": "epinephrine",
    "noradrenaline": "norepinephrine",
    "frusemide": "furosemide",
    "lignocaine": "lidocaine",

    // GI
    "omeprazol": "omeprazole",
    "pantopraz": "pantoprazole",

    // Vitamins/Supplements
    "vitamin b1": "thiamine",
    "vitamin b2": "riboflavin",
    "vitamin b3": "niacin",
    "vitamin b9": "folic acid",
    "vitamin b12": "cyanocobalamin",
    "vitamin c": "ascorbic acid"
};

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
 * Resolves a generic medicine name to its standard US/RxNorm spelling.
 * 
 * @param query The input generic name (e.g., "Paracetamol", "Amoxycillin")
 * @returns The resolved name (e.g., "Acetaminophen") or null if no resolution found
 */
export async function resolveGenericName(query: string): Promise<string | null> {
    const normalized = query.toLowerCase().trim();

    // 1. Check Local Synonym Map (Fastest)
    if (GENERIC_SYNONYMS[normalized]) {
        console.log(`[GenericResolver] Local Map: "${query}" -> "${GENERIC_SYNONYMS[normalized]}"`);
        return GENERIC_SYNONYMS[normalized];
    }

    // Check for partial matches in synonyms (e.g. "cipro" -> "ciprofloxacin")
    // Use strictly for known abbreviations to act safely
    // (Skipping for now to avoid false positives unless requested)

    // 2. Check RxNorm Spelling Suggestion API
    try {
        // Only call for words that look like they might be misspelled medicines (length > 3)
        if (normalized.length < 4) return null;

        console.log(`[GenericResolver] API Check: Fetching suggestions for "${query}"...`);
        const response = await fetchWithRetry(
            `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(normalized)}`
        );

        if (!response.ok) return null;

        const data = await response.json();
        const suggestions = data.suggestionGroup?.suggestionList?.suggestion;

        if (suggestions && suggestions.length > 0) {
            // Return top suggestion
            const bestMatch = suggestions[0];
            console.log(`[GenericResolver] API Match: "${query}" -> "${bestMatch}"`);
            return bestMatch;
        }

    } catch (error) {
        console.error(`[GenericResolver] Error fetching suggestions: ${error}`);
    }

    return null;
}
