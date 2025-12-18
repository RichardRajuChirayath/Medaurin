import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDFfdpSAJwmp7_FNKGhnHGucKQHkiyiBVk",
    authDomain: "expensetracker-dc734.firebaseapp.com",
    projectId: "expensetracker-dc734",
    storageBucket: "expensetracker-dc734.firebasestorage.app",
    messagingSenderId: "633688564128",
    appId: "1:633688564128:web:d97c9cfe2ad4c62aae44c5",
    measurementId: "G-4BCR6G3B9C"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Export messaging instance (only on client side and if supported)
export const getFirebaseMessaging = async () => {
    try {
        const supported = await isSupported();
        if (supported && typeof window !== 'undefined') {
            return getMessaging(app);
        }
    } catch (err) {
        console.warn("Firebase Messaging not supported in this environment");
    }
    return null;
};

export { app, auth };
export const firebaseConfigPublic = firebaseConfig;
