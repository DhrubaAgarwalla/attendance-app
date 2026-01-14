import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Card, TopBar, Loading, EmptyState } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/calculations';
import { getMonthName, getCurrentMonthYear } from '../../utils/dateUtils';
import { calculateStaffSalary, getSalaryHistory } from '../../services/salary';

const SalaryScreen = () => {
    const { user } = useAuth();
    const [currentSalary, setCurrentSalary] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { loadSalaryData(); }, []);

    const loadSalaryData = async () => {
        if (!user) return;
        try {
            const { month, year } = getCurrentMonthYear();

            // Calculate current month (preview)
            const current = await calculateStaffSalary(user.id, year, month);
            setCurrentSalary(current);

            // Get history
            const hist = await getSalaryHistory(user.id);
            setHistory(hist);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const onRefresh = async () => { setRefreshing(true); await loadSalaryData(); setRefreshing(false); };

    if (loading) return <Loading fullScreen text="Loading salary..." />;

    const SalaryRow = ({ label, value, isDeduction, isBonus, isFinal }) => (
        <View style={[styles.salaryRow, isFinal && styles.finalRow]}>
            <Text style={[styles.rowLabel, isFinal && styles.finalLabel]}>{label}</Text>
            <Text style={[
                styles.rowValue,
                isDeduction && styles.deduction,
                isBonus && styles.bonus,
                isFinal && styles.finalValue,
            ]}>
                {isDeduction ? '-' : ''}{formatCurrency(value)}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="My Salary" subtitle="Earnings & deductions" />
            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

                {/* Current Month Preview */}
                {currentSalary && (
                    <>
                        <Text style={styles.sectionTitle}>This Month (Preview)</Text>
                        <Card variant="elevated" style={styles.currentCard}>
                            <View style={styles.monthHeader}>
                                <View style={styles.monthInfo}>
                                    <Text style={styles.monthName}>{getMonthName(currentSalary.month)} {currentSalary.year}</Text>
                                    <Text style={styles.previewNote}>*Final calculation at month end</Text>
                                </View>
                                <View style={styles.finalBox}>
                                    <Text style={styles.finalLabel2}>Estimated</Text>
                                    <Text style={styles.finalAmount}>{formatCurrency(currentSalary.finalAmount)}</Text>
                                </View>
                            </View>

                            <View style={styles.breakdown}>
                                <SalaryRow label="Base Salary" value={currentSalary.baseSalary} />
                                <SalaryRow label={`Working Days (${currentSalary.presentDays}/${currentSalary.workingDays})`} value={currentSalary.dailySalary * currentSalary.presentDays} />
                                <SalaryRow label={`Absent (${currentSalary.absentDays} days)`} value={currentSalary.absentDeduction} isDeduction />
                                <SalaryRow label={`Late Penalty (${currentSalary.lateCount} lates)`} value={currentSalary.latePenalty} isDeduction />
                                <SalaryRow label="Advance Deduction" value={currentSalary.advanceDeduction} isDeduction />
                                {currentSalary.bonus > 0 && <SalaryRow label="Perfect Attendance Bonus" value={currentSalary.bonus} isBonus />}
                                <SalaryRow label="Net Payable" value={currentSalary.finalAmount} isFinal />
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                                    <Text style={styles.statValue}>{currentSalary.presentDays}</Text>
                                    <Text style={styles.statLabel}>Present</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
                                    <Text style={styles.statValue}>{currentSalary.absentDays}</Text>
                                    <Text style={styles.statLabel}>Absent</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="time-outline" size={20} color={Colors.warning} />
                                    <Text style={styles.statValue}>{currentSalary.lateCount}</Text>
                                    <Text style={styles.statLabel}>Late</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="airplane-outline" size={20} color={Colors.secondary} />
                                    <Text style={styles.statValue}>{currentSalary.leavesUsed}</Text>
                                    <Text style={styles.statLabel}>Leaves</Text>
                                </View>
                            </View>
                        </Card>
                    </>
                )}

                {/* Salary History */}
                <Text style={styles.sectionTitle}>Past Salaries</Text>
                {history.length === 0 ? (
                    <Card variant="outlined" style={styles.emptyCard}>
                        <EmptyState icon="wallet-outline" title="No History" message="Your salary history will appear here" />
                    </Card>
                ) : (
                    history.map((salary) => (
                        <Card key={salary.id} variant="outlined" style={styles.historyCard}>
                            <View style={styles.historyHeader}>
                                <View>
                                    <Text style={styles.historyMonth}>{getMonthName(salary.month)} {salary.year}</Text>
                                    <Text style={styles.historyDate}>Paid on {salary.calculatedAt?.split('T')[0]}</Text>
                                </View>
                                <View style={styles.historyAmount}>
                                    <Text style={styles.historyValue}>{formatCurrency(salary.finalAmount)}</Text>
                                    {salary.isLocked && <Ionicons name="lock-closed" size={14} color={Colors.success} />}
                                </View>
                            </View>
                            <View style={styles.historyStats}>
                                <Text style={styles.historyStat}>Present: {salary.presentDays}</Text>
                                <Text style={styles.historyStat}>Absent: {salary.absentDays}</Text>
                                <Text style={styles.historyStat}>Late: {salary.lateCount}</Text>
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
    content: { flex: 1, padding: Spacing.md },
    sectionTitle: { ...Typography.titleMedium, color: Colors.onSurface, marginBottom: Spacing.sm, marginTop: Spacing.md },
    currentCard: { marginBottom: Spacing.md },
    monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
    monthInfo: {},
    monthName: { ...Typography.titleLarge, color: Colors.onSurface },
    previewNote: { ...Typography.labelSmall, color: Colors.outline },
    finalBox: { alignItems: 'flex-end' },
    finalLabel2: { ...Typography.labelSmall, color: Colors.primary },
    finalAmount: { ...Typography.headlineMedium, color: Colors.primary },
    breakdown: { borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.md },
    salaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
    rowLabel: { ...Typography.bodyMedium, color: Colors.onSurfaceVariant },
    rowValue: { ...Typography.bodyMedium, color: Colors.onSurface },
    deduction: { color: Colors.error },
    bonus: { color: Colors.success },
    finalRow: { borderTopWidth: 1, borderTopColor: Colors.outline, marginTop: Spacing.sm, paddingTop: Spacing.sm },
    finalLabel: { ...Typography.titleMedium, color: Colors.onSurface },
    finalValue: { ...Typography.titleMedium, color: Colors.primary },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.outlineVariant },
    statItem: { alignItems: 'center' },
    statValue: { ...Typography.titleMedium, color: Colors.onSurface },
    statLabel: { ...Typography.labelSmall, color: Colors.outline },
    emptyCard: { padding: Spacing.xl },
    historyCard: { marginBottom: Spacing.sm },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyMonth: { ...Typography.titleMedium, color: Colors.onSurface },
    historyDate: { ...Typography.labelSmall, color: Colors.outline },
    historyAmount: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    historyValue: { ...Typography.titleMedium, color: Colors.success },
    historyStats: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
    historyStat: { ...Typography.bodySmall, color: Colors.outline },
});

export default SalaryScreen;
