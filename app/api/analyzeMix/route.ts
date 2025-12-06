import { type NextRequest, NextResponse } from "next/server"
import {
  normalizeDrugName,
  getDrugInteractionsFromNIH,
  getDrugClass
} from "@/lib/drug-interaction-service"

interface MedicineWithFDA {
  name: string
  fdaText: string
  genericName?: string[]
  brandName?: string[]
  pharmClass?: string[]
  sideEffects?: string[]
  isUnknown?: boolean
}

interface Interaction {
  from: string
  to: string
  severity: "high" | "moderate" | "low" | "unknown"
  description: string
  source?: string
}

interface AnalysisResult {
  status: "safe" | "caution" | "danger"
  score: number
  medicines: string[]
  interactions: Interaction[]
  recommendations: string[]
  medicineDetails?: Array<{
    name: string
    fdaText: string
    genericName?: string[]
    brandName?: string[]
    pharmClass?: string[]
    sideEffects?: string[]
    isUnknown?: boolean
  }>
}

export async function POST(request: NextRequest) {
  try {
    const { medicines } = await request.json()

    console.log("Received medicines for analysis:", JSON.stringify(medicines, null, 2))

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json({ error: "No medicines provided" }, { status: 400 })
    }



    // Step 1: Normalize drug names using RxNorm API
    // CRITICAL: Use the USER'S INPUT (m.name), NOT the FDA generic name
    // This ensures similarity check validates what the user actually typed
    console.log("[Analysis] Normalizing drug names with RxNorm...")
    const normalizedDrugs = await Promise.all(
      medicines.map(async (m: MedicineWithFDA) => {
        // Always normalize based on USER INPUT to prevent bypassing similarity check
        const normalized = await normalizeDrugName(m.name)
        return { ...m, rxcui: normalized.rxcui, normalizedName: normalized.normalizedName }
      })
    )
    console.log("[Analysis] Normalized:", normalizedDrugs.map(d => ({ userInput: d.name, rxcui: d.rxcui, isUnknown: d.isUnknown })))

    // LENIENT CHECK: A medicine is unrecognized ONLY if:
    // It's NOT found in RxNorm (no rxcui) AND NOT found in FDA (isUnknown = true)
    // This allows medicines that exist in ANY database to be analyzed
    const unrecognizedMedicines = normalizedDrugs.filter(d => {
      const notInRxNorm = !d.rxcui
      const notInFDA = d.isUnknown === true

      console.log(`[Validation] ${d.name}: RxNorm=${d.rxcui || 'NOT FOUND'}, FDA=${notInFDA ? 'NOT FOUND' : 'FOUND'}`)

      // Only reject if it's not in BOTH databases
      const notFoundAnywhere = notInRxNorm && notInFDA

      if (notFoundAnywhere) {
        console.log(`[Validation] ❌ ${d.name} not found in ANY database`)
      } else if (d.rxcui) {
        console.log(`[Validation] ✅ ${d.name} found in RxNorm`)
      } else if (!notInFDA) {
        console.log(`[Validation] ✅ ${d.name} found in FDA`)
      }

      return notFoundAnywhere
    }).map(d => d.name)

    if (unrecognizedMedicines.length > 0) {
      console.log(`[Analysis] ❌ UNRECOGNIZED medicines found: ${unrecognizedMedicines.join(", ")}`)

      return NextResponse.json({
        status: "unknown",
        score: 0,
        medicines: medicines.map((m: MedicineWithFDA) => m.name),
        interactions: [],
        recommendations: [
          `⚠️ The following medicine(s) were NOT RECOGNIZED in our medical databases (RxNorm, FDA): ${unrecognizedMedicines.join(", ")}.`,
          "We cannot perform a safety analysis without valid medicine names.",
          "Please:",
          "• Check the spelling carefully",
          "• Try entering the generic/scientific name (e.g., 'Acetaminophen' instead of brand names)",
          "• Ensure you're entering actual medicine names, not random text",
          "• For Indian brands, try common names like 'Dolo', 'Crocin', 'Paracetamol', etc."
        ],
        medicineDetails: medicines.map((m: MedicineWithFDA) => ({
          name: m.name,
          fdaText: m.fdaText,
          genericName: m.genericName,
          brandName: m.brandName,
          pharmClass: m.pharmClass,
          sideEffects: m.sideEffects,
          isUnknown: m.isUnknown,
        })),
        unrecognized: unrecognizedMedicines
      })
    }

    console.log(`[Analysis] ✅ All medicines validated successfully`)

    // Check if all medicines are actually the same drug
    if (medicines.length >= 2) {
      const allSameDrug = medicines.every((m: MedicineWithFDA, idx: number) => {
        if (idx === 0) return true
        return areSameDrug(medicines[0], m)
      })

      if (allSameDrug) {
        console.log(`[Analysis] ℹ️ All entered medicines are the SAME drug: ${medicines.map((m: MedicineWithFDA) => m.name).join(', ')}`)

        return NextResponse.json({
          status: "safe",
          score: 0,
          medicines: medicines.map((m: MedicineWithFDA) => m.name),
          interactions: [],
          recommendations: [
            `All the medicines you entered (${medicines.map((m: MedicineWithFDA) => m.name).join(', ')}) are actually THE SAME DRUG.`,
            `They contain the same active ingredient: ${medicines[0].genericName?.[0] || medicines[0].name}.`,
            "Taking multiple versions of the same medicine can lead to overdose.",
            "Please consult your doctor before taking more than one form of the same medication."
          ],
          medicineDetails: medicines.map((m: MedicineWithFDA) => ({
            name: m.name,
            fdaText: m.fdaText,
            genericName: m.genericName,
            brandName: m.brandName,
            pharmClass: m.pharmClass,
            sideEffects: m.sideEffects,
            isUnknown: m.isUnknown,
          })),
          sameDrugDetected: true
        })
      }
    }

    // Handle single medicine case (AFTER validation)
    if (medicines.length === 1) {
      const singleMedicineResult: AnalysisResult = {
        status: "safe",
        score: 0,
        medicines: medicines.map((m: MedicineWithFDA) => m.name),
        interactions: [],
        recommendations: [
          "No interactions to analyze for a single medicine.",
          "Always follow the dosing instructions provided with your medicine.",
          "Inform your doctor of all medicines you are taking, including over-the-counter drugs and supplements.",
        ],
      }
      return NextResponse.json(singleMedicineResult)
    }

    // Step 2: Get interactions from NIH Drug Interaction API
    const rxcuis = normalizedDrugs.map(d => d.rxcui).filter((r): r is string => r !== null)
    let nihInteractions: Interaction[] = []

    if (rxcuis.length >= 2) {
      console.log("[Analysis] Fetching NIH drug interactions...")
      const nihData = await getDrugInteractionsFromNIH(rxcuis)

      // Convert NIH interactions to our format
      nihInteractions = nihData.map(ni => ({
        from: ni.minConcept?.[0]?.name || medicines[0].name,
        to: ni.minConcept?.[1]?.name || medicines[1].name,
        severity: ni.severity,
        description: ni.description,
        source: `NIH (${ni.source})`
      }))
      console.log(`[Analysis] Found ${nihInteractions.length} NIH interactions`)
    }

    // Step 3: Run local analysis (keyword + known combinations)
    const localInteractions = analyzeInteractions(medicines)
    console.log(`[Analysis] Found ${localInteractions.length} local interactions`)

    // Step 4: Merge interactions (avoid duplicates, prefer NIH data)
    const allInteractions = mergeInteractions(nihInteractions, localInteractions)
    console.log(`[Analysis] Total merged interactions: ${allInteractions.length}`)

    // Calculate risk score using advanced multi-factor analysis
    const riskBreakdown = calculateAdvancedRiskScore(allInteractions, medicines)
    const score = riskBreakdown.finalScore
    console.log(`[Analysis] Risk breakdown:`, riskBreakdown)

    // Determine status
    const status = determineStatus(score)

    // Generate recommendations with risk factors
    const recommendations = generateRecommendations(status, allInteractions, medicines)

    // Add risk factors to recommendations
    if (riskBreakdown.riskFactors.length > 0) {
      recommendations.push(...riskBreakdown.riskFactors.filter(f =>
        !recommendations.some(r => r.includes(f))
      ))
    }

    const result = {
      status,
      score,
      medicines: medicines.map((m: MedicineWithFDA) => m.name),
      interactions: allInteractions,
      recommendations,
      medicineDetails: medicines.map((m: MedicineWithFDA) => ({
        name: m.name,
        fdaText: m.fdaText,
        genericName: m.genericName,
        brandName: m.brandName,
        pharmClass: m.pharmClass,
        sideEffects: m.sideEffects,
        isUnknown: m.isUnknown,
      })),
      riskBreakdown: {
        interactionScore: riskBreakdown.interactionScore,
        polypharmacyScore: riskBreakdown.polypharmacyScore,
        drugClassScore: riskBreakdown.drugClassScore,
        cumulativeRisk: riskBreakdown.cumulativeRiskScore,
        multiplier: riskBreakdown.clinicalSignificanceMultiplier,
        factors: riskBreakdown.riskFactors
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze medicines" }, { status: 500 })
  }
}

// Merge NIH and local interactions, avoiding duplicates
function mergeInteractions(nihInteractions: Interaction[], localInteractions: Interaction[]): Interaction[] {
  const merged: Interaction[] = [...nihInteractions]
  const existingPairs = new Set(
    nihInteractions.map(i => [i.from.toLowerCase(), i.to.toLowerCase()].sort().join('|'))
  )

  for (const local of localInteractions) {
    const pairKey = [local.from.toLowerCase(), local.to.toLowerCase()].sort().join('|')
    if (!existingPairs.has(pairKey)) {
      merged.push(local)
      existingPairs.add(pairKey)
    }
  }

  // Sort by severity (high first)
  const severityOrder = { high: 0, moderate: 1, low: 2, unknown: 3 }
  return merged.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

const HIGH_RISK_KEYWORDS = [
  "contraindicated",
  "do not use",
  "avoid use",
  "life-threatening",
  "fatal",
  "severe",
  "toxicity",
  "serotonin syndrome",
  "hypertensive crisis",
  "qt prolongation",
  "bleeding risk",
  "respiratory depression",
  "hepatotoxicity",
  "anaphylaxis",
  "maoi",
  "mao inhibitor",
]

// Known dangerous drug class combinations that should always flag as HIGH risk
const DANGEROUS_COMBINATIONS: Array<{
  drugs: string[]
  classes: string[]
  severity: "high"
  description: string
}> = [
    {
      drugs: ["sertraline", "fluoxetine", "paroxetine", "citalopram", "escitalopram", "fluvoxamine"],
      classes: ["ssri", "serotonin", "antidepressant"],
      severity: "high",
      description: "CONTRAINDICATED: SSRIs with MAO inhibitors can cause serotonin syndrome, a potentially life-threatening condition. Do NOT combine these medications."
    },
    {
      drugs: ["phenelzine", "tranylcypromine", "isocarboxazid", "selegiline", "rasagiline"],
      classes: ["maoi", "mao inhibitor", "monoamine oxidase"],
      severity: "high",
      description: "CONTRAINDICATED: MAO inhibitors with SSRIs can cause serotonin syndrome, a potentially life-threatening condition. Do NOT combine these medications."
    },
    {
      drugs: ["warfarin", "coumadin"],
      classes: ["anticoagulant", "blood thinner"],
      severity: "high",
      description: "HIGH RISK: Combining blood thinners with NSAIDs significantly increases bleeding risk. Avoid combination or use with extreme caution under medical supervision."
    },
    {
      drugs: ["aspirin", "ibuprofen", "naproxen", "diclofenac", "celecoxib"],
      classes: ["nsaid", "anti-inflammatory"],
      severity: "high",
      description: "HIGH RISK: NSAIDs with anticoagulants significantly increase bleeding risk. Avoid combination."
    },
    {
      drugs: ["oxycodone", "hydrocodone", "morphine", "fentanyl", "codeine", "tramadol"],
      classes: ["opioid", "narcotic", "pain killer"],
      severity: "high",
      description: "DANGER: Opioids with benzodiazepines or sedatives can cause severe respiratory depression and death."
    },
    {
      drugs: ["alprazolam", "diazepam", "lorazepam", "clonazepam"],
      classes: ["benzodiazepine", "sedative", "anxiolytic"],
      severity: "high",
      description: "DANGER: Benzodiazepines with opioids can cause severe respiratory depression and death."
    },
    {
      drugs: ["simvastatin", "atorvastatin", "lovastatin"],
      classes: ["statin", "cholesterol"],
      severity: "high",
      description: "HIGH RISK: Certain statins with macrolide antibiotics or azole antifungals can cause severe muscle damage (rhabdomyolysis)."
    },
    {
      drugs: ["erythromycin", "clarithromycin", "azithromycin"],
      classes: ["macrolide", "antibiotic"],
      severity: "high",
      description: "HIGH RISK: Macrolide antibiotics can increase statin levels, causing muscle damage."
    },
    {
      drugs: ["metformin"],
      classes: ["biguanide", "antidiabetic"],
      severity: "high",
      description: "CAUTION: Metformin with nephrotoxic drugs or contrast dye can cause lactic acidosis."
    }
  ]

const MODERATE_RISK_KEYWORDS = [
  "monitor",
  "caution",
  "adjustment",
  "dose reduction",
  "increased risk",
  "decreased effect",
  "reduced absorption",
  "potentiate",
  "enhance",
  "drowsiness",
  "dizziness",
  "sedation",
  "hypotension",
  "bradycardia",
  "hyperkalemia",
  "hypoglycemia",
]

// Helper function to check if two medicines are actually the same drug
function areSameDrug(med1: MedicineWithFDA, med2: MedicineWithFDA): boolean {
  // Check if they have the same generic name
  if (med1.genericName && med2.genericName) {
    const generics1 = med1.genericName.map(g => g.toLowerCase())
    const generics2 = med2.genericName.map(g => g.toLowerCase())

    // If any generic name matches, they're the same drug
    for (const g1 of generics1) {
      for (const g2 of generics2) {
        if (g1 === g2) {
          return true
        }
      }
    }
  }

  // Check if the names are very similar (case-insensitive)
  const name1Lower = med1.name.toLowerCase()
  const name2Lower = med2.name.toLowerCase()

  if (name1Lower === name2Lower) {
    return true
  }

  return false
}


function analyzeInteractions(medicines: MedicineWithFDA[]): Interaction[] {
  const interactions: Interaction[] = []
  const processedPairs = new Set<string>()

  // First, check for known dangerous combinations
  const dangerousInteractions = checkDangerousCombinations(medicines)
  interactions.push(...dangerousInteractions)

  // Compare each medicine with every other medicine
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const medicine1 = medicines[i]
      const medicine2 = medicines[j]

      // Skip if both medicines are the same drug (check generic names)
      const isSameDrug = areSameDrug(medicine1, medicine2)
      if (isSameDrug) {
        console.log(`[Analysis] Skipping ${medicine1.name} vs ${medicine2.name} - same drug`)
        continue
      }

      // Skip if we already found this pair in dangerous combinations
      const pairKey = [medicine1.name, medicine2.name].sort().join('|')
      if (dangerousInteractions.some(i =>
        [i.from, i.to].sort().join('|') === pairKey
      )) {
        continue
      }

      // Check if FDA text of medicine1 mentions medicine2
      const interaction1 = findInteraction(medicine1, medicine2)

      // Check if FDA text of medicine2 mentions medicine1
      const interaction2 = findInteraction(medicine2, medicine1)

      if (interaction1) {
        interactions.push(interaction1)
      }

      if (interaction2) {
        interactions.push(interaction2)
      }
    }
  }

  return interactions
}

