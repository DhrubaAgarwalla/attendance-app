import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { db } from '../../services/database';
import { Card, TopBar, Avatar, StatusBadge, EmptyState, Loading } from '../../components/common';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { formatDate } from '../../utils/dateUtils';

const LeaveApprovalsScreen = () => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('pending');

    useEffect(() => { if (currentStore) loadLeaves(); }, [currentStore]);

    const loadLeaves = async () => {
        if (!currentStore) return;
        try {
            const storeLeaves = await db.leaveRequests.getByStoreId(currentStore.id);
            const enriched = await Promise.all(storeLeaves.map(async (l) => {
                const staff = await db.staff.getById(l.staffId);
                return { ...l, staffName: staff?.name || 'Unknown', staffPhone: staff?.phone || '' };
            }));
            enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setLeaves(enriched);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const onRefresh = async () => { setRefreshing(true); await loadLeaves(); setRefreshing(false); };

    const handleAction = async (leave, status) => {
        try {
            await db.leaveRequests.update(leave.id, {
                status,
                approvedBy: user?.name || 'Admin',
                updatedAt: new Date().toISOString()
            });
            setLeaves(leaves.map(l => l.id === leave.id ? { ...l, status, approvedBy: user?.name } : l));
            Alert.alert('Success', `Leave ${status}`);
        } catch (error) { Alert.alert('Error', 'Action failed'); }
    };

    const filteredLeaves = leaves.filter(l => filter === 'all' || l.status === filter);
    const pendingCount = leaves.filter(l => l.status === 'pending').length;

    if (loading) return <Loading fullScreen text="Loading..." />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="Leave Approvals" subtitle={`${pendingCount} pending`} />

            <View style={styles.filterRow}>
                {['pending', 'approved', 'rejected', 'all'].map((f) => (
                    <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {filteredLeaves.length === 0 ? (
                    <EmptyState icon="calendar-outline" title="No Requests" message={`No ${filter} leave requests`} />
                ) : (
                    filteredLeaves.map((leave) => (
                        <Card key={leave.id} variant="outlined" style={styles.card}>
                            <View style={styles.header}>
                                <Avatar name={leave.staffName} size={44} />
                                <View style={styles.info}>
                                    <Text style={styles.name}>{leave.staffName}</Text>
                                    <Text style={styles.phone}>{leave.staffPhone}</Text>
                                </View>
                                <StatusBadge status={leave.status} size="small" />
                            </View>
                            <View style={styles.details}>
                                <View style={styles.detailRow}>
                                    <Ionicons name="calendar" size={16} color={Colors.primary} />
                                    <Text style={styles.date}>{formatDate(leave.leaveDate, 'EEEE, dd MMM yyyy')}</Text>
                                </View>
                                <Text style={styles.type}>{leave.type?.toUpperCase()} • Applied {formatDate(leave.createdAt, 'dd MMM')}</Text>
                                {leave.reason && <Text style={styles.reason}>"{leave.reason}"</Text>}
                            </View>
                            {leave.status === 'pending' && (
                                <View style={styles.actions}>
                                    <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleAction(leave, 'rejected')}>
                                        <Ionicons name="close" size={20} color={Colors.error} />
                                        <Text style={[styles.actionText, { color: Colors.error }]}>Reject</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleAction(leave, 'approved')}>
                                        <Ionicons name="checkmark" size={20} color={Colors.success} />
                                        <Text style={[styles.actionText, { color: Colors.success }]}>Approve</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {leave.approvedBy && <Text style={styles.approvedBy}>{leave.status === 'approved' ? 'Approved' : 'Rejected'} by {leave.approvedBy}</Text>}
                        </Card>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    filterRow: { flexDirection: 'row', padding: Spacing.sm, gap: Spacing.xs, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
    filterBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 16, backgroundColor: Colors.surfaceVariant },
    filterActive: { backgroundColor: Colors.primary },
    filterText: { ...Typography.labelSmall, color: Colors.onSurfaceVariant },
    filterTextActive: { color: Colors.onPrimary },
    content: { flex: 1, padding: Spacing.md },
    card: { marginBottom: Spacing.md },
    header: { flexDirection: 'row', alignItems: 'center' },
    info: { flex: 1, marginLeft: Spacing.md },
    name: { ...Typography.titleMedium, color: Colors.onSurface },
    phone: { ...Typography.bodySmall, color: Colors.outline },
    details: { marginTop: Spacing.md, gap: Spacing.xs },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    date: { ...Typography.bodyMedium, color: Colors.onSurface },
    type: { ...Typography.labelSmall, color: Colors.outline },
    reason: { ...Typography.bodySmall, color: Colors.onSurfaceVariant, fontStyle: 'italic' },
    actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.md },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.sm, borderRadius: 8, gap: Spacing.xs },
    rejectBtn: { backgroundColor: Colors.errorContainer },
    approveBtn: { backgroundColor: Colors.successContainer },
    actionText: { ...Typography.labelLarge },
    approvedBy: { ...Typography.bodySmall, color: Colors.outline, marginTop: Spacing.sm, fontStyle: 'italic' },
});

export default LeaveApprovalsScreen;
