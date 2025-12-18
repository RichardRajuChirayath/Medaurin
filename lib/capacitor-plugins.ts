import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Share } from '@capacitor/share';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

/**
 * Check if running in native Capacitor app
 */
export const isNative = Capacitor.isNativePlatform();

/**
 * Get current platform
 */
export const platform = Capacitor.getPlatform(); // 'android', 'ios', or 'web'

/**
 * Take a photo using device camera
 */
export async function takePicture(): Promise<string | null> {
    if (!isNative) {
        // Web fallback - use file input
        return null;
    }

    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Base64,
            source: CameraSource.Camera,
        });

        return `data:image/jpeg;base64,${image.base64String}`;
    } catch (error) {
        console.error('Camera error:', error);
        return null;
    }
}

/**
 * Pick image from gallery
 */
export async function pickImage(): Promise<string | null> {
    if (!isNative) {
        return null;
    }

    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Base64,
            source: CameraSource.Photos,
        });

        return `data:image/jpeg;base64,${image.base64String}`;
    } catch (error) {
        console.error('Gallery error:', error);
        return null;
    }
}

/**
 * Save data to local storage (native or web)
 */
export async function saveLocal(key: string, value: string): Promise<void> {
    if (isNative) {
        await Preferences.set({ key, value });
    } else {
        localStorage.setItem(key, value);
    }
}

/**
 * Get data from local storage
 */
export async function getLocal(key: string): Promise<string | null> {
    if (isNative) {
        const { value } = await Preferences.get({ key });
        return value;
    } else {
        return localStorage.getItem(key);
    }
}

/**
 * Remove data from local storage
 */
export async function removeLocal(key: string): Promise<void> {
    if (isNative) {
        await Preferences.remove({ key });
    } else {
        localStorage.removeItem(key);
    }
}

/**
 * Share content (uses native share if available)
 */
export async function shareContent(title: string, text: string, url?: string): Promise<void> {
    if (isNative) {
        await Share.share({ title, text, url });
    } else {
        if (navigator.share) {
            await navigator.share({ title, text, url });
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(text);
            alert('Copied to clipboard!');
        }
    }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!isNative) {
        // Web notification permission
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    const permission = await LocalNotifications.requestPermissions();
    return permission.display === 'granted';
}

/**
 * Schedule a local notification
 */
export async function scheduleNotification(
    title: string,
    body: string,
    time: Date
): Promise<void> {
    if (!isNative) {
        // Web Notification API (limited)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
        }
        return;
    }

    await LocalNotifications.schedule({
        notifications: [
            {
                title,
                body,
                id: Date.now(),
                schedule: { at: time },
                sound: 'default',
                attachments: undefined,
                actionTypeId: '',
                extra: {},
            },
        ],
    });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(id: number): Promise<void> {
    if (!isNative) return;

    await LocalNotifications.cancel({
        notifications: [{ id }],
    });
}

/**
 * Register for push notifications
 */
export async function registerPushNotifications(): Promise<string | null> {
    if (!isNative) return null;

    try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            return null;
        }

        await PushNotifications.register();

        // Return the token in the listener
        return new Promise((resolve) => {
            PushNotifications.addListener('registration', (token) => {
                resolve(token.value);
            });

            PushNotifications.addListener('registrationError', () => {
                resolve(null);
            });
        });
    } catch (error) {
        console.error('Push notification error:', error);
        return null;
    }
}

/**
 * Get device information
 */
export async function getDeviceInfo() {
    if (!isNative) {
        return {
            platform: 'web',
            model: 'Unknown',
            manufacturer: 'Unknown',
            osVersion: 'Unknown',
            webViewVersion: 'Unknown',
        };
    }

    const info = await Device.getInfo();
    return {
        platform: info.platform,
        model: info.model || 'Unknown',
        manufacturer: info.manufacturer || 'Unknown',
        osVersion: info.osVersion || 'Unknown',
        webViewVersion: info.webViewVersion || 'Unknown',
    };
}

/**
 * Get device ID (for analytics)
 */
export async function getDeviceId(): Promise<string> {
    if (!isNative) {
        // Generate web-based ID
        let id = localStorage.getItem('device_id');
        if (!id) {
            id = `web_${Date.now()}_${Math.random().toString(36)}`;
            localStorage.setItem('device_id', id);
        }
        return id;
    }

    const info = await Device.getId();
    return info.identifier;
}

/**
 * Check network connection status
 */
export async function getNetworkStatus(): Promise<boolean> {
    if (isNative) {
        const status = await Network.getStatus();
        return status.connected;
    } else {
        return navigator.onLine;
    }
}

/**
 * Listen for network changes
 */
export function onNetworkChange(callback: (connected: boolean) => void): () => void {
    if (isNative) {
        const listener = Network.addListener('networkStatusChange', (status) => {
            callback(status.connected);
        });

        return () => listener.remove();
    } else {
        const onlineHandler = () => callback(true);
        const offlineHandler = () => callback(false);

        window.addEventListener('online', onlineHandler);
        window.addEventListener('offline', offlineHandler);

        return () => {
            window.removeEventListener('online', onlineHandler);
            window.removeEventListener('offline', offlineHandler);
        };
    }
}

/**
 * Exit the app (Android only)
 */
export async function exitApp(): Promise<void> {
    if (isNative && platform === 'android') {
        await App.exitApp();
    }
}

/**
 * Get app info
 */
export async function getAppInfo() {
    if (!isNative) {
        return {
            name: 'Medaurin',
            id: 'web',
            build: '1.0.0',
            version: '1.0.0',
        };
    }

    const info = await App.getInfo();
    return info;
}

/**
 * Save file to device
 */
export async function saveFile(
    filename: string,
    data: string,
    directory: Directory = Directory.Documents
): Promise<string | null> {
    if (!isNative) {
        // Web download
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return filename;
    }

    try {
        const result = await Filesystem.writeFile({
            path: filename,
            data,
            directory,
            encoding: Encoding.UTF8,
        });

        return result.uri;
    } catch (error) {
        console.error('File save error:', error);
        return null;
    }
}

/**
 * Read file from device
 */
export async function readFile(
    filename: string,
    directory: Directory = Directory.Documents
): Promise<string | null> {
    if (!isNative) {
        return null;
    }

    try {
        const result = await Filesystem.readFile({
            path: filename,
            directory,
            encoding: Encoding.UTF8,
        });

        return result.data as string;
    } catch (error) {
        console.error('File read error:', error);
        return null;
    }
}

/**
 * Check if app has camera permission
 */
export async function checkCameraPermission(): Promise<boolean> {
    if (!isNative) return true;

    try {
        const status = await Camera.checkPermissions();
        return status.camera === 'granted';
    } catch {
        return false;
    }
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
    if (!isNative) return true;

    try {
        const status = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
        return status.camera === 'granted';
    } catch {
        return false;
    }
}

// Import Encoding from Filesystem
import { Encoding } from '@capacitor/filesystem';
