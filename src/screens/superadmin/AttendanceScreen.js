import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/database';
import { Card, TopBar, Avatar, StatusBadge, Loading, EmptyState } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { getCurrentDateString, formatDate } from '../../utils/dateUtils';

const AttendanceScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
    const [attendance, setAttendance] = useState([]);
    const [summary, setSummary] = useState({ present: 0, late: 0, absent: 0, onLeave: 0 });

    useEffect(() => {
        loadStores();
    }, []);

    useEffect(() => {
        if (selectedStore) loadAttendance();
    }, [selectedStore, selectedDate]);

    const loadStores = async () => {
        try {
            const allStores = await db.stores.getAll();
            const activeStores = allStores.filter(s => s.isActive);
            setStores(activeStores);
            if (activeStores.length > 0) {
                setSelectedStore(activeStores[0]);
            }
        } catch (error) {
            console.error('Error loading stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAttendance = async () => {
        if (!selectedStore) return;
        try {
            // Wrap in try-catch to handle Firebase query errors
            let attendanceList = [];
            let staff = [];

            try {
                attendanceList = await db.attendance.getByStoreAndDate(selectedStore.id, selectedDate);
            } catch (e) {
                console.error('Error fetching attendance:', e);
                attendanceList = [];
            }

            try {
                staff = await db.staff.getByStoreId(selectedStore.id);
            } catch (e) {
                console.error('Error fetching staff:', e);
                staff = [];
            }

            const enriched = staff.filter(s => s.status === 'active').map((s) => {
                const record = attendanceList.find(a => a.staffId === s.id);
                return {
                    staffId: s.id,
                    staffName: s.name || 'Unknown',
                    staffRole: s.role || 'Staff',
                    status: record?.status || 'not_marked',
                    checkIn: record?.checkIn,
                    checkOut: record?.checkOut,
                };
            });

            setAttendance(enriched);
            setSummary({
                present: enriched.filter(a => a.status === 'present').length,
                late: enriched.filter(a => a.status === 'late').length,
                absent: enriched.filter(a => a.status === 'absent').length,
                onLeave: enriched.filter(a => a.status === 'on_leave').length,
            });
        } catch (error) {
            console.error('Error loading attendance:', error);
            setAttendance([]);
            setSummary({ present: 0, late: 0, absent: 0, onLeave: 0 });
        }
    };

    const navigateDate = (days) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAttendance();
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return Colors.success;
            case 'late': return Colors.warning;
            case 'absent': return Colors.error;
            case 'on_leave': return Colors.secondary;
            default: return Colors.outline;
        }
    };

    if (loading) return <Loading fullScreen text="Loading..." />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="Attendance" subtitle="View all stores" />

            {/* Store Selector */}
            {stores.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storeSelector}>
                    {stores.map((store) => (
                        <TouchableOpacity
                            key={store.id}
                            style={[styles.storeChip, selectedStore?.id === store.id && styles.storeChipSelected]}
                            onPress={() => setSelectedStore(store)}
                        >
                            <Text style={[styles.storeChipText, selectedStore?.id === store.id && styles.storeChipTextSelected]}>
                                {store.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.noStoresContainer}>
                    <Text style={styles.noStoresText}>No active stores found</Text>
                </View>
            )}

            {/* Date Navigator */}
            <View style={styles.dateNav}>
                <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.dateText}>{formatDate(selectedDate, 'EEE, MMM d, yyyy')}</Text>
                <TouchableOpacity onPress={() => navigateDate(1)} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryItem, { backgroundColor: Colors.successContainer }]}>
                    <Text style={styles.summaryValue}>{summary.present}</Text>
                    <Text style={styles.summaryLabel}>Present</Text>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: Colors.warningContainer }]}>
                    <Text style={styles.summaryValue}>{summary.late}</Text>
                    <Text style={styles.summaryLabel}>Late</Text>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: Colors.errorContainer }]}>
                    <Text style={styles.summaryValue}>{summary.absent}</Text>
                    <Text style={styles.summaryLabel}>Absent</Text>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: Colors.secondaryContainer }]}>
                    <Text style={styles.summaryValue}>{summary.onLeave}</Text>
                    <Text style={styles.summaryLabel}>Leave</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {attendance.length === 0 ? (
                    <EmptyState icon="people-outline" title="No Staff" message="No active staff in this store" />
                ) : (
                    attendance.map((record) => (
                        <Card key={record.staffId} variant="outlined" style={styles.attendanceCard}>
                            <View style={styles.attendanceRow}>
                                <Avatar name={record.staffName} size={44} />
                                <View style={styles.attendanceInfo}>
                                    <Text style={styles.staffName}>{record.staffName}</Text>
                                    <Text style={styles.staffRole}>{record.staffRole}</Text>
                                    {record.checkIn && (
                                        <Text style={styles.timeText}>
                                            In: {formatDate(record.checkIn, 'hh:mm a')}
                                            {record.checkOut && ` • Out: ${formatDate(record.checkOut, 'hh:mm a')}`}
                                        </Text>
                                    )}
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) + '20' }]}>
                                    <Ionicons
                                        name={record.status === 'present' ? 'checkmark-circle' : record.status === 'late' ? 'time' : record.status === 'absent' ? 'close-circle' : 'airplane'}
                                        size={16}
                                        color={getStatusColor(record.status)}
                                    />
                                    <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                                        {record.status === 'not_marked' ? 'Not Marked' : record.status.replace('_', ' ')}
                                    </Text>
                                </View>
                            </View>
                        </Card>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    storeSelector: { flexGrow: 0, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    storeChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.surfaceVariant,
        marginRight: Spacing.sm,
    },
    storeChipSelected: { backgroundColor: Colors.primary },
    storeChipText: { ...Typography.labelMedium, color: Colors.onSurfaceVariant },
    storeChipTextSelected: { color: Colors.onPrimary },
    dateNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.surface,
    },
    navBtn: { padding: Spacing.sm },
    dateText: { ...Typography.titleMedium, color: Colors.onSurface },
    summaryRow: { flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    summaryItem: { flex: 1, alignItems: 'center', padding: Spacing.sm, borderRadius: BorderRadius.md },
    summaryValue: { ...Typography.titleMedium, color: Colors.onSurface },
    summaryLabel: { ...Typography.labelSmall, color: Colors.onSurfaceVariant },
    content: { flex: 1 },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    attendanceCard: { marginBottom: Spacing.sm },
    attendanceRow: { flexDirection: 'row', alignItems: 'center' },
    attendanceInfo: { flex: 1, marginLeft: Spacing.md },
    staffName: { ...Typography.titleSmall, color: Colors.onSurface },
    staffRole: { ...Typography.bodySmall, color: Colors.outline },
    timeText: { ...Typography.labelSmall, color: Colors.primary, marginTop: 2 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    statusText: { ...Typography.labelSmall, textTransform: 'capitalize' },
    noStoresContainer: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
    noStoresText: {
        ...Typography.bodyMedium,
        color: Colors.outline,
    },
});

export default AttendanceScreen;
