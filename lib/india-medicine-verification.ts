import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * India Government Medicine Verification Service
 * Uses local CDSCO and NPPA datasets for verification
 */

interface CDSCODrug {
    drugName: string
    genericName: string
    approvalStatus: "APPROVED" | "BANNED" | "UNKNOWN"
    cdscoLicense: string
    manufacturer: string
    manufacturerLicense: string
    category: string
    isBanned: boolean
    banReason?: string
}

interface NPPAPrice {
    drugName: string
    strength: string
    dosageForm: string
    ceilingPrice: number
    pricePerUnit: number
    packSize: string
    isControlled: boolean
    nppaNotificationNo: string
}

interface VerificationResult {
    govApprovalStatus: "APPROVED" | "BANNED" | "UNKNOWN"
    isBanned: boolean
    govMrp: number | null
    isOverpriced: boolean
    manufacturerName: string | null
    manufacturerLicense: string | null
    verifiedAt: Date
    verificationAlerts: string[]
}

// Load datasets once at module initialization
let cdscoDataset: CDSCODrug[] = []
let nppaDataset: NPPAPrice[] = []

try {
    const cdscoPath = join(process.cwd(), 'data', 'cdsco-drugs.json')
    const nppaPath = join(process.cwd(), 'data', 'nppa-ceiling-prices.json')

    cdscoDataset = JSON.parse(readFileSync(cdscoPath, 'utf-8'))
    nppaDataset = JSON.parse(readFileSync(nppaPath, 'utf-8'))

    console.log(`[VERIFICATION] Loaded ${cdscoDataset.length} CDSCO drugs`)
    console.log(`[VERIFICATION] Loaded ${nppaDataset.length} NPPA price entries`)
} catch (error) {
    console.error('[VERIFICATION] Failed to load datasets:', error)
}

/**
 * Normalize medicine name for matching
 */
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '')
}

/**
 * Find drug in CDSCO dataset
 */
function findInCDSCO(medicineName: string): CDSCODrug | null {
    const normalized = normalizeName(medicineName)

    return cdscoDataset.find(drug => {
        const drugNormalized = normalizeName(drug.drugName)
        const genericNormalized = normalizeName(drug.genericName)

        return drugNormalized.includes(normalized) ||
            normalized.includes(drugNormalized) ||
            genericNormalized.includes(normalized) ||
            normalized.includes(genericNormalized)
    }) || null
}

/**
 * Find price in NPPA dataset
 */
function findInNPPA(medicineName: string): NPPAPrice | null {
    const normalized = normalizeName(medicineName)

    return nppaDataset.find(price => {
        const priceNormalized = normalizeName(price.drugName)
        return priceNormalized.includes(normalized) || normalized.includes(priceNormalized)
    }) || null
}

/**
 * Calculate if medicine is overpriced
 */
function calculateOverpricing(actualPrice: number, govMrp: number, quantity: string | undefined): {
    isOverpriced: boolean
    percentageOver: number
} {
    // Extract quantity number from string like "10 tablets"
    const qtyMatch = quantity?.match(/(\d+)/)
    const units = qtyMatch ? parseInt(qtyMatch[1]) : 1

    // Calculate expected price based on govt MRP
    const expectedPrice = govMrp * units

    // Allow 20% margin (pharmacies need profit)
    const allowedPrice = expectedPrice * 1.20

    const isOverpriced = actualPrice > allowedPrice
    const percentageOver = ((actualPrice - expectedPrice) / expectedPrice) * 100

    return { isOverpriced, percentageOver: Math.round(percentageOver) }
}

/**
 * Verify medicine against India government databases
 */
export async function verifyIndianMedicine(
    medicineName: string,
    actualPrice?: number,
    quantity?: string
): Promise<VerificationResult> {
    const alerts: string[] = []

    // Check CDSCO database
    const cdscoMatch = findInCDSCO(medicineName)

    let govApprovalStatus: "APPROVED" | "BANNED" | "UNKNOWN" = "UNKNOWN"
    let isBanned = false
    let manufacturerName: string | null = null
    let manufacturerLicense: string | null = null

    if (cdscoMatch) {
        govApprovalStatus = cdscoMatch.approvalStatus
        isBanned = cdscoMatch.isBanned
        manufacturerName = cdscoMatch.manufacturer
        manufacturerLicense = cdscoMatch.manufacturerLicense

        if (isBanned) {
            alerts.push(`⚠️ CRITICAL: This medicine is BANNED in India by CDSCO`)
            if (cdscoMatch.banReason) {
                alerts.push(`Reason: ${cdscoMatch.banReason}`)
            }
        }
    }

    // Check NPPA database for price control
    const nppaMatch = findInNPPA(medicineName)

    let govMrp: number | null = null
    let isOverpriced = false

    if (nppaMatch && actualPrice) {
        govMrp = nppaMatch.pricePerUnit

        const pricingCheck = calculateOverpricing(actualPrice, govMrp, quantity)
        isOverpriced = pricingCheck.isOverpriced

        if (isOverpriced) {
            alerts.push(
                `💰 You may have been overcharged. ` +
                `You paid ₹${actualPrice.toFixed(2)}, ` +
                `but govt ceiling price is ₹${(govMrp * (parseInt(quantity?.match(/(\d+)/)?.[1] || '1'))).toFixed(2)}`
            )
        } else if (pricingCheck.percentageOver < 0) {
            alerts.push(`✓ Good deal! You saved ${Math.abs(pricingCheck.percentageOver)}% compared to govt MRP`)
        }
    }

    return {
        govApprovalStatus,
        isBanned,
        govMrp,
        isOverpriced,
        manufacturerName,
        manufacturerLicense,
        verifiedAt: new Date(),
        verificationAlerts: alerts
    }
}

/**
 * Check if verification requires immediate alert
 */
export function requiresAlert(result: VerificationResult): boolean {
    return result.isBanned || result.isOverpriced
}

/**
 * Generate FCM alert message
 */
export function generateAlertMessage(medicineName: string, result: VerificationResult): string {
    if (result.isBanned) {
        return `⚠️ ALERT: ${medicineName} is BANNED by CDSCO. Please consult your doctor immediately!`
    }

    if (result.isOverpriced) {
        return `💰 ${medicineName} may have been overpriced. Check your expense tracker for details.`
    }

    return `✓ ${medicineName} verified successfully`
}
