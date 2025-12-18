"use client"

import { useState, useEffect } from "react"
import {
    Cloud, Sun, Droplets, Wind, AlertTriangle, CheckCircle,
    ThermometerSun, Snowflake, Shield, RefreshCw, MapPin
} from "lucide-react"
import { toast } from "sonner"

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
    aqi: number
}

interface WeatherHealthData {
    alerts: HealthAlert[]
    weather: WeatherData | null
    medicationsMonitored: number
    totalMedications: number
    message?: string
}

export function WeatherHealthShield() {
    const [data, setData] = useState<WeatherHealthData | null>(null)
    const [loading, setLoading] = useState(true)
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const fetchHealthAlerts = async (lat: number, lon: number) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/weather/health-alerts?lat=${lat}&lon=${lon}`)

            if (!response.ok) {
                console.log("Weather health alerts unavailable (this is optional)")
                setLoading(false) // Ensure loading state is reset even on non-OK response
                return // Silently fail - weather is not critical
            }

            const result = await response.json()
            setData(result)
            setLastUpdate(new Date())

            // Show toast for critical alerts
            const criticalAlerts = result.alerts?.filter((a: HealthAlert) => a.severity === "critical")
            if (criticalAlerts && criticalAlerts.length > 0) {
                toast.error(`${criticalAlerts.length} Critical Weather Alert(s)`, {
                    description: "Check Weather Health Shield immediately",
                    duration: 10000
                })
            }
        } catch (error) {
            console.error("Error fetching health alerts:", error)
            toast.error("Failed to fetch weather alerts")
        } finally {
            setLoading(false)
        }
    }

    const getLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported")
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setLocation({ lat: latitude, lon: longitude })
                fetchHealthAlerts(latitude, longitude)
            },
            (error) => {
                console.error("Geolocation error:", error)
                toast.error("Please enable location access for personalized alerts")
                setLoading(false)
            }
        )
    }

    useEffect(() => {
        getLocation()

        // Auto-refresh every 30 minutes
        const interval = setInterval(() => {
            if (location) {
                fetchHealthAlerts(location.lat, location.lon)
            }
        }, 30 * 60 * 1000)

        return () => clearInterval(interval)
    }, [])

    const handleRefresh = () => {
        if (location) {
            fetchHealthAlerts(location.lat, location.lon)
        } else {
            getLocation()
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "from-red-500 to-rose-600"
            case "high":
                return "from-orange-500 to-amber-600"
            case "moderate":
                return "from-yellow-500 to-orange-500"
            case "low":
                return "from-blue-500 to-indigo-600"
            default:
                return "from-slate-500 to-slate-600"
        }
    }

    const getSeverityBorderColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "border-red-500 dark:border-red-400"
            case "high":
                return "border-orange-500 dark:border-orange-400"
            case "moderate":
                return "border-yellow-500 dark:border-yellow-400"
            case "low":
                return "border-blue-500 dark:border-blue-400"
            default:
                return "border-slate-500 dark:border-slate-400"
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "uv":
                return <Sun className="w-5 h-5" />
            case "heat":
                return <ThermometerSun className="w-5 h-5" />
            case "cold":
                return <Snowflake className="w-5 h-5" />
            case "humidity":
                return <Droplets className="w-5 h-5" />
            case "airQuality":
                return <Wind className="w-5 h-5" />
            default:
                return <Cloud className="w-5 h-5" />
        }
    }

    const getAQILevel = (aqi: number) => {
        if (aqi <= 50) return { label: "Good", color: "text-green-600 dark:text-green-400" }
        if (aqi <= 100) return { label: "Moderate", color: "text-yellow-600 dark:text-yellow-400" }
        if (aqi <= 150) return { label: "Unhealthy (Sensitive)", color: "text-orange-600 dark:text-orange-400" }
        if (aqi <= 200) return { label: "Unhealthy", color: "text-red-600 dark:text-red-400" }
        if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-600 dark:text-purple-400" }
        return { label: "Hazardous", color: "text-rose-600 dark:text-rose-400" }
    }

    const getUVLevel = (uv: number) => {
        if (uv <= 2) return { label: "Low", color: "text-green-600" }
        if (uv <= 5) return { label: "Moderate", color: "text-yellow-600" }
        if (uv <= 7) return { label: "High", color: "text-orange-600" }
        if (uv <= 10) return { label: "Very High", color: "text-red-600" }
        return { label: "Extreme", color: "text-purple-600" }
    }

    if (loading) {
        return (
            <div className="glass-card p-8 animate-pulse">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-8 w-64 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-10 w-10 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                </div>
                <div className="space-y-4">
                    <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                    <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="glass-card p-8">
                <div className="text-center py-8">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Location Required
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Enable location to get personalized weather-health alerts
                    </p>
                    <button
                        onClick={getLocation}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                    >
                        Enable Location
                    </button>
                </div>
            </div>
        )
    }

    const { alerts, weather, medicationsMonitored, totalMedications, message } = data
    const aqiLevel = weather ? getAQILevel(weather.aqi) : null
    const uvLevel = weather ? getUVLevel(weather.current.uvIndex) : null

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Shield className="w-8 h-8 text-white" />
                                <h2 className="text-3xl font-black text-white">Weather Health Shield</h2>
                            </div>
                            <p className="text-indigo-100 text-lg">
                                Real-time environmental safety monitoring
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-xl transition-all hover:rotate-180 duration-500"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {weather && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ThermometerSun className="w-5 h-5 text-white" />
                                    <span className="text-sm text-indigo-100">Temperature</span>
                                </div>
                                <div className="text-3xl font-black text-white">{Math.round(weather.current.temperature)}°C</div>
                                <div className="text-xs text-indigo-200 mt-1">Feels {Math.round(weather.current.apparentTemperature)}°C</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sun className="w-5 h-5 text-white" />
                                    <span className="text-sm text-indigo-100">UV Index</span>
                                </div>
                                <div className="text-3xl font-black text-white">{weather.current.uvIndex.toFixed(1)}</div>
                                <div className={`text-xs font-bold mt-1 ${uvLevel?.color}`}>{uvLevel?.label}</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Droplets className="w-5 h-5 text-white" />
                                    <span className="text-sm text-indigo-100">Humidity</span>
                                </div>
                                <div className="text-3xl font-black text-white">{Math.round(weather.current.humidity)}%</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Wind className="w-5 h-5 text-white" />
                                    <span className="text-sm text-indigo-100">Air Quality</span>
                                </div>
                                <div className="text-3xl font-black text-white">{Math.round(weather.aqi)}</div>
                                <div className={`text-xs font-bold mt-1 ${aqiLevel?.color}`}>{aqiLevel?.label}</div>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex items-center justify-between text-sm text-indigo-100">
                        <div>
                            Monitoring <span className="font-bold text-white">{medicationsMonitored}</span> of{" "}
                            <span className="font-bold text-white">{totalMedications}</span> medications
                        </div>
                        {lastUpdate && (
                            <div className="text-xs">
                                Updated {lastUpdate.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            {alerts && alerts.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        Active Health Alerts ({alerts.length})
                    </h3>
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`glass-card border-l-4 ${getSeverityBorderColor(alert.severity)} p-6 hover:shadow-xl transition-all duration-300`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 bg-gradient-to-br ${getSeverityColor(alert.severity)} rounded-xl text-white`}>
                                    {getTypeIcon(alert.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white">
                                            {alert.title}
                                        </h4>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${alert.severity === "critical" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                            alert.severity === "high" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                                "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            }`}>
                                            {alert.severity}
                                        </span>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 mb-3">
                                        {alert.description}
                                    </p>
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                                                    Recommended Action:
                                                </div>
                                                <div className="text-sm text-indigo-700 dark:text-indigo-400">
                                                    {alert.recommendation}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                        <span>Current: <span className="font-bold">{alert.currentValue.toFixed(1)}</span></span>
                                        <span>•</span>
                                        <span>Threshold: <span className="font-bold">{alert.threshold}</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-8">
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                            All Clear! 🎉
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {message || "No environmental health alerts for your medications today. Current weather conditions are safe."}
                        </p>
                    </div>
                </div>
            )}

            {/* Info Footer */}
            <div className="glass-card p-6">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        <p className="font-bold text-slate-900 dark:text-white mb-1">How it works:</p>
                        <p>
                            Weather Health Shield monitors real-time environmental conditions and cross-references them with your medication list to provide personalized safety alerts.
                            This includes UV sensitivity, heat/cold risks, air quality impacts, and storage conditions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
