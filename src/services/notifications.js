import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const NOTIFICATION_KEY = '@notification_settings';

// Request notification permissions
export const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return false;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return true;
};

// Get push token for server notifications
export const getPushToken = async () => {
    try {
        const token = await Notifications.getExpoPushTokenAsync();
        return token.data;
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
};

// Schedule shift reminder notification (30 min before)
export const scheduleShiftReminder = async (staffName, shiftTime, storeId) => {
    try {
        // Parse shift time (format: HH:mm)
        const [hours, minutes] = shiftTime.split(':').map(Number);

        // Create date for today with shift time
        const now = new Date();
        const shiftDate = new Date(now);
        shiftDate.setHours(hours, minutes, 0, 0);

        // Set reminder to 30 min before
        const reminderDate = new Date(shiftDate.getTime() - 30 * 60 * 1000);

        // Only schedule if the reminder is in the future
        if (reminderDate > now) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⏰ Shift Starting Soon!',
                    body: `Your shift at work starts in 30 minutes. Time to get ready!`,
                    sound: true,
                    data: { type: 'shift_reminder', storeId },
                },
                trigger: {
                    date: reminderDate,
                },
            });
            console.log('Shift reminder scheduled for', reminderDate);
        }
    } catch (error) {
        console.error('Error scheduling shift reminder:', error);
    }
};

// Send instant notification (for testing)
export const sendInstantNotification = async (title, body, data = {}) => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                data,
            },
            trigger: null, // null = send immediately
        });
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

// Notification types for admins
export const NotificationTypes = {
    STAFF_LATE: 'staff_late',
    STAFF_ABSENT: 'staff_absent',
    LEAVE_REQUEST: 'leave_request',
    SHIFT_REMINDER: 'shift_reminder',
};

// Send admin alert notification
export const sendAdminAlert = async (type, staffName, storeName) => {
    let title, body;

    switch (type) {
        case NotificationTypes.STAFF_LATE:
            title = '⏰ Staff Late Alert';
            body = `${staffName} is late for their shift at ${storeName}`;
            break;
        case NotificationTypes.STAFF_ABSENT:
            title = '❌ Staff Absent Alert';
            body = `${staffName} has been marked absent at ${storeName}`;
            break;
        case NotificationTypes.LEAVE_REQUEST:
            title = '📝 New Leave Request';
            body = `${staffName} has submitted a leave request`;
            break;
        default:
            return;
    }

    await sendInstantNotification(title, body, { type, staffName, storeName });
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
};

// Get all scheduled notifications
export const getScheduledNotifications = async () => {
    return await Notifications.getAllScheduledNotificationsAsync();
};

// Listen for notifications
export const addNotificationListener = (onReceive, onResponse) => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(onReceive);
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(onResponse);

    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
};

export default {
    requestNotificationPermissions,
    getPushToken,
    scheduleShiftReminder,
    sendInstantNotification,
    sendAdminAlert,
    cancelAllNotifications,
    getScheduledNotifications,
    addNotificationListener,
    NotificationTypes,
};
