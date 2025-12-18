import { type NextRequest, NextResponse } from "next/server"
import { validateMedicines } from "@/lib/medicine-validator"

/**
 * GET DRUG DATA API ROUTE
 * 
 * This route validates and fetches FDA/RxNorm data for manually entered medicines.
 * Uses the UNIFIED validation system (same as OCR).
 */

export async function POST(request: NextRequest) {
  try {
    const { medicines } = await request.json()

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json({ error: "No medicines provided" }, { status: 400 })
    }

    console.log(`[getDrugData] Validating ${medicines.length} medicines...`)
    const startTime = Date.now()

    // USE UNIFIED VALIDATION
    const validatedMedicines = await validateMedicines(medicines)

    // Check for any invalid medicines
    const invalidMedicines = validatedMedicines.filter(m => !m.isValid)

    if (invalidMedicines.length > 0) {
      console.log(`[getDrugData] ❌ Found ${invalidMedicines.length} invalid medicines`)

      // Return error with details about which medicines failed
      return NextResponse.json({
        error: "Invalid medicines detected",
        invalidMedicines: invalidMedicines.map(m => ({
          name: m.name,
          reason: m.reason
        })),
        validMedicines: validatedMedicines.filter(m => m.isValid).map(m => m.name)
      }, { status: 400 })
    }

    console.log(`[getDrugData] ✅ All ${medicines.length} medicines validated successfully`)

    // Convert to the format expected by the frontend
    const drugData = validatedMedicines.map(med => ({
      name: med.name,
      fdaText: med.fdaData?.text || "",
      genericName: med.fdaData?.genericName || (med.normalizedName ? [med.normalizedName] : []),
      brandName: med.fdaData?.brandName,
      pharmClass: med.fdaData?.pharmClass,
      sideEffects: med.fdaData?.sideEffects,
      isUnknown: false, // All are validated, so none are unknown
      rxcui: med.rxcui,
      normalizedName: med.normalizedName
    }))

    const duration = Date.now() - startTime
    console.log(`[getDrugData] Completed in ${duration}ms`)

    return NextResponse.json(drugData)

  } catch (error) {
    console.error("[getDrugData] Error:", error)
    return NextResponse.json({ error: "Failed to fetch drug data" }, { status: 500 })
  }
}
