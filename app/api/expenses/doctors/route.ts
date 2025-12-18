import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { fetchNative } from "@/lib/fetch-native"

const NOMINATIM_API = "https://nominatim.openstreetmap.org"
const USER_AGENT = "Medaurin/1.0" // Required by OSM policy

// Type definitions
interface Doctor {
    id: number
    name: string
    lat: number
    lon: number
    address: string
    phone: string
    specialty: string
    openingHours: string
    type: string // clinic, hospital, doctor
}

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

// GET - Find nearby doctors/clinics/hospitals
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
        const radius = searchParams.get("radius") || "3000" // 3km default for doctors
        const type = searchParams.get("type") || "all" // all, clinic, hospital, doctor

        if (!lat || !lon) {
            return NextResponse.json(
                { error: "Latitude and longitude are required" },
                { status: 400 }
            )
        }

        console.log(`[OSM-Doctors] Fetching from Overpass API... (type: ${type})`)

        let doctors: Doctor[] = []

        try {
            // Try Overpass API first (more reliable for POI data)
            // Using a slightly more specific query structure to avoid timeout
            let overpassQuery = `[out:json][timeout:25];(`

            // Add nodes and ways for each type
            if (type === "all" || type === "clinic") {
                overpassQuery += `node["amenity"="clinic"](around:${radius},${lat},${lon});way["amenity"="clinic"](around:${radius},${lat},${lon});`
            }

            if (type === "all" || type === "hospital") {
                overpassQuery += `node["amenity"="hospital"](around:${radius},${lat},${lon});way["amenity"="hospital"](around:${radius},${lat},${lon});`
            }

            if (type === "all" || type === "doctor") {
                overpassQuery += `node["amenity"="doctors"](around:${radius},${lat},${lon});way["amenity"="doctors"](around:${radius},${lat},${lon});`
            }

            overpassQuery += `);out center;` // 'out center' is faster than 'out body' for ways

            const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`

            // Use native Node.js https module to bypass fetch/undici issues on Windows
            const response = await fetchNative(overpassUrl, {
                "User-Agent": "Medaurin/1.0 (Health App; Education Project)",
                "Referer": "https://medaurin.app",
                "Connection": "close" // Avoid keep-alive issues
            }).catch(async () => {
                // Retry logic for Overpass
                console.log("[OSM-Doctors] Primary Overpass request failed, retrying...")
                return fetchNative(overpassUrl, {
                    "User-Agent": "Medaurin/1.0",
                    "Connection": "close"
                })
            })

            if (!response.ok) {
                console.warn(`[OSM-Doctors] Overpass API returned ${response.status}, falling back to Nominatim`)
                // Proceed to catch block for fallback
                throw new Error(`Overpass status: ${response.status}`)
            }

            const data = await response.json()

            if (!data.elements || data.elements.length === 0) {
                console.log("[OSM-Doctors] No doctors/clinics found in Overpass, trying Nominatim...")
                throw new Error("No results from Overpass")
            }

            doctors = data.elements.map((element: any) => {
                const tags = element.tags || {}
                // ... mapping logic remains same ...
                let address = tags["addr:full"] || ""
                if (!address) {
                    const parts = []
                    if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"])
                    if (tags["addr:street"]) parts.push(tags["addr:street"])
                    if (tags["addr:city"]) parts.push(tags["addr:city"])
                    if (tags["addr:postcode"]) parts.push(tags["addr:postcode"])
                    address = parts.join(", ")
                }

                // Determine facility type
                const amenityType = tags.amenity || ""
                let facilityType = "clinic"
                if (amenityType === "hospital") facilityType = "hospital"
                else if (amenityType === "doctors") facilityType = "doctor"

                return {
                    id: element.id,
                    name: tags.name || `Unnamed ${facilityType.charAt(0).toUpperCase() + facilityType.slice(1)}`,
                    lat: element.lat || element.center?.lat, // 'out center' provides center for ways
                    lon: element.lon || element.center?.lon,
                    address: address,
                    phone: tags.phone || tags.contact?.phone || "",
                    specialty: tags.healthcare?.speciality || tags.specialty || "",
                    openingHours: tags.opening_hours || "",
                    type: facilityType
                }
            })

            console.log(`[OSM-Doctors] Found ${doctors.length} medical facilities from Overpass API`)

        } catch (overpassError) {
            // Fallback to Nominatim API
            console.log("[OSM-Doctors] Falling back to Nominatim API...")

            try {
                let queryTerm = "doctor"
                if (type === "hospital") queryTerm = "hospital"
                if (type === "clinic") queryTerm = "clinic"

                const rDeg = parseFloat(radius) / 111000
                const latNum = parseFloat(lat)
                const lonNum = parseFloat(lon)
                const viewbox = `${lonNum - rDeg},${latNum + rDeg},${lonNum + rDeg},${latNum - rDeg}`

                const nominatimUrl = `${NOMINATIM_API}/search?` + new URLSearchParams({
                    q: queryTerm,
                    format: "json",
                    viewbox: viewbox,
                    bounded: "1",
                    addressdetails: "1",
                    extratags: "1",
                    limit: "50"
                })

                const nominatimResponse = await fetchNative(nominatimUrl, {
                    "User-Agent": "Medaurin/1.0 (Health App; Education Project)",
                    "Referer": "https://medaurin.app",
                    "Connection": "close"
                })

                if (!nominatimResponse.ok) {
                    throw new Error(`Nominatim API error: ${nominatimResponse.status}`)
                }

                const nominatimData = await nominatimResponse.json()

                // Map Nominatim results
                doctors = nominatimData.map((place: any) => {
                    // ... mapping ...
                    const addr = place.address || {}
                    const addressParts = []
                    if (addr.house_number) addressParts.push(addr.house_number)
                    if (addr.road) addressParts.push(addr.road)
                    if (addr.city || addr.town || addr.village) {
                        addressParts.push(addr.city || addr.town || addr.village)
                    }
                    if (addr.postcode) addressParts.push(addr.postcode)

                    // Infer type
                    const typeGuess = place.type || place.class || "clinic"
                    let facilityType = "clinic"
                    if (typeGuess.includes("hospital")) facilityType = "hospital"
                    else if (typeGuess.includes("doctor")) facilityType = "doctor"

                    return {
                        id: parseInt(place.place_id),
                        name: place.name || place.display_name?.split(",")[0] || "Unnamed Facility",
                        lat: parseFloat(place.lat),
                        lon: parseFloat(place.lon),
                        address: addressParts.join(", "),
                        phone: place.extratags?.phone || "",
                        specialty: place.extratags?.specialty || "",
                        openingHours: place.extratags?.opening_hours || "",
                        type: facilityType
                    }
                })

                console.log(`[OSM-Doctors] Found ${doctors.length} medical facilities from Nominatim API`)

            } catch (nominatimError) {
                console.error("[OSM-Doctors] All providers failed:", nominatimError)
                throw new Error("External API failure")
            }
        }

        // Sort by distance (common for both demo and real data)
        const userLat = parseFloat(lat)
        const userLon = parseFloat(lon)

        const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371e3 // Earth's radius in meters
            const φ1 = lat1 * Math.PI / 180
            const φ2 = lat2 * Math.PI / 180
            const Δφ = (lat2 - lat1) * Math.PI / 180
            const Δλ = (lon2 - lon1) * Math.PI / 180

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

            return R * c // Distance in meters
        }

        const doctorsWithDistance = doctors.map(doc => ({
            ...doc,
            distance: calculateDistance(userLat, userLon, doc.lat, doc.lon)
        })).sort((a, b) => a.distance - b.distance)

        const result = {
            doctors: doctorsWithDistance,
            counts: {
                total: doctorsWithDistance.length,
                clinics: doctorsWithDistance.filter(d => d.type === "clinic").length,
                hospitals: doctorsWithDistance.filter(d => d.type === "hospital").length,
                doctors: doctorsWithDistance.filter(d => d.type === "doctor").length
            }
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error("Error fetching doctors:", error)
        // Return empty results with helpful message instead of 500 error
        return NextResponse.json({
            doctors: [],
            counts: { total: 0, clinics: 0, hospitals: 0, doctors: 0 },
            error: "Unable to connect to map services. Please check your network connection or firewall settings."
        }, { status: 200 })
    }
}