// Check for known dangerous drug combinations
function checkDangerousCombinations(medicines: MedicineWithFDA[]): Interaction[] {
  const interactions: Interaction[] = []
  const medNames = medicines.map(m => m.name.toLowerCase())

  // Also collect all generic names and classes
  const allNames: string[] = []
  const allClasses: string[] = []

  medicines.forEach(m => {
    allNames.push(m.name.toLowerCase())
    if (m.genericName) allNames.push(...m.genericName.map(n => n.toLowerCase()))
    if (m.brandName) allNames.push(...m.brandName.map(n => n.toLowerCase()))
    if (m.pharmClass) allClasses.push(...m.pharmClass.map(c => c.toLowerCase()))
  })

  // Check SSRIs vs MAO inhibitors specifically
  const ssriDrugs = ["sertraline", "fluoxetine", "paroxetine", "citalopram", "escitalopram", "fluvoxamine", "zoloft", "prozac", "paxil", "lexapro"]
  const maoiDrugs = ["phenelzine", "tranylcypromine", "isocarboxazid", "selegiline", "rasagiline", "nardil", "parnate", "emsam"]
  const maoiTerms = ["mao inhibitor", "maoi", "monoamine oxidase"]

  const hasSSRI = medicines.find(m =>
    ssriDrugs.some(d => m.name.toLowerCase().includes(d)) ||
    allNames.some(n => ssriDrugs.some(d => n.includes(d))) ||
    allClasses.some(c => c.includes("ssri") || c.includes("serotonin reuptake"))
  )

  const hasMAOI = medicines.find(m =>
    maoiDrugs.some(d => m.name.toLowerCase().includes(d)) ||
    maoiTerms.some(t => m.name.toLowerCase().includes(t)) ||
    allNames.some(n => maoiDrugs.some(d => n.includes(d)) || maoiTerms.some(t => n.includes(t))) ||
    allClasses.some(c => c.includes("maoi") || c.includes("monoamine oxidase"))
  )

  if (hasSSRI && hasMAOI) {
    interactions.push({
      from: hasSSRI.name,
      to: hasMAOI.name,
      severity: "high",
      description: "🚨 CONTRAINDICATED: SSRIs with MAO inhibitors can cause SEROTONIN SYNDROME, a potentially life-threatening condition characterized by agitation, high fever, rapid heart rate, and muscle rigidity. Do NOT combine these medications. Wait at least 2 weeks after stopping an MAOI before starting an SSRI."
    })
  }

  // Check Opioids vs Benzodiazepines
  const opioids = ["oxycodone", "hydrocodone", "morphine", "fentanyl", "codeine", "tramadol", "vicodin", "percocet", "oxycontin"]
  const benzos = ["alprazolam", "diazepam", "lorazepam", "clonazepam", "xanax", "valium", "ativan", "klonopin"]

  const hasOpioid = medicines.find(m =>
    opioids.some(d => m.name.toLowerCase().includes(d)) ||
    allNames.some(n => opioids.some(d => n.includes(d))) ||
    allClasses.some(c => c.includes("opioid"))
  )

  const hasBenzo = medicines.find(m =>
    benzos.some(d => m.name.toLowerCase().includes(d)) ||
    allNames.some(n => benzos.some(d => n.includes(d))) ||
    allClasses.some(c => c.includes("benzodiazepine"))
  )

  if (hasOpioid && hasBenzo) {
    interactions.push({
      from: hasOpioid.name,
      to: hasBenzo.name,
      severity: "high",
      description: "🚨 DANGER: Combining opioids with benzodiazepines can cause severe respiratory depression, coma, and death. The FDA has issued a Black Box Warning for this combination."
    })
  }

  // Check Blood Thinners vs NSAIDs
  const bloodThinners = ["warfarin", "coumadin", "heparin", "enoxaparin", "rivaroxaban", "apixaban", "dabigatran", "xarelto", "eliquis"]
  const nsaids = ["aspirin", "ibuprofen", "naproxen", "diclofenac", "celecoxib", "advil", "motrin", "aleve", "celebrex"]

  const hasBloodThinner = medicines.find(m =>
    bloodThinners.some(d => m.name.toLowerCase().includes(d)) ||
    allNames.some(n => bloodThinners.some(d => n.includes(d))) ||
    allClasses.some(c => c.includes("anticoagulant"))
  )

  const hasNSAID = medicines.find(m =>
    nsaids.some(d => m.name.toLowerCase().includes(d)) ||
    allNames.some(n => nsaids.some(d => n.includes(d))) ||
    allClasses.some(c => c.includes("nsaid") || c.includes("anti-inflammatory"))
  )

  if (hasBloodThinner && hasNSAID) {
    interactions.push({
      from: hasBloodThinner.name,
      to: hasNSAID.name,
      severity: "high",
      description: "🚨 HIGH RISK: Combining blood thinners with NSAIDs significantly increases the risk of serious bleeding, including gastrointestinal and intracranial bleeding. Avoid this combination."
    })
  }

  // Check Statins vs certain antibiotics
  const statins = ["simvastatin", "atorvastatin", "lovastatin", "pravastatin", "rosuvastatin", "lipitor", "zocor", "crestor"]
  const riskyAntibiotics = ["erythromycin", "clarithromycin", "ketoconazole", "itraconazole"]

  const hasStatin = medicines.find(m =>
    statins.some(d => m.name.toLowerCase().includes(d)) ||
    allNames.some(n => statins.some(d => n.includes(d))) ||
    allClasses.some(c => c.includes("statin"))
  )

  const hasRiskyAntibiotic = medicines.find(m =>
    riskyAntibiotics.some(d => m.name.toLowerCase().includes(d)) ||
    allNames.some(n => riskyAntibiotics.some(d => n.includes(d)))
  )

  if (hasStatin && hasRiskyAntibiotic) {
    interactions.push({
      from: hasStatin.name,
      to: hasRiskyAntibiotic.name,
      severity: "high",
      description: "🚨 HIGH RISK: This combination can significantly increase statin levels in your blood, leading to rhabdomyolysis (severe muscle breakdown) which can cause kidney failure."
    })
  }

  return interactions
}

