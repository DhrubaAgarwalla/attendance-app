import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { db } from '../services/database';
import { useAuth } from './AuthContext';
import { ROLES } from '../constants';

const StoreContext = createContext(null);

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};

export const StoreProvider = ({ children }) => {
    const { user } = useAuth();
    const [stores, setStores] = useState([]);
    const [currentStore, setCurrentStore] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load stores based on user role
    useEffect(() => {
        if (user) {
            loadStores();
        }
    }, [user]);

    const loadStores = useCallback(async () => {
        try {
            setIsLoading(true);
            const allStores = await db.stores.getAll();

            if (user?.role === ROLES.SUPER_ADMIN) {
                // Super admin sees all stores
                setStores(allStores);
            } else if (user?.role === ROLES.ADMIN) {
                // Admin sees only assigned stores
                const assignedStores = allStores.filter(
                    store => user.assignedStoreIds?.includes(store.id)
                );
                setStores(assignedStores);

                // Set first store as current if not set
                if (assignedStores.length > 0 && !currentStore) {
                    setCurrentStore(assignedStores[0]);
                }
            } else if (user?.role === ROLES.STAFF) {
                // Staff sees only their store
                const staffStore = allStores.find(store => store.id === user.storeId);
                if (staffStore) {
                    setStores([staffStore]);
                    setCurrentStore(staffStore);
                }
            }
        } catch (error) {
            console.error('Error loading stores:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentStore]);

    // Create a new store (Super Admin only)
    const createStore = useCallback(async (storeData) => {
        try {
            const newStore = await db.stores.add({
                ...storeData,
                id: `store_${Date.now()}`,
                isActive: true,
                holidayDates: [],
                attendanceFrozen: false,
                createdAt: new Date().toISOString(),
            });

            setStores(prev => [...prev, newStore]);
            return { success: true, store: newStore };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    // Update store
    const updateStore = useCallback(async (storeId, updates) => {
        try {
            const updatedStore = await db.stores.update(storeId, updates);
            setStores(prev => prev.map(s => s.id === storeId ? updatedStore : s));

            if (currentStore?.id === storeId) {
                setCurrentStore(updatedStore);
            }

            return { success: true, store: updatedStore };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [currentStore]);

    // Deactivate store
    const deactivateStore = useCallback(async (storeId) => {
        return updateStore(storeId, { isActive: false });
    }, [updateStore]);

    // Toggle attendance freeze
    const toggleAttendanceFreeze = useCallback(async (storeId, freeze) => {
        return updateStore(storeId, { attendanceFrozen: freeze });
    }, [updateStore]);

    // Add holiday
    const addHoliday = useCallback(async (storeId, date, description) => {
        const store = stores.find(s => s.id === storeId);
        if (!store) return { success: false, error: 'Store not found' };

        const holidayDates = store.holidayDates || [];
        const newHoliday = { date, description };

        return updateStore(storeId, {
            holidayDates: [...holidayDates, newHoliday]
        });
    }, [stores, updateStore]);

    // Remove holiday
    const removeHoliday = useCallback(async (storeId, date) => {
        const store = stores.find(s => s.id === storeId);
        if (!store) return { success: false, error: 'Store not found' };

        const holidayDates = (store.holidayDates || []).filter(h => h.date !== date);

        return updateStore(storeId, { holidayDates });
    }, [stores, updateStore]);

    // Check if date is holiday
    const isHoliday = useCallback((storeId, date) => {
        const store = stores.find(s => s.id === storeId);
        if (!store) return false;

        return (store.holidayDates || []).some(h => h.date === date);
    }, [stores]);

    // Get holidays for a store
    const getHolidays = useCallback((storeId) => {
        const store = stores.find(s => s.id === storeId);
        return store?.holidayDates || [];
    }, [stores]);

    const value = {
        stores,
        currentStore,
        isLoading,
        setCurrentStore,
        loadStores,
        createStore,
        updateStore,
        deactivateStore,
        toggleAttendanceFreeze,
        addHoliday,
        removeHoliday,
        isHoliday,
        getHolidays,
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};

export default StoreContext;
