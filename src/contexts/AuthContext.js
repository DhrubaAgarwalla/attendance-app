import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../services/database';
import { getDeviceId, validateDeviceId } from '../services/device';
import { ROLES } from '../constants';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deviceId, setDeviceId] = useState(null);
    const [error, setError] = useState(null);

    // Initialize auth state
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            setIsLoading(true);

            // Get device ID
            const currentDeviceId = await getDeviceId();
            setDeviceId(currentDeviceId);

            // Check for saved user
            const savedUser = await db.user.get();

            if (savedUser) {
                // Validate device ID matches
                const isValidDevice = savedUser.deviceId === currentDeviceId;

                if (isValidDevice) {
                    setUser(savedUser);
                } else {
                    // Device mismatch - log out
                    await db.user.clear();
                    setError('Device mismatch. Please login again.');
                }
            }
        } catch (err) {
            console.error('Auth initialization error:', err);
            setError('Failed to initialize authentication');
        } finally {
            setIsLoading(false);
        }
    };

    // Login function
    const login = useCallback(async (phone, role) => {
        try {
            setError(null);
            const currentDeviceId = await getDeviceId();

            let userData = null;

            // Check based on role
            if (role === ROLES.SUPER_ADMIN) {
                // Super admin - hardcoded for demo (in production, check against secure storage)
                if (phone === '9395386870') {
                    userData = {
                        id: 'super_admin_1',
                        name: 'Super Admin',
                        phone,
                        role: ROLES.SUPER_ADMIN,
                        deviceId: currentDeviceId,
                    };
                } else {
                    throw new Error('Invalid super admin credentials');
                }
            } else if (role === ROLES.ADMIN) {
                // Find admin by phone
                const admins = await db.admins.getAll();
                const admin = admins.find(a => a.phone === phone);

                if (!admin) {
                    throw new Error('Admin not found');
                }

                if (!admin.isActive) {
                    throw new Error('Admin account is deactivated');
                }

                // Check device ID
                if (admin.deviceId && admin.deviceId !== currentDeviceId) {
                    throw new Error('Login from unregistered device. Please contact Super Admin.');
                }

                // If no device ID set, register this device
                if (!admin.deviceId) {
                    await db.admins.update(admin.id, { deviceId: currentDeviceId });
                }

                userData = {
                    ...admin,
                    role: ROLES.ADMIN,
                    deviceId: currentDeviceId,
                };
            } else {
                // Staff login
                const staff = await db.staff.getByDeviceId(currentDeviceId);

                if (staff) {
                    // Device already registered to a staff
                    if (staff.phone !== phone) {
                        throw new Error('This device is registered to a different staff member');
                    }

                    if (staff.status === 'left') {
                        throw new Error('Your account is no longer active');
                    }

                    userData = {
                        ...staff,
                        role: ROLES.STAFF,
                    };
                } else {
                    // Check if phone exists
                    const allStaff = await db.staff.getAll();
                    const staffByPhone = allStaff.find(s => s.phone === phone);

                    if (!staffByPhone) {
                        throw new Error('Staff not found. Please contact your admin.');
                    }

                    if (staffByPhone.deviceId && staffByPhone.deviceId !== currentDeviceId) {
                        throw new Error('Login from unregistered device. Please request device change from admin.');
                    }

                    if (staffByPhone.status === 'left') {
                        throw new Error('Your account is no longer active');
                    }

                    // Register device for first-time login
                    if (!staffByPhone.deviceId) {
                        await db.staff.update(staffByPhone.id, { deviceId: currentDeviceId });
                    }

                    userData = {
                        ...staffByPhone,
                        role: ROLES.STAFF,
                        deviceId: currentDeviceId,
                    };
                }
            }

            // Save user data
            await db.user.set(userData);
            setUser(userData);

            return { success: true, user: userData };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, []);

    // Logout function
    const logout = useCallback(async () => {
        try {
            await db.user.clear();
            setUser(null);
            setError(null);
        } catch (err) {
            console.error('Logout error:', err);
        }
    }, []);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        if (!user) return;

        try {
            if (user.role === ROLES.ADMIN) {
                const updatedAdmin = await db.admins.getById(user.id);
                if (updatedAdmin) {
                    const userData = { ...updatedAdmin, role: ROLES.ADMIN };
                    await db.user.set(userData);
                    setUser(userData);
                }
            } else if (user.role === ROLES.STAFF) {
                const updatedStaff = await db.staff.getById(user.id);
                if (updatedStaff) {
                    const userData = { ...updatedStaff, role: ROLES.STAFF };
                    await db.user.set(userData);
                    setUser(userData);
                }
            }
        } catch (err) {
            console.error('Refresh user error:', err);
        }
    }, [user]);

    const value = {
        user,
        deviceId,
        isLoading,
        error,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
        isAdmin: user?.role === ROLES.ADMIN,
        isStaff: user?.role === ROLES.STAFF,
        login,
        logout,
        refreshUser,
        clearError: () => setError(null),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