// A mapping of common drug synonyms
const drugSynonyms: { [key: string]: string[] } = {
  acetaminophen: ["paracetamol"],
  paracetamol: ["acetaminophen"],
  ibuprofen: ["advil", "motrin"],
  "acetylsalicylic acid": ["aspirin"],
  aspirin: ["acetylsalicylic acid"],
}

function findInteraction(sourceMed: MedicineWithFDA, targetMed: MedicineWithFDA): Interaction | null {
  const textLower = sourceMed.fdaText.toLowerCase()

  // Build a list of all possible names for targetMed, including synonyms
  let targetNames = [targetMed.name.toLowerCase()]
  if (targetMed.genericName) {
    targetNames.push(...targetMed.genericName.map(n => n.toLowerCase()))
  }
  if (targetMed.brandName) {
    targetNames.push(...targetMed.brandName.map(n => n.toLowerCase()))
  }

  // Add synonyms to the list of names to check
  const allNamesAndSynonyms: string[] = [...targetNames]
  for (const name of targetNames) {
    if (drugSynonyms[name]) {
      allNamesAndSynonyms.push(...drugSynonyms[name])
    }
  }

  // Use a Set to get unique names and filter out short ones
  const validTargetNames = [...new Set(allNamesAndSynonyms)].filter(n => n.length > 3)

  // Check for direct mention of any name or synonym
  for (const name of validTargetNames) {
    if (textLower.includes(name)) {
      const context = extractContext(sourceMed.fdaText, name)
      const severity = determineSeverity(context)

      console.log(`[Interaction] Found: ${sourceMed.name} <-> ${targetMed.name}, severity: ${severity}, context length: ${context.length}`)

      return {
        from: sourceMed.name,
        to: targetMed.name,
        severity,
        description: context || `${sourceMed.name} label mentions an interaction with ${name}.`,
      }
    }
  }

  // Check for pharmacological class interactions
  if (targetMed.pharmClass) {
    for (const pharmClass of targetMed.pharmClass) {
      const pharmClassLower = pharmClass.toLowerCase()
      // Pharm classes can be long, ensure we match significant parts
      if (textLower.includes(pharmClassLower)) {
        const context = extractContext(sourceMed.fdaText, pharmClassLower)
        const severity = determineSeverity(context)

        return {
          from: sourceMed.name,
          to: targetMed.name,
          severity,
          description: context || `${sourceMed.name} label mentions interactions with ${pharmClass} class medications.`,
        }
      }
    }
  }

  return null
}

