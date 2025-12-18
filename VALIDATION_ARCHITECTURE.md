# 🏗️ MEDICINE VALIDATION ARCHITECTURE

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│                                                                 │
│  ┌─────────────────┐              ┌──────────────────┐         │
│  │  Photo Upload   │              │  Manual Entry    │         │
│  │  (OCR)          │              │  (Text Input)    │         │
│  └────────┬────────┘              └────────┬─────────┘         │
└───────────┼──────────────────────────────────┼─────────────────┘
            │                                  │
            │                                  │
            v                                  v
┌─────────────────────────────────────────────────────────────────┐
│                       API LAYER                                 │
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │ /api/ocr         │              │ /api/getDrugData │        │
│  │                  │              │                  │        │
│  │ 1. Extract       │              │ 1. Receive names │        │
│  │    tokens        │              │ 2. Validate all  │        │
│  │ 2. Validate all  │              │ 3. Return data/  │        │
│  │ 3. Filter invalid│              │    error         │        │
│  │ 4. Deduplicate   │              │                  │        │
│  └────────┬─────────┘              └────────┬─────────┘        │
└───────────┼──────────────────────────────────┼─────────────────┘
            │                                  │
            └──────────────┬───────────────────┘
                          │
                          v
┌─────────────────────────────────────────────────────────────────┐
│              UNIFIED VALIDATION LAYER                           │
│              (lib/medicine-validator.ts)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   validateMedicines(names: string[])                     │  │
│  │                                                          │  │
│  │   For each medicine name:                               │  │
│  │   ┌────────────────────────────────────────────────┐    │  │
│  │   │  1. Normalize input (lowercase, trim)          │    │  │
│  │   │  2. Check RxNorm (with similarity threshold)   │    │  │
│  │   │  3. Check FDA (brand + substance search)       │    │  │
│  │   │  4. Determine validity: rxcui≠null OR fda≠null │    │  │
│  │   │  5. Return ValidatedMedicine object            │    │  │
│  │   └────────────────────────────────────────────────┘    │  │
│  │                                                          │  │
│  │   deduplicateMedicines(medicines: ValidatedMedicine[])  │  │
│  │   - Group by rxcui                                      │  │
│  │   - Keep first occurrence                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      v               v               v
┌───────────┐  ┌───────────┐  ┌───────────┐
│  RxNorm   │  │    FDA    │  │   Cache   │
│   API     │  │   API     │  │  Layer    │
│           │  │           │  │           │
│ - Search  │  │ - Brand   │  │ - Memory  │
│ - Synonyms│  │ - Substance│ │ - File    │
│ - Classes │  │ - Labels  │  │ - TTL     │
└───────────┘  └───────────┘  └───────────┘
```

## Data Flow

### 1. OCR Upload Flow

```
User uploads photo
      ↓
[OCR.space API] → Extract text
      ↓
extractMedicineTokens(text)
  - Pattern matching
  - Blocklist filtering
      ↓
["Dolo", "650", "Tablet", "Fast"]
      ↓
validateMedicines(tokens)
  ├→ "Dolo"   → RxNorm ✅ rxcui:161
  ├→ "650"    → RxNorm ❌, FDA ❌ → INVALID
  ├→ "Tablet" → RxNorm ❌, FDA ❌ → INVALID
  └→ "Fast"   → RxNorm ❌, FDA ❌ → INVALID
      ↓
Filter: only isValid === true
      ↓
["Acetaminophen"]
      ↓
deduplicateMedicines()
      ↓
Return to frontend
```

### 2. Manual Entry Flow

```
User types "Paracetamol"
      ↓
POST /api/getDrugData
      ↓
validateMedicines(["Paracetamol"])
      ↓
Check RxNorm:
  - Cache check (normalized key: "paracetamol")
  - If miss: API call
  - Similarity check: "paracetamol" vs "Acetaminophen" = 70%+
  - Result: rxcui = "161" ✅
      ↓
