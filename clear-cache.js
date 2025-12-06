#!/usr/bin/env node

/**
 * Cache Management Script
 * Clears RxNorm cache to force re-validation with new similarity checks
 */

const clearCache = async () => {
    try {
        console.log('🧹 Clearing RxNorm cache to apply new validation rules...\n')

        const response = await fetch('http://localhost:3000/api/cache', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'clear',
                cacheType: 'rxnorm'
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('✅ Success:', result.message)
        console.log('\n📝 Note: The new similarity check will now apply to all medicine lookups.')
        console.log('   Invalid inputs like "hi" will be properly rejected.\n')
    } catch (error) {
        console.error('❌ Error:', error.message)
        console.log('\n💡 Make sure your Next.js dev server is running on http://localhost:3000')
    }
}

clearCache()
