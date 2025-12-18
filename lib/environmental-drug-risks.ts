/**
 * Environmental Drug Risk Database
 * Maps medications to environmental sensitivities (UV, Heat, Cold, Humidity, Air Quality)
 */

export interface EnvironmentalRisk {
    drugName: string
    rxcui?: string
    activeIngredient: string[]
    risks: {
        uvSensitivity?: {
            severity: "high" | "moderate" | "low"
            threshold: number // UV Index threshold
            description: string
            recommendation: string
        }
        heatSensitivity?: {
            severity: "high" | "moderate" | "low"
            threshold: number // Temperature in Celsius
            description: string
            recommendation: string
        }
        coldSensitivity?: {
            severity: "high" | "moderate" | "low"
            threshold: number // Temperature in Celsius
            description: string
            recommendation: string
        }
        humiditySensitivity?: {
            severity: "high" | "moderate" | "low"
            threshold: number // Humidity percentage
            description: string
            recommendation: string
        }
        airQualitySensitivity?: {
            severity: "high" | "moderate" | "low"
            threshold: number // AQI threshold
            description: string
            recommendation: string
        }
    }
}

export const ENVIRONMENTAL_DRUG_RISKS: EnvironmentalRisk[] = [
    // ANTIBIOTICS - UV Sensitivity
    {
        drugName: "Doxycycline",
        activeIngredient: ["doxycycline"],
        risks: {
            uvSensitivity: {
                severity: "high",
                threshold: 6,
                description: "Causes severe photosensitivity - skin burns easily under UV exposure",
                recommendation: "Apply SPF 50+ sunscreen every 2 hours. Wear protective clothing. Avoid direct sun 10 AM - 4 PM."
            }
        }
    },
    {
        drugName: "Ciprofloxacin",
        activeIngredient: ["ciprofloxacin"],
        risks: {
            uvSensitivity: {
                severity: "high",
                threshold: 6,
                description: "Increases risk of severe sunburn and skin damage",
                recommendation: "Minimize sun exposure. Use broad-spectrum SPF 50+. Cover exposed skin."
            }
        }
    },
    {
        drugName: "Tetracycline",
        activeIngredient: ["tetracycline"],
        risks: {
            uvSensitivity: {
                severity: "moderate",
                threshold: 7,
                description: "May cause photosensitive skin reactions",
                recommendation: "Wear sunscreen SPF 30+. Limit outdoor activities during peak UV hours."
            }
        }
    },

    // BLOOD PRESSURE MEDICATIONS - Heat & Dehydration
    {
        drugName: "Lisinopril",
        activeIngredient: ["lisinopril"],
        risks: {
            heatSensitivity: {
                severity: "high",
                threshold: 35,
                description: "Increases dehydration and heat stroke risk by blocking fluid retention",
                recommendation: "Drink 3-4 liters of water daily. Avoid strenuous outdoor activities. Monitor for dizziness."
            }
        }
    },
    {
        drugName: "Hydrochlorothiazide",
        activeIngredient: ["hydrochlorothiazide"],
        risks: {
            heatSensitivity: {
                severity: "high",
                threshold: 33,
                description: "Diuretic effect accelerates dehydration in hot weather",
                recommendation: "Increase water intake significantly. Limit salt. Stay in air-conditioned spaces. Watch for fatigue."
            },
            uvSensitivity: {
                severity: "moderate",
                threshold: 7,
                description: "Can cause sun-sensitive rashes",
                recommendation: "Use SPF 30+ sunscreen. Wear a hat outdoors."
            }
        }
    },
    {
        drugName: "Amlodipine",
        activeIngredient: ["amlodipine"],
        risks: {
            heatSensitivity: {
                severity: "moderate",
                threshold: 36,
                description: "May impair body's ability to regulate temperature",
                recommendation: "Stay hydrated. Avoid prolonged heat exposure. Monitor blood pressure."
            }
        }
    },

    // DIABETES MEDICATIONS - Temperature Storage
    {
        drugName: "Insulin",
        activeIngredient: ["insulin"],
        risks: {
            heatSensitivity: {
                severity: "high",
                threshold: 30,
                description: "Insulin degrades rapidly in heat, losing effectiveness",
                recommendation: "Store in insulated cooler. Never leave in hot car. Keep refrigerated when possible."
            },
            coldSensitivity: {
                severity: "high",
                threshold: 2,
                description: "Freezing destroys insulin. Do not use if frozen.",
                recommendation: "Keep insulin close to body. Never store in freezer. Discard if frozen."
            }
        }
    },
    {
        drugName: "Metformin",
        activeIngredient: ["metformin"],
        risks: {
            heatSensitivity: {
                severity: "moderate",
                threshold: 35,
                description: "Hot weather can increase risk of lactic acidosis",
                recommendation: "Stay well-hydrated. Monitor blood sugar more frequently. Avoid overexertion in heat."
            }
        }
    },

    // ASTHMA & RESPIRATORY - Cold & Air Quality
    {
        drugName: "Albuterol",
        activeIngredient: ["albuterol", "salbutamol"],
        risks: {
            coldSensitivity: {
                severity: "moderate",
                threshold: 5,
                description: "Cold air can trigger bronchospasm, requiring more frequent dosing",
                recommendation: "Warm inhaler in hands before use. Breathe through nose in cold. Carry rescue inhaler."
            },
            airQualitySensitivity: {
                severity: "high",
                threshold: 100,
                description: "Poor air quality worsens asthma symptoms",
                recommendation: "Stay indoors when AQI > 100. Use air purifier. Increase preventive medication as advised."
            }
        }
    },
    {
        drugName: "Montelukast",
        activeIngredient: ["montelukast"],
        risks: {
            airQualitySensitivity: {
                severity: "moderate",
                threshold: 150,
                description: "High pollution can reduce medication effectiveness",
                recommendation: "Wear N95 mask outdoors. Limit physical activity. Monitor symptoms closely."
            }
        }
    },

    // ANTIHISTAMINES - Heat (drowsiness in heat)
    {
        drugName: "Diphenhydramine",
        activeIngredient: ["diphenhydramine", "benadryl"],
        risks: {
            heatSensitivity: {
                severity: "moderate",
                threshold: 34,
                description: "Reduces sweating, impairing body's cooling mechanism",
                recommendation: "Avoid strenuous activities in heat. Stay in cool environments. Watch for overheating."
            }
        }
    },

    // ACNE MEDICATIONS - UV
    {
        drugName: "Isotretinoin",
        activeIngredient: ["isotretinoin", "accutane"],
        risks: {
            uvSensitivity: {
                severity: "high",
                threshold: 5,
                description: "Extreme photosensitivity - severe burns possible even with brief exposure",
                recommendation: "Mandatory SPF 50+ sunscreen. Reapply every hour. Wear hat and sunglasses. Avoid midday sun."
            }
        }
    },
    {
        drugName: "Tretinoin",
        activeIngredient: ["tretinoin", "retin-a"],
        risks: {
            uvSensitivity: {
                severity: "high",
                threshold: 6,
                description: "Increases skin sensitivity to sunlight significantly",
                recommendation: "Apply sunscreen before going outdoors. Use after sunset only."
            }
        }
    },

    // NSAIDS - UV & Heat
    {
        drugName: "Ibuprofen",
        activeIngredient: ["ibuprofen"],
        risks: {
            uvSensitivity: {
                severity: "low",
                threshold: 8,
                description: "May cause mild photosensitivity in some individuals",
                recommendation: "Use basic sun protection (SPF 30+) during prolonged sun exposure."
            },
            heatSensitivity: {
                severity: "moderate",
                threshold: 36,
                description: "Can impair kidney function when dehydrated in heat",
                recommendation: "Drink extra water. Avoid in extreme heat if possible."
            }
        }
    },

    // ANTICOAGULANTS - Temperature extremes
    {
        drugName: "Warfarin",
        activeIngredient: ["warfarin"],
        risks: {
            heatSensitivity: {
                severity: "moderate",
                threshold: 35,
                description: "Dehydration can affect INR levels unpredictably",
                recommendation: "Maintain consistent hydration. Monitor INR more frequently in hot weather."
            }
        }
    },

    // MENTAL HEALTH - Heat regulation
    {
        drugName: "Lithium",
        activeIngredient: ["lithium"],
        risks: {
            heatSensitivity: {
                severity: "high",
                threshold: 32,
                description: "Dehydration can cause dangerous lithium toxicity",
                recommendation: "Critical: Increase fluid intake significantly. Monitor for confusion, tremors. Check lithium levels."
            }
        }
    },
    {
        drugName: "Risperidone",
        activeIngredient: ["risperidone"],
        risks: {
            heatSensitivity: {
                severity: "moderate",
                threshold: 35,
                description: "Impairs body's temperature regulation mechanisms",
                recommendation: "Stay in air-conditioned spaces. Avoid overheating. Monitor for heat exhaustion."
            }
        }
    },

    // THYROID - Storage
    {
        drugName: "Levothyroxine",
        activeIngredient: ["levothyroxine", "thyroxine"],
        risks: {
            heatSensitivity: {
                severity: "moderate",
                threshold: 25,
                description: "Heat and humidity degrade medication potency",
                recommendation: "Store in cool, dry place. Keep in original container. Check expiration frequently."
            },
            humiditySensitivity: {
                severity: "moderate",
                threshold: 70,
                description: "Moisture reduces effectiveness",
                recommendation: "Use desiccant packets. Keep bottle tightly closed."
            }
        }
    },

    // MIGRAINE - Weather changes
    {
        drugName: "Sumatriptan",
        activeIngredient: ["sumatriptan"],
        risks: {
            heatSensitivity: {
                severity: "moderate",
                threshold: 34,
                description: "Extreme heat can trigger migraines, increasing medication need",
                recommendation: "Stay cool and hydrated. Keep medication readily available."
            }
        }
    }
]

/**
 * Search for environmental risks by drug name or active ingredient
 */
export function findEnvironmentalRisks(medicationName: string): EnvironmentalRisk | undefined {
    const normalizedName = medicationName.toLowerCase().trim()

    return ENVIRONMENTAL_DRUG_RISKS.find(risk => {
        // Check drug name
        if (risk.drugName.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(risk.drugName.toLowerCase())) {
            return true
        }

        // Check active ingredients
        return risk.activeIngredient.some(ingredient =>
            ingredient.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(ingredient.toLowerCase())
        )
    })
}

/**
 * Get all risks for a list of medications
 */
export function getAllEnvironmentalRisks(medications: string[]): EnvironmentalRisk[] {
    const risks: EnvironmentalRisk[] = []

    medications.forEach(med => {
        const risk = findEnvironmentalRisks(med)
        if (risk) {
            risks.push(risk)
        }
    })

    return risks
}
