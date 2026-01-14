import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/database';
import { Card, TopBar, StatusBadge, Loading, EmptyState } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { formatDate, formatTime, getCurrentMonthYear, getMonthName, getDaysInMonth } from '../../utils/dateUtils';
import { ATTENDANCE_STATUS } from '../../constants';

const AttendanceHistoryScreen = () => {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const { month, year } = getCurrentMonthYear();
        return { month, year };
    });
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, leave: 0 });

    useEffect(() => { loadAttendance(); }, [selectedMonth]);

    const loadAttendance = async () => {
        if (!user) return;
        try {
            const records = await db.attendance.getByStaffAndMonth(user.id, selectedMonth.year, selectedMonth.month);
            records.sort((a, b) => new Date(b.date) - new Date(a.date));
            setAttendance(records);

            // Calculate stats
            const s = { present: 0, absent: 0, late: 0, leave: 0 };
            records.forEach(r => {
                if (r.status === ATTENDANCE_STATUS.PRESENT) s.present++;
                else if (r.status === ATTENDANCE_STATUS.LATE) { s.present++; s.late++; }
                else if (r.status === ATTENDANCE_STATUS.ABSENT) s.absent++;
                else if (r.status === ATTENDANCE_STATUS.ON_LEAVE) s.leave++;
            });
            setStats(s);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const onRefresh = async () => { setRefreshing(true); await loadAttendance(); setRefreshing(false); };

    const navigateMonth = (direction) => {
        let { month, year } = selectedMonth;
        month += direction;
        if (month > 12) { month = 1; year++; }
        else if (month < 1) { month = 12; year--; }
        setSelectedMonth({ month, year });
        setLoading(true);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case ATTENDANCE_STATUS.PRESENT: return { icon: 'checkmark-circle', color: Colors.success };
            case ATTENDANCE_STATUS.LATE: return { icon: 'time', color: Colors.warning };
            case ATTENDANCE_STATUS.ABSENT: return { icon: 'close-circle', color: Colors.error };
            case ATTENDANCE_STATUS.ON_LEAVE: return { icon: 'airplane', color: Colors.secondary };
            default: return { icon: 'help-circle', color: Colors.outline };
        }
    };

    if (loading) return <Loading fullScreen text="Loading..." />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="Attendance History" subtitle="Past records" />

            {/* Month Navigator */}
            <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.monthText}>{getMonthName(selectedMonth.month)} {selectedMonth.year}</Text>
                <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Stats Summary */}
            <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: Colors.successContainer }]}>
                    <Text style={[styles.statValue, { color: Colors.success }]}>{stats.present}</Text>
                    <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: Colors.errorContainer }]}>
                    <Text style={[styles.statValue, { color: Colors.error }]}>{stats.absent}</Text>
                    <Text style={styles.statLabel}>Absent</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: Colors.warningContainer }]}>
                    <Text style={[styles.statValue, { color: Colors.warning }]}>{stats.late}</Text>
                    <Text style={styles.statLabel}>Late</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: Colors.secondaryContainer }]}>
                    <Text style={[styles.statValue, { color: Colors.secondary }]}>{stats.leave}</Text>
                    <Text style={styles.statLabel}>Leave</Text>
                </View>
            </View>

            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {attendance.length === 0 ? (
                    <EmptyState icon="calendar-outline" title="No Records" message="No attendance records for this month" />
                ) : (
                    attendance.map((record) => {
                        const statusStyle = getStatusStyle(record.status);
                        return (
                            <Card key={record.id} variant="outlined" style={styles.recordCard}>
                                <View style={styles.recordRow}>
                                    <View style={[styles.statusIcon, { backgroundColor: `${statusStyle.color}20` }]}>
                                        <Ionicons name={statusStyle.icon} size={24} color={statusStyle.color} />
                                    </View>
                                    <View style={styles.recordInfo}>
                                        <Text style={styles.recordDate}>{formatDate(record.date, 'EEEE, dd MMM')}</Text>
                                        <View style={styles.timeRow}>
                                            <Text style={styles.timeText}>In: {formatTime(record.checkIn)}</Text>
                                            {record.checkOut && <Text style={styles.timeText}>Out: {formatTime(record.checkOut)}</Text>}
                                        </View>
                                    </View>
                                    <StatusBadge status={record.status} size="small" />
                                </View>
                                {record.isLate && <Text style={styles.lateNote}>⚠️ Late arrival</Text>}
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
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
    navBtn: { padding: Spacing.sm },
    monthText: { ...Typography.titleMedium, color: Colors.onSurface },
    statsRow: { flexDirection: 'row', padding: Spacing.sm, gap: Spacing.xs },
    statBox: { flex: 1, alignItems: 'center', padding: Spacing.sm, borderRadius: BorderRadius.md },
    statValue: { ...Typography.titleLarge },
    statLabel: { ...Typography.labelSmall, color: Colors.onSurfaceVariant },
    content: { flex: 1, padding: Spacing.md },
    recordCard: { marginBottom: Spacing.sm },
    recordRow: { flexDirection: 'row', alignItems: 'center' },
    statusIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    recordInfo: { flex: 1, marginLeft: Spacing.md },
    recordDate: { ...Typography.titleSmall, color: Colors.onSurface },
    timeRow: { flexDirection: 'row', gap: Spacing.md },
    timeText: { ...Typography.bodySmall, color: Colors.outline },
    lateNote: { ...Typography.labelSmall, color: Colors.warning, marginTop: Spacing.xs },
});

export default AttendanceHistoryScreen;
