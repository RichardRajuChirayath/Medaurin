"use client"

import { useState } from "react"
import { MapPin, Navigation, Stethoscope, Activity, Building2, Loader2, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

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
    distance: number // in meters
}

interface DoctorData {
    doctors: Doctor[]
    counts: {
        total: number
        clinics: number
        hospitals: number
        doctors: number
    }
}

export function DoctorFinder() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<DoctorData | null>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
    const [filterType, setFilterType] = useState<"all" | "clinic" | "hospital" | "doctor">("all")

    const requestLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser")
            return
        }

        setLoading(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords
                setUserLocation({ lat: latitude, lon: longitude })
                await fetchDoctors(latitude, longitude, filterType)
            },
            (error) => {
                toast.error("Unable to get your location")
                console.error(error)
                setLoading(false)
            }
        )
    }

    const fetchDoctors = async (lat: number, lon: number, type: string = "all") => {
        try {
            const res = await fetch(`/api/expenses/doctors?lat=${lat}&lon=${lon}&radius=3000&type=${type}`)

            if (res.status === 429) {
                toast.error("Rate limit exceeded. Please wait 1 second.")
                return
            }

            if (res.ok) {
                const result = await res.json()
                setData(result)
                if (result.error) {
                    toast.warning(result.error, { duration: 5000 })
                } else if (result.doctors.length === 0) {
                    toast.info("No medical facilities found in this area")
                } else {
                    toast.success(`Found ${result.doctors.length} medical facilities nearby!`)
                }
            } else {
                toast.error("Failed to fetch medical facilities")
            }
        } catch (error) {
            toast.error("Network error. Please check your connection.")
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = async (type: "all" | "clinic" | "hospital" | "doctor") => {
        setFilterType(type)
        if (userLocation) {
            setLoading(true)
            await fetchDoctors(userLocation.lat, userLocation.lon, type)
        }
    }

    const openInMaps = (lat: number, lon: number, name: string, address?: string) => {
        let destinationQuery = name

        if (address && address.trim()) {
            destinationQuery = `${name}, ${address}`
        } else {
            destinationQuery = `${name}, ${lat},${lon}`
        }

        const encodedDestination = encodeURIComponent(destinationQuery)
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`

        window.open(url, "_blank")
    }

    const formatDistance = (meters: number) => {
        if (meters < 1000) {
            return `${Math.round(meters)}m`
        }
        return `${(meters / 1000).toFixed(1)}km`
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "hospital":
                return <Building2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            case "doctor":
                return <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            default:
                return <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
        }
    }

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case "hospital":
                return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
            case "doctor":
                return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
            default:
                return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                        Find Nearby Doctors & Clinics
                    </CardTitle>
                    <CardDescription>
                        Discover hospitals, clinics, and doctors near you
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!data ? (
                        <div className="text-center py-12">
                            <Stethoscope className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Allow location access to find medical facilities within 3km
                            </p>
                            <Button
                                onClick={requestLocation}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-4 h-4 mr-2" />
                                        Find Medical Facilities Near Me
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Filter Buttons */}
                            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <div className="flex items-center gap-2 mr-2">
                                    <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant={filterType === "all" ? "default" : "outline"}
                                    onClick={() => handleFilterChange("all")}
                                    disabled={loading}
                                >
                                    All ({data.counts.total})
                                </Button>
                                <Button
                                    size="sm"
                                    variant={filterType === "clinic" ? "default" : "outline"}
                                    onClick={() => handleFilterChange("clinic")}
                                    disabled={loading}
                                >
                                    <Activity className="w-3 h-3 mr-1" />
                                    Clinics ({data.counts.clinics})
                                </Button>
                                <Button
                                    size="sm"
                                    variant={filterType === "hospital" ? "default" : "outline"}
                                    onClick={() => handleFilterChange("hospital")}
                                    disabled={loading}
                                >
                                    <Building2 className="w-3 h-3 mr-1" />
                                    Hospitals ({data.counts.hospitals})
                                </Button>
                                <Button
                                    size="sm"
                                    variant={filterType === "doctor" ? "default" : "outline"}
                                    onClick={() => handleFilterChange("doctor")}
                                    disabled={loading}
                                >
                                    <Stethoscope className="w-3 h-3 mr-1" />
                                    Doctors ({data.counts.doctors})
                                </Button>
                            </div>

                            {/* Medical Facilities List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 dark:text-white">
                                        {data.doctors.length} Medical Facilities Found
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={requestLocation}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                                    </Button>
                                </div>

                                {data.doctors.length === 0 ? (
                                    <p className="text-center py-8 text-slate-500">No medical facilities found in this area</p>
                                ) : (
                                    data.doctors.map((doctor) => (
                                        <div
                                            key={doctor.id}
                                            className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border hover:shadow-md transition"
                                        >
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                                    {getTypeIcon(doctor.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start gap-2 mb-1">
                                                        <h4 className="font-bold text-slate-900 dark:text-white">
                                                            {doctor.name}
                                                        </h4>
                                                    </div>
                                                    <div className="flex gap-2 mb-2">
                                                        <Badge className={`text-xs ${getTypeBadgeColor(doctor.type)}`}>
                                                            {doctor.type.charAt(0).toUpperCase() + doctor.type.slice(1)}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            📍 {formatDistance(doctor.distance)}
                                                        </Badge>
                                                    </div>
                                                    {doctor.specialty && (
                                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                                                            🩺 {doctor.specialty}
                                                        </p>
                                                    )}
                                                    {doctor.address && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                            {doctor.address}
                                                        </p>
                                                    )}
                                                    {doctor.phone && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            📞 {doctor.phone}
                                                        </p>
                                                    )}
                                                    {doctor.openingHours && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            🕐 {doctor.openingHours}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openInMaps(doctor.lat, doctor.lon, doctor.name, doctor.address)}
                                                className="ml-4"
                                            >
                                                <Navigation className="w-4 h-4 mr-1" />
                                                Navigate
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                        <strong>💡 Tip:</strong> Data is sourced from OpenStreetMap (free & open-source).
                        Distances are calculated from your current location. Tap "Navigate" to get directions!
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
