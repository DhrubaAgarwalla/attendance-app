import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input } from '../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { ROLES } from '../constants';
import { validatePhone } from '../utils/helpers';

const LoginScreen = () => {
    const { login, deviceId, error, clearError, isLoading } = useAuth();
    const [phone, setPhone] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [phoneError, setPhoneError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (error) {
            Alert.alert('Login Failed', error, [
                { text: 'OK', onPress: clearError },
            ]);
        }
    }, [error, clearError]);

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setPhoneError('');
    };

    const handleLogin = async () => {
        if (!phone) {
            setPhoneError('Please enter your phone number');
            return;
        }

        if (!validatePhone(phone)) {
            setPhoneError('Please enter a valid 10-digit phone number');
            return;
        }

        if (!selectedRole) {
            Alert.alert('Select Role', 'Please select your role to continue');
            return;
        }

        setSubmitting(true);
        setPhoneError('');

        const result = await login(phone, selectedRole);

        setSubmitting(false);
    };

    const roles = [
        {
            id: ROLES.STAFF,
            title: 'Staff',
            description: 'Mark attendance & view salary',
            icon: 'person-outline',
            color: Colors.staffAccent,
        },
        {
            id: ROLES.ADMIN,
            title: 'Admin',
            description: 'Manage staff & store',
            icon: 'briefcase-outline',
            color: Colors.adminAccent,
        },
        {
            id: ROLES.SUPER_ADMIN,
            title: 'Super Admin',
            description: 'Full system access',
            icon: 'shield-checkmark-outline',
            color: Colors.superAdminAccent,
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="time" size={48} color={Colors.primary} />
                        </View>
                        <Text style={styles.title}>Attendance App</Text>
                        <Text style={styles.subtitle}>
                            Multi-Store HR Management System
                        </Text>
                    </View>

                    {/* Role Selection */}
                    <Text style={styles.sectionTitle}>Select Your Role</Text>
                    <View style={styles.roleContainer}>
                        {roles.map((role) => (
                            <Card
                                key={role.id}
                                variant={selectedRole === role.id ? 'filled' : 'outlined'}
                                onPress={() => handleRoleSelect(role.id)}
                                style={[
                                    styles.roleCard,
                                    selectedRole === role.id && {
                                        backgroundColor: `${role.color}15`,
                                        borderColor: role.color,
                                        borderWidth: 2,
                                    },
                                ]}
                            >
                                <View style={styles.roleContent}>
                                    <View
                                        style={[
                                            styles.roleIcon,
                                            { backgroundColor: `${role.color}20` },
                                        ]}
                                    >
                                        <Ionicons name={role.icon} size={24} color={role.color} />
                                    </View>
                                    <View style={styles.roleText}>
                                        <Text style={styles.roleTitle}>{role.title}</Text>
                                        <Text style={styles.roleDescription}>{role.description}</Text>
                                    </View>
                                    {selectedRole === role.id && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={24}
                                            color={role.color}
                                        />
                                    )}
                                </View>
                            </Card>
                        ))}
                    </View>

                    {/* Phone Input */}
                    <Text style={styles.sectionTitle}>Login</Text>
                    <Input
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter your 10-digit phone number"
                        keyboardType="phone-pad"
                        maxLength={10}
                        error={phoneError}
                        leftIcon={
                            <Ionicons name="call-outline" size={20} color={Colors.outline} />
                        }
                    />

                    {/* Device ID Display */}
                    <View style={styles.deviceInfo}>
                        <Ionicons name="phone-portrait-outline" size={16} color={Colors.outline} />
                        <Text style={styles.deviceText}>
                            Device ID: {deviceId?.slice(0, 20)}...
                        </Text>
                    </View>

                    {/* Login Button */}
                    <Button
                        title="Login"
                        onPress={handleLogin}
                        loading={submitting || isLoading}
                        disabled={!selectedRole || !phone || submitting}
                        fullWidth
                        size="large"
                        style={styles.loginButton}
                    />

                    {/* Info Card */}
                    <Card variant="filled" style={styles.infoCard}>
                        <View style={styles.infoContent}>
                            <Ionicons name="information-circle" size={20} color={Colors.primary} />
                            <Text style={styles.infoText}>
                                Login is restricted to registered devices only. Contact your admin if you need to change devices.
                            </Text>
                        </View>
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        marginTop: Spacing.lg,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryContainer,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        ...Typography.headlineMedium,
        color: Colors.onSurface,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.bodyMedium,
        color: Colors.onSurfaceVariant,
    },
    sectionTitle: {
        ...Typography.titleMedium,
        color: Colors.onSurface,
        marginBottom: Spacing.md,
        marginTop: Spacing.sm,
    },
    roleContainer: {
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    roleCard: {
        padding: Spacing.md,
    },
    roleContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    roleText: {
        flex: 1,
    },
    roleTitle: {
        ...Typography.titleMedium,
        color: Colors.onSurface,
    },
    roleDescription: {
        ...Typography.bodySmall,
        color: Colors.onSurfaceVariant,
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm,
        marginBottom: Spacing.lg,
        gap: Spacing.xs,
    },
    deviceText: {
        ...Typography.bodySmall,
        color: Colors.outline,
    },
    loginButton: {
        marginTop: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    infoCard: {
        backgroundColor: Colors.primaryContainer,
    },
    infoContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    infoText: {
        ...Typography.bodySmall,
        color: Colors.onPrimaryContainer,
        flex: 1,
    },
});

export default LoginScreen;
