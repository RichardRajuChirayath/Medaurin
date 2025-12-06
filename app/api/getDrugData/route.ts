import { type NextRequest, NextResponse } from "next/server"
import { fdaDrugCache, getDrugCacheKey } from "@/lib/cache"

interface DrugInfo {
  name: string
  fdaText: string
  genericName?: string[]
  brandName?: string[]
  pharmClass?: string[]
  sideEffects?: string[]
  isUnknown?: boolean
}

// Mapping of common Indian/International brand names to their generic counterparts
const BRAND_TO_GENERIC_MAPPING: Record<string, string> = {
  "dolo": "acetaminophen",
  "crocin": "acetaminophen",
  "calpol": "acetaminophen",
  "pan d": "pantoprazole domperidone",
  "pantop": "pantoprazole",
  "omez": "omeprazole",
  "rantac": "ranitidine",
  "combiflam": "ibuprofen paracetamol",
  "saridon": "paracetamol propyphenazone caffeine",
  "meftal": "mefenamic acid",
  "ascoril": "terbutaline bromhexine guaifenesin",
  "azithral": "azithromycin",
  "augmentin": "amoxicillin clavulanate",
  "montek": "montelukast",
  "zincovit": "multivitamin zinc",
  "shelcal": "calcium vitamin d3",
  "limcee": "vitamin c",
  "becosules": "b complex vitamin c",
  "allegra": "fexofenadine",
  "cetrizine": "cetirizine",
  "okacet": "cetirizine",
  "sinarest": "paracetamol phenylephrine chlorpheniramine",
  "wikoryl": "paracetamol phenylephrine chlorpheniramine",
  "cheston cold": "cetirizine paracetamol phenylephrine",
  "maftal spas": "mefenamic acid dicyclomine",
  "cyclopam": "dicyclomine paracetamol",
  "zerodol": "aceclofenac",
  "hifenac": "aceclofenac",
  "ultracet": "tramadol paracetamol",
  "voveran": "diclofenac",
  "volini": "diclofenac",
  "gelusil": "aluminum hydroxide magnesium hydroxide simethicone",
  "digene": "aluminum hydroxide magnesium hydroxide",
  "mucolite": "ambroxol",
  "grilinctus": "dextromethorphan chlorpheniramine guaifenesin",
  "benadryl": "diphenhydramine",
  "corex": "chlorpheniramine codeine",
  "thyronorm": "thyroxine",
  "eltroxin": "thyroxine",
  "glycomet": "metformin",
  "gluconorm": "metformin glimepiride",
  "januvia": "sitagliptin",
  "galvus": "vildagliptin",
  "istamet": "metformin sitagliptin",
  "telma": "telmisartan",
  "telmikind": "telmisartan",
  "amlong": "amlodipine",
  "stamlo": "amlodipine",
  "ciar": "ciprofloxacin",
  "ciplox": "ciprofloxacin",
  "taxim": "cefotaxime",
  "monocef": "ceftriaxone",
  "zifi": "cefixime",
  "clamp": "amoxicillin clavulanate",
  "moxikind": "amoxicillin",
  "norflox": "norfloxacin",
  "flagyl": "metronidazole",
  "metrogyl": "metronidazole",
  "sporidex": "cephalexin",
  "phexin": "cephalexin",
  "betadine": "povidone iodine",
  "soframycin": "framycetin",
  "t-bact": "mupirocin",
  "augmentin 625": "amoxicillin clavulanate",
  "azithral 500": "azithromycin",
  "dolo 650": "acetaminophen",
  "crocin 650": "acetaminophen",
}