function extractContext(text: string, keyword: string): string {
  const index = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (index === -1) return ""

  // Extract a more comprehensive context window for better information
  // Look for sentence boundaries
  const before = text.substring(0, index)
  const after = text.substring(index)

  const sentenceStart = Math.max(before.lastIndexOf('. '), before.lastIndexOf('! '), before.lastIndexOf('? '), before.lastIndexOf('\n'))
  const sentenceEnd = Math.min(
    after.indexOf('. ') === -1 ? Infinity : after.indexOf('. '),
    after.indexOf('! ') === -1 ? Infinity : after.indexOf('! '),
    after.indexOf('? ') === -1 ? Infinity : after.indexOf('? '),
    after.indexOf('\n') === -1 ? Infinity : after.indexOf('\n')
  )

  let startPos = sentenceStart === -1 ? Math.max(0, index - 150) : sentenceStart + 1
  let endPos = sentenceEnd === Infinity ? Math.min(text.length, index + 400) : index + sentenceEnd + 1

  // If the sentence is too long, truncate but allow more text
  if (endPos - startPos > 800) {
    startPos = Math.max(0, index - 150)
    endPos = Math.min(text.length, index + 400)
  }

  return text.substring(startPos, endPos).trim()
}

function determineSeverity(text: string): "high" | "moderate" | "low" {
  const lowerText = text.toLowerCase()

  for (const keyword of HIGH_RISK_KEYWORDS) {
    if (lowerText.includes(keyword)) return "high"
  }

  for (const keyword of MODERATE_RISK_KEYWORDS) {
    if (lowerText.includes(keyword)) return "moderate"
  }

  return "low"
}

