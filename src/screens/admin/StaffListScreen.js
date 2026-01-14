import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../contexts/StoreContext';
import { db } from '../../services/database';
import { Card, TopBar, Button, Input, Avatar, StatusBadge, EmptyState, Loading } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { generateId, validatePhone } from '../../utils/helpers';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/calculations';
import { STAFF_STATUS } from '../../constants';

const StaffListScreen = () => {
    const { currentStore } = useStore();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [newStaff, setNewStaff] = useState({
        name: '', phone: '', role: '', monthlySalary: '', joiningDate: '', photo: null,
    });

    useEffect(() => { if (currentStore) loadStaff(); }, [currentStore]);

    const loadStaff = async () => {
        if (!currentStore) return;
        try {
            const staffList = await db.staff.getByStoreId(currentStore.id);
            setStaff(staffList);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const onRefresh = async () => { setRefreshing(true); await loadStaff(); setRefreshing(false); };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.5,
        });
        if (!result.canceled) setNewStaff({ ...newStaff, photo: result.assets[0].uri });
    };

    const handleAddStaff = async () => {
        if (!newStaff.name || !newStaff.phone || !newStaff.monthlySalary) {
            Alert.alert('Error', 'Please fill all required fields'); return;
        }
        if (!validatePhone(newStaff.phone)) {
            Alert.alert('Error', 'Enter valid 10-digit phone'); return;
        }

        try {
            const staffMember = {
                id: generateId(),
                storeId: currentStore.id,
                name: newStaff.name,
                phone: newStaff.phone,
                role: newStaff.role || 'Staff',
                monthlySalary: parseFloat(newStaff.monthlySalary),
                joiningDate: newStaff.joiningDate || new Date().toISOString().split('T')[0],
                photoUrl: newStaff.photo,
                status: STAFF_STATUS.ACTIVE,
                deviceId: null,
                documents: [],
                customStartTime: null,
                customEndTime: null,
                createdAt: new Date().toISOString(),
            };

            await db.staff.add(staffMember);
            setStaff([...staff, staffMember]);
            setShowAddModal(false);
            setNewStaff({ name: '', phone: '', role: '', monthlySalary: '', joiningDate: '', photo: null });
            Alert.alert('Success', 'Staff added successfully');
        } catch (error) { Alert.alert('Error', 'Failed to add staff'); }
    };

    const handleStatusChange = async (staffMember, newStatus) => {
        try {
            await db.staff.update(staffMember.id, { status: newStatus });
            setStaff(staff.map(s => s.id === staffMember.id ? { ...s, status: newStatus } : s));
        } catch (error) { Alert.alert('Error', 'Failed to update status'); }
    };

    const handleResetDevice = async (staffMember) => {
        Alert.alert('Reset Device', `Reset device for ${staffMember.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset', style: 'destructive', onPress: async () => {
                    await db.staff.update(staffMember.id, { deviceId: null });
                    setStaff(staff.map(s => s.id === staffMember.id ? { ...s, deviceId: null } : s));
                    Alert.alert('Success', 'Device reset');
                }
            },
        ]);
    };

    if (loading) return <Loading fullScreen text="Loading staff..." />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="Staff" subtitle={`${staff.length} members`} rightIcon="person-add-outline" onRightPress={() => setShowAddModal(true)} />
            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {staff.length === 0 ? (
                    <EmptyState icon="people-outline" title="No Staff" message="Add staff to your store" actionLabel="Add Staff" onAction={() => setShowAddModal(true)} />
                ) : (
                    staff.map((s) => (
                        <Card key={s.id} variant="outlined" style={styles.staffCard}>
                            <View style={styles.staffHeader}>
                                <Avatar source={s.photoUrl} name={s.name} size={56} />
                                <View style={styles.staffInfo}>
                                    <Text style={styles.staffName}>{s.name}</Text>
                                    <Text style={styles.staffRole}>{s.role}</Text>
                                    <Text style={styles.staffPhone}>{s.phone}</Text>
                                </View>
                                <StatusBadge status={s.status} size="small" />
                            </View>
                            <View style={styles.staffDetails}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Salary</Text>
                                    <Text style={styles.detailValue}>{formatCurrency(s.monthlySalary)}/mo</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Joined</Text>
                                    <Text style={styles.detailValue}>{formatDate(s.joiningDate)}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Device</Text>
                                    <Text style={[styles.detailValue, { color: s.deviceId ? Colors.success : Colors.outline }]}>
                                        {s.deviceId ? 'Registered' : 'Not set'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.staffActions}>
                                {s.status === STAFF_STATUS.ACTIVE && (
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange(s, STAFF_STATUS.ON_NOTICE)}>
                                        <Ionicons name="alert-circle-outline" size={18} color={Colors.warning} />
                                        <Text style={[styles.actionText, { color: Colors.warning }]}>Notice</Text>
                                    </TouchableOpacity>
                                )}
                                {s.status === STAFF_STATUS.ON_NOTICE && (
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange(s, STAFF_STATUS.LEFT)}>
                                        <Ionicons name="exit-outline" size={18} color={Colors.error} />
                                        <Text style={[styles.actionText, { color: Colors.error }]}>Mark Left</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleResetDevice(s)} disabled={!s.deviceId}>
                                    <Ionicons name="refresh-outline" size={18} color={s.deviceId ? Colors.primary : Colors.outline} />
                                    <Text style={[styles.actionText, { color: s.deviceId ? Colors.primary : Colors.outline }]}>Reset Device</Text>
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))
                )}

                {showAddModal && (
                    <Card variant="elevated" style={styles.modal}>
                        <Text style={styles.modalTitle}>Add New Staff</Text>
                        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                            {newStaff.photo ? (
                                <Image source={{ uri: newStaff.photo }} style={styles.photoPreview} />
                            ) : (
                                <Ionicons name="camera" size={32} color={Colors.outline} />
                            )}
                            <Text style={styles.photoText}>Add Photo</Text>
                        </TouchableOpacity>
                        <Input label="Full Name *" value={newStaff.name} onChangeText={(t) => setNewStaff({ ...newStaff, name: t })} placeholder="Staff name" />
                        <Input label="Phone *" value={newStaff.phone} onChangeText={(t) => setNewStaff({ ...newStaff, phone: t })} placeholder="10-digit phone" keyboardType="phone-pad" maxLength={10} />
                        <Input label="Role" value={newStaff.role} onChangeText={(t) => setNewStaff({ ...newStaff, role: t })} placeholder="e.g., Sales, Manager" />
                        <Input label="Monthly Salary (₹) *" value={newStaff.monthlySalary} onChangeText={(t) => setNewStaff({ ...newStaff, monthlySalary: t })} placeholder="15000" keyboardType="number-pad" />
                        <View style={styles.modalActions}>
                            <Button title="Cancel" variant="outlined" onPress={() => setShowAddModal(false)} style={styles.modalBtn} />
                            <Button title="Add Staff" onPress={handleAddStaff} style={styles.modalBtn} />
                        </View>
                    </Card>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1, padding: Spacing.md },
    staffCard: { marginBottom: Spacing.md },
    staffHeader: { flexDirection: 'row', alignItems: 'center' },
    staffInfo: { flex: 1, marginLeft: Spacing.md },
    staffName: { ...Typography.titleMedium, color: Colors.onSurface },
    staffRole: { ...Typography.bodySmall, color: Colors.primary },
    staffPhone: { ...Typography.bodySmall, color: Colors.outline },
    staffDetails: { flexDirection: 'row', marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.md },
    detailItem: { flex: 1, alignItems: 'center' },
    detailLabel: { ...Typography.labelSmall, color: Colors.outline },
    detailValue: { ...Typography.bodyMedium, color: Colors.onSurface },
    staffActions: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.md, marginTop: Spacing.md },
    actionBtn: { alignItems: 'center', gap: 4 },
    actionText: { ...Typography.labelSmall },
    modal: { marginTop: Spacing.lg, padding: Spacing.lg },
    modalTitle: { ...Typography.titleLarge, color: Colors.onSurface, marginBottom: Spacing.lg },
    photoBtn: { alignItems: 'center', justifyContent: 'center', width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.surfaceVariant, alignSelf: 'center', marginBottom: Spacing.lg },
    photoPreview: { width: 100, height: 100, borderRadius: 50 },
    photoText: { ...Typography.labelSmall, color: Colors.outline, marginTop: 4 },
    modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    modalBtn: { flex: 1 },
});

export default StaffListScreen;
