import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { generateId } from '../utils/helpers';

const DEVICE_ID_KEY = 'app_device_id';

// Generate a unique device identifier
export const generateDeviceId = () => {
    // Create a unique ID based on device info and random string
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const deviceInfo = `${Device.brand || 'unknown'}-${Device.modelName || 'device'}`;

    return `${deviceInfo}-${timestamp}-${random}`.replace(/\s+/g, '-').toLowerCase();
};

// Get or create device ID
export const getDeviceId = async () => {
    try {
        // Try to get existing device ID
        let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

        if (!deviceId) {
            // Generate new device ID
            deviceId = generateDeviceId();
            await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
        }

        return deviceId;
    } catch (error) {
        console.error('Error getting device ID:', error);
        // Fallback for devices that don't support SecureStore
        return generateId();
    }
};

// Get device information
export const getDeviceInfo = async () => {
    return {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        deviceType: Device.deviceType,
        isDevice: Device.isDevice, // false if running on simulator/emulator
        platform: Platform.OS,
    };
};

// Check if device ID matches
export const validateDeviceId = async (storedDeviceId) => {
    const currentDeviceId = await getDeviceId();
    return currentDeviceId === storedDeviceId;
};

// Reset device ID (for testing or admin reset)
export const resetDeviceId = async () => {
    try {
        await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
        return true;
    } catch (error) {
        console.error('Error resetting device ID:', error);
        return false;
    }
};
