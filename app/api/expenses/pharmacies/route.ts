import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { fetchNative } from "@/lib/fetch-native"

const NOMINATIM_API = "https://nominatim.openstreetmap.org"
const USER_AGENT = "MixSafe/1.0" // Required by OSM policy

// Type definitions
interface Pharmacy {
    id: number
    name: string
    lat: number
    lon: number
    address: string
    phone: string
    openingHours: string
}

interface EnrichedPharmacy extends Pharmacy {
    totalSpent: number
    visitCount: number
}

// Cache removed as per user request for fresh data every time

// Rate limiting (max 1 request per second per user)
const rateLimits = new Map<string, number>()

function checkRateLimit(userId: string): boolean {
    const lastRequest = rateLimits.get(userId) || 0
    const now = Date.now()

    if (now - lastRequest < 1000) {
        return false // Too fast
    }

    rateLimits.set(userId, now)
    return true
}

// GET - Find nearby pharmacies
export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Rate limiting
        if (!checkRateLimit(session.userId)) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please wait 1 second between requests." },
                { status: 429 }
            )
        }

        const { searchParams } = new URL(req.url)
        const lat = searchParams.get("lat")
        const lon = searchParams.get("lon")
        const radius = searchParams.get("radius") || "2000" // meters

        if (!lat || !lon) {
            return NextResponse.json(
                { error: "Latitude and longitude are required" },
                { status: 400 }
            )
        }

        // Cache lookup block removed

        console.log("[OSM] Cache MISS, fetching from Overpass API...")

        let pharmacies = []

        try {
            // Try Overpass API first (more reliable for POI data)
            const overpassQuery = `
                [out:json][timeout:15];
                (
                    node["amenity"="pharmacy"](around:${radius},${lat},${lon});
                    way["amenity"="pharmacy"](around:${radius},${lat},${lon});
                );
                out body;
            `

            const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`

            const response = await fetchNative(overpassUrl, {
                "User-Agent": USER_AGENT,
                "Connection": "close"
            }).catch(async (fetchError) => {
                console.warn("[OSM] Primary fetch failed, retrying...")
                return fetchNative(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=test`, {
                    "User-Agent": USER_AGENT,
                    "Connection": "close"
                }).then(() => {
                    throw new Error("Switching to Nominatim")
                }).catch(() => {
                    throw fetchError
                })
            })

            if (!response.ok) {
                console.warn(`[OSM] Overpass API returned ${response.status}, falling back to Nominatim`)
                throw new Error(`Overpass API error: ${response.status}`)
            }

            const data = await response.json()

            if (!data.elements || data.elements.length === 0) {
                console.log("[OSM] No pharmacies found in Overpass, trying Nominatim...")
                throw new Error("No results from Overpass")
            }

            pharmacies = data.elements.map((element: any) => {
                // Build a comprehensive address from OSM tags
                const tags = element.tags || {}
                let address = ""

                // Try to build full address from components
                if (tags["addr:full"]) {
                    address = tags["addr:full"]
                } else {
                    // Build address from components
                    const addressParts = []
                    if (tags["addr:housenumber"]) addressParts.push(tags["addr:housenumber"])
                    if (tags["addr:street"]) addressParts.push(tags["addr:street"])
                    if (tags["addr:city"]) addressParts.push(tags["addr:city"])
                    if (tags["addr:postcode"]) addressParts.push(tags["addr:postcode"])

                    address = addressParts.join(", ")
                }

                return {
                    id: element.id,
                    name: tags.name || "Unnamed Pharmacy",
                    lat: element.lat || element.center?.lat,
                    lon: element.lon || element.center?.lon,
                    address: address,
                    phone: tags.phone || "",
                    openingHours: tags.opening_hours || ""
                }
            })

            console.log(`[OSM] Found ${pharmacies.length} pharmacies from Overpass API`)

        } catch (overpassError) {
            // Fallback to Nominatim API
            console.log("[OSM] Falling back to Nominatim API...")
            console.error("[OSM] Overpass error:", overpassError)

            try {
                const nominatimUrl = `${NOMINATIM_API}/search?` + new URLSearchParams({
                    q: "pharmacy",
                    format: "json",
                    lat: lat.toString(),
                    lon: lon.toString(),
                    radius: radius,
                    addressdetails: "1",
                    extratags: "1",
                    limit: "50"
                })

                const nominatimResponse = await fetchNative(nominatimUrl, {
                    "User-Agent": USER_AGENT,
                    "Connection": "close"
                })

                if (!nominatimResponse.ok) {
                    throw new Error(`Nominatim API error: ${nominatimResponse.status}`)
                }

                const nominatimData = await nominatimResponse.json()

                pharmacies = nominatimData.map((place: any) => {
                    const addr = place.address || {}
                    const addressParts = []

                    if (addr.house_number) addressParts.push(addr.house_number)
                    if (addr.road) addressParts.push(addr.road)
                    if (addr.city || addr.town || addr.village) {
                        addressParts.push(addr.city || addr.town || addr.village)
                    }
                    if (addr.postcode) addressParts.push(addr.postcode)

                    return {
                        id: parseInt(place.place_id),
                        name: place.name || place.display_name?.split(",")[0] || "Unnamed Pharmacy",
                        lat: parseFloat(place.lat),
                        lon: parseFloat(place.lon),
                        address: addressParts.join(", "),
                        phone: place.extratags?.phone || "",
                        openingHours: place.extratags?.opening_hours || ""
                    }
                })

                console.log(`[OSM] Found ${pharmacies.length} pharmacies from Nominatim API`)

            } catch (nominatimError) {
                console.error("[OSM] Nominatim error:", nominatimError)
                throw new Error("Both Overpass and Nominatim APIs failed")
            }
        }

        // Get user's spending history per pharmacy
        const expenses = await prisma.medicineExpense.findMany({
            where: {
                userId: session.userId,
                pharmacyName: { not: null }
            },
            select: {
                pharmacyName: true,
                price: true
            }
        })

        // Calculate total spending per pharmacy
        const spendingMap = new Map<string, number>()
        expenses.forEach((e: { pharmacyName: string | null; price: number }) => {
            if (e.pharmacyName) {
                const current = spendingMap.get(e.pharmacyName) || 0
                spendingMap.set(e.pharmacyName, current + e.price)
            }
        })

        // Enrich pharmacy data with spending insights
        const enrichedPharmacies: EnrichedPharmacy[] = pharmacies.map((p: Pharmacy) => ({
            ...p,
            totalSpent: spendingMap.get(p.name) || 0,
            visitCount: expenses.filter((e: { pharmacyName: string | null }) => e.pharmacyName === p.name).length
        }))

        const result = {
            pharmacies: enrichedPharmacies,
            insights: {
                cheapestPharmacy: enrichedPharmacies.length > 0
                    ? enrichedPharmacies.reduce((min: EnrichedPharmacy, p: EnrichedPharmacy) =>
                        (p.totalSpent > 0 && p.totalSpent < min.totalSpent) ? p : min
                    )
                    : null,
                mostVisited: enrichedPharmacies.length > 0
                    ? enrichedPharmacies.reduce((max: EnrichedPharmacy, p: EnrichedPharmacy) =>
                        p.visitCount > max.visitCount ? p : max
                    )
                    : null
            }
        }

        // Cache set removed
        return NextResponse.json(result)

    } catch (error) {
        console.error("Error fetching pharmacies:", error)
        // Return empty results with helpful message instead of 500 error
        return NextResponse.json({
            pharmacies: [],
            insights: { cheapestPharmacy: null, mostVisited: null },
            error: "Unable to connect to map services. Please check your network connection or firewall settings."
        }, { status: 200 })
    }
}
