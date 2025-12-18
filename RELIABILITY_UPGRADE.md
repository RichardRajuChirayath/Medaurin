# Reliability Upgrade & API Stabilization

## Changes Implemented

### 1. Robust API Handling
- **Retry Logic:** All external API calls (RxNorm, FDA) now auto-retry 3 times with a 200ms backoff strategy before failing. This handles transient network glitches or 429 Rate Limit responses.
- **Components Updated:**
  - `lib/medicine-validator.ts`: `validateMedicineName`, `getRxNormData`, `getFDAData`
  - `lib/drug-interaction-service.ts`: `normalizeDrugName`, `getDrugInteractionsFromNIH`
  - `lib/generic-resolver.ts`: `resolveGenericName`

### 2. Concurrency Control (OCR Stabilization)
- **Rate Limiting:** Implemented a `LimitQueue` preventing more than 5 parallel validation requests during batch processing (e.g. OCR results).
- **Benefit:** Prevents flooding the NIH/FDA servers, reducing the likelihood of being blocked or rate-limited.

### 3. Integrated Normalization Pipeline (Consistency Fix)
- **Strict Cleaning:** Drug names are now strictly normalized (lowercase, punctuation removed, spaces collapsed) in ALL pipelines.
- **Indian Brand Support:** The `analyzeMix` endpoint now correctly resolves Indian brands (e.g., Dolo -> Paracetamol) before generic resolution and RxNorm lookup.
- **Generic Resolution:** Both validator and analyzer now auto-correct generics (e.g., Paracetamol -> Acetaminophen) to their RxNorm standard.
- **Result:** `getDrugData` (Validator) and `analyzeMix` (Analyzer) now produce 100% consistent results for Indian brands and generics.

### 4. API Error Handling in Analysis
- **Graceful Degradation:** If the RxNorm API fails after retries, the medicine is marked with `apiStatus: "api_error"` instead of being flagged as "Invalid/Unknown".
- **User Experience:** The user is informed of the temporary system error rather than being told their medicine is invalid. "Unrecognized" errors are reserved for actual spelling/data issues.

### 5. Caching Policy
- **Ephemeral Only:** No data is written to disk or long-term memory. Freshness is guaranteed for every analysis session.

These changes ensure the validator works reliably for both manual entry and file uploads without "invalid response data" errors caused by network jitter or pipeline mismatches.
