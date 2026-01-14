import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { db } from '../../services/database';
import { Card, TopBar, Avatar, StatusBadge, Button } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { getCurrentDateString, formatDate, formatTime, isCheckInLate } from '../../utils/dateUtils';
import { isWithinRadius } from '../../utils/calculations';
import { generateId } from '../../utils/helpers';
import { BUSINESS_RULES } from '../../constants';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { currentStore } = useStore();
    const [todayRecord, setTodayRecord] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locationError, setLocationError] = useState(null);

    useEffect(() => { loadTodayAttendance(); }, []);

    const loadTodayAttendance = async () => {
        if (!user) return;
        const today = getCurrentDateString();
        const record = await db.attendance.getByStaffAndDate(user.id, today);
        setTodayRecord(record);
    };

    const handleCheckIn = async () => {
        setLoading(true);
        setLocationError(null);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationError('Location permission required');
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Check if within store radius
            if (currentStore && currentStore.lat && currentStore.lng) {
                const withinRadius = isWithinRadius(latitude, longitude, currentStore.lat, currentStore.lng, currentStore.radius || 100);
                if (!withinRadius) {
                    Alert.alert('Location Error', 'You are outside the allowed check-in radius');
                    setLoading(false);
                    return;
                }
            }

            const now = new Date();
            const startTime = currentStore?.defaultStartTime || '09:00';
            const isLate = isCheckInLate(now, startTime, BUSINESS_RULES.GRACE_PERIOD_MINUTES);

            const record = {
                id: generateId(),
                staffId: user.id,
                storeId: currentStore?.id || user.storeId,
                date: getCurrentDateString(),
                checkIn: now.toISOString(),
                checkOut: null,
                isLate,
                status: isLate ? 'late' : 'present',
                lat: latitude,
                lng: longitude,
            };

            await db.attendance.add(record);
            setTodayRecord(record);
            Alert.alert('Success', isLate ? 'Checked in (Late)' : 'Checked in successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to check in');
        }
        setLoading(false);
    };

    const handleCheckOut = async () => {
        if (!todayRecord) return;
        setLoading(true);
        try {
            const now = new Date();
            await db.attendance.update(todayRecord.id, { checkOut: now.toISOString() });
            setTodayRecord({ ...todayRecord, checkOut: now.toISOString() });
            Alert.alert('Success', 'Checked out successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to check out');
        }
        setLoading(false);
    };

    const getStatusMessage = () => {
        if (!todayRecord) return { icon: 'log-in-outline', text: 'Not checked in yet', color: Colors.warning };
        if (todayRecord.checkOut) return { icon: 'checkmark-done', text: 'Day complete', color: Colors.success };
        if (todayRecord.isLate) return { icon: 'warning', text: 'Checked in late', color: Colors.warning };
        return { icon: 'checkmark-circle', text: 'Working', color: Colors.success };
    };

    const status = getStatusMessage();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar
                title="My Dashboard"
                subtitle={currentStore?.name || 'Staff'}
                rightComponent={<TouchableOpacity onPress={logout}><Ionicons name="log-out-outline" size={24} color={Colors.error} /></TouchableOpacity>}
            />
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Welcome Card */}
                <Card variant="filled" style={styles.welcomeCard}>
                    <View style={styles.welcomeContent}>
                        <Avatar name={user?.name} size={56} backgroundColor={Colors.staffAccent} />
                        <View style={styles.welcomeText}>
                            <Text style={styles.welcomeGreeting}>Hello,</Text>
                            <Text style={styles.welcomeName}>{user?.name}</Text>
                        </View>
                    </View>
                </Card>

                {/* Status Card */}
                <Card variant="outlined" style={styles.statusCard}>
                    <View style={styles.statusContent}>
                        <View style={[styles.statusIcon, { backgroundColor: `${status.color}20` }]}>
                            <Ionicons name={status.icon} size={32} color={status.color} />
                        </View>
                        <Text style={styles.statusText}>{status.text}</Text>
                        <Text style={styles.dateText}>{formatDate(new Date(), 'EEEE, dd MMM yyyy')}</Text>
                    </View>

                    {todayRecord && (
                        <View style={styles.timeDisplay}>
                            <View style={styles.timeBox}>
                                <Text style={styles.timeLabel}>Check In</Text>
                                <Text style={styles.timeValue}>{formatTime(todayRecord.checkIn)}</Text>
                            </View>
                            <View style={styles.timeDivider} />
                            <View style={styles.timeBox}>
                                <Text style={styles.timeLabel}>Check Out</Text>
                                <Text style={styles.timeValue}>{todayRecord.checkOut ? formatTime(todayRecord.checkOut) : '--:--'}</Text>
                            </View>
                        </View>
                    )}
                </Card>

                {/* Action Button */}
                {!todayRecord ? (
                    <Button title="Check In" onPress={handleCheckIn} loading={loading} fullWidth size="large" icon={<Ionicons name="log-in" size={24} color="#fff" />} style={styles.actionBtn} />
                ) : !todayRecord.checkOut ? (
                    <Button title="Check Out" onPress={handleCheckOut} loading={loading} fullWidth size="large" variant="outlined" icon={<Ionicons name="log-out" size={24} color={Colors.primary} />} style={styles.actionBtn} />
                ) : (
                    <Card variant="filled" style={styles.completeCard}>
                        <Ionicons name="checkmark-done-circle" size={48} color={Colors.success} />
                        <Text style={styles.completeText}>Your day is complete!</Text>
                    </Card>
                )}

                {locationError && <Text style={styles.errorText}>{locationError}</Text>}

                {/* Quick Links */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickLinks}>
                    <TouchableOpacity style={styles.quickLink}>
                        <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
                        <Text style={styles.quickLinkText}>My Attendance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickLink}>
                        <Ionicons name="airplane-outline" size={24} color={Colors.secondary} />
                        <Text style={styles.quickLinkText}>Apply Leave</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickLink}>
                        <Ionicons name="wallet-outline" size={24} color={Colors.staffAccent} />
                        <Text style={styles.quickLinkText}>My Salary</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickLink}>
                        <Ionicons name="book-outline" size={24} color={Colors.warning} />
                        <Text style={styles.quickLinkText}>Company Rules</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1 },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    welcomeCard: { backgroundColor: Colors.staffAccent, marginBottom: Spacing.lg },
    welcomeContent: { flexDirection: 'row', alignItems: 'center' },
    welcomeText: { marginLeft: Spacing.md },
    welcomeGreeting: { ...Typography.bodyMedium, color: 'rgba(255,255,255,0.8)' },
    welcomeName: { ...Typography.titleLarge, color: '#fff' },
    statusCard: { marginBottom: Spacing.lg },
    statusContent: { alignItems: 'center', paddingVertical: Spacing.md },
    statusIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
    statusText: { ...Typography.titleMedium, color: Colors.onSurface },
    dateText: { ...Typography.bodySmall, color: Colors.outline },
    timeDisplay: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.outlineVariant, marginTop: Spacing.md, paddingTop: Spacing.md },
    timeBox: { flex: 1, alignItems: 'center' },
    timeLabel: { ...Typography.labelSmall, color: Colors.outline },
    timeValue: { ...Typography.headlineSmall, color: Colors.onSurface },
    timeDivider: { width: 1, backgroundColor: Colors.outlineVariant },
    actionBtn: { marginBottom: Spacing.lg },
    completeCard: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, marginBottom: Spacing.lg },
    completeText: { ...Typography.titleMedium, color: Colors.success, marginTop: Spacing.sm },
    errorText: { ...Typography.bodySmall, color: Colors.error, textAlign: 'center', marginBottom: Spacing.md },
    sectionTitle: { ...Typography.titleMedium, color: Colors.onSurface, marginBottom: Spacing.md },
    quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    quickLink: { width: '48%', backgroundColor: Colors.surfaceContainerLow, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: Spacing.sm },
    quickLinkText: { ...Typography.labelMedium, color: Colors.onSurface },
});

export default Dashboard;
