import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { db } from '../../services/database';
import { Card, TopBar, Avatar, StatusBadge } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/calculations';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { stores, loadStores } = useStore();
    const [stats, setStats] = useState({
        totalStores: 0,
        activeStores: 0,
        totalAdmins: 0,
        totalStaff: 0,
        pendingLeaves: 0,
        pendingDeviceRequests: 0,
    });
    const [refreshing, setRefreshing] = useState(false);
    const [recentLeaves, setRecentLeaves] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const allStores = await db.stores.getAll();
            const allAdmins = await db.admins.getAll();
            const allStaff = await db.staff.getAll();
            const pendingLeaves = await db.leaveRequests.getPending();
            const pendingDeviceReqs = await db.deviceRequests.getPending();

            setStats({
                totalStores: allStores.length,
                activeStores: allStores.filter(s => s.isActive).length,
                totalAdmins: allAdmins.length,
                totalStaff: allStaff.length,
                pendingLeaves: pendingLeaves.length,
                pendingDeviceRequests: pendingDeviceReqs.length,
            });

            // Get recent leave requests with staff info
            const leaves = await db.leaveRequests.getAll();
            const recentWithInfo = await Promise.all(
                leaves.slice(-5).reverse().map(async (leave) => {
                    const staff = await db.staff.getById(leave.staffId);
                    const store = await db.stores.getById(leave.storeId);
                    return {
                        ...leave,
                        staffName: staff?.name || 'Unknown',
                        storeName: store?.name || 'Unknown',
                    };
                })
            );
            setRecentLeaves(recentWithInfo);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        await loadStores();
        setRefreshing(false);
    };

    const StatCard = ({ icon, label, value, color, onPress }) => (
        <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: color }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar
                title="Super Admin"
                subtitle="Dashboard"
                rightComponent={
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <Ionicons name="log-out-outline" size={24} color={Colors.error} />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Welcome Card */}
                <Card variant="filled" style={styles.welcomeCard}>
                    <View style={styles.welcomeContent}>
                        <Avatar name={user?.name} size={56} backgroundColor={Colors.superAdminAccent} />
                        <View style={styles.welcomeText}>
                            <Text style={styles.welcomeGreeting}>Welcome back,</Text>
                            <Text style={styles.welcomeName}>{user?.name || 'Super Admin'}</Text>
                        </View>
                        <StatusBadge status="active" label="Online" size="small" />
                    </View>
                </Card>

                {/* Stats Grid */}
                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={styles.statsGrid}>
                    <StatCard
                        icon="storefront"
                        label="Total Stores"
                        value={stats.totalStores}
                        color={Colors.primary}
                    />
                    <StatCard
                        icon="storefront"
                        label="Active Stores"
                        value={stats.activeStores}
                        color={Colors.success}
                    />
                    <StatCard
                        icon="briefcase"
                        label="Admins"
                        value={stats.totalAdmins}
                        color={Colors.adminAccent}
                    />
                    <StatCard
                        icon="people"
                        label="Staff"
                        value={stats.totalStaff}
                        color={Colors.staffAccent}
                    />
                </View>

                {/* Pending Actions */}
                <Text style={styles.sectionTitle}>Pending Actions</Text>
                <View style={styles.pendingRow}>
                    <Card
                        variant="outlined"
                        style={styles.pendingCard}
                        onPress={() => { }}
                    >
                        <View style={styles.pendingContent}>
                            <View style={[styles.pendingIcon, { backgroundColor: Colors.warningContainer }]}>
                                <Ionicons name="calendar-outline" size={24} color={Colors.warning} />
                            </View>
                            <View style={styles.pendingText}>
                                <Text style={styles.pendingValue}>{stats.pendingLeaves}</Text>
                                <Text style={styles.pendingLabel}>Leave Requests</Text>
                            </View>
                        </View>
                    </Card>

                    <Card
                        variant="outlined"
                        style={styles.pendingCard}
                        onPress={() => { }}
                    >
                        <View style={styles.pendingContent}>
                            <View style={[styles.pendingIcon, { backgroundColor: Colors.errorContainer }]}>
                                <Ionicons name="phone-portrait-outline" size={24} color={Colors.error} />
                            </View>
                            <View style={styles.pendingText}>
                                <Text style={styles.pendingValue}>{stats.pendingDeviceRequests}</Text>
                                <Text style={styles.pendingLabel}>Device Requests</Text>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* Recent Leave Requests */}
                <Text style={styles.sectionTitle}>Recent Leave Requests</Text>
                {recentLeaves.length > 0 ? (
                    recentLeaves.map((leave) => (
                        <Card key={leave.id} variant="outlined" style={styles.leaveCard}>
                            <View style={styles.leaveContent}>
                                <Avatar name={leave.staffName} size={40} />
                                <View style={styles.leaveInfo}>
                                    <Text style={styles.leaveName}>{leave.staffName}</Text>
                                    <Text style={styles.leaveStore}>{leave.storeName}</Text>
                                    <Text style={styles.leaveDate}>{leave.leaveDate}</Text>
                                </View>
                                <StatusBadge status={leave.status} size="small" />
                            </View>
                            {leave.approvedBy && (
                                <Text style={styles.approvedBy}>
                                    {leave.status === 'approved' ? 'Approved' : 'Rejected'} by: {leave.approvedBy}
                                </Text>
                            )}
                        </Card>
                    ))
                ) : (
                    <Card variant="filled" style={styles.emptyCard}>
                        <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
                        <Text style={styles.emptyText}>No leave requests yet</Text>
                    </Card>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    logoutBtn: {
        padding: Spacing.sm,
    },
    welcomeCard: {
        backgroundColor: Colors.superAdminAccent,
        marginBottom: Spacing.lg,
    },
    welcomeContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    welcomeText: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    welcomeGreeting: {
        ...Typography.bodyMedium,
        color: 'rgba(255,255,255,0.8)',
    },
    welcomeName: {
        ...Typography.titleLarge,
        color: '#fff',
    },
    sectionTitle: {
        ...Typography.titleMedium,
        color: Colors.onSurface,
        marginBottom: Spacing.md,
        marginTop: Spacing.sm,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    statCard: {
        width: '48%',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        borderLeftWidth: 4,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    statValue: {
        ...Typography.headlineMedium,
        color: Colors.onSurface,
    },
    statLabel: {
        ...Typography.bodySmall,
        color: Colors.onSurfaceVariant,
    },
    pendingRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    pendingCard: {
        flex: 1,
    },
    pendingContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pendingIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    pendingText: {
        flex: 1,
    },
    pendingValue: {
        ...Typography.headlineSmall,
        color: Colors.onSurface,
    },
    pendingLabel: {
        ...Typography.bodySmall,
        color: Colors.onSurfaceVariant,
    },
    leaveCard: {
        marginBottom: Spacing.sm,
    },
    leaveContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leaveInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    leaveName: {
        ...Typography.titleSmall,
        color: Colors.onSurface,
    },
    leaveStore: {
        ...Typography.bodySmall,
        color: Colors.onSurfaceVariant,
    },
    leaveDate: {
        ...Typography.labelSmall,
        color: Colors.outline,
    },
    approvedBy: {
        ...Typography.bodySmall,
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.sm,
        fontStyle: 'italic',
    },
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    emptyText: {
        ...Typography.bodyMedium,
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.sm,
    },
});

export default Dashboard;
