import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/database';
import { Card, TopBar, Button, Input, Avatar, StatusBadge, EmptyState, Loading } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { generateId, validatePhone } from '../../utils/helpers';

const AdminsScreen = () => {
    const [admins, setAdmins] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editAdmin, setEditAdmin] = useState(null);
    const [editStores, setEditStores] = useState([]);
    const [newAdmin, setNewAdmin] = useState({
        name: '',
        phone: '',
        selectedStores: [],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allAdmins = await db.admins.getAll();
            const allStores = await db.stores.getAll();
            setAdmins(allAdmins);
            setStores(allStores);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleAddAdmin = async () => {
        if (!newAdmin.name || !newAdmin.phone) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!validatePhone(newAdmin.phone)) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return;
        }

        try {
            const admin = {
                id: generateId(),
                name: newAdmin.name,
                phone: newAdmin.phone,
                assignedStoreIds: newAdmin.selectedStores,
                isActive: true,
                deviceId: null,
                createdAt: new Date().toISOString(),
            };

            await db.admins.add(admin);
            setAdmins([...admins, admin]);
            setShowAddModal(false);
            setNewAdmin({ name: '', phone: '', selectedStores: [] });
            Alert.alert('Success', 'Admin added successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to add admin');
        }
    };

    const handleToggleActive = async (admin) => {
        try {
            await db.admins.update(admin.id, { isActive: !admin.isActive });
            setAdmins(admins.map(a =>
                a.id === admin.id ? { ...a, isActive: !a.isActive } : a
            ));
        } catch (error) {
            Alert.alert('Error', 'Failed to update admin');
        }
    };

    const handleResetDevice = async (admin) => {
        Alert.alert(
            'Reset Device',
            `Are you sure you want to reset the device ID for ${admin.name}? They will need to login again from their new device.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await db.admins.update(admin.id, { deviceId: null });
                            setAdmins(admins.map(a =>
                                a.id === admin.id ? { ...a, deviceId: null } : a
                            ));
                            Alert.alert('Success', 'Device ID has been reset');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reset device');
                        }
                    },
                },
            ]
        );
    };

    const toggleStoreSelection = (storeId) => {
        const selected = newAdmin.selectedStores.includes(storeId)
            ? newAdmin.selectedStores.filter(id => id !== storeId)
            : [...newAdmin.selectedStores, storeId];
        setNewAdmin({ ...newAdmin, selectedStores: selected });
    };

    const getStoreNames = (storeIds) => {
        return storeIds
            .map(id => stores.find(s => s.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    };

    const handleEditAdmin = (admin) => {
        setEditAdmin(admin);
        setEditStores(admin.assignedStoreIds || []);
        setShowEditModal(true);
    };

    const toggleEditStoreSelection = (storeId) => {
        const selected = editStores.includes(storeId)
            ? editStores.filter(id => id !== storeId)
            : [...editStores, storeId];
        setEditStores(selected);
    };

    const handleSaveEdit = async () => {
        if (!editAdmin) return;
        try {
            await db.admins.update(editAdmin.id, { assignedStoreIds: editStores });
            setAdmins(admins.map(a => a.id === editAdmin.id ? { ...a, assignedStoreIds: editStores } : a));
            setShowEditModal(false);
            setEditAdmin(null);
            Alert.alert('Success', 'Admin stores updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update admin');
        }
    };

    if (loading) {
        return <Loading fullScreen text="Loading admins..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar
                title="Admins"
                subtitle={`${admins.length} total`}
                rightIcon="person-add-outline"
                onRightPress={() => setShowAddModal(true)}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {admins.length === 0 ? (
                    <EmptyState
                        icon="people-outline"
                        title="No Admins"
                        message="Add your first admin to manage stores"
                        actionLabel="Add Admin"
                        onAction={() => setShowAddModal(true)}
                    />
                ) : (
                    admins.map((admin) => (
                        <Card key={admin.id} variant="outlined" style={styles.adminCard}>
                            <View style={styles.adminHeader}>
                                <Avatar name={admin.name} size={48} backgroundColor={Colors.adminAccent} />
                                <View style={styles.adminInfo}>
                                    <Text style={styles.adminName}>{admin.name}</Text>
                                    <Text style={styles.adminPhone}>{admin.phone}</Text>
                                </View>
                                <StatusBadge
                                    status={admin.isActive ? 'active' : 'left'}
                                    label={admin.isActive ? 'Active' : 'Inactive'}
                                    size="small"
                                />
                            </View>

                            {admin.assignedStoreIds?.length > 0 && (
                                <View style={styles.storesRow}>
                                    <Ionicons name="storefront-outline" size={16} color={Colors.outline} />
                                    <Text style={styles.storesText} numberOfLines={2}>
                                        {getStoreNames(admin.assignedStoreIds)}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.deviceRow}>
                                <Ionicons
                                    name={admin.deviceId ? 'phone-portrait' : 'phone-portrait-outline'}
                                    size={16}
                                    color={admin.deviceId ? Colors.success : Colors.outline}
                                />
                                <Text style={styles.deviceText}>
                                    {admin.deviceId ? 'Device registered' : 'No device registered'}
                                </Text>
                            </View>

                            <View style={styles.adminActions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => handleToggleActive(admin)}
                                >
                                    <Ionicons
                                        name={admin.isActive ? 'close-circle-outline' : 'checkmark-circle-outline'}
                                        size={20}
                                        color={admin.isActive ? Colors.error : Colors.success}
                                    />
                                    <Text style={[styles.actionText, { color: admin.isActive ? Colors.error : Colors.success }]}>
                                        {admin.isActive ? 'Deactivate' : 'Activate'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => handleResetDevice(admin)}
                                    disabled={!admin.deviceId}
                                >
                                    <Ionicons
                                        name="refresh-outline"
                                        size={20}
                                        color={admin.deviceId ? Colors.warning : Colors.outline}
                                    />
                                    <Text style={[styles.actionText, { color: admin.deviceId ? Colors.warning : Colors.outline }]}>
                                        Reset Device
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditAdmin(admin)}>
                                    <Ionicons name="create-outline" size={20} color={Colors.primary} />
                                    <Text style={[styles.actionText, { color: Colors.primary }]}>
                                        Edit Stores
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))
                )}

                {/* Add Admin Modal */}
                {showAddModal && (
                    <Card variant="elevated" style={styles.modal}>
                        <Text style={styles.modalTitle}>Add New Admin</Text>

                        <Input
                            label="Full Name *"
                            value={newAdmin.name}
                            onChangeText={(text) => setNewAdmin({ ...newAdmin, name: text })}
                            placeholder="Enter admin name"
                        />

                        <Input
                            label="Phone Number *"
                            value={newAdmin.phone}
                            onChangeText={(text) => setNewAdmin({ ...newAdmin, phone: text })}
                            placeholder="Enter 10-digit phone number"
                            keyboardType="phone-pad"
                            maxLength={10}
                        />

                        <Text style={styles.storeSelectLabel}>Assign Stores</Text>
                        <View style={styles.storesList}>
                            {stores.map((store) => (
                                <TouchableOpacity
                                    key={store.id}
                                    style={[
                                        styles.storeChip,
                                        newAdmin.selectedStores.includes(store.id) && styles.storeChipSelected,
                                    ]}
                                    onPress={() => toggleStoreSelection(store.id)}
                                >
                                    <Ionicons
                                        name={newAdmin.selectedStores.includes(store.id) ? 'checkmark-circle' : 'add-circle-outline'}
                                        size={18}
                                        color={newAdmin.selectedStores.includes(store.id) ? Colors.onPrimary : Colors.outline}
                                    />
                                    <Text style={[
                                        styles.storeChipText,
                                        newAdmin.selectedStores.includes(store.id) && styles.storeChipTextSelected,
                                    ]}>
                                        {store.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <Button
                                title="Cancel"
                                variant="outlined"
                                onPress={() => setShowAddModal(false)}
                                style={styles.modalBtn}
                            />
                            <Button
                                title="Add Admin"
                                onPress={handleAddAdmin}
                                style={styles.modalBtn}
                            />
                        </View>
                    </Card>
                )}

                {/* Edit Admin Modal */}
                {showEditModal && editAdmin && (
                    <Card variant="elevated" style={styles.modal}>
                        <Text style={styles.modalTitle}>Edit Stores for {editAdmin.name}</Text>

                        <Text style={styles.storeSelectLabel}>Select Stores</Text>
                        <View style={styles.storesList}>
                            {stores.map((store) => (
                                <TouchableOpacity
                                    key={store.id}
                                    style={[
                                        styles.storeChip,
                                        editStores.includes(store.id) && styles.storeChipSelected,
                                    ]}
                                    onPress={() => toggleEditStoreSelection(store.id)}
                                >
                                    <Ionicons
                                        name={editStores.includes(store.id) ? 'checkmark-circle' : 'add-circle-outline'}
                                        size={18}
                                        color={editStores.includes(store.id) ? Colors.onPrimary : Colors.outline}
                                    />
                                    <Text style={[
                                        styles.storeChipText,
                                        editStores.includes(store.id) && styles.storeChipTextSelected,
                                    ]}>
                                        {store.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <Button title="Cancel" variant="outlined" onPress={() => setShowEditModal(false)} style={styles.modalBtn} />
                            <Button title="Save" onPress={handleSaveEdit} style={styles.modalBtn} />
                        </View>
                    </Card>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    adminCard: {
        marginBottom: Spacing.md,
    },
    adminHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    adminInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    adminName: {
        ...Typography.titleMedium,
        color: Colors.onSurface,
    },
    adminPhone: {
        ...Typography.bodySmall,
        color: Colors.onSurfaceVariant,
    },
    storesRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.xs,
        marginTop: Spacing.xs,
    },
    storesText: {
        ...Typography.bodySmall,
        color: Colors.onSurfaceVariant,
        flex: 1,
    },
    deviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.xs,
    },
    deviceText: {
        ...Typography.bodySmall,
        color: Colors.outline,
    },
    adminActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: Colors.outlineVariant,
        paddingTop: Spacing.md,
        marginTop: Spacing.md,
    },
    actionBtn: {
        alignItems: 'center',
        gap: Spacing.xs,
    },
    actionText: {
        ...Typography.labelSmall,
    },
    modal: {
        marginTop: Spacing.lg,
        padding: Spacing.lg,
    },
    modalTitle: {
        ...Typography.titleLarge,
        color: Colors.onSurface,
        marginBottom: Spacing.lg,
    },
    storeSelectLabel: {
        ...Typography.labelLarge,
        color: Colors.onSurface,
        marginBottom: Spacing.sm,
    },
    storesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    storeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.outline,
        gap: Spacing.xs,
    },
    storeChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    storeChipText: {
        ...Typography.labelMedium,
        color: Colors.onSurface,
    },
    storeChipTextSelected: {
        color: Colors.onPrimary,
    },
    modalActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    modalBtn: {
        flex: 1,
    },
});

export default AdminsScreen;
