import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/database';
import { Card, TopBar, Avatar, StatusBadge, EmptyState, Loading } from '../../components/common';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { formatDate } from '../../utils/dateUtils';

const GlobalLeavesScreen = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadLeaves();
    }, []);

    const loadLeaves = async () => {
        try {
            const allLeaves = await db.leaveRequests.getAll();
            const enrichedLeaves = await Promise.all(
                allLeaves.map(async (leave) => {
                    const staff = await db.staff.getById(leave.staffId);
                    const store = await db.stores.getById(leave.storeId);
                    return { ...leave, staffName: staff?.name || 'Unknown', storeName: store?.name || 'Unknown' };
                })
            );
            enrichedLeaves.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setLeaves(enrichedLeaves);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (leave) => {
        await db.leaveRequests.update(leave.id, { status: 'approved', approvedBy: 'Super Admin', updatedAt: new Date().toISOString() });
        setLeaves(leaves.map(l => l.id === leave.id ? { ...l, status: 'approved', approvedBy: 'Super Admin' } : l));
    };

    const handleReject = async (leave) => {
        await db.leaveRequests.update(leave.id, { status: 'rejected', approvedBy: 'Super Admin', updatedAt: new Date().toISOString() });
        setLeaves(leaves.map(l => l.id === leave.id ? { ...l, status: 'rejected', approvedBy: 'Super Admin' } : l));
    };

    const filteredLeaves = leaves.filter(l => filter === 'all' || l.status === filter);

    if (loading) return <Loading fullScreen text="Loading..." />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="Leave Requests" subtitle="All stores" />
            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadLeaves} />}>
                {filteredLeaves.length === 0 ? (
                    <EmptyState icon="calendar-outline" title="No Leave Requests" message="No requests yet" />
                ) : (
                    filteredLeaves.map((leave) => (
                        <Card key={leave.id} variant="outlined" style={styles.card}>
                            <View style={styles.header}>
                                <Avatar name={leave.staffName} size={40} />
                                <View style={styles.info}>
                                    <Text style={styles.name}>{leave.staffName}</Text>
                                    <Text style={styles.store}>{leave.storeName}</Text>
                                </View>
                                <StatusBadge status={leave.status} size="small" />
                            </View>
                            <Text style={styles.date}>{formatDate(leave.leaveDate)}</Text>
                            {leave.status === 'pending' && (
                                <View style={styles.actions}>
                                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(leave)}>
                                        <Text style={{ color: Colors.error }}>Reject</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(leave)}>
                                        <Text style={{ color: Colors.success }}>Approve</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
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
    card: { marginBottom: Spacing.md },
    header: { flexDirection: 'row', alignItems: 'center' },
    info: { flex: 1, marginLeft: Spacing.md },
    name: { ...Typography.titleMedium, color: Colors.onSurface },
    store: { ...Typography.bodySmall, color: Colors.outline },
    date: { ...Typography.bodyMedium, color: Colors.onSurface, marginTop: Spacing.sm },
    actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    rejectBtn: { flex: 1, padding: Spacing.sm, backgroundColor: Colors.errorContainer, borderRadius: 8, alignItems: 'center' },
    approveBtn: { flex: 1, padding: Spacing.sm, backgroundColor: Colors.successContainer, borderRadius: 8, alignItems: 'center' },
});

export default GlobalLeavesScreen;