// ============================================
// ADVANCED MULTI-FACTOR RISK SCORING SYSTEM
// ============================================

interface RiskBreakdown {
  baseScore: number
  interactionScore: number
  polypharmacyScore: number
  drugClassScore: number
  cumulativeRiskScore: number
  clinicalSignificanceMultiplier: number
  finalScore: number
  riskFactors: string[]
}

// High-risk drug classes that increase overall risk
const HIGH_RISK_DRUG_CLASSES = [
  { class: "anticoagulant", weight: 1.3, reason: "Blood thinners require careful monitoring" },
  { class: "opioid", weight: 1.4, reason: "High addiction and overdose potential" },
  { class: "benzodiazepine", weight: 1.3, reason: "Sedation and dependency risks" },
  { class: "ssri", weight: 1.1, reason: "Serotonergic effects require monitoring" },
  { class: "maoi", weight: 1.5, reason: "Severe interaction potential" },
  { class: "antipsychotic", weight: 1.2, reason: "Complex side effect profile" },
  { class: "immunosuppressant", weight: 1.4, reason: "Narrow therapeutic index" },
  { class: "chemotherapy", weight: 1.5, reason: "High toxicity potential" },
  { class: "insulin", weight: 1.2, reason: "Hypoglycemia risk" },
  { class: "digoxin", weight: 1.3, reason: "Narrow therapeutic window" },
  { class: "lithium", weight: 1.3, reason: "Requires blood level monitoring" },
  { class: "warfarin", weight: 1.4, reason: "Bleeding risk with narrow therapeutic range" },
]

