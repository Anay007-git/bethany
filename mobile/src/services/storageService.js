/**
 * Bethany Homestay Mobile - Universal Resilient Storage Service
 * Works seamlessly with React Native, Expo, and Web fallback.
 */

let nativeAsyncStorage = null;
try {
    nativeAsyncStorage = require('@react-native-async-storage/async-storage').default || require('@react-native-async-storage/async-storage');
} catch {
    // Fallback if native module not ready
    nativeAsyncStorage = null;
}

// In-memory memory store fallback
const memoryStore = new Map();

export const StorageService = {
    async setItem(key, value) {
        try {
            const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
            memoryStore.set(key, stringVal);

            if (nativeAsyncStorage && typeof nativeAsyncStorage.setItem === 'function') {
                await nativeAsyncStorage.setItem(key, stringVal);
            } else if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, stringVal);
            }
            return true;
        } catch (e) {
            console.warn('Storage setItem warning:', e);
            return false;
        }
    },

    async getItem(key) {
        try {
            if (nativeAsyncStorage && typeof nativeAsyncStorage.getItem === 'function') {
                const val = await nativeAsyncStorage.getItem(key);
                if (val !== null && val !== undefined) return val;
            }
            if (typeof window !== 'undefined' && window.localStorage) {
                const val = window.localStorage.getItem(key);
                if (val !== null && val !== undefined) return val;
            }
            return memoryStore.get(key) || null;
        } catch (e) {
            console.warn('Storage getItem warning:', e);
            return memoryStore.get(key) || null;
        }
    },

    async removeItem(key) {
        try {
            memoryStore.delete(key);
            if (nativeAsyncStorage && typeof nativeAsyncStorage.removeItem === 'function') {
                await nativeAsyncStorage.removeItem(key);
            }
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key);
            }
            return true;
        } catch (e) {
            console.warn('Storage removeItem warning:', e);
            return false;
        }
    }
};

export default StorageService;
