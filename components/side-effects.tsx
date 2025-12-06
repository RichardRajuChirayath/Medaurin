"use client"

import { useState } from "react"
import { ChevronDown, AlertTriangle } from "lucide-react"

interface SideEffectsProps {
  sideEffects: string[]
}

export function SideEffects({ sideEffects }: SideEffectsProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!sideEffects || sideEffects.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
      >
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
          <h3 className="font-bold text-lg">Common Side Effects</h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="p-4 mt-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <ul className="space-y-2">
            {sideEffects.map((effect, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-gray-500">•</span>
                <span>{effect}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
