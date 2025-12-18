// Test script to diagnose OSM API connectivity from Node.js
const https = require('https');

console.log('[TEST] Testing Overpass API from Node.js...');

const testUrl = 'https://overpass-api.de/api/interpreter?data=[out:json];node(12.9786,77.364,13,78);out;';

https.get(testUrl, {
    headers: {
        'User-Agent': 'Medaurin/1.0 Test'
    },
    timeout: 10000
}, (res) => {
    console.log('[TEST] Status Code:', res.statusCode);
    console.log('[TEST] Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('[TEST] Response received. Length:', data.length);
        console.log('[TEST] ✅ SUCCESS - API is reachable!');
    });
}).on('error', (err) => {
    console.error('[TEST] ❌ ERROR:', err.message);
    console.error('[TEST] Code:', err.code);
}).on('timeout', () => {
    console.error('[TEST] ❌ TIMEOUT after 10s');
});