Check FDA:
  - Cache check
  - If miss: API call (brand + substance)
  - Extract: text, genericName, classes, etc.
      ↓
isValid = true (rxcui found)
      ↓
Return complete drug data to frontend
      ↓
Frontend sends to /api/analyzeMix
```

## Validation Decision Tree

```
                    Medicine Name Input
                            │
                            v
                    Normalize (lowercase, trim)
                            │
                            v
                      Length >= 2?
                       /         \
                     NO           YES
                     /             \
                    v               v
              INVALID         Check RxNorm API
         (too short)               │
                                   v
                           ┌───────────────┐
                           │ RxNorm Result │
                           └───────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │                             │
                rxcui found?                 rxcui = null
                    │                             │
                    YES                           │
                    │                             │
                    v                             v
          Similarity >= 70%?              Check FDA API
             /          \                       │
           YES          NO                      v
            │           │               ┌───────────────┐
            v           v               │  FDA Result   │
        VALID      Try FDA API          └───────┬───────┘
      (RxNorm)          │                       │
                        │              ┌────────┴────────┐
                        v              │                 │
                  Check FDA API    FDA data found?   No FDA data
                        │              │                 │
                        v              YES               v
               ┌───────────────┐       │            INVALID
               │  FDA Result   │       v           (not found
               └───────┬───────┘   VALID           anywhere)
                       │          (FDA only)
              ┌────────┴────────┐
              │                 │
          FDA found?        No FDA
              │                 │
              YES               v
              │             INVALID
              v            (similarity
          VALID              too low)
      (FDA fallback)
```

## Cache Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    MultiTierCache                        │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Level 1: Memory Cache                 │    │
│  │  - LRU eviction                                 │    │
│  │  - Max 500-1000 entries per type                │    │
│  │  - Sub-50ms access time                         │    │
│  │                                                  │    │
│  │  Structure:                                     │    │
│  │  {                                              │    │
│  │    "rxnorm:paracetamol": {                      │    │
│  │      data: { rxcui: "161", name: "...", ... },  │    │
│  │      timestamp: 1234567890,                     │    │
│  │      ttl: 2592000000,  // 30 days              │    │
│  │      hits: 42                                   │    │
│  │    }                                            │    │
│  │  }                                              │    │
│  └─────────────────────────────────────────────────┘    │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Level 2: File Cache                   │    │
│  │  - Persistent across restarts                   │    │
│  │  - .cache/rxnorm/*.json                         │    │
│  │  - .cache/fda-drugs/*.json                      │    │
│  │  - Auto-cleanup on TTL expiry                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Cache Types:                                           │
│  ├─ RxNorm Cache (TTL: 30 days)                         │
│  ├─ FDA Drug Cache (TTL: 7 days)                        │
│  ├─ NIH Interaction Cache (TTL: 7 days)                 │
│  └─ Analysis Cache (TTL: 24 hours)                      │
└──────────────────────────────────────────────────────────┘

Cache Key Normalization:
  Input: "Paracetamol"
  Key:   "rxnorm:paracetamol"  ← lowercase + trimmed

Cache Entry Lifecycle:
  1. CREATE: On first miss, fetch from API, cache result
  2. READ: Check memory → check file → return or null
  3. UPDATE: On subsequent requests, increment hit count
  4. EXPIRE: Auto-delete when (now - timestamp) > TTL
  5. EVICT: LRU eviction when memory cache is full
```

## Deduplication Logic

```
Input medicines: ["Paracetamol", "Calpol", "Dolo", "Aspirin"]
      ↓
Validate each:
  "Paracetamol" → rxcui: "161"
  "Calpol"      → rxcui: "161"  ← Same as Paracetamol
  "Dolo"        → rxcui: "161"  ← Same as Paracetamol
  "Aspirin"     → rxcui: "1191"
      ↓
Deduplicate by rxcui:
  rxcui "161":  Keep "Paracetamol" (first occurrence)
  rxcui "1191": Keep "Aspirin"
      ↓
Output: ["Paracetamol", "Aspirin"]
```

