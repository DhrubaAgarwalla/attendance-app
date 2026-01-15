// Firebase Firestore Database Service
import { firestore } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';

const USER_STORAGE_KEY = '@attendance_user';

// Collection names
const COLLECTIONS = {
    STORES: 'stores',
    STAFF: 'staff',
    ADMINS: 'admins',
    ATTENDANCE: 'attendance',
    LEAVE_REQUESTS: 'leaveRequests',
    SALARY_RECORDS: 'salaryRecords',
    DEVICE_REQUESTS: 'deviceRequests',
    SETTINGS: 'settings',
};

// Helper to convert Firestore timestamp to ISO string
const toISOString = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate().toISOString();
    return timestamp;
};

// Helper to convert docs to array with id
const docsToArray = (snapshot) => {
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: toISOString(doc.data().createdAt),
        updatedAt: toISOString(doc.data().updatedAt),
    }));
};

// ============ STORES ============
export const stores = {
    async getAll() {
        const snapshot = await getDocs(collection(firestore, COLLECTIONS.STORES));
        return docsToArray(snapshot);
    },

    async getById(id) {
        const docRef = doc(firestore, COLLECTIONS.STORES, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },

    async add(store) {
        const docRef = doc(firestore, COLLECTIONS.STORES, store.id);
        await setDoc(docRef, {
            ...store,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return store;
    },

    async update(id, updates) {
        const docRef = doc(firestore, COLLECTIONS.STORES, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        return { id, ...updates };
    },

    async delete(id) {
        const docRef = doc(firestore, COLLECTIONS.STORES, id);
        await deleteDoc(docRef);
    },
};

// ============ STAFF ============
export const staff = {
    async getAll() {
        const snapshot = await getDocs(collection(firestore, COLLECTIONS.STAFF));
        return docsToArray(snapshot);
    },

    async getByStoreId(storeId) {
        const q = query(
            collection(firestore, COLLECTIONS.STAFF),
            where('storeId', '==', storeId)
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async getByPhone(phone) {
        const q = query(
            collection(firestore, COLLECTIONS.STAFF),
            where('phone', '==', phone)
        );
        const snapshot = await getDocs(q);
        const results = docsToArray(snapshot);
        return results[0] || null;
    },

    async getByDeviceId(deviceId) {
        const q = query(
            collection(firestore, COLLECTIONS.STAFF),
            where('deviceId', '==', deviceId)
        );
        const snapshot = await getDocs(q);
        const results = docsToArray(snapshot);
        return results[0] || null;
    },

    async getById(id) {
        const docRef = doc(firestore, COLLECTIONS.STAFF, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },

    async add(staffMember) {
        const docRef = doc(firestore, COLLECTIONS.STAFF, staffMember.id);
        await setDoc(docRef, {
            ...staffMember,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return staffMember;
    },

    async update(id, updates) {
        const docRef = doc(firestore, COLLECTIONS.STAFF, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        return { id, ...updates };
    },

    async delete(id) {
        const docRef = doc(firestore, COLLECTIONS.STAFF, id);
        await deleteDoc(docRef);
    },
};

// ============ ADMINS ============
export const admins = {
    async getAll() {
        const snapshot = await getDocs(collection(firestore, COLLECTIONS.ADMINS));
        return docsToArray(snapshot);
    },

    async getByStoreId(storeId) {
        const q = query(
            collection(firestore, COLLECTIONS.ADMINS),
            where('storeId', '==', storeId)
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async getByPhone(phone) {
        const q = query(
            collection(firestore, COLLECTIONS.ADMINS),
            where('phone', '==', phone)
        );
        const snapshot = await getDocs(q);
        const results = docsToArray(snapshot);
        return results[0] || null;
    },

    async getByDeviceId(deviceId) {
        const q = query(
            collection(firestore, COLLECTIONS.ADMINS),
            where('deviceId', '==', deviceId)
        );
        const snapshot = await getDocs(q);
        const results = docsToArray(snapshot);
        return results[0] || null;
    },

    async getById(id) {
        const docRef = doc(firestore, COLLECTIONS.ADMINS, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },

    async add(admin) {
        const docRef = doc(firestore, COLLECTIONS.ADMINS, admin.id);
        await setDoc(docRef, {
            ...admin,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return admin;
    },

    async update(id, updates) {
        const docRef = doc(firestore, COLLECTIONS.ADMINS, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        return { id, ...updates };
    },

    async delete(id) {
        const docRef = doc(firestore, COLLECTIONS.ADMINS, id);
        await deleteDoc(docRef);
    },
};

// ============ ATTENDANCE ============
export const attendance = {
    async getAll() {
        const snapshot = await getDocs(collection(firestore, COLLECTIONS.ATTENDANCE));
        return docsToArray(snapshot);
    },

    async getByStaffId(staffId) {
        const q = query(
            collection(firestore, COLLECTIONS.ATTENDANCE),
            where('staffId', '==', staffId)
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async getByStoreId(storeId) {
        const q = query(
            collection(firestore, COLLECTIONS.ATTENDANCE),
            where('storeId', '==', storeId)
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async getByStoreAndDate(storeId, date) {
        const q = query(
            collection(firestore, COLLECTIONS.ATTENDANCE),
            where('storeId', '==', storeId),
            where('date', '==', date)
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async getByStaffAndDate(staffId, date) {
        const q = query(
            collection(firestore, COLLECTIONS.ATTENDANCE),
            where('staffId', '==', staffId),
            where('date', '==', date)
        );
        const snapshot = await getDocs(q);
        const results = docsToArray(snapshot);
        return results[0] || null;
    },

    async getByStaffAndMonth(staffId, year, month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
        const q = query(
            collection(firestore, COLLECTIONS.ATTENDANCE),
            where('staffId', '==', staffId),
            where('date', '>=', startDate),
            where('date', '<=', endDate)
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async add(record) {
        const docRef = doc(firestore, COLLECTIONS.ATTENDANCE, record.id);
        await setDoc(docRef, {
            ...record,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return record;
    },

    async update(id, updates) {
        const docRef = doc(firestore, COLLECTIONS.ATTENDANCE, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        return { id, ...updates };
    },

    async upsert(record) {
        const existing = await this.getByStaffAndDate(record.staffId, record.date);
        if (existing) {
            await this.update(existing.id, record);
            return { ...existing, ...record };
        } else {
            return await this.add(record);
        }
    },
};

// ============ LEAVE REQUESTS ============
export const leaveRequests = {
    async getAll() {
        const snapshot = await getDocs(collection(firestore, COLLECTIONS.LEAVE_REQUESTS));
        return docsToArray(snapshot);
    },

    async getByStaffId(staffId) {
        const q = query(
            collection(firestore, COLLECTIONS.LEAVE_REQUESTS),
            where('staffId', '==', staffId)
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async getByStoreId(storeId) {
        const q = query(
            collection(firestore, COLLECTIONS.LEAVE_REQUESTS),
            where('storeId', '==', storeId)
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async getPending() {
        const q = query(
            collection(firestore, COLLECTIONS.LEAVE_REQUESTS),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async getPendingByStoreId(storeId) {
        const q = query(
            collection(firestore, COLLECTIONS.LEAVE_REQUESTS),
            where('storeId', '==', storeId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async add(request) {
        const docRef = doc(firestore, COLLECTIONS.LEAVE_REQUESTS, request.id);
        await setDoc(docRef, {
            ...request,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return request;
    },

    async update(id, updates) {
        const docRef = doc(firestore, COLLECTIONS.LEAVE_REQUESTS, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        return { id, ...updates };
    },
};

// ============ SALARY RECORDS ============
export const salaryRecords = {
    async getByStaffId(staffId) {
        const q = query(
            collection(firestore, COLLECTIONS.SALARY_RECORDS),
            where('staffId', '==', staffId)
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async getByStaffAndMonth(staffId, year, month) {
        const q = query(
            collection(firestore, COLLECTIONS.SALARY_RECORDS),
            where('staffId', '==', staffId),
            where('year', '==', year),
            where('month', '==', month)
        );
        const snapshot = await getDocs(q);
        const results = docsToArray(snapshot);
        return results[0] || null;
    },

    async add(record) {
        const docRef = doc(firestore, COLLECTIONS.SALARY_RECORDS, record.id);
        await setDoc(docRef, {
            ...record,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return record;
    },

    async update(id, updates) {
        const docRef = doc(firestore, COLLECTIONS.SALARY_RECORDS, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        return { id, ...updates };
    },
};

// ============ DEVICE REQUESTS ============
export const deviceRequests = {
    async getAll() {
        const snapshot = await getDocs(collection(firestore, COLLECTIONS.DEVICE_REQUESTS));
        return docsToArray(snapshot);
    },

    async getPending() {
        const q = query(
            collection(firestore, COLLECTIONS.DEVICE_REQUESTS),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        return docsToArray(snapshot);
    },

    async add(request) {
        const docRef = doc(firestore, COLLECTIONS.DEVICE_REQUESTS, request.id);
        await setDoc(docRef, {
            ...request,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return request;
    },

    async update(id, updates) {
        const docRef = doc(firestore, COLLECTIONS.DEVICE_REQUESTS, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        return { id, ...updates };
    },
};

// ============ SETTINGS ============
export const settings = {
    async get(key) {
        const docRef = doc(firestore, COLLECTIONS.SETTINGS, key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().value;
        }
        return null;
    },

    async set(key, value) {
        const docRef = doc(firestore, COLLECTIONS.SETTINGS, key);
        await setDoc(docRef, {
            value,
            updatedAt: Timestamp.now(),
        });
    },
};

// ============ LOCAL USER SESSION (AsyncStorage, not Firestore) ============
export const user = {
    async get() {
        try {
            const data = await AsyncStorage.getItem(USER_STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    async set(userData) {
        try {
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        } catch (error) {
            console.error('Error setting user:', error);
        }
    },

    async clear() {
        try {
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing user:', error);
        }
    },
};

// Export all as db object (same interface as before)
export const db = {
    stores,
    staff,
    admins,
    attendance,
    leaveRequests,
    salaryRecords,
    deviceRequests,
    settings,
    user,
};

export default db;
