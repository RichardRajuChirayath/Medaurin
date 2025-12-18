"use client"

import { useState } from "react"
import { MapPin, Navigation, Store, TrendingDown, Star, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Pharmacy {
    id: number
    name: string
    lat: number
    lon: number
    address: string
    phone: string
    openingHours: string
    totalSpent: number
    visitCount: number
}

interface PharmacyData {
    pharmacies: Pharmacy[]
    insights: {
        cheapestPharmacy: Pharmacy | null
        mostVisited: Pharmacy | null
    }
}

export function PharmacyFinder() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<PharmacyData | null>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)

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
                await fetchPharmacies(latitude, longitude)
            },
            (error) => {
                toast.error("Unable to get your location")
                console.error(error)
                setLoading(false)
            }
        )
    }

    const fetchPharmacies = async (lat: number, lon: number) => {
        try {
            const res = await fetch(`/api/expenses/pharmacies?lat=${lat}&lon=${lon}&radius=2000`)

            if (res.status === 429) {
                toast.error("Rate limit exceeded. Please wait 1 second.")
                return
            }

            if (res.ok) {
                const result = await res.json()
                setData(result)
                if (result.error) {
                    toast.warning(result.error, { duration: 5000 })
                } else if (result.pharmacies.length === 0) {
                    toast.info("No pharmacies found in this area")
                } else {
                    toast.success(`Found ${result.pharmacies.length} pharmacies nearby!`)
                }
            } else {
                toast.error("Failed to fetch pharmacies")
            }
        } catch (error) {
            toast.error("Network error. Please check your connection.")
        } finally {
            setLoading(false)
        }
    }

    const openInMaps = (lat: number, lon: number, name: string, address?: string) => {
        // Build destination query using name and address to prevent Google Maps from snapping to wrong POIs
        let destinationQuery = name

        if (address && address.trim()) {
            // If address is available, use: "Name, Address"
            destinationQuery = `${name}, ${address}`
        } else {
            // Fallback: use name with coordinates to help Google Maps locate it
            destinationQuery = `${name}, ${lat},${lon}`
        }

        // Properly encode the destination query
        const encodedDestination = encodeURIComponent(destinationQuery)
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`

        window.open(url, "_blank")
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                        Find Nearby Pharmacies
                    </CardTitle>
                    <CardDescription>
                        Discover pharmacies near you and see where you've spent the least
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!data ? (
                        <div className="text-center py-12">
                            <MapPin className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Allow location access to find pharmacies within 2km
                            </p>
                            <Button
                                onClick={requestLocation}
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-4 h-4 mr-2" />
                                        Find Pharmacies Near Me
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Insights Cards */}
                            {data.insights.cheapestPharmacy && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                                        <CardHeader className="pb-2">
                                            <CardDescription className="flex items-center gap-2">
                                                <TrendingDown className="w-4 h-4 text-green-600" />
                                                Cheapest Pharmacy
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="font-bold text-lg">{data.insights.cheapestPharmacy.name}</p>
                                            <p className="text-sm text-green-600">₹{data.insights.cheapestPharmacy.totalSpent.toFixed(2)} total spent</p>
                                        </CardContent>
                                    </Card>

                                    {data.insights.mostVisited && (
                                        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
                                            <CardHeader className="pb-2">
                                                <CardDescription className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-purple-600" />
                                                    Most Visited
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="font-bold text-lg">{data.insights.mostVisited.name}</p>
                                                <p className="text-sm text-purple-600">{data.insights.mostVisited.visitCount} visits</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Pharmacy List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 dark:text-white">
                                        {data.pharmacies.length} Pharmacies Found
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={requestLocation}
                                    >
                                        Refresh
                                    </Button>
                                </div>

                                {data.pharmacies.length === 0 ? (
                                    <p className="text-center py-8 text-slate-500">No pharmacies found in this area</p>
                                ) : (
                                    data.pharmacies.map((pharmacy) => (
                                        <div
                                            key={pharmacy.id}
                                            className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border hover:shadow-md transition"
                                        >
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                                    <Store className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900 dark:text-white">
                                                        {pharmacy.name}
                                                    </h4>
                                                    {pharmacy.address && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                            {pharmacy.address}
                                                        </p>
                                                    )}
                                                    {pharmacy.phone && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            📞 {pharmacy.phone}
                                                        </p>
                                                    )}
                                                    {pharmacy.openingHours && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            🕐 {pharmacy.openingHours}
                                                        </p>
                                                    )}
                                                    <div className="flex gap-2 mt-2">
                                                        {pharmacy.totalSpent > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Spent: ₹{pharmacy.totalSpent.toFixed(2)}
                                                            </Badge>
                                                        )}
                                                        {pharmacy.visitCount > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {pharmacy.visitCount} visits
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openInMaps(pharmacy.lat, pharmacy.lon, pharmacy.name, pharmacy.address)}
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
                        Your spending history helps identify the most cost-effective pharmacies!
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