// Interaction severity base scores
const SEVERITY_SCORES = {
  high: 35,
  moderate: 15,
  low: 5,
  unknown: 10
}

// Clinical significance keywords that increase severity
const CLINICAL_KEYWORDS = {
  critical: ["death", "fatal", "life-threatening", "black box", "contraindicated"],
  severe: ["hospitalization", "emergency", "discontinue immediately", "serious adverse"],
  significant: ["avoid", "do not use", "significant risk", "careful monitoring"],
  moderate: ["monitor", "use caution", "may increase", "adjustment needed"]
}

function calculateAdvancedRiskScore(
  interactions: Interaction[],
  medicines: MedicineWithFDA[]
): RiskBreakdown {
  const riskFactors: string[] = []

  // 1. BASE INTERACTION SCORE
  let interactionScore = 0
  let highCount = 0
  let moderateCount = 0
  let lowCount = 0

  for (const interaction of interactions) {
    const baseScore = SEVERITY_SCORES[interaction.severity]

    // Apply clinical significance multiplier
    let clinicalMultiplier = 1.0
    const descLower = interaction.description.toLowerCase()

    if (CLINICAL_KEYWORDS.critical.some(k => descLower.includes(k))) {
      clinicalMultiplier = 1.5
      if (!riskFactors.includes("Critical clinical warnings detected")) {
        riskFactors.push("Critical clinical warnings detected")
      }
    } else if (CLINICAL_KEYWORDS.severe.some(k => descLower.includes(k))) {
      clinicalMultiplier = 1.3
    } else if (CLINICAL_KEYWORDS.significant.some(k => descLower.includes(k))) {
      clinicalMultiplier = 1.15
    }

    interactionScore += baseScore * clinicalMultiplier

    // Count by severity
    if (interaction.severity === "high") highCount++
    else if (interaction.severity === "moderate") moderateCount++
    else lowCount++
  }

  if (highCount > 0) riskFactors.push(`${highCount} high-severity interaction(s)`)
  if (moderateCount > 0) riskFactors.push(`${moderateCount} moderate interaction(s)`)

  // 2. POLYPHARMACY RISK SCORE
  // Risk increases non-linearly with number of medications
  let polypharmacyScore = 0
  const medCount = medicines.length

  if (medCount >= 2 && medCount <= 4) {
    polypharmacyScore = 0 // Normal range
  } else if (medCount === 5) {
    polypharmacyScore = 5
    riskFactors.push("5 medications: Minor polypharmacy")
  } else if (medCount >= 6 && medCount <= 8) {
    polypharmacyScore = 10
    riskFactors.push("6+ medications: Moderate polypharmacy risk")
  } else if (medCount >= 9) {
    polypharmacyScore = 20
    riskFactors.push("9+ medications: High polypharmacy risk - consider medication review")
  }

  // 3. DRUG CLASS RISK SCORE
  // Certain drug classes inherently carry more risk
  let drugClassScore = 0
  const detectedClasses: string[] = []

  for (const med of medicines) {
    const allClasses = [
      med.name.toLowerCase(),
      ...(med.genericName || []).map(n => n.toLowerCase()),
      ...(med.pharmClass || []).map(c => c.toLowerCase())
    ].join(' ')

    for (const riskClass of HIGH_RISK_DRUG_CLASSES) {
      if (allClasses.includes(riskClass.class) && !detectedClasses.includes(riskClass.class)) {
        drugClassScore += 5 * riskClass.weight
        detectedClasses.push(riskClass.class)
        riskFactors.push(`${riskClass.class.toUpperCase()}: ${riskClass.reason}`)
      }
    }
  }

  // 4. CUMULATIVE RISK MULTIPLIER
  // Multiple high-risk interactions compound the risk
  let cumulativeMultiplier = 1.0

  if (highCount >= 3) {
    cumulativeMultiplier = 1.5
    riskFactors.push("Multiple high-risk interactions: Cumulative risk elevated")
  } else if (highCount >= 2) {
    cumulativeMultiplier = 1.25
  } else if (highCount === 1 && moderateCount >= 2) {
    cumulativeMultiplier = 1.15
  }

  // 5. INTERACTION PAIR SYNERGY
  // Some combinations are worse together than individually
  let synergyPenalty = 0
  const interactionPairs = interactions.map(i =>
    [i.from.toLowerCase(), i.to.toLowerCase()].sort().join('|')
  )

  // Check for dangerous multi-drug scenarios
  const hasAnticoagulant = medicines.some(m =>
    m.name.toLowerCase().includes('warfarin') ||
    m.pharmClass?.some(c => c.toLowerCase().includes('anticoagulant'))
  )
  const hasNSAID = medicines.some(m =>
    ['aspirin', 'ibuprofen', 'naproxen'].some(n => m.name.toLowerCase().includes(n))
  )
  const hasSteroid = medicines.some(m =>
    m.pharmClass?.some(c => c.toLowerCase().includes('corticosteroid'))
  )

  // Triple whammy: Anticoagulant + NSAID + anything else
  if (hasAnticoagulant && hasNSAID) {
    synergyPenalty += 15
    riskFactors.push("⚠️ Blood thinner + NSAID combination detected")
  }

  // CNS Depression stacking
  const cnsDrugs = medicines.filter(m =>
    ['opioid', 'benzodiazepine', 'sedative', 'hypnotic', 'antihistamine'].some(c =>
      m.pharmClass?.some(pc => pc.toLowerCase().includes(c)) ||
      m.name.toLowerCase().includes(c)
    )
  )
  if (cnsDrugs.length >= 2) {
    synergyPenalty += 10 * (cnsDrugs.length - 1)
    riskFactors.push(`${cnsDrugs.length} CNS depressant medications: Additive sedation risk`)
  }

  // 6. CALCULATE FINAL SCORE
  const baseScore = interactionScore
  const adjustedScore = (baseScore + polypharmacyScore + drugClassScore + synergyPenalty) * cumulativeMultiplier
  const finalScore = Math.min(100, Math.round(adjustedScore))

  return {
    baseScore,
    interactionScore,
    polypharmacyScore,
    drugClassScore,
    cumulativeRiskScore: synergyPenalty,
    clinicalSignificanceMultiplier: cumulativeMultiplier,
    finalScore,
    riskFactors
  }
}

