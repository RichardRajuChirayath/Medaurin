#!/usr/bin/env node

/**
 * FDA FALSE-POSITIVE FIX - AUTOMATED TEST
 * 
 * This script tests that random words (packaging, office, etc.)
 * are now correctly REJECTED instead of being accepted as medicines.
 */

const API_URL = 'http://localhost:3000/api/getDrugData'

// Words that should FAIL (were false positives before fix)
const SHOULD_REJECT = [
    'packaging',
    'area',
    'office',
    'road',
    'industrial',
    'protect',
    'formulation',
    'limited',
    'powerful',
    'brand',
    'fast',
    'care'
]

// Words that should PASS (real medicines)
const SHOULD_ACCEPT = [
    'aspirin',
    'paracetamol',
    'ibuprofen',
    'metformin'
]

async function testWord(word, shouldBeValid) {
    console.log(`\nTesting: "${word}" (expect: ${shouldBeValid ? 'VALID' : 'INVALID'})`)

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ medicines: [word] })
        })

        const data = await response.json()

        if (shouldBeValid) {
            // Should be accepted (200)
            if (response.ok) {
                console.log(`  ✅ PASS: "${word}" correctly accepted`)
                return true
            } else {
                console.log(`  ❌ FAIL: "${word}" should be valid but was rejected`)
                console.log(`  Reason: ${data.invalidMedicines?.[0]?.reason}`)
                return false
            }
        } else {
            // Should be rejected (400)
            if (!response.ok && response.status === 400) {
                console.log(`  ✅ PASS: "${word}" correctly rejected`)
                console.log(`  Reason: ${data.invalidMedicines?.[0]?.reason}`)
                return true
            } else {
                console.log(`  ❌ FAIL: "${word}" should be invalid but was accepted`)
                return false
            }
        }
    } catch (error) {
        console.log(`  ❌ ERROR: ${error.message}`)
        return false
    }
}

async function runTests() {
    console.log('='.repeat(60))
    console.log('FDA FALSE-POSITIVE FIX - AUTOMATED TEST')
    console.log('='.repeat(60))

    let passed = 0
    let failed = 0

    // Test rejections
    console.log('\n📛 TESTING FALSE POSITIVES (should be REJECTED):')
    for (const word of SHOULD_REJECT) {
        const result = await testWord(word, false)
        if (result) passed++
        else failed++
    }

    // Test acceptances
    console.log('\n✅ TESTING REAL MEDICINES (should be ACCEPTED):')
    for (const word of SHOULD_ACCEPT) {
        const result = await testWord(word, true)
        if (result) passed++
        else failed++
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Tests: ${passed + failed}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)

    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! FDA false-positive issue is FIXED!')
    } else {
        console.log('\n⚠️  Some tests failed. Check the output above.')
    }
    console.log('='.repeat(60))

    process.exit(failed === 0 ? 0 : 1)
}

// Check if server is running
async function checkServer() {
    try {
        const response = await fetch('http://localhost:3000')
        if (!response.ok) throw new Error('Server not responding')
    } catch (error) {
        console.error('❌ Error: Development server not running!')
        console.error('Please start the server with: npm run dev')
        process.exit(1)
    }
}

// Run tests
checkServer()
    .then(() => runTests())
    .catch(error => {
        console.error('Test error:', error)
        process.exit(1)
    })
