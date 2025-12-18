# Cache System Removal

## Overview
As per the user request, the caching system has been completely disabled across the entire MixSafe project. This ensures that all data (medicines, interactions, pharmacy locations) is fetched fresh from the source (APIs or Database) for every single request.

## Changes Implemented

### 1. Global Cache Disablement (`lib/cache.ts`)
The central caching module has been modified to operate in "Pass-Through" mode:
- **Architecture:** The `MemoryCache` and `FileCache` classes remain but are stripped of logic.
- **GET Operations:** Always return `null` (simulating a cache miss).
- **SET Operations:** Perform no action (data is never stored).
- **Cleanup/Warmup:** functions do nothing.

This affects:
- `fdaDrugCache` (FDA drug data)
- `rxNormCache` (RxNorm normalization data)
- `nihInteractionCache` (Drug interaction checks)
- `analysisCache` (Mixed medicine analysis results)

### 2. Pharmacy Search (`app/api/expenses/pharmacies/route.ts`)
- Removed the local in-memory `Map` cache.
- Removed helper functions `getCached` and `setCache`.
- Every search for nearby pharmacies now queries the Overpass/Nominatim API directly.

## Implication
- **Accuracy:** Maximize. No stale data.
- **Latency:** Increased. Every request requires external API calls.
- **Rate Limits:** We will consume external API quotas (RxNorm, FDA, OSM) faster.
- **Reliability:** If external APIs are down, the user will feel it immediately (no cache fallback).

All validation, normalization, and lookups are now fully real-time.
