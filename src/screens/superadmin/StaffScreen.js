import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../services/database';
import { Card, TopBar, Button, Input, Avatar, StatusBadge, EmptyState, Loading } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { generateId, validatePhone } from '../../utils/helpers';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/calculations';
import { STAFF_STATUS } from '../../constants';

const StaffScreen = () => {
    const [staff, setStaff] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editStaff, setEditStaff] = useState(null);
    const [selectedStoreFilter, setSelectedStoreFilter] = useState('all');
    const [newStaff, setNewStaff] = useState({
        name: '', phone: '', role: '', monthlySalary: '', storeId: '', photo: null,
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [staffList, storesList] = await Promise.all([
                db.staff.getAll(),
                db.stores.getAll(),
            ]);
            setStaff(staffList);
            setStores(storesList);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

    const getStoreName = (storeId) => {
        const store = stores.find(s => s.id === storeId);
        return store?.name || 'Unassigned';
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.5,
        });
        if (!result.canceled) setNewStaff({ ...newStaff, photo: result.assets[0].uri });
    };

    const handleAddStaff = async () => {
        if (!newStaff.name || !newStaff.phone || !newStaff.monthlySalary || !newStaff.storeId) {
            Alert.alert('Error', 'Please fill all required fields including store'); return;
        }
        if (!validatePhone(newStaff.phone)) {
            Alert.alert('Error', 'Enter valid 10-digit phone'); return;
        }

        try {
            const staffMember = {
                id: generateId(),
                storeId: newStaff.storeId,
                name: newStaff.name,
                phone: newStaff.phone,
                role: newStaff.role || 'Staff',
                monthlySalary: parseFloat(newStaff.monthlySalary),
                joiningDate: new Date().toISOString().split('T')[0],
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
            setNewStaff({ name: '', phone: '', role: '', monthlySalary: '', storeId: '', photo: null });
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

    const handleChangeStore = async (staffMember) => {
        Alert.alert('Change Store', 'Select new store:',
            stores.map(store => ({
                text: store.name,
                onPress: async () => {
                    await db.staff.update(staffMember.id, { storeId: store.id });
                    setStaff(staff.map(s => s.id === staffMember.id ? { ...s, storeId: store.id } : s));
                    Alert.alert('Success', `Moved to ${store.name}`);
                }
            })).concat({ text: 'Cancel', style: 'cancel' })
        );
    };

    const handleEditStaff = (staffMember) => {
        setEditStaff({
            ...staffMember,
            monthlySalary: String(staffMember.monthlySalary || ''),
            customStartTime: staffMember.customStartTime || '',
            customEndTime: staffMember.customEndTime || '',
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editStaff) return;
        try {
            const updates = {
                name: editStaff.name,
                role: editStaff.role,
                monthlySalary: parseFloat(editStaff.monthlySalary) || 0,
                customStartTime: editStaff.customStartTime || null,
                customEndTime: editStaff.customEndTime || null,
            };
            await db.staff.update(editStaff.id, updates);
            setStaff(staff.map(s => s.id === editStaff.id ? { ...s, ...updates } : s));
            setShowEditModal(false);
            setEditStaff(null);
            Alert.alert('Success', 'Staff updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update staff');
        }
    };

    if (loading) return <Loading fullScreen text="Loading staff..." />;

    const filteredStaff = selectedStoreFilter === 'all'
        ? staff
        : staff.filter(s => s.storeId === selectedStoreFilter);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="All Staff" subtitle={`${staff.length} total`} rightIcon="person-add-outline" onRightPress={() => setShowAddModal(true)} />

            {/* Store Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterChip, selectedStoreFilter === 'all' && styles.filterActive]}
                    onPress={() => setSelectedStoreFilter('all')}
                >
                    <Text style={[styles.filterText, selectedStoreFilter === 'all' && styles.filterTextActive]}>All</Text>
                </TouchableOpacity>
                {stores.map(store => (
                    <TouchableOpacity
                        key={store.id}
                        style={[styles.filterChip, selectedStoreFilter === store.id && styles.filterActive]}
                        onPress={() => setSelectedStoreFilter(store.id)}
                    >
                        <Text style={[styles.filterText, selectedStoreFilter === store.id && styles.filterTextActive]}>{store.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {filteredStaff.length === 0 ? (
                    <EmptyState icon="people-outline" title="No Staff" message="Add staff to get started" actionLabel="Add Staff" onAction={() => setShowAddModal(true)} />
                ) : (
                    filteredStaff.map((s) => (
                        <Card key={s.id} variant="outlined" style={styles.staffCard}>
                            <View style={styles.staffHeader}>
                                <Avatar source={s.photoUrl} name={s.name} size={56} />
                                <View style={styles.staffInfo}>
                                    <Text style={styles.staffName}>{s.name}</Text>
                                    <Text style={styles.staffRole}>{s.role}</Text>
                                    <Text style={styles.staffStore}>📍 {getStoreName(s.storeId)}</Text>
                                </View>
                                <StatusBadge status={s.status} size="small" />
                            </View>
                            <View style={styles.staffDetails}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Salary</Text>
                                    <Text style={styles.detailValue}>{formatCurrency(s.monthlySalary)}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Phone</Text>
                                    <Text style={styles.detailValue}>{s.phone}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Device</Text>
                                    <Text style={[styles.detailValue, { color: s.deviceId ? Colors.success : Colors.outline }]}>
                                        {s.deviceId ? 'Set' : 'Not set'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.staffActions}>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditStaff(s)}>
                                    <Ionicons name="create-outline" size={18} color={Colors.secondary} />
                                    <Text style={[styles.actionText, { color: Colors.secondary }]}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleChangeStore(s)}>
                                    <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
                                    <Text style={[styles.actionText, { color: Colors.primary }]}>Move</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleResetDevice(s)} disabled={!s.deviceId}>
                                    <Ionicons name="refresh" size={18} color={s.deviceId ? Colors.warning : Colors.outline} />
                                    <Text style={[styles.actionText, { color: s.deviceId ? Colors.warning : Colors.outline }]}>Reset</Text>
                                </TouchableOpacity>
                                {s.status === STAFF_STATUS.ACTIVE && (
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange(s, STAFF_STATUS.LEFT)}>
                                        <Ionicons name="exit-outline" size={18} color={Colors.error} />
                                        <Text style={[styles.actionText, { color: Colors.error }]}>Remove</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Inline Edit Form - appears below this card */}
                            {editStaff?.id === s.id && (
                                <View style={styles.inlineEditForm}>
                                    <View style={styles.inlineEditHeader}>
                                        <Text style={styles.inlineEditTitle}>Edit Staff</Text>
                                        <TouchableOpacity onPress={() => setEditStaff(null)}>
                                            <Ionicons name="close-circle" size={24} color={Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                    <Input
                                        label="Name"
                                        value={editStaff.name}
                                        onChangeText={(t) => setEditStaff({ ...editStaff, name: t })}
                                    />
                                    <Input
                                        label="Role"
                                        value={editStaff.role}
                                        onChangeText={(t) => setEditStaff({ ...editStaff, role: t })}
                                        placeholder="e.g., Sales, Manager"
                                    />
                                    <Input
                                        label="Monthly Salary (₹)"
                                        value={editStaff.monthlySalary}
                                        onChangeText={(t) => setEditStaff({ ...editStaff, monthlySalary: t })}
                                        keyboardType="number-pad"
                                    />
                                    <Text style={styles.inputLabel}>Custom Work Hours (Optional)</Text>
                                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                                        <View style={{ flex: 1 }}>
                                            <Input
                                                label="Start Time"
                                                value={editStaff.customStartTime}
                                                onChangeText={(t) => setEditStaff({ ...editStaff, customStartTime: t })}
                                                placeholder="e.g., 10:00"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Input
                                                label="End Time"
                                                value={editStaff.customEndTime}
                                                onChangeText={(t) => setEditStaff({ ...editStaff, customEndTime: t })}
                                                placeholder="e.g., 19:00"
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.modalActions}>
                                        <Button title="Cancel" variant="outlined" onPress={() => setEditStaff(null)} style={styles.modalBtn} />
                                        <Button title="Save" onPress={handleSaveEdit} style={styles.modalBtn} />
                                    </View>
                                </View>
                            )}
                        </Card>
                    ))
                )}

                {/* Add Staff Modal */}
                {showAddModal && (
                    <Card variant="elevated" style={styles.modal}>
                        <Text style={styles.modalTitle}>Add New Staff</Text>

                        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                            {newStaff.photo ? (
                                <Image source={{ uri: newStaff.photo }} style={styles.photoPreview} />
                            ) : (
                                <Ionicons name="camera" size={32} color={Colors.outline} />
                            )}
                        </TouchableOpacity>

                        <Text style={styles.inputLabel}>Assign to Store *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storeSelect}>
                            {stores.map(store => (
                                <TouchableOpacity
                                    key={store.id}
                                    style={[styles.storeChip, newStaff.storeId === store.id && styles.storeChipActive]}
                                    onPress={() => setNewStaff({ ...newStaff, storeId: store.id })}
                                >
                                    <Text style={[styles.storeChipText, newStaff.storeId === store.id && styles.storeChipTextActive]}>
                                        {store.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

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
    filterContainer: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, maxHeight: 50 },
    filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 16, backgroundColor: Colors.surfaceVariant, marginRight: Spacing.xs },
    filterActive: { backgroundColor: Colors.primary },
    filterText: { ...Typography.labelMedium, color: Colors.onSurfaceVariant },
    filterTextActive: { color: Colors.onPrimary },
    content: { flex: 1, padding: Spacing.md },
    staffCard: { marginBottom: Spacing.md },
    staffHeader: { flexDirection: 'row', alignItems: 'center' },
    staffInfo: { flex: 1, marginLeft: Spacing.md },
    staffName: { ...Typography.titleMedium, color: Colors.onSurface },
    staffRole: { ...Typography.bodySmall, color: Colors.primary },
    staffStore: { ...Typography.labelSmall, color: Colors.outline },
    staffDetails: { flexDirection: 'row', marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.md },
    detailItem: { flex: 1, alignItems: 'center' },
    detailLabel: { ...Typography.labelSmall, color: Colors.outline },
    detailValue: { ...Typography.bodyMedium, color: Colors.onSurface },
    staffActions: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.md, marginTop: Spacing.md },
    actionBtn: { alignItems: 'center', gap: 4 },
    actionText: { ...Typography.labelSmall },
    modal: { marginTop: Spacing.lg, padding: Spacing.lg },
    modalTitle: { ...Typography.titleLarge, color: Colors.onSurface, marginBottom: Spacing.md },
    photoBtn: { alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surfaceVariant, alignSelf: 'center', marginBottom: Spacing.md },
    photoPreview: { width: 80, height: 80, borderRadius: 40 },
    inputLabel: { ...Typography.labelMedium, color: Colors.onSurface, marginBottom: Spacing.xs },
    storeSelect: { marginBottom: Spacing.md, maxHeight: 40 },
    storeChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.outline, marginRight: Spacing.xs },
    storeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    storeChipText: { ...Typography.labelMedium, color: Colors.onSurface },
    storeChipTextActive: { color: Colors.onPrimary },
    modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    modalBtn: { flex: 1 },
    inlineEditForm: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.primary,
        backgroundColor: Colors.surfaceContainerLow,
        marginHorizontal: -Spacing.md,
        marginBottom: -Spacing.md,
        padding: Spacing.md,
        borderBottomLeftRadius: BorderRadius.lg,
        borderBottomRightRadius: BorderRadius.lg,
    },
    inlineEditHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    inlineEditTitle: {
        ...Typography.titleMedium,
        color: Colors.primary,
    },
});

export default StaffScreen;
