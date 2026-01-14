import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useStore } from '../../contexts/StoreContext';
import { db } from '../../services/database';
import { Card, TopBar, Button, Loading } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/calculations';
import { getMonthName, getCurrentMonthYear, getWorkingDaysInMonth } from '../../utils/dateUtils';
import { ATTENDANCE_STATUS, STAFF_STATUS } from '../../constants';

const ReportsScreen = () => {
    const { currentStore } = useStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthYear());
    const [report, setReport] = useState(null);

    useEffect(() => { if (currentStore) loadReport(); }, [currentStore, selectedMonth]);

    const loadReport = async () => {
        if (!currentStore) return;
        try {
            const staffList = await db.staff.getByStoreId(currentStore.id);
            const activeStaff = staffList.filter(s => s.status !== STAFF_STATUS.LEFT);
            const monthStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;

            const staffReports = await Promise.all(activeStaff.map(async (s) => {
                const attendance = await db.attendance.getByStaffAndMonth(s.id, selectedMonth.year, selectedMonth.month);
                const leaves = (await db.leaveRequests.getByStaffId(s.id)).filter(l => l.leaveDate.startsWith(monthStr) && l.status === 'approved');

                let present = 0, late = 0, absent = 0;
                attendance.forEach(a => {
                    if (a.status === ATTENDANCE_STATUS.PRESENT) present++;
                    else if (a.status === ATTENDANCE_STATUS.LATE) { present++; late++; }
                    else if (a.status === ATTENDANCE_STATUS.ABSENT) absent++;
                });

                return {
                    id: s.id, name: s.name, role: s.role, salary: s.monthlySalary,
                    presentDays: present, lateDays: late, absentDays: absent, leaveDays: leaves.length,
                };
            }));

            const totals = staffReports.reduce((acc, s) => ({
                present: acc.present + s.presentDays,
                late: acc.late + s.lateDays,
                absent: acc.absent + s.absentDays,
                leave: acc.leave + s.leaveDays,
                salary: acc.salary + s.salary,
            }), { present: 0, late: 0, absent: 0, leave: 0, salary: 0 });

            setReport({ staffReports, totals, workingDays: getWorkingDaysInMonth(selectedMonth.year, selectedMonth.month) });
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const navigateMonth = (dir) => {
        let { month, year } = selectedMonth;
        month += dir;
        if (month > 12) { month = 1; year++; }
        else if (month < 1) { month = 12; year--; }
        setSelectedMonth({ month, year });
        setLoading(true);
    };

    const exportCSV = async () => {
        if (!report) return;
        try {
            let csv = 'Name,Role,Salary,Present,Late,Absent,Leaves\n';
            report.staffReports.forEach(s => {
                csv += `${s.name},${s.role},${s.salary},${s.presentDays},${s.lateDays},${s.absentDays},${s.leaveDays}\n`;
            });
            csv += `\nTOTALS,,${report.totals.salary},${report.totals.present},${report.totals.late},${report.totals.absent},${report.totals.leave}`;

            const fileName = `${currentStore?.name || 'Store'}_${getMonthName(selectedMonth.month)}_${selectedMonth.year}.csv`;
            const filePath = FileSystem.documentDirectory + fileName;
            await FileSystem.writeAsStringAsync(filePath, csv);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath);
            } else {
                Alert.alert('Success', `Report saved to ${fileName}`);
            }
        } catch (error) { Alert.alert('Error', 'Failed to export'); }
    };

    const onRefresh = async () => { setRefreshing(true); await loadReport(); setRefreshing(false); };

    if (loading) return <Loading fullScreen text="Loading report..." />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="Reports" subtitle={currentStore?.name || 'Store'} rightIcon="download-outline" onRightPress={exportCSV} />

            <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.monthText}>{getMonthName(selectedMonth.month)} {selectedMonth.year}</Text>
                <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {/* Summary Cards */}
                {report && (
                    <>
                        <View style={styles.summaryGrid}>
                            <View style={[styles.summaryCard, { backgroundColor: Colors.primaryContainer }]}>
                                <Text style={styles.summaryValue}>{report.staffReports.length}</Text>
                                <Text style={styles.summaryLabel}>Staff</Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: Colors.successContainer }]}>
                                <Text style={styles.summaryValue}>{report.totals.present}</Text>
                                <Text style={styles.summaryLabel}>Present</Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: Colors.warningContainer }]}>
                                <Text style={styles.summaryValue}>{report.totals.late}</Text>
                                <Text style={styles.summaryLabel}>Late</Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: Colors.errorContainer }]}>
                                <Text style={styles.summaryValue}>{report.totals.absent}</Text>
                                <Text style={styles.summaryLabel}>Absent</Text>
                            </View>
                        </View>

                        <Card variant="outlined" style={styles.salaryCard}>
                            <Text style={styles.salaryLabel}>Total Salary Liability</Text>
                            <Text style={styles.salaryValue}>{formatCurrency(report.totals.salary)}</Text>
                        </Card>

                        <Text style={styles.sectionTitle}>Staff Details</Text>
                        {report.staffReports.map((s) => (
                            <Card key={s.id} variant="outlined" style={styles.staffCard}>
                                <View style={styles.staffHeader}>
                                    <View>
                                        <Text style={styles.staffName}>{s.name}</Text>
                                        <Text style={styles.staffRole}>{s.role}</Text>
                                    </View>
                                    <Text style={styles.staffSalary}>{formatCurrency(s.salary)}</Text>
                                </View>
                                <View style={styles.statsRow}>
                                    <View style={styles.stat}><Text style={[styles.statVal, { color: Colors.success }]}>{s.presentDays}</Text><Text style={styles.statLbl}>Present</Text></View>
                                    <View style={styles.stat}><Text style={[styles.statVal, { color: Colors.warning }]}>{s.lateDays}</Text><Text style={styles.statLbl}>Late</Text></View>
                                    <View style={styles.stat}><Text style={[styles.statVal, { color: Colors.error }]}>{s.absentDays}</Text><Text style={styles.statLbl}>Absent</Text></View>
                                    <View style={styles.stat}><Text style={[styles.statVal, { color: Colors.secondary }]}>{s.leaveDays}</Text><Text style={styles.statLbl}>Leave</Text></View>
                                </View>
                            </Card>
                        ))}

                        <Button title="Export CSV Report" onPress={exportCSV} fullWidth icon={<Ionicons name="download" size={20} color="#fff" />} style={styles.exportBtn} />
                    </>
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
    content: { flex: 1, padding: Spacing.md },
    summaryGrid: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
    summaryCard: { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md },
    summaryValue: { ...Typography.titleLarge, color: Colors.onSurface },
    summaryLabel: { ...Typography.labelSmall, color: Colors.onSurfaceVariant },
    salaryCard: { alignItems: 'center', padding: Spacing.lg, marginBottom: Spacing.md },
    salaryLabel: { ...Typography.labelMedium, color: Colors.outline },
    salaryValue: { ...Typography.headlineMedium, color: Colors.primary },
    sectionTitle: { ...Typography.titleMedium, color: Colors.onSurface, marginBottom: Spacing.sm },
    staffCard: { marginBottom: Spacing.sm },
    staffHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    staffName: { ...Typography.titleSmall, color: Colors.onSurface },
    staffRole: { ...Typography.bodySmall, color: Colors.outline },
    staffSalary: { ...Typography.titleMedium, color: Colors.primary },
    statsRow: { flexDirection: 'row', marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.sm },
    stat: { flex: 1, alignItems: 'center' },
    statVal: { ...Typography.titleSmall },
    statLbl: { ...Typography.labelSmall, color: Colors.outline },
    exportBtn: { marginTop: Spacing.lg, marginBottom: Spacing.xl },
});

export default ReportsScreen;
