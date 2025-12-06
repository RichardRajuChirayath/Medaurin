// Quick test script to check FDA API
const testMedicine = "ibuprofen";

async function testFDA() {
    try {
        console.log(`Testing FDA API for: ${testMedicine}`);

        const response = await fetch(
            `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${testMedicine}"&limit=1`
        );

        const data = await response.json();
        console.log(`Results found: ${data.results?.length || 0}`);

        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            console.log("\nAvailable fields:");
            console.log("- adverse_reactions:", !!result.adverse_reactions);
            console.log("- drug_interactions:", !!result.drug_interactions);
            console.log("- warnings:", !!result.warnings);

            if (result.adverse_reactions) {
                const text = Array.isArray(result.adverse_reactions)
                    ? result.adverse_reactions.join(' ')
                    : result.adverse_reactions;
                console.log("\nAdverse reactions preview:");
                console.log(text.substring(0, 500));
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

testFDA();
