import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../contexts/StoreContext';
import { db } from '../../services/database';
import { Card, TopBar, Avatar, StatusBadge, Loading, EmptyState, Button } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { formatDate, formatTime, getCurrentDateString } from '../../utils/dateUtils';
import { ATTENDANCE_STATUS, STAFF_STATUS } from '../../constants';

const AttendanceScreen = () => {
    const { currentStore } = useStore();
    const [staff, setStaff] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const today = getCurrentDateString();

    useEffect(() => { if (currentStore) loadData(); }, [currentStore]);

    const loadData = async () => {
        if (!currentStore) return;
        try {
            // Get active staff
            const staffList = await db.staff.getByStoreId(currentStore.id);
            const activeStaff = staffList.filter(s => s.status === STAFF_STATUS.ACTIVE);
            setStaff(activeStaff);

            // Get today's attendance
            const todayRecords = await db.attendance.getByStoreAndDate(currentStore.id, today);
            const attendanceMap = {};
            todayRecords.forEach(r => { attendanceMap[r.staffId] = r; });
            setAttendance(attendanceMap);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

    const markAttendance = async (staffMember, status) => {
        try {
            const existing = attendance[staffMember.id];
            if (existing) {
                await db.attendance.update(existing.id, { status, updatedAt: new Date().toISOString() });
                setAttendance({ ...attendance, [staffMember.id]: { ...existing, status } });
            } else {
                const record = {
                    id: `${staffMember.id}_${today}`,
                    staffId: staffMember.id,
                    storeId: currentStore.id,
                    date: today,
                    checkIn: status === ATTENDANCE_STATUS.PRESENT || status === ATTENDANCE_STATUS.LATE ? new Date().toISOString() : null,
                    checkOut: null,
                    isLate: status === ATTENDANCE_STATUS.LATE,
                    status,
                    lat: null, lng: null,
                    markedBy: 'admin',
                };
                await db.attendance.add(record);
                setAttendance({ ...attendance, [staffMember.id]: record });
            }
        } catch (error) { Alert.alert('Error', 'Failed to mark attendance'); }
    };

    const getStatusColor = (staffId) => {
        const record = attendance[staffId];
        if (!record) return Colors.outline;
        switch (record.status) {
            case ATTENDANCE_STATUS.PRESENT: return Colors.success;
            case ATTENDANCE_STATUS.LATE: return Colors.warning;
            case ATTENDANCE_STATUS.ABSENT: return Colors.error;
            case ATTENDANCE_STATUS.ON_LEAVE: return Colors.secondary;
            default: return Colors.outline;
        }
    };

    if (loading) return <Loading fullScreen text="Loading..." />;

    const presentCount = Object.values(attendance).filter(a => a.status === ATTENDANCE_STATUS.PRESENT || a.status === ATTENDANCE_STATUS.LATE).length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="Attendance" subtitle={formatDate(today, 'EEEE, dd MMM')} />

            {/* Summary Card */}
            <Card variant="filled" style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{staff.length}</Text>
                        <Text style={styles.summaryLabel}>Total Staff</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: Colors.success }]}>{presentCount}</Text>
                        <Text style={styles.summaryLabel}>Present</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: Colors.error }]}>{staff.length - presentCount}</Text>
                        <Text style={styles.summaryLabel}>Not Marked</Text>
                    </View>
                </View>
            </Card>

            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {staff.length === 0 ? (
                    <EmptyState icon="people-outline" title="No Staff" message="Add staff to mark attendance" />
                ) : (
                    staff.map((s) => {
                        const record = attendance[s.id];
                        const statusColor = getStatusColor(s.id);
                        return (
                            <Card key={s.id} variant="outlined" style={[styles.staffCard, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}>
                                <View style={styles.staffRow}>
                                    <Avatar name={s.name} size={44} source={s.photoUrl} />
                                    <View style={styles.staffInfo}>
                                        <Text style={styles.staffName}>{s.name}</Text>
                                        <Text style={styles.staffRole}>{s.role}</Text>
                                        {record && <Text style={styles.checkTime}>In: {formatTime(record.checkIn)}</Text>}
                                    </View>
                                    {record && <StatusBadge status={record.status} size="small" />}
                                </View>

                                {!record || record.status === ATTENDANCE_STATUS.ABSENT ? (
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.successContainer }]} onPress={() => markAttendance(s, ATTENDANCE_STATUS.PRESENT)}>
                                            <Ionicons name="checkmark" size={20} color={Colors.success} />
                                            <Text style={[styles.actionText, { color: Colors.success }]}>Present</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.warningContainer }]} onPress={() => markAttendance(s, ATTENDANCE_STATUS.LATE)}>
                                            <Ionicons name="time" size={20} color={Colors.warning} />
                                            <Text style={[styles.actionText, { color: Colors.warning }]}>Late</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.errorContainer }]} onPress={() => markAttendance(s, ATTENDANCE_STATUS.ABSENT)}>
                                            <Ionicons name="close" size={20} color={Colors.error} />
                                            <Text style={[styles.actionText, { color: Colors.error }]}>Absent</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.secondaryContainer }]} onPress={() => markAttendance(s, ATTENDANCE_STATUS.ON_LEAVE)}>
                                            <Ionicons name="airplane" size={20} color={Colors.secondary} />
                                            <Text style={[styles.actionText, { color: Colors.secondary }]}>Leave</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                            </Card>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    summaryCard: { margin: Spacing.md, marginBottom: 0 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center' },
    summaryValue: { ...Typography.headlineSmall, color: Colors.primary },
    summaryLabel: { ...Typography.labelSmall, color: Colors.onSurfaceVariant },
    summaryDivider: { width: 1, backgroundColor: Colors.outlineVariant },
    content: { flex: 1, padding: Spacing.md },
    staffCard: { marginBottom: Spacing.md },
    staffRow: { flexDirection: 'row', alignItems: 'center' },
    staffInfo: { flex: 1, marginLeft: Spacing.md },
    staffName: { ...Typography.titleMedium, color: Colors.onSurface },
    staffRole: { ...Typography.bodySmall, color: Colors.outline },
    checkTime: { ...Typography.labelSmall, color: Colors.success },
    actionRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.md },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.sm, borderRadius: BorderRadius.sm, gap: 4 },
    actionText: { ...Typography.labelSmall },
});

export default AttendanceScreen;
