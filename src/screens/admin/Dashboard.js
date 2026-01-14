import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { db } from '../../services/database';
import { Card, TopBar, Avatar, StatusBadge } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { getCurrentDateString, formatDate } from '../../utils/dateUtils';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { currentStore } = useStore();
    const [stats, setStats] = useState({ totalStaff: 0, presentToday: 0, pendingLeaves: 0, onLeaveToday: 0 });
    const [refreshing, setRefreshing] = useState(false);
    const [todayAttendance, setTodayAttendance] = useState([]);

    useEffect(() => { if (currentStore) loadDashboardData(); }, [currentStore]);

    const loadDashboardData = async () => {
        if (!currentStore) return;
        try {
            const staff = await db.staff.getByStoreId(currentStore.id);
            const today = getCurrentDateString();
            const attendance = await db.attendance.getByStoreAndDate(currentStore.id, today);
            const pendingLeaves = await db.leaveRequests.getPendingByStoreId(currentStore.id);

            setStats({
                totalStaff: staff.filter(s => s.status === 'active').length,
                presentToday: attendance.filter(a => a.status === 'present' || a.status === 'late').length,
                pendingLeaves: pendingLeaves.length,
                onLeaveToday: attendance.filter(a => a.status === 'on_leave').length,
            });

            const attendanceWithStaff = await Promise.all(
                attendance.slice(0, 5).map(async (a) => {
                    const s = await db.staff.getById(a.staffId);
                    return { ...a, staffName: s?.name || 'Unknown' };
                })
            );
            setTodayAttendance(attendanceWithStaff);
        } catch (error) { console.error('Error:', error); }
    };

    const onRefresh = async () => { setRefreshing(true); await loadDashboardData(); setRefreshing(false); };

    const StatCard = ({ icon, label, value, color }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar
                title="Admin Dashboard"
                subtitle={currentStore?.name || 'No store selected'}
                rightComponent={
                    <TouchableOpacity onPress={logout}>
                        <Ionicons name="log-out-outline" size={24} color={Colors.error} />
                    </TouchableOpacity>
                }
            />
            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <Card variant="filled" style={styles.welcomeCard}>
                    <View style={styles.welcomeContent}>
                        <Avatar name={user?.name} size={48} backgroundColor={Colors.adminAccent} />
                        <View style={styles.welcomeText}>
                            <Text style={styles.welcomeGreeting}>Welcome,</Text>
                            <Text style={styles.welcomeName}>{user?.name}</Text>
                        </View>
                    </View>
                </Card>

                <Text style={styles.sectionTitle}>Today's Overview</Text>
                <View style={styles.statsGrid}>
                    <StatCard icon="people" label="Total Staff" value={stats.totalStaff} color={Colors.primary} />
                    <StatCard icon="checkmark-circle" label="Present" value={stats.presentToday} color={Colors.success} />
                    <StatCard icon="time" label="Pending Leaves" value={stats.pendingLeaves} color={Colors.warning} />
                    <StatCard icon="airplane" label="On Leave" value={stats.onLeaveToday} color={Colors.secondary} />
                </View>

                <Text style={styles.sectionTitle}>Recent Check-ins</Text>
                {todayAttendance.map((a) => (
                    <Card key={a.id} variant="outlined" style={styles.attendanceCard}>
                        <View style={styles.attendanceRow}>
                            <Avatar name={a.staffName} size={40} />
                            <View style={styles.attendanceInfo}>
                                <Text style={styles.attendanceName}>{a.staffName}</Text>
                                <Text style={styles.attendanceTime}>{formatDate(a.checkIn, 'hh:mm a')}</Text>
                            </View>
                            <StatusBadge status={a.status} size="small" />
                        </View>
                    </Card>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1, padding: Spacing.md },
    welcomeCard: { backgroundColor: Colors.adminAccent, marginBottom: Spacing.lg },
    welcomeContent: { flexDirection: 'row', alignItems: 'center' },
    welcomeText: { marginLeft: Spacing.md },
    welcomeGreeting: { ...Typography.bodyMedium, color: 'rgba(255,255,255,0.8)' },
    welcomeName: { ...Typography.titleLarge, color: '#fff' },
    sectionTitle: { ...Typography.titleMedium, color: Colors.onSurface, marginBottom: Spacing.md, marginTop: Spacing.sm },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    statCard: { width: '48%', backgroundColor: Colors.surfaceContainerLow, borderRadius: BorderRadius.lg, padding: Spacing.md, borderLeftWidth: 4 },
    statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
    statValue: { ...Typography.headlineSmall, color: Colors.onSurface },
    statLabel: { ...Typography.bodySmall, color: Colors.onSurfaceVariant },
    attendanceCard: { marginBottom: Spacing.sm },
    attendanceRow: { flexDirection: 'row', alignItems: 'center' },
    attendanceInfo: { flex: 1, marginLeft: Spacing.md },
    attendanceName: { ...Typography.titleSmall, color: Colors.onSurface },
    attendanceTime: { ...Typography.bodySmall, color: Colors.outline },
});

export default Dashboard;
