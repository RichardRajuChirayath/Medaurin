# 🧪 QUICK TESTING GUIDE

## How to Test the New Validation System

### Test 1: OCR Upload with Valid Medicine
**What to do:**
1. Upload a photo with "Dolo 650" clearly visible
2. Check the response

**Expected Result:**
```json
{
  "medicines": ["Acetaminophen"],
  "validationDetails": [
    {
      "detected": "Dolo",
      "validated": "Acetaminophen",
      "rxcui": "161",
      "source": "RxNorm"
    }
  ]
}
```

### Test 2: OCR Upload with Junk Text
**What to do:**
1. Upload a photo with text like "Fast Relief Tablet MRP Rs.30"
2. Check the response

**Expected Result:**
```json
{
  "medicines": [],
  "message": "No valid medicines found. Rejected candidates: ..."
}
```

### Test 3: Manual Entry - Valid Medicine
**What to do:**
```javascript
POST /api/getDrugData
{
  "medicines": ["Paracetamol"]
}
```

**Expected Result:**
```json
[
  {
    "name": "Paracetamol",
    "fdaText": "...",
    "rxcui": "161",
    "normalizedName": "Acetaminophen",
    "isUnknown": false
  }
]
```

### Test 4: Manual Entry - Invalid Medicine (Typo)
**What to do:**
```javascript
POST /api/getDrugData
{
  "medicines": ["Paracetmol"]  // Note the typo
}
```

**Expected Result:**
```json
{
  "error": "Invalid medicines detected",
  "invalidMedicines": [
    {
      "name": "Paracetmol",
      "reason": "Not found in RxNorm or FDA databases"
    }
  ]
}
```
**HTTP Status:** 400

### Test 5: Duplicate Detection
**What to do:**
```javascript
POST /api/getDrugData
{
  "medicines": ["Paracetamol", "Calpol", "Dolo 650"]
}
```

**Expected Result:**
All three should be validated and deduplicated to just "Acetaminophen" (they all have rxcui=161)

### Test 6: Check Console Logs
**Look for:**
```
[Validator] Validating: "Paracetamol"
[RxNorm] Cache MISS: "paracetamol" - fetching...
[RxNorm] ✅ Match: "paracetamol" → "Acetaminophen" (95.5%)
[FDA] Cache MISS: "paracetamol" - fetching...
[FDA] ✅ Match found for "paracetamol"
[Validator] ✅ VALID: "Paracetamol" - RxNorm match
```

## Common Test Cases

### ✅ Should ACCEPT:
- Paracetamol
- Aspirin
- Ibuprofen
- Dolo (Indian brand)
- Crocin (Indian brand)
- Metformin
- Lisinopril

### ❌ Should REJECT:
- hi
- fast
- tablet
- xyz123
- paracetmol (typo)
- unknown123

## Check Cache Behavior

### First Request (Cache Miss):
```
[RxNorm] Cache MISS: "paracetamol"
[RxNorm] Fetching from API...
[RxNorm] ✅ Match found
[Cache:rxnorm] SET rxnorm:paracetamol...
```

### Second Request (Cache Hit):
```
[RxNorm] Cache HIT: "paracetamol"
[Validator] ✅ VALID: "Paracetamol" - RxNorm match
```

### Invalid Medicine (Also Cached):
```
[RxNorm] Cache MISS: "xyz123"
[RxNorm] ❌ No match for "xyz123"
[Cache:rxnorm] SET rxnorm:xyz123... (with rxcui=null)
```

## Performance Benchmarks

### Expected Response Times:
- **Cache Hit:** < 50ms
- **Cache Miss (RxNorm only):** 200-500ms
- **Cache Miss (RxNorm + FDA):** 500-1000ms
- **Batch (5 medicines, all cached):** < 100ms
- **Batch (5 medicines, all uncached):** 1-2s

## Integration Test Script

```javascript
// Test the full flow
async function testValidation() {
  // Test 1: Valid medicine
  const response1 = await fetch('/api/getDrugData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medicines: ['Aspirin'] })
  })
  console.assert(response1.ok, 'Valid medicine should succeed')
  
  // Test 2: Invalid medicine
  const response2 = await fetch('/api/getDrugData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medicines: ['xyz123'] })
  })
  console.assert(response2.status === 400, 'Invalid medicine should return 400')
  
  // Test 3: Mixed valid and invalid
  const response3 = await fetch('/api/getDrugData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medicines: ['Aspirin', 'xyz123'] })
  })
  console.assert(response3.status === 400, 'ANY invalid medicine should return 400')
  
  console.log('✅ All tests passed!')
}
```

## Debugging Tips

### If validation fails unexpectedly:

1. **Check console logs** for detailed validation steps
2. **Check similarity score** - might be < 70%
3. **Try generic name** instead of brand name
4. **Clear cache** if you think data is stale:
   ```bash
   npm run clear-cache
   ```

### If getting "Not found" errors:

1. **Verify spelling** - must be exact or very similar
2. **Try alternatives:**
   - Brand name → Generic name
   - Generic name → Brand name
3. **Check RxNorm directly:**
   https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=MEDICINE_NAME

### If cache seems broken:

1. **Check cache directory:** `.cache/`
2. **Verify TTL:** Should be auto-deleted after expiry
3. **Check normalized keys:** All should be lowercase

## Success Criteria

✅ The system is working correctly if:

1. Valid medicines are accepted (RxNorm OR FDA match)
2. Invalid medicines are rejected with clear error messages
3. OCR doesn't return junk words like "tablet", "fast", "hi"
4. Duplicates are automatically merged (same rxcui)
5. Cache is being used (see "Cache HIT" in logs)
6. Same validation for OCR and manual entry
7. Error responses include helpful information

## Quick Commands

```bash
# Start dev server
npm run dev

# Clear all caches
node clear-all-cache.js

# Test a specific medicine via CLI
curl -X POST http://localhost:3000/api/getDrugData \
  -H "Content-Type: application/json" \
  -d '{"medicines":["Aspirin"]}'
```

---

**Status:** Ready for testing!
