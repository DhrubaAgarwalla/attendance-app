import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Card, TopBar, Avatar, Button } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function ProfileScreen() {
    const { user, logout, deviceId } = useAuth();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="Profile" subtitle="My account" />
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Card variant="outlined" style={styles.profileCard}>
                    <Avatar name={user?.name} size={80} backgroundColor={Colors.staffAccent} />
                    <Text style={styles.name}>{user?.name}</Text>
                    <Text style={styles.role}>{user?.role?.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.phone}>{user?.phone}</Text>
                </Card>

                <Card variant="outlined" style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="phone-portrait-outline" size={20} color={Colors.outline} />
                        <View style={styles.infoText}>
                            <Text style={styles.infoLabel}>Device ID</Text>
                            <Text style={styles.infoValue}>{deviceId?.slice(0, 30)}...</Text>
                        </View>
                    </View>
                </Card>

                <Card variant="filled" style={styles.rulesCard}>
                    <View style={styles.rulesHeader}>
                        <Ionicons name="book-outline" size={24} color={Colors.primary} />
                        <Text style={styles.rulesTitle}>Company Rules</Text>
                    </View>
                    <Text style={styles.rulesText}>• 15-minute grace period for check-in</Text>
                    <Text style={styles.rulesText}>• 2 leaves allowed per month</Text>
                    <Text style={styles.rulesText}>• ₹500 bonus for perfect attendance</Text>
                    <Text style={styles.rulesText}>• 3rd late = ₹200 fine</Text>
                    <Text style={styles.rulesText}>• 5th late = marked absent</Text>
                </Card>

                <Button title="Logout" variant="outlined" color={Colors.error} onPress={logout} fullWidth style={styles.logoutBtn} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1 },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    profileCard: { alignItems: 'center', padding: Spacing.xl, marginBottom: Spacing.md },
    name: { ...Typography.headlineSmall, color: Colors.onSurface, marginTop: Spacing.md },
    role: { ...Typography.labelMedium, color: Colors.primary, marginTop: Spacing.xs },
    phone: { ...Typography.bodyMedium, color: Colors.outline, marginTop: Spacing.xs },
    infoCard: { marginBottom: Spacing.md },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    infoText: { flex: 1 },
    infoLabel: { ...Typography.labelSmall, color: Colors.outline },
    infoValue: { ...Typography.bodySmall, color: Colors.onSurface },
    rulesCard: { marginBottom: Spacing.lg },
    rulesHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    rulesTitle: { ...Typography.titleMedium, color: Colors.onSurface },
    rulesText: { ...Typography.bodySmall, color: Colors.onSurfaceVariant, marginBottom: Spacing.xs },
    logoutBtn: { marginTop: Spacing.md },
});