export async function POST(request: NextRequest) {
  try {
    const { medicines } = await request.json()

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json({ error: "No medicines provided" }, { status: 400 })
    }

    const drugData: DrugInfo[] = []
    const startTime = Date.now()

    // Fetch FDA data for each medicine (with caching)
    for (const medicine of medicines) {
      const cacheKey = getDrugCacheKey(medicine)

      // Check cache first
      const cachedData = await fdaDrugCache.get(cacheKey)

      if (cachedData) {
        console.log(`[FDA] Cache HIT for ${medicine}`)
        drugData.push({
          name: medicine,
          fdaText: cachedData.text,
          genericName: cachedData.details?.genericName,
          brandName: cachedData.details?.brandName,
          pharmClass: cachedData.details?.pharmClass,
          sideEffects: cachedData.details?.sideEffects,
          isUnknown: cachedData.isUnknown,
        })
      } else {
        console.log(`[FDA] Cache MISS for ${medicine}, fetching from API...`)
        const data = await fetchFDAData(medicine)

        // Store in cache
        await fdaDrugCache.set(cacheKey, data)

        drugData.push({
          name: medicine,
          fdaText: data.text,
          genericName: data.details?.genericName,
          brandName: data.details?.brandName,
          pharmClass: data.details?.pharmClass,
          sideEffects: data.details?.sideEffects,
          isUnknown: data.isUnknown,
        })
      }
    }

    const duration = Date.now() - startTime
    console.log(`[FDA] Total fetch time: ${duration}ms for ${medicines.length} medicines`)

    return NextResponse.json(drugData)
  } catch (error) {
    console.error("Get drug data error:", error)
    return NextResponse.json({ error: "Failed to fetch drug data" }, { status: 500 })
  }
}

function normalizeMedicineName(name: string): string {
  // Remove common suffixes and extra words from medicine names to improve search accuracy
  let cleanedName = name
    .replace(/\b(fast release|extended release|sustained release|controlled release|tablets|tablet|capsule|capsules|injection|ointment|cream|syrup|suspension|drops|gel|solution|liquid|oral|iv|im)\b/gi, "")
    .replace(/\b(\d+\.?\d*\s*(?:mg|ml|mcg|g|gm|iu|u))\b/gi, "") // Remove dosages like 500mg, 0.5ml
    .replace(/[^\w\s]/gi, " ") // Replace special characters with space
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim()

  // Specific fix for "Dolo 650" -> "Dolo" (handled by mapping, but good for others)
  // If the name is very short (e.g. "D"), keep original or handle error
  return cleanedName.length > 1 ? cleanedName : name
}

function getFallbackSideEffects(medicineName: string): string[] {
  // Common side effects for popular medicines (for demo when FDA data unavailable)
  const fallbackData: Record<string, string[]> = {
    "aspirin": ["Nausea", "Upset stomach", "Heartburn", "Drowsiness", "Headache"],
    "ibuprofen": ["Nausea", "Vomiting", "Diarrhea", "Constipation", "Dizziness", "Headache"],
    "paracetamol": ["Nausea", "Rash", "Headache"],
    "acetaminophen": ["Nausea", "Rash", "Headache"],
    "metformin": ["Nausea", "Vomiting", "Diarrhea", "Abdominal pain", "Loss of appetite"],
    "dolo": ["Nausea", "Rash", "Headache"],
    "crocin": ["Nausea", "Rash", "Headache"],
    "combiflam": ["Nausea", "Vomiting", "Dizziness", "Heartburn"],
  }

  const normalized = medicineName.toLowerCase().trim()
  return fallbackData[normalized] || []
}

function extractSideEffectsFromText(text: string): string[] {
  if (!text) return []

  const lowerText = text.toLowerCase()
  const effects = new Set<string>()

  // Regex to find list items (common in FDA labels)
  const listItemRegex = /^(?:[•*-]|\d+\.)\s+(.+)/gm

  let match
  while ((match = listItemRegex.exec(lowerText)) !== null) {
    const effect = match[1]
      .trim()
      .split(/[,;]/)[0] // Take the primary effect
      .replace(/\(see warnings\)/g, "")
      .replace(/and other/g, "")
      .replace(/[^\w\s]/gi, "") // Clean special chars
      .trim()

    if (effect.length > 2 && effect.length < 50) {
      effects.add(effect.charAt(0).toUpperCase() + effect.slice(1))
    }
  }

  return Array.from(effects).slice(0, 15)
}