## Error Handling

```
┌────────────────────────────────────────────┐
│         Validation Failure Modes           │
└────────────────────────────────────────────┘

1. RxNorm API Failure
   ├─ Network error → Cache null result
   ├─ Invalid response → Cache null result
   └─ Similarity too low → Cache null result

2. FDA API Failure
   ├─ Network error → Cache null result with isUnknown=true
   ├─ No results found → Cache null result
   └─ Malformed data → Cache null result

3. Both APIs Fail
   └─ Return INVALID medicine with reason

4. Frontend Response
   ├─ OCR: Return empty array with message
   ├─ Manual: Return 400 with detailed error
   └─ Analysis: Skip invalid medicines, warn user
```

## Performance Optimizations

```
┌─────────────────────────────────────────────┐
│        Performance Enhancements             │
└─────────────────────────────────────────────┘

1. Parallel Validation
   validateMedicines([...]) uses Promise.all()
   → All medicines validated simultaneously

2. Smart Caching
   ├─ Normalized keys prevent duplicates
   ├─ Negative results cached (avoid re-fetch)
   └─ TTL prevents stale data

3. Early Termination
   ├─ If RxNorm succeeds, skip FDA (optional)
   ├─ If similarity < 70%, stop immediately
   └─ If cached, return instantly

4. Lazy Loading
   ├─ FDA data only fetched if needed
   ├─ Synonyms fetched separately
   └─ NIH interactions on-demand

Typical Response Times:
  ┌─────────────────┬───────────┐
  │ Scenario        │ Time      │
  ├─────────────────┼───────────┤
  │ Cache hit       │ < 50ms    │
  │ RxNorm only     │ 200-500ms │
  │ RxNorm + FDA    │ 500-1s    │
  │ Batch (10 meds) │ 1-2s      │
  └─────────────────┴───────────┘
```

## Security Considerations

```
┌─────────────────────────────────────────────┐
│           Security Measures                 │
└─────────────────────────────────────────────┘

1. Input Validation
   ├─ Length check (2-100 characters)
   ├─ Character whitelist
   └─ No SQL/code injection risk

2. API Rate Limiting
   ├─ FDA: 240 req/min (per API key)
   ├─ RxNorm: No official limit
   └─ Consider adding app-level throttling

3. Cache Security
   ├─ No sensitive data cached
   ├─ Public medical information only
   └─ Regular TTL-based cleanup

4. Error Handling
   ├─ No stack traces in production
   ├─ Generic error messages to users
   └─ Detailed logging for debugging
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────┐
│          Logging Strategy                   │
└─────────────────────────────────────────────┘

[Validator] - Main validation logic
  ├─ Validating: "medicine name"
  ├─ ✅ VALID / ❌ INVALID
  └─ Batch complete: X valid, Y invalid

[RxNorm] - RxNorm API interactions
  ├─ Cache HIT/MISS
  ├─ Similarity: X%
  └─ Match found / No match

[FDA] - FDA API interactions
  ├─ Cache HIT/MISS
  ├─ Brand/Substance search
  └─ Match found / No match

[Cache] - Cache operations
  ├─ SET/GET operations
  ├─ Cleanup operations
  └─ Stats (hit rate, size)

Key Metrics to Track:
  ├─ Validation success rate
  ├─ Cache hit rate
  ├─ API response times
  ├─ Error frequency
  └─ Most validated medicines
```

## Deployment Checklist

```
✅ Pre-deployment:
  ├─ Verify all TypeScript errors resolved
  ├─ Test with sample medicines
  ├─ Check cache directory permissions
  ├─ Verify API keys configured
  └─ Test error handling

✅ Post-deployment:
  ├─ Monitor API rate limits
  ├─ Watch cache growth
  ├─ Check validation success rate
  ├─ Monitor response times
  └─ Review error logs
```

---

**Architecture Status:** ✅ Stable and Production-Ready
