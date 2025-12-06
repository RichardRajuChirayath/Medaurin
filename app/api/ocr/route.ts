import { type NextRequest, NextResponse } from "next/server"

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

    // OCR.space returns parsed text in ParsedResults array
    const parsedText = ocrResult.ParsedResults?.[0]?.ParsedText

    if (!ocrResult.IsErroredOnProcessing && parsedText) {
      // Extract medicine names using regex patterns
      const medicines = extractMedicineNames(parsedText)

      return NextResponse.json({
        medicines: medicines.length > 0 ? medicines : ["Unable to extract medicines"],
        rawText: parsedText,
      })
    } else {
      const errorMessage = ocrResult.ErrorMessage || ocrResult.ParsedResults?.[0]?.ErrorMessage || "OCR processing failed"
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error("OCR error:", error)
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 })
  }
}

// Extract medicine names from OCR text
function extractMedicineNames(text: string): string[] {
  // Pre-clean text
  const cleanText = text
    .replace(/\|/g, "I") // Common OCR error
    .replace(/\[|\]|\{|\}/g, "")
    .replace(/\s+/g, " ")

  // Common medicine name patterns (case-insensitive)
  const medicinePatterns = [
    // Common generic medicines (expanded list)
    /\b(paracetamol|acetaminophen|ibuprofen|aspirin|naproxen|cetirizine|loratadine|fexofenadine|omeprazole|pantoprazole|rabeprazole|lansoprazole|ranitidine|famotidine|metformin|lisinopril|atorvastatin|rosuvastatin|amlodipine|telmisartan|losartan|amoxicillin|azithromycin|ciprofloxacin|ofloxacin|levofloxacin|sertraline|fluoxetine|alprazolam|clonazepam|diazepam|atorvastatin|simvastatin|lovastatin|montelukast|levocetirizine|ambroxol|dextromethorphan|guaifenesin|chlorpheniramine|phenylephrine)\b/gi,

    // Brand names with dosage (e.g., "Dolo 650", "Augmentin 625")
    /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\s+(?:\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|gm))\b/g,

    // Brand names with form (e.g., "Crocin Tablet", "Volini Gel")
    /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\s+(?:tablet|tablets|capsule|capsules|injection|syrup|suspension|gel|cream|ointment|drops|solution)\b/gi,

    // Specific Indian brands (hardcoded for better detection)
    /\b(Dolo|Crocin|Calpol|Meftal|Combiflam|Saridon|Disprin|Voveran|Volini|Zerodol|Hifenac|Ultracet|Sumo|Nice|Nimulid|Cipcal|Shelcal|Zincovit|Becosules|Limcee|Celin|Ascoril|Benadryl|Corex|Grilinctus|Maxtra|Sinarest|Wikoryl|Cheston|Okacet|Allegra|Avil|Montek|Telekast|Pantop|Pan|Omez|Rantac|Aciloc|Zinetac|Gelusil|Digene|Mucaine|Cremaffin|Dulcoflex|Kaymachurna|Isabgol|Eno|Gas-O-Fast|Pudin|Hara|Hajmola|Vicks|Strepsils|Honitus|Koflet|Cofsils|Alex|Zeet|Torex|Glycomet|Gluconorm|Januvia|Galvus|Istamet|Teneligliptin|Voglibose|Glimepiride|Telma|Telmikind|Amlong|Stamlo|Ciar|Ciplox|Taxim|Monocef|Zifi|Clamp|Moxikind|Norflox|Flagyl|Metrogyl|Sporidex|Phexin|Betadine|Soframycin|T-Bact)\b/gi
  ]

  const medicines = new Set<string>()
  const blocklist = new Set([
    // Dosage forms
    "tablet", "tablets", "capsule", "capsules", "injection", "syrup", "suspension", "gel", "cream", "ointment", "drops", "solution",
    // Packaging/Manufacturing info
    "mrp", "price", "batch", "date", "mfg", "exp", "expiry", "incl", "taxes", "india", "ltd", "pvt", "pharmaceuticals", "pharma",
    "store", "cool", "dry", "place", "dosage", "directed", "physician", "keep", "reach", "children", "composition", "contains",
    // Tablet types and instructions
    "each", "film", "coated", "uncoated", "sustained", "release", "extended", "controlled", "mouth", "dissolve", "swallow", "whole",
    "chew", "crush", "break", "warning", "schedule", "drug", "prescription", "retail", "sold", "retailer", "chemist", "doctor",
    "fast", "slow", "immediate", "delayed", "enteric", "gastro", "resistant",
    // Legal/regulatory
    "regd", "trade", "mark", "marketed", "manufactured", "licensed", "user", "manual", "net", "content", "weight", "volume",
    // Units
    "mg", "ml", "mcg", "g", "gm", "iu", "u", "usp", "ip", "bp", "nf", "w/v", "w/w", "v/v",
    // Common non-medicine words
    "pack", "strip", "blister", "box", "bottle", "container", "label", "read", "carefully", "before", "use", "using",
    "take", "taking", "consult", "medical", "advice", "information", "instructions", "side", "effects", "adverse",
    "reactions", "overdose", "storage", "dispose", "disposal", "empty", "full", "half", "quarter"
  ])

  medicinePatterns.forEach((pattern) => {
    const matches = cleanText.matchAll(pattern)
    for (const match of matches) {
      // match[1] is usually the name part
      let medicine = (match[1] || match[0]).trim()

      // Clean up the extracted name
      medicine = medicine.replace(/\d+\s*(?:mg|ml|mcg|g|gm|iu|u).*/i, "").trim()

      // Filter out blocklisted words and short strings
      if (
        medicine.length > 2 &&
        !blocklist.has(medicine.toLowerCase()) &&
        !/^\d+$/.test(medicine) // Not just numbers
      ) {
        medicines.add(medicine)
      }
    }
  })

  // Remove duplicates and return as array
  return Array.from(medicines)
    .filter((m) => m.length > 0)
    .slice(0, 15) // Increased limit
}
