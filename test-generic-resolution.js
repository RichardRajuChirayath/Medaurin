const API_URL = 'http://localhost:3000/api/getDrugData';

const TEST_CASES = [
    // UK/International Generic Spellings
    { input: 'Paracetamol', expected: 'Acetaminophen' },
    { input: 'Amoxycillin', expected: 'Amoxicillin' },
    { input: 'Sulphamethoxazole', expected: 'Sulfamethoxazole' },

    // Typos (Should be auto-corrected by RxNorm API)
    { input: 'Motfimin', expected: 'Metformin' }, // Typo
    { input: 'Ibuprofin', expected: 'Ibuprofen' }, // Typo

    // Should still work normally
    { input: 'Acetaminophen', expected: 'Acetaminophen' }, // US Standard
    { input: 'Dolo 650', expected: 'Acetaminophen' }     // Indian Brand
];

async function testGenericResolution() {
    console.log('🌍 TESTING GENERIC NAME RESOLUTION 🌍');
    console.log('=======================================');

    for (const test of TEST_CASES) {
        try {
            console.log(`\nTesting: "${test.input}"...`);
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicines: [test.input] })
            });

            if (res.ok) {
                const data = await res.json();
                const result = data[0];

                // Check if normalized name contains the expected US spelling
                const isMatch = result.normalizedName.toLowerCase().includes(test.expected.toLowerCase());

                if (isMatch) {
                    console.log(`✅ SUCCESS: "${test.input}" -> "${result.normalizedName}" (Expected: ${test.expected})`);
                } else {
                    console.log(`⚠️ VALIDATED BUT MISMATCH: "${test.input}" -> "${result.normalizedName}" (Expected: ${test.expected})`);
                }

            } else {
                const err = await res.json();
                console.log(`❌ FAILED: "${test.input}" rejected.`);
                console.log(`   Reason: ${err.invalidMedicines?.[0]?.reason}`);
            }
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }
}

// Check server and run
fetch('http://localhost:3000').then(() => testGenericResolution()).catch(() => console.log("Server not running. Start with 'npm run dev'"));
