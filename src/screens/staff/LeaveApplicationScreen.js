import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { db } from '../../services/database';
import { Card, TopBar, Button, Input, StatusBadge, EmptyState, Loading } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { generateId } from '../../utils/helpers';
import { formatDate, getCurrentDateString, isFutureDate, getCurrentMonthYear } from '../../utils/dateUtils';
import { BUSINESS_RULES, LEAVE_STATUS, LEAVE_TYPE } from '../../constants';

const LeaveApplicationScreen = () => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [newLeave, setNewLeave] = useState({ date: '', reason: '', type: LEAVE_TYPE.PAID });
    const [leavesThisMonth, setLeavesThisMonth] = useState(0);

    useEffect(() => { loadLeaves(); }, []);

    const loadLeaves = async () => {
        if (!user) return;
        try {
            const myLeaves = await db.leaveRequests.getByStaffId(user.id);
            myLeaves.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setLeaves(myLeaves);

            // Count leaves this month
            const { month, year } = getCurrentMonthYear();
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
            const approvedThisMonth = myLeaves.filter(l =>
                l.status === LEAVE_STATUS.APPROVED && l.leaveDate.startsWith(monthStr)
            ).length;
            setLeavesThisMonth(approvedThisMonth);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const onRefresh = async () => { setRefreshing(true); await loadLeaves(); setRefreshing(false); };

    const handleApplyLeave = async () => {
        if (!newLeave.date) { Alert.alert('Error', 'Please select a date'); return; }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newLeave.date)) {
            Alert.alert('Error', 'Enter date in format YYYY-MM-DD (e.g., 2026-01-20)'); return;
        }

        // Check if future date
        if (!isFutureDate(newLeave.date)) {
            Alert.alert('Error', 'Cannot apply leave for past or current date'); return;
        }

        // Check monthly limit
        if (leavesThisMonth >= BUSINESS_RULES.MAX_LEAVES_PER_MONTH) {
            Alert.alert('Limit Reached', `You have already used ${BUSINESS_RULES.MAX_LEAVES_PER_MONTH} leaves this month`); return;
        }

        // Check if already applied for this date
        const existing = leaves.find(l => l.leaveDate === newLeave.date && l.status !== LEAVE_STATUS.REJECTED);
        if (existing) {
            Alert.alert('Error', 'You already have a leave request for this date'); return;
        }

        try {
            const leaveRequest = {
                id: generateId(),
                staffId: user.id,
                storeId: currentStore?.id || user.storeId,
                leaveDate: newLeave.date,
                type: newLeave.type,
                reason: newLeave.reason,
                status: LEAVE_STATUS.PENDING,
                approvedBy: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await db.leaveRequests.add(leaveRequest);
            setLeaves([leaveRequest, ...leaves]);
            setShowApplyModal(false);
            setNewLeave({ date: '', reason: '', type: LEAVE_TYPE.PAID });
            Alert.alert('Success', 'Leave application submitted');
        } catch (error) { Alert.alert('Error', 'Failed to apply leave'); }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case LEAVE_STATUS.APPROVED: return { icon: 'checkmark-circle', color: Colors.success };
            case LEAVE_STATUS.REJECTED: return { icon: 'close-circle', color: Colors.error };
            default: return { icon: 'time', color: Colors.warning };
        }
    };

    if (loading) return <Loading fullScreen text="Loading..." />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="Leave" subtitle={`${BUSINESS_RULES.MAX_LEAVES_PER_MONTH - leavesThisMonth} remaining this month`} rightIcon="add-circle-outline" onRightPress={() => setShowApplyModal(true)} />

            {/* Leave Balance Card */}
            <View style={styles.balanceCard}>
                <View style={styles.balanceItem}>
                    <Text style={styles.balanceValue}>{BUSINESS_RULES.MAX_LEAVES_PER_MONTH}</Text>
                    <Text style={styles.balanceLabel}>Per Month</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                    <Text style={styles.balanceValue}>{leavesThisMonth}</Text>
                    <Text style={styles.balanceLabel}>Used</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                    <Text style={[styles.balanceValue, { color: Colors.success }]}>{BUSINESS_RULES.MAX_LEAVES_PER_MONTH - leavesThisMonth}</Text>
                    <Text style={styles.balanceLabel}>Available</Text>
                </View>
            </View>

            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {leaves.length === 0 ? (
                    <EmptyState icon="airplane-outline" title="No Leave Requests" message="Apply for leave when needed" actionLabel="Apply Leave" onAction={() => setShowApplyModal(true)} />
                ) : (
                    leaves.map((leave) => {
                        const statusInfo = getStatusIcon(leave.status);
                        return (
                            <Card key={leave.id} variant="outlined" style={styles.leaveCard}>
                                <View style={styles.leaveHeader}>
                                    <View style={[styles.statusIcon, { backgroundColor: `${statusInfo.color}20` }]}>
                                        <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
                                    </View>
                                    <View style={styles.leaveInfo}>
                                        <Text style={styles.leaveDate}>{formatDate(leave.leaveDate, 'EEEE, dd MMM yyyy')}</Text>
                                        <Text style={styles.leaveType}>{leave.type?.toUpperCase()} LEAVE</Text>
                                    </View>
                                    <StatusBadge status={leave.status} size="small" />
                                </View>
                                {leave.reason && <Text style={styles.leaveReason}>Reason: {leave.reason}</Text>}
                                {leave.approvedBy && (
                                    <Text style={styles.approvedBy}>
                                        {leave.status === LEAVE_STATUS.APPROVED ? 'Approved' : 'Rejected'} by {leave.approvedBy}
                                    </Text>
                                )}
                            </Card>
                        );
                    })
                )}

                {/* Apply Leave Modal */}
                {showApplyModal && (
                    <Card variant="elevated" style={styles.modal}>
                        <Text style={styles.modalTitle}>Apply for Leave</Text>

                        <Text style={styles.infoText}>
                            ℹ️ You can take max {BUSINESS_RULES.MAX_LEAVES_PER_MONTH} leaves per month. Perfect attendance earns ₹{BUSINESS_RULES.PERFECT_ATTENDANCE_BONUS} bonus!
                        </Text>

                        <Input label="Leave Date *" value={newLeave.date} onChangeText={(t) => setNewLeave({ ...newLeave, date: t })} placeholder="YYYY-MM-DD (e.g., 2026-01-20)" />

                        <Text style={styles.typeLabel}>Leave Type</Text>
                        <View style={styles.typeRow}>
                            {[LEAVE_TYPE.PAID, LEAVE_TYPE.UNPAID].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeBtn, newLeave.type === type && styles.typeBtnActive]}
                                    onPress={() => setNewLeave({ ...newLeave, type })}
                                >
                                    <Text style={[styles.typeText, newLeave.type === type && styles.typeTextActive]}>
                                        {type.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Input label="Reason (optional)" value={newLeave.reason} onChangeText={(t) => setNewLeave({ ...newLeave, reason: t })} placeholder="Why do you need leave?" multiline numberOfLines={2} />

                        <View style={styles.modalActions}>
                            <Button title="Cancel" variant="outlined" onPress={() => setShowApplyModal(false)} style={styles.modalBtn} />
                            <Button title="Apply" onPress={handleApplyLeave} style={styles.modalBtn} />
                        </View>
                    </Card>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    balanceCard: { flexDirection: 'row', backgroundColor: Colors.primaryContainer, margin: Spacing.md, borderRadius: BorderRadius.lg, padding: Spacing.md },
    balanceItem: { flex: 1, alignItems: 'center' },
    balanceValue: { ...Typography.headlineSmall, color: Colors.onPrimaryContainer },
    balanceLabel: { ...Typography.labelSmall, color: Colors.onPrimaryContainer },
    balanceDivider: { width: 1, backgroundColor: Colors.primary, opacity: 0.3 },
    content: { flex: 1, padding: Spacing.md },
    leaveCard: { marginBottom: Spacing.md },
    leaveHeader: { flexDirection: 'row', alignItems: 'center' },
    statusIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    leaveInfo: { flex: 1, marginLeft: Spacing.md },
    leaveDate: { ...Typography.titleMedium, color: Colors.onSurface },
    leaveType: { ...Typography.labelSmall, color: Colors.outline },
    leaveReason: { ...Typography.bodySmall, color: Colors.onSurfaceVariant, marginTop: Spacing.sm },
    approvedBy: { ...Typography.bodySmall, color: Colors.outline, marginTop: Spacing.xs, fontStyle: 'italic' },
    modal: { marginTop: Spacing.lg, padding: Spacing.lg },
    modalTitle: { ...Typography.titleLarge, color: Colors.onSurface, marginBottom: Spacing.md },
    infoText: { ...Typography.bodySmall, color: Colors.primary, backgroundColor: Colors.primaryContainer, padding: Spacing.sm, borderRadius: BorderRadius.sm, marginBottom: Spacing.md },
    typeLabel: { ...Typography.labelMedium, color: Colors.onSurface, marginBottom: Spacing.sm },
    typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    typeBtn: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.outline, alignItems: 'center' },
    typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    typeText: { ...Typography.labelMedium, color: Colors.onSurface },
    typeTextActive: { color: Colors.onPrimary },
    modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    modalBtn: { flex: 1 },
});

export default LeaveApplicationScreen;
