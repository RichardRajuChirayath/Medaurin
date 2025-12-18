import drugsData from './indian-drugs.json';

interface IndianDrug {
    brand: string;
    generics: string[];
}

export interface BrandResolution {
    isBrand: boolean;
    brandName: string;
    genericNames: string[];
    confidence: number;
}

/**
 * Resolves an Indian brand name to its generic ingredients using fuzzy matching.
 * 
 * @param query The medicine name to resolve (e.g., "Dolo", "Calpol 650")
 * @returns BrandResolution object if a match is found, null otherwise
 */
export function resolveIndianBrand(query: string): BrandResolution | null {
    const normalizedQuery = query.toLowerCase().trim();

    // Remove dosage strength (e.g., "Dolo 650" -> "Dolo")
    // Keep the original query if it's short to avoid over-cleaning
    const cleanQuery = normalizedQuery.replace(/\s+\d+(\.\d+)?\s*(mg|g|ml|mcg)?$/i, "").trim();
    const searchTerm = cleanQuery.length > 2 ? cleanQuery : normalizedQuery;

    let bestMatch: IndianDrug | null = null;
    let maxSimilarity = 0;

    for (const drug of drugsData) {
        const brandName = drug.brand.toLowerCase();

        // 1. Exact Match
        if (brandName === searchTerm) {
            return {
                isBrand: true,
                brandName: drug.brand,
                genericNames: drug.generics,
                confidence: 1.0
            };
        }

        // 2. Fuzzy Match
        const similarity = calculateSimilarity(searchTerm, brandName);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestMatch = drug;
        }
    }

    // Threshold for accepting a fuzzy match
    // Higher threshold (0.8) to prevent false positives like "Dolo" matching "Pol"
    if (bestMatch && maxSimilarity >= 0.8) {
        console.log(`[BrandMapper] Mapped "${query}" -> "${bestMatch.brand}" (Generics: ${bestMatch.generics.join(', ')}) - Score: ${maxSimilarity.toFixed(2)}`);
        return {
            isBrand: true,
            brandName: bestMatch.brand,
            genericNames: bestMatch.generics,
            confidence: maxSimilarity
        };
    }

    return null;
}

/**
 * Calculate Levenshtein similarity between two strings
 * Returns 0 to 1 (1 = identical)
 * Identical to the one in medicine-validator.ts, duplicated here to keep modules independent if needed
 * or we could export/import. 
 */
function calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const shorter = Math.min(str1.length, str2.length);
    const longer = Math.max(str1.length, str2.length);

    // If one contains the other, boost the score (helps with substring matches)
    if (str1.includes(str2) || str2.includes(str1)) {
        return shorter / longer;
    }

    // Levenshtein distance
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    const distance = matrix[str2.length][str1.length];
    return 1 - (distance / longer);
}
