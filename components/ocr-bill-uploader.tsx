"use client"

import { useState } from "react"
import { createWorker } from "tesseract.js"
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface ExtractedData {
    medicineName?: string
    price?: number
    quantity?: string
    pharmacyName?: string
    date?: string
    rawText: string
}

interface OCRUploaderProps {
    onDataExtracted: (data: ExtractedData) => void
}

export function OCRBillUploader({ onDataExtracted }: OCRUploaderProps) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [extractedText, setExtractedText] = useState("")

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file (JPG, PNG, etc.)")
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB")
            return
        }

        setIsProcessing(true)
        setProgress(0)

        try {
            // Initialize Tesseract worker
            const worker = await createWorker("eng", 1, {
                logger: (m) => {
                    if (m.status === "recognizing text") {
                        setProgress(Math.round(m.progress * 100))
                    }
                }
            })

            // Perform OCR
            const { data: { text } } = await worker.recognize(file)
            await worker.terminate()

            setExtractedText(text)

            // Extract structured data using regex
            const extractedData = extractDataFromText(text)

            toast.success("Bill scanned successfully!")
            onDataExtracted(extractedData)

        } catch (error) {
            console.error("OCR error:", error)
            toast.error("Failed to process image. Please try again.")
        } finally {
            setIsProcessing(false)
            setProgress(0)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Scan Bill / Invoice
                </CardTitle>
                <CardDescription>
                    Upload a photo of your medicine bill. We'll auto-extract the details using OCR.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isProcessing ? (
                    <label className="block">
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition">
                            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Click to upload bill image
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                JPG, PNG, or PDF (max 10MB)
                            </p>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                ) : (
                    <div className="p-8 text-center">
                        <Loader2 className="w-12 h-12 text-indigo-600 mx-auto mb-3 animate-spin" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Processing image...
                        </p>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500">{progress}% complete</p>
                    </div>
                )}

                {extractedText && (
                    <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Extracted Text (Raw):
                        </p>
                        <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {extractedText}
                        </pre>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Smart regex-based data extraction
function extractDataFromText(text: string): ExtractedData {
    const data: ExtractedData = { rawText: text }

    // Common medicine name patterns (prioritize capitalized words)
    const medicinePattern = /(?:tablet|capsule|syrup|injection|cream|ointment)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/gi
    const medicineMatch = text.match(medicinePattern)
    if (medicineMatch && medicineMatch.length > 0) {
        data.medicineName = medicineMatch[0].replace(/(tablet|capsule|syrup|injection|cream|ointment)\s*/gi, "").trim()
    }

    // Price patterns (₹, Rs., INR, etc.)
    const pricePattern = /(?:₹|Rs\.?|INR)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i
    const priceMatch = text.match(pricePattern)
    if (priceMatch) {
        data.price = parseFloat(priceMatch[1].replace(/,/g, ""))
    }

    // Fallback: Look for standalone numbers that could be prices
    if (!data.price) {
        const standalonePricePattern = /\b(\d{2,4}(?:\.\d{2})?)\b/
        const standalonePriceMatch = text.match(standalonePricePattern)
        if (standalonePriceMatch) {
            data.price = parseFloat(standalonePriceMatch[1])
        }
    }

    // Quantity patterns
    const quantityPattern = /(\d+)\s*(?:tablet|capsule|strip|bottle|ml|mg|piece)/i
    const quantityMatch = text.match(quantityPattern)
    if (quantityMatch) {
        data.quantity = quantityMatch[0]
    }

    // Date patterns (DD/MM/YYYY, DD-MM-YYYY, etc.)
    const datePattern = /(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/
    const dateMatch = text.match(datePattern)
    if (dateMatch) {
        try {
            const [day, month, year] = dateMatch[0].split(/[-/]/)
            data.date = `${year.length === 2 ? '20' + year : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        } catch (e) {
            // Invalid date format, skip
        }
    }

    // Pharmacy name (look for "pharmacy", "medicals", "chemist" keywords)
    const pharmacyPattern = /([A-Z][a-zA-Z\s]+(?:Pharmacy|Medical|Chemist|Drug Store))/i
    const pharmacyMatch = text.match(pharmacyPattern)
    if (pharmacyMatch) {
        data.pharmacyName = pharmacyMatch[1].trim()
    }

    return data
}
