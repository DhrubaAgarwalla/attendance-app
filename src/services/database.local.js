import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

// Generic storage operations
const storage = {
    async get(key) {
        try {
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error getting ${key}:`, error);
            return null;
        }
    },

    async set(key, value) {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error setting ${key}:`, error);
            return false;
        }
    },

    async remove(key) {
        try {
            await AsyncStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
            return false;
        }
    },

    async clear() {
        try {
            await AsyncStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    },
};

// Collection operations (array-based storage)
const collection = {
    async getAll(collectionKey) {
        const data = await storage.get(collectionKey);
        return data || [];
    },

    async getById(collectionKey, id) {
        const items = await this.getAll(collectionKey);
        return items.find(item => item.id === id) || null;
    },

    async add(collectionKey, item) {
        const items = await this.getAll(collectionKey);
        items.push(item);
        await storage.set(collectionKey, items);
        return item;
    },

    async update(collectionKey, id, updates) {
        const items = await this.getAll(collectionKey);
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return null;

        items[index] = { ...items[index], ...updates };
        await storage.set(collectionKey, items);
        return items[index];
    },

    async delete(collectionKey, id) {
        const items = await this.getAll(collectionKey);
        const filtered = items.filter(item => item.id !== id);
        await storage.set(collectionKey, filtered);
        return true;
    },

    async query(collectionKey, predicate) {
        const items = await this.getAll(collectionKey);
        return items.filter(predicate);
    },
};

