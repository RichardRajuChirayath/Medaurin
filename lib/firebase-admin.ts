import * as admin from 'firebase-admin';

// Initialize Firebase Admin only if not already initialized
if (!admin.apps.length) {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!projectId || !clientEmail || !privateKey) {
            console.error('[Firebase Admin] Missing required environment variables:', {
                hasProjectId: !!projectId,
                hasClientEmail: !!clientEmail,
                hasPrivateKey: !!privateKey
            });
        } else {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log('[Firebase Admin] Initialized successfully');
        }
    } catch (error) {
        console.error('[Firebase Admin] Initialization error:', error);
    }
}

// Safe getters that handle uninitialized state
export const messaging = () => {
    if (!admin.apps.length) {
        throw new Error('[Firebase Admin] Not initialized. Check environment variables.');
    }
    return admin.messaging();
};

export const auth = () => {
    if (!admin.apps.length) {
        throw new Error('[Firebase Admin] Not initialized. Check environment variables.');
    }
    return admin.auth();
};
