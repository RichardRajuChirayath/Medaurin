// Test script for Indian Brand mapping
const indianBrands = ["Dolo", "Crocin", "Metrogyl"];

// Mock of the mapping from the API
const BRAND_TO_GENERIC_MAPPING = {
    "dolo": "acetaminophen",
    "crocin": "acetaminophen",
    "metrogyl": "metronidazole"
};

async function testIndianBrandSearch() {
    for (const brand of indianBrands) {
        console.log(`\n--- Testing ${brand} ---`);
        const lowerName = brand.toLowerCase();

        let searchName = brand;
        let isMappedToGeneric = false;

        if (BRAND_TO_GENERIC_MAPPING[lowerName]) {
            searchName = BRAND_TO_GENERIC_MAPPING[lowerName];
            isMappedToGeneric = true;
            console.log(`[Mapping] ✓ Mapped "${brand}" to generic: "${searchName}"`);
        }

        if (isMappedToGeneric) {
            console.log(`[FDA] Searching by substance_name: "${searchName}"`);
            try {
                const response = await fetch(
                    `https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${encodeURIComponent(searchName)}"&limit=1`
                );
                const data = await response.json();
                console.log(`[Result] Found ${data.results?.length || 0} results`);

                if (data.results?.length > 0) {
                    console.log(`[Success] Retrieved FDA data for ${brand} (via ${searchName})`);
                    if (data.results[0].adverse_reactions) {
                        console.log(`[Data] Has adverse reactions data: Yes`);
                    }
                }
            } catch (e) {
                console.error("Error fetching:", e.message);
            }
        } else {
            console.log("Not mapped, would search by brand name.");
        }
    }
}

testIndianBrandSearch();
