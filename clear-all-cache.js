#!/usr/bin/env node

/**
 * Clear ALL caches to apply new validation rules
 */

const clearAllCaches = async () => {
    try {
        console.log('🧹 Clearing ALL caches to apply new validation rules...\n')

        const response = await fetch('http://localhost:3000/api/cache', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'clear',
                cacheType: 'all'
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('✅ Success:', result.message)
        console.log('\n📝 Changes Applied:')
        console.log('   • RxNorm now validates USER INPUT (not FDA generic names)')
        console.log('   • Similarity check: >50% required')
        console.log('   • Invalid inputs like "hi" will be rejected\n')
    } catch (error) {
        console.error('❌ Error:', error.message)
        console.log('\n💡 Make sure your Next.js dev server is running on http://localhost:3000')
    }
}

clearAllCaches()