function calculateRiskScore(interactions: Interaction[], medicines?: MedicineWithFDA[]): number {
  // If we have medicine details, use advanced scoring
  if (medicines && medicines.length > 0) {
    const breakdown = calculateAdvancedRiskScore(interactions, medicines)
    console.log("[Risk] Advanced scoring breakdown:", breakdown)
    return breakdown.finalScore
  }

  // Fallback to simple scoring
  if (interactions.length === 0) return 0

  let score = 0

  for (const interaction of interactions) {
    switch (interaction.severity) {
      case "high":
        score += 40
        break
      case "moderate":
        score += 15
        break
      case "low":
        score += 5
        break
    }
  }

  return Math.min(100, score)
}

function determineStatus(score: number): "safe" | "caution" | "danger" {
  if (score >= 55) return "danger"  // Lowered threshold for more sensitive detection
  if (score >= 20) return "caution"
  return "safe"
}

function generateRecommendations(status: string, interactions: Interaction[], medicines: MedicineWithFDA[]): string[] {
  const recommendations: string[] = []

  if (status === "danger") {
    recommendations.push("High risk interactions detected. Do not combine these medicines without medical advice.")
    recommendations.push("Contact your doctor immediately.")
  } else if (status === "caution") {
    recommendations.push("Moderate interactions detected. Monitor for side effects.")
    recommendations.push("Consult a pharmacist about spacing your doses.")
  } else {
    recommendations.push("No significant interactions found in our databases (FDA, RxNorm & NIH).")
    recommendations.push("Always follow dosing instructions.")
  }

  // Add specific advice based on interaction types if possible
  // (Simplified for now)

  if (medicines.some(m => m.isUnknown)) {
    recommendations.push("Note: Some medicines could not be fully verified against the FDA database. Please check the spelling or consult a professional.")
  }

  return recommendations
}
