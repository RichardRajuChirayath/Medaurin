import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { getAllEnvironmentalRisks, EnvironmentalRisk } from "@/lib/environmental-drug-risks"
import { fetchNative } from "@/lib/fetch-native"

interface WeatherData {
    current: {
        temperature: number
        humidity: number
        uvIndex: number
        apparentTemperature: number
    }
    forecast: {
        maxTemp: number
        minTemp: number
        maxUV: number
    }
}

interface HealthAlert {
    id: string
    severity: "critical" | "high" | "moderate" | "low"
    type: "uv" | "heat" | "cold" | "humidity" | "airQuality"
    medication: string
    title: string
    description: string
    recommendation: string
    currentValue: number
    threshold: number
}

// Rate limiting
const rateLimits = new Map<string, number>()

function checkRateLimit(userId: string): boolean {
    const lastRequest = rateLimits.get(userId) || 0
    const now = Date.now()

    if (now - lastRequest < 30000) { // 30 seconds
        return false
    }

    rateLimits.set(userId, now)
    return true
}

/**
 * Fetch weather data from Open-Meteo API (100% free, no API key)
 */
async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,uv_index&daily=temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto&forecast_days=1`

    const response = await fetchNative(url, {
        "User-Agent": "Medaurin/1.0 (Health App)",
        "Connection": "close"
    })

    if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()

    return {
        current: {
            temperature: data.current.temperature_2m,
            humidity: data.current.relative_humidity_2m,
            uvIndex: data.current.uv_index,
            apparentTemperature: data.current.apparent_temperature
        },
        forecast: {
            maxTemp: data.daily.temperature_2m_max[0],
            minTemp: data.daily.temperature_2m_min[0],
            maxUV: data.daily.uv_index_max[0]
        }
    }
}

/**
 * Fetch Air Quality Index from Open-Meteo (free)
 */
async function fetchAirQuality(lat: number, lon: number): Promise<number> {
    try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`

        const response = await fetchNative(url, {
            "User-Agent": "Medaurin/1.0 (Health App)",
            "Connection": "close"
        })

        if (!response.ok) {
            return 50 // Default moderate AQI if API fails
        }

        const data = await response.json()
        return data.current.us_aqi || 50
    } catch (error) {
        console.error("[AQI] Error fetching air quality:", error)
        return 50 // Default
    }
}

/**
 * Generate health alerts based on weather and medications
 */
