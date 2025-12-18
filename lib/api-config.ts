/**
 * API Configuration for Production
 * 
 * When building for Android, the frontend is static (bundled in APK)
 * but API calls need to go to your deployed backend.
 * 
 * Update this with your production URL after deploying to Vercel/Railway
 */

// Development: localhost
// Production: Your deployed backend URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// For production builds, you can set this in package.json build script:
// "build:production": "NEXT_PUBLIC_API_URL=https://your-backend.vercel.app next build"

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = !isProduction;
