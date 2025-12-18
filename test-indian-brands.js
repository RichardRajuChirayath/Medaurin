const { validateMedicineName } = require('./lib/medicine-validator');

// Mock cache to avoid compilation errors in node environment if needed
// Or simply rely on the fact that we can't easily run this in isolation without full environment
// Instead I will create a test that hits the API endpoint which uses the new logic.

const API_URL = 'http://localhost:3000/api/getDrugData';

const INDIAN_BRANDS = [
    'Dolo 650',
    'Calpol',
    'Pan D',
    'Saridon',
    'Augmentin',
    'Allegra'
];

async function testIndianBrands() {
    console.log('🇮🇳 TESTING INDIAN BRAND RECOGNITION 🇮🇳');
    console.log('=======================================');

    for (const brand of INDIAN_BRANDS) {
        try {
            console.log(`\nTesting: "${brand}"...`);
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicines: [brand] })
            });

            if (res.ok) {
                const data = await res.json();
                const result = data[0];
                console.log(`✅ SUCCESS: "${brand}" validated!`);
                console.log(`   -> Normalized Name: ${result.normalizedName}`); // Should be Generic (e.g., Acetaminophen)
                console.log(`   -> RxCUI: ${result.rxcui} (Found in RxNorm via generic mapping)`);
            } else {
                const err = await res.json();
                console.log(`❌ FAILED: "${brand}" rejected.`);
                console.log(`   Reason: ${err.invalidMedicines?.[0]?.reason}`);
            }
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }
}

// Check server and run
fetch('http://localhost:3000').then(() => testIndianBrands()).catch(() => console.log("Server not running. Start with 'npm run dev'"));