// Specific data operations
export const db = {
    // Stores
    stores: {
        getAll: () => collection.getAll(STORAGE_KEYS.STORES),
        getById: (id) => collection.getById(STORAGE_KEYS.STORES, id),
        add: (store) => collection.add(STORAGE_KEYS.STORES, store),
        update: (id, updates) => collection.update(STORAGE_KEYS.STORES, id, updates),
        delete: (id) => collection.delete(STORAGE_KEYS.STORES, id),
    },

    // Admins
    admins: {
        getAll: () => collection.getAll(STORAGE_KEYS.ADMINS),
        getById: (id) => collection.getById(STORAGE_KEYS.ADMINS, id),
        getByDeviceId: async (deviceId) => {
            const admins = await collection.getAll(STORAGE_KEYS.ADMINS);
            return admins.find(a => a.deviceId === deviceId);
        },
        add: (admin) => collection.add(STORAGE_KEYS.ADMINS, admin),
        update: (id, updates) => collection.update(STORAGE_KEYS.ADMINS, id, updates),
        delete: (id) => collection.delete(STORAGE_KEYS.ADMINS, id),
    },

    // Staff
    staff: {
        getAll: () => collection.getAll(STORAGE_KEYS.STAFF),
        getById: (id) => collection.getById(STORAGE_KEYS.STAFF, id),
        getByStoreId: async (storeId) => {
            return collection.query(STORAGE_KEYS.STAFF, s => s.storeId === storeId);
        },
        getByDeviceId: async (deviceId) => {
            const staff = await collection.getAll(STORAGE_KEYS.STAFF);
            return staff.find(s => s.deviceId === deviceId);
        },
        add: (staffMember) => collection.add(STORAGE_KEYS.STAFF, staffMember),
        update: (id, updates) => collection.update(STORAGE_KEYS.STAFF, id, updates),
        delete: (id) => collection.delete(STORAGE_KEYS.STAFF, id),
    },

    // Attendance
    attendance: {
        getAll: () => collection.getAll(STORAGE_KEYS.ATTENDANCE),
        getById: (id) => collection.getById(STORAGE_KEYS.ATTENDANCE, id),
        getByStaffAndDate: async (staffId, date) => {
            const records = await collection.query(STORAGE_KEYS.ATTENDANCE,
                a => a.staffId === staffId && a.date === date
            );
            return records[0] || null;
        },
        getByStaffAndMonth: async (staffId, year, month) => {
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
            return collection.query(STORAGE_KEYS.ATTENDANCE,
                a => a.staffId === staffId && a.date.startsWith(monthStr)
            );
        },
        getByStoreAndDate: async (storeId, date) => {
            return collection.query(STORAGE_KEYS.ATTENDANCE,
                a => a.storeId === storeId && a.date === date
            );
        },
        add: (record) => collection.add(STORAGE_KEYS.ATTENDANCE, record),
        update: (id, updates) => collection.update(STORAGE_KEYS.ATTENDANCE, id, updates),
    },

    // Leave Requests
    leaveRequests: {
        getAll: () => collection.getAll(STORAGE_KEYS.LEAVE_REQUESTS),
        getById: (id) => collection.getById(STORAGE_KEYS.LEAVE_REQUESTS, id),
        getByStaffId: async (staffId) => {
            return collection.query(STORAGE_KEYS.LEAVE_REQUESTS, l => l.staffId === staffId);
        },
        getByStoreId: async (storeId) => {
            return collection.query(STORAGE_KEYS.LEAVE_REQUESTS, l => l.storeId === storeId);
        },
        getPending: async () => {
            return collection.query(STORAGE_KEYS.LEAVE_REQUESTS, l => l.status === 'pending');
        },
        getPendingByStoreId: async (storeId) => {
            return collection.query(STORAGE_KEYS.LEAVE_REQUESTS,
                l => l.storeId === storeId && l.status === 'pending'
            );
        },
        add: (request) => collection.add(STORAGE_KEYS.LEAVE_REQUESTS, request),
        update: (id, updates) => collection.update(STORAGE_KEYS.LEAVE_REQUESTS, id, updates),
    },

    // Salary Advances
    salaryAdvances: {
        getAll: () => collection.getAll(STORAGE_KEYS.SALARY_ADVANCES),
        getByStaffId: async (staffId) => {
            return collection.query(STORAGE_KEYS.SALARY_ADVANCES, a => a.staffId === staffId);
        },
        getUndeductedByStaffId: async (staffId) => {
            return collection.query(STORAGE_KEYS.SALARY_ADVANCES,
                a => a.staffId === staffId && !a.isDeducted
            );
        },
        add: (advance) => collection.add(STORAGE_KEYS.SALARY_ADVANCES, advance),
        update: (id, updates) => collection.update(STORAGE_KEYS.SALARY_ADVANCES, id, updates),
    },

    // Monthly Salary
    monthlySalary: {
        getAll: () => collection.getAll(STORAGE_KEYS.MONTHLY_SALARY),
        getByStaffId: async (staffId) => {
            return collection.query(STORAGE_KEYS.MONTHLY_SALARY, s => s.staffId === staffId);
        },
        getByStaffAndMonth: async (staffId, year, month) => {
            const records = await collection.query(STORAGE_KEYS.MONTHLY_SALARY,
                s => s.staffId === staffId && s.year === year && s.month === month
            );
            return records[0] || null;
        },
        add: (salary) => collection.add(STORAGE_KEYS.MONTHLY_SALARY, salary),
        update: (id, updates) => collection.update(STORAGE_KEYS.MONTHLY_SALARY, id, updates),
    },

    // Notifications
    notifications: {
        getAll: () => collection.getAll(STORAGE_KEYS.NOTIFICATIONS),
        getByUserId: async (userId) => {
            return collection.query(STORAGE_KEYS.NOTIFICATIONS, n => n.userId === userId);
        },
        getUnread: async (userId) => {
            return collection.query(STORAGE_KEYS.NOTIFICATIONS,
                n => n.userId === userId && !n.isRead
            );
        },
        add: (notification) => collection.add(STORAGE_KEYS.NOTIFICATIONS, notification),
        markAsRead: (id) => collection.update(STORAGE_KEYS.NOTIFICATIONS, id, { isRead: true }),
    },

    // Device Change Requests
    deviceRequests: {
        getAll: () => collection.getAll(STORAGE_KEYS.DEVICE_REQUESTS),
        getPending: async () => {
            return collection.query(STORAGE_KEYS.DEVICE_REQUESTS, r => r.status === 'pending');
        },
        add: (request) => collection.add(STORAGE_KEYS.DEVICE_REQUESTS, request),
        update: (id, updates) => collection.update(STORAGE_KEYS.DEVICE_REQUESTS, id, updates),
    },

    // User Data (current logged in user)
    user: {
        get: () => storage.get(STORAGE_KEYS.USER_DATA),
        set: (userData) => storage.set(STORAGE_KEYS.USER_DATA, userData),
        clear: () => storage.remove(STORAGE_KEYS.USER_DATA),
    },

    // Device ID
    deviceId: {
        get: () => storage.get(STORAGE_KEYS.DEVICE_ID),
        set: (deviceId) => storage.set(STORAGE_KEYS.DEVICE_ID, deviceId),
    },

    // Clear all data
    clearAll: () => storage.clear(),
};

export default db;
