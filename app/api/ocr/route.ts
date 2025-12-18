import { type NextRequest, NextResponse } from "next/server"
import { validateMedicines, deduplicateMedicines } from "@/lib/medicine-validator"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Convert file to base64
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = `data:${image.type};base64,${buffer.toString("base64")}`

    // Prepare FormData for OCR.space API
    const ocrFormData = new FormData()
    ocrFormData.append("base64image", base64Image)
    ocrFormData.append("OCREngine", "2")
    ocrFormData.append("scale", "true")
    ocrFormData.append("detectOrientation", "true")

    const ocrApiKey = process.env.OCR_API_KEY || "K84303568988957"

    // Send to OCR.space API
    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: ocrApiKey,
      },
      body: ocrFormData,
    })

    if (!ocrResponse.ok) {
      throw new Error("OCR API request failed")
    }

    const ocrResult = await ocrResponse.json()
    console.log("OCR API Response:", JSON.stringify(ocrResult, null, 2))

    // Check for OCR platform errors first
    if (ocrResult.IsErroredOnProcessing) {
      const errorMessage = ocrResult.ErrorMessage || ocrResult.ParsedResults?.[0]?.ErrorMessage || "OCR processing failed"
      throw new Error(errorMessage)
    }

    // Get validated text (or empty string)
    const parsedText = ocrResult.ParsedResults?.[0]?.ParsedText || ""
    const candidateTokens = extractMedicineTokens(parsedText)

    console.log(`[OCR] Extracted ${candidateTokens.length} candidate tokens`)

    // Internal safety check: If no tokens found, return success:false (HTTP 200)
    // This allows the frontend to handle it as a "Notice" rather than a "Crash"
    if (candidateTokens.length === 0) {
      console.warn("[OCR] No text/candidates found. Returning neutral response.")
      return NextResponse.json({
        success: false,
        reason: "NO_TEXT_DETECTED",
        medicines: [],
        rawText: parsedText,
        message: "We couldn't read any clear medicine names. Please try again with better lighting."
      })
    }

    // If we have candidates, proceed with validation
    console.log(`[OCR] Validating ${candidateTokens.length} candidates...`)
    const validatedMedicines = await validateMedicines(candidateTokens)
    const validMedicines = validatedMedicines.filter(m => m.isValid)
    const deduplicated = deduplicateMedicines(validMedicines)

    // Second safety check: Text found, but all rejected as invalid/safe-list blocked
    if (deduplicated.length === 0) {
      const invalidReasons = validatedMedicines
        .filter(m => !m.isValid)
        .map(m => `"${m.name}"`)
        .join(", ")

      return NextResponse.json({
        success: false,
        reason: "NO_VALID_MEDICINES",
        medicines: [],
        rawText: parsedText,
        message: "Text detected, but no verifiable medicines found.",
        debug_rejected: invalidReasons
      })
    }

    // Success path
    const drugData = deduplicated.map(med => ({
      name: med.name,
      normalizedName: med.normalizedName,
      rxcui: med.rxcui,
      fdaText: med.fdaData?.text || "",
      genericName: med.fdaData?.genericName || (med.normalizedName ? [med.normalizedName] : []),
      brandName: med.fdaData?.brandName || [],
      pharmClass: med.fdaData?.pharmClass || [],
      sideEffects: med.fdaData?.sideEffects || [],
      isUnknown: false
    }))

    return NextResponse.json({
      success: true,
      medicines: drugData.map(d => d.name),
      drugData: drugData,
      rawText: parsedText
    })

  } catch (error) {
    console.error("OCR error:", error)
    // Only return 500 for actual crashes/infrastructure failures
    return NextResponse.json({
      success: false,
      reason: "INTERNAL_ERROR",
      error: "Our image analysis service is temporarily unavailable."
    }, { status: 500 })
  }
}

/**
 * Extract potential medicine name tokens from OCR text
 * This does BASIC filtering to remove obvious garbage
 * Real validation happens via validateMedicines()
 */
function extractMedicineTokens(text: string): string[] {
  // Pre-clean text
  const cleanText = text
    .replace(/\|/g, "I") // Common OCR error
    .replace(/\[|\]|\{|\}/g, "")
    .replace(/\s+/g, " ")

  const tokens = new Set<string>()

  // Pattern 1: Medicine names with dosage (e.g., "Dolo 650", "Augmentin 625")
  const dosagePattern = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\s+\d+/g
  let match
  while ((match = dosagePattern.exec(cleanText)) !== null) {
    tokens.add(match[1].trim())
  }

  // Pattern 2: Capitalized words (potential brand names)
  const capitalizedPattern = /\b[A-Z][a-z]{3,}\b/g
  while ((match = capitalizedPattern.exec(cleanText)) !== null) {
    const word = match[0]

    // Skip if it's a common non-medicine word
    if (!isBlocklisted(word)) {
      tokens.add(word)
    }
  }

  // Pattern 3: Common generic names (lowercase in text)
  const genericNames = [
    "paracetamol", "acetaminophen", "ibuprofen", "aspirin", "naproxen",
    "cetirizine", "loratadine", "omeprazole", "pantoprazole", "metformin",
    "lisinopril", "atorvastatin", "amlodipine", "azithromycin", "amoxicillin"
  ]

  const lowerText = cleanText.toLowerCase()
  genericNames.forEach(name => {
    if (lowerText.includes(name)) {
      tokens.add(name)
    }
  })

  // Return unique tokens
  return Array.from(tokens).filter(token => token.length > 2)
}

/**
 * Check if a word is in the blocklist (non-medicine terms)
 */
function isBlocklisted(word: string): boolean {
  const blocklist = new Set([
    // Dosage forms
    "tablet", "tablets", "capsule", "capsules", "injection", "syrup",
    "suspension", "gel", "cream", "ointment", "drops", "solution",

    // Packaging/Manufacturing
    "mrp", "price", "batch", "date", "mfg", "exp", "expiry", "india",
    "ltd", "pvt", "pharmaceuticals", "pharma", "store", "dosage",

    // Instructions
    "directed", "physician", "keep", "reach", "children", "composition",
    "contains", "each", "film", "coated", "release", "extended",

    // Legal/Regulatory
    "regd", "trade", "mark", "marketed", "manufactured", "licensed",

    // Common words
    "pack", "strip", "blister", "box", "bottle", "label", "read",
    "carefully", "before", "take", "consult", "medical", "advice"
  ])

  return blocklist.has(word.toLowerCase())
}