function generateHealthAlerts(
    weather: WeatherData,
    aqi: number,
    medicationRisks: EnvironmentalRisk[]
): HealthAlert[] {
    const alerts: HealthAlert[] = []

    medicationRisks.forEach(risk => {
        // Check UV Index
        if (risk.risks.uvSensitivity && weather.current.uvIndex >= risk.risks.uvSensitivity.threshold) {
            alerts.push({
                id: `uv-${risk.drugName}`,
                severity: risk.risks.uvSensitivity.severity === "high" ? "critical" :
                    risk.risks.uvSensitivity.severity === "moderate" ? "high" : "moderate",
                type: "uv",
                medication: risk.drugName,
                title: `⚠️ UV Alert: ${risk.drugName}`,
                description: risk.risks.uvSensitivity.description,
                recommendation: risk.risks.uvSensitivity.recommendation,
                currentValue: weather.current.uvIndex,
                threshold: risk.risks.uvSensitivity.threshold
            })
        }

        // Check Heat
        if (risk.risks.heatSensitivity && weather.current.temperature >= risk.risks.heatSensitivity.threshold) {
            alerts.push({
                id: `heat-${risk.drugName}`,
                severity: risk.risks.heatSensitivity.severity === "high" ? "critical" :
                    risk.risks.heatSensitivity.severity === "moderate" ? "high" : "moderate",
                type: "heat",
                medication: risk.drugName,
                title: `🌡️ Heat Warning: ${risk.drugName}`,
                description: risk.risks.heatSensitivity.description,
                recommendation: risk.risks.heatSensitivity.recommendation,
                currentValue: weather.current.temperature,
                threshold: risk.risks.heatSensitivity.threshold
            })
        }

        // Check Cold
        if (risk.risks.coldSensitivity && weather.current.temperature <= risk.risks.coldSensitivity.threshold) {
            alerts.push({
                id: `cold-${risk.drugName}`,
                severity: risk.risks.coldSensitivity.severity === "high" ? "critical" :
                    risk.risks.coldSensitivity.severity === "moderate" ? "high" : "moderate",
                type: "cold",
                medication: risk.drugName,
                title: `❄️ Cold Alert: ${risk.drugName}`,
                description: risk.risks.coldSensitivity.description,
                recommendation: risk.risks.coldSensitivity.recommendation,
                currentValue: weather.current.temperature,
                threshold: risk.risks.coldSensitivity.threshold
            })
        }

        // Check Humidity
        if (risk.risks.humiditySensitivity && weather.current.humidity >= risk.risks.humiditySensitivity.threshold) {
            alerts.push({
                id: `humidity-${risk.drugName}`,
                severity: risk.risks.humiditySensitivity.severity === "high" ? "high" : "moderate",
                type: "humidity",
                medication: risk.drugName,
                title: `💧 Humidity Alert: ${risk.drugName}`,
                description: risk.risks.humiditySensitivity.description,
                recommendation: risk.risks.humiditySensitivity.recommendation,
                currentValue: weather.current.humidity,
                threshold: risk.risks.humiditySensitivity.threshold
            })
        }

        // Check Air Quality
        if (risk.risks.airQualitySensitivity && aqi >= risk.risks.airQualitySensitivity.threshold) {
            alerts.push({
                id: `aqi-${risk.drugName}`,
                severity: risk.risks.airQualitySensitivity.severity === "high" ? "critical" : "high",
                type: "airQuality",
                medication: risk.drugName,
                title: `🏭 Air Quality Alert: ${risk.drugName}`,
                description: risk.risks.airQualitySensitivity.description,
                recommendation: risk.risks.airQualitySensitivity.recommendation,
                currentValue: aqi,
                threshold: risk.risks.airQualitySensitivity.threshold
            })
        }
    })

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 }
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return alerts
}

export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Rate limiting
        if (!checkRateLimit(session.userId)) {
            return NextResponse.json(
                { error: "Please wait 30 seconds between requests" },
                { status: 429 }
            )
        }

        const { searchParams } = new URL(req.url)
        const lat = searchParams.get("lat")
        const lon = searchParams.get("lon")

        if (!lat || !lon) {
            return NextResponse.json(
                { error: "Location (lat, lon) required" },
                { status: 400 }
            )
        }

        // Get user's current medications
        const medications = await prisma.medication.findMany({
            where: {
                userId: session.userId
            },
            select: {
                medicineName: true
            }
        })

        if (medications.length === 0) {
            return NextResponse.json({
                alerts: [],
                weather: null,
                message: "Add medications to your profile to get personalized health alerts"
            })
        }

        // Fetch weather data
        const weather = await fetchWeatherData(parseFloat(lat), parseFloat(lon))

        // Fetch air quality
        const aqi = await fetchAirQuality(parseFloat(lat), parseFloat(lon))

        // Get environmental risks for user's medications
        const medicationNames = medications.map(m => m.medicineName)
        const medicationRisks = getAllEnvironmentalRisks(medicationNames)

        // Generate personalized alerts
        const alerts = generateHealthAlerts(weather, aqi, medicationRisks)

        return NextResponse.json({
            alerts,
            weather: {
                ...weather,
                aqi
            },
            medicationsMonitored: medicationRisks.length,
            totalMedications: medications.length
        })

    } catch (error) {
        console.error("Error generating health alerts:", error)
        return NextResponse.json({
            error: "Failed to fetch weather alerts",
            alerts: [],
            weather: null
        }, { status: 500 })
    }
}