async function fetchFDAData(medicineName: string): Promise<{ text: string; details?: any; isUnknown?: boolean }> {
  try {
    const normalizedName = normalizeMedicineName(medicineName)
    const lowerName = normalizedName.toLowerCase()

    // 1. Check Manual Mapping (Indian Brands, etc.)
    let searchName = normalizedName
    let isMappedToGeneric = false
    if (BRAND_TO_GENERIC_MAPPING[lowerName]) {
      searchName = BRAND_TO_GENERIC_MAPPING[lowerName]
      isMappedToGeneric = true
      console.log(`[FDA] ✓ Mapped Indian brand "${medicineName}" to generic: "${searchName}"`)
    } else {
      console.log(`[FDA] Searching for: ${medicineName} (normalized: ${normalizedName})`)
    }

    // 2. Search FDA - use substance_name for mapped generics, brand_name otherwise
    let response
    let data

    if (isMappedToGeneric) {
      // For Indian brands mapped to generics, search by substance_name directly
      console.log(`[FDA] Searching by substance_name (generic): "${searchName}"`)
      response = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${encodeURIComponent(searchName)}"&limit=1`,
      )
      data = await response.json()
      console.log(`[FDA] ✓ Substance name search: ${data.results?.length || 0} results`)
    } else {
      // For non-mapped medicines, try brand name first
      console.log(`[FDA] Searching by brand_name: "${searchName}"`)
      response = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(searchName)}"&limit=1`,
      )
      data = await response.json()
      console.log(`[FDA] Brand name search: ${data.results?.length || 0} results`)

      // 3. If no results, try substance name as fallback
      if (!data.results || data.results.length === 0) {
        console.log(`[FDA] Trying substance name search for "${searchName}"`)
        response = await fetch(
          `https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${encodeURIComponent(searchName)}"&limit=1`,
        )
        data = await response.json()
        console.log(`[FDA] Substance name search: ${data.results?.length || 0} results`)
      }
    }

    if (!data.results || data.results.length === 0) {
      // Provide fallback side effects for common medicines when FDA data is unavailable
      const fallbackSideEffects = getFallbackSideEffects(medicineName.toLowerCase())

      return {
        text: `No FDA data found for ${medicineName}. This might be a local brand or supplement not in the FDA database.`,
        details: fallbackSideEffects.length > 0 ? {
          sideEffects: fallbackSideEffects
        } : undefined,
        isUnknown: true
      }
    }

    const result = data.results[0]
    const warnings: string[] = []
    const allSideEffects = new Set<string>()

    const fieldsToCheck = [
      "drug_interactions",
      "warnings",
      "warnings_and_cautions",
      "contraindications",
      "adverse_reactions",
      "boxed_warning"
    ]

    fieldsToCheck.forEach(field => {
      if (result[field]) {
        const fieldData = Array.isArray(result[field]) ? result[field] : [result[field]]
        warnings.push(...fieldData)

        // Extract side effects from each relevant field
        const text = fieldData.join(" ")
        const extracted = extractSideEffectsFromText(text)
        extracted.forEach(effect => allSideEffects.add(effect))

        console.log(`[FDA] Found ${field}: ${text.substring(0, 100)}...`)
      }
    })

    const fullText = warnings.join(" ").substring(0, 5000)
    console.log(`[FDA] Total FDA text length for ${medicineName}: ${fullText.length} characters`)

    const finalSideEffects = Array.from(allSideEffects)
    console.log(`[FDA] Extracted ${finalSideEffects.length} side effects for ${medicineName}:`, finalSideEffects)

    return {
      text: fullText,
      details: {
        genericName: result.openfda?.substance_name,
        brandName: result.openfda?.brand_name,
        pharmClass: result.openfda?.pharm_class_epc || result.openfda?.pharm_class_moa,
        sideEffects: finalSideEffects.length > 0 ? finalSideEffects : undefined,
      },
      isUnknown: false
    }
  } catch (error) {
    console.error(`Error fetching FDA data for ${medicineName}:`, error)
    return {
      text: `Unable to fetch data for ${medicineName}`,
      isUnknown: true
    }
  }
}
