importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// -------------------------------------------------------------------------
// FIREBASE CONFIG (Must match your app config)
// -------------------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyDFfdpSAJwmp7_FNKGhnHGucKQHkiyiBVk",
    authDomain: "expensetracker-dc734.firebaseapp.com",
    projectId: "expensetracker-dc734",
    storageBucket: "expensetracker-dc734.firebasestorage.app",
    messagingSenderId: "633688564128",
    appId: "1:633688564128:web:d97c9cfe2ad4c62aae44c5",
    measurementId: "G-4BCR6G3B9C"
};

// Initialize Firebase in the Service Worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.png' // Ensure you have an icon in public/
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
