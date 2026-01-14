import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/database';
import { Card, TopBar, Button, Input, StatusBadge, EmptyState, Loading } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { generateId } from '../../utils/helpers';

const StoresScreen = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStore, setNewStore] = useState({
        name: '',
        address: '',
        lat: '',
        lng: '',
        radius: '100',
        startTime: '09:00',
        endTime: '18:00',
    });

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            const allStores = await db.stores.getAll();
            setStores(allStores);
        } catch (error) {
            console.error('Error loading stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStores();
        setRefreshing(false);
    };

    const handleAddStore = async () => {
        if (!newStore.name || !newStore.address) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            const store = {
                id: generateId(),
                name: newStore.name,
                address: newStore.address,
                lat: parseFloat(newStore.lat) || 0,
                lng: parseFloat(newStore.lng) || 0,
                radius: parseInt(newStore.radius) || 100,
                defaultStartTime: newStore.startTime,
                defaultEndTime: newStore.endTime,
                isActive: true,
                holidayDates: [],
                attendanceFrozen: false,
                createdAt: new Date().toISOString(),
            };

            await db.stores.add(store);
            setStores([...stores, store]);
            setShowAddModal(false);
            setNewStore({
                name: '',
                address: '',
                lat: '',
                lng: '',
                radius: '100',
                startTime: '09:00',
                endTime: '18:00',
            });
            Alert.alert('Success', 'Store added successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to add store');
        }
    };

    const handleToggleActive = async (store) => {
        try {
            await db.stores.update(store.id, { isActive: !store.isActive });
            setStores(stores.map(s =>
                s.id === store.id ? { ...s, isActive: !s.isActive } : s
            ));
        } catch (error) {
            Alert.alert('Error', 'Failed to update store');
        }
    };

    const handleToggleFreeze = async (store) => {
        try {
            await db.stores.update(store.id, { attendanceFrozen: !store.attendanceFrozen });
            setStores(stores.map(s =>
                s.id === store.id ? { ...s, attendanceFrozen: !s.attendanceFrozen } : s
            ));
        } catch (error) {
            Alert.alert('Error', 'Failed to update store');
        }
    };

    if (loading) {
        return <Loading fullScreen text="Loading stores..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar
                title="Stores"
                subtitle={`${stores.length} total`}
                rightIcon="add-circle-outline"
                onRightPress={() => setShowAddModal(true)}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {stores.length === 0 ? (
                    <EmptyState
                        icon="storefront-outline"
                        title="No Stores"
                        message="Add your first store to get started"
                        actionLabel="Add Store"
                        onAction={() => setShowAddModal(true)}
                    />
                ) : (
                    stores.map((store) => (
                        <Card key={store.id} variant="outlined" style={styles.storeCard}>
                            <View style={styles.storeHeader}>
                                <View style={styles.storeIcon}>
                                    <Ionicons name="storefront" size={24} color={Colors.primary} />
                                </View>
                                <View style={styles.storeInfo}>
                                    <Text style={styles.storeName}>{store.name}</Text>
                                    <Text style={styles.storeAddress} numberOfLines={1}>
                                        {store.address}
                                    </Text>
                                </View>
                                <StatusBadge
                                    status={store.isActive ? 'active' : 'left'}
                                    label={store.isActive ? 'Active' : 'Inactive'}
                                    size="small"
                                />
                            </View>

                            <View style={styles.storeDetails}>
                                <View style={styles.detailRow}>
                                    <Ionicons name="time-outline" size={16} color={Colors.outline} />
                                    <Text style={styles.detailText}>
                                        {store.defaultStartTime} - {store.defaultEndTime}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Ionicons name="location-outline" size={16} color={Colors.outline} />
                                    <Text style={styles.detailText}>
                                        Radius: {store.radius}m
                                    </Text>
                                </View>
                                {store.attendanceFrozen && (
                                    <View style={styles.frozenBadge}>
                                        <Ionicons name="snow" size={14} color={Colors.primary} />
                                        <Text style={styles.frozenText}>Attendance Frozen</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.storeActions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => handleToggleActive(store)}
                                >
                                    <Ionicons
                                        name={store.isActive ? 'close-circle-outline' : 'checkmark-circle-outline'}
                                        size={20}
                                        color={store.isActive ? Colors.error : Colors.success}
                                    />
                                    <Text style={[styles.actionText, { color: store.isActive ? Colors.error : Colors.success }]}>
                                        {store.isActive ? 'Deactivate' : 'Activate'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => handleToggleFreeze(store)}
                                >
                                    <Ionicons
                                        name={store.attendanceFrozen ? 'play-circle-outline' : 'pause-circle-outline'}
                                        size={20}
                                        color={Colors.primary}
                                    />
                                    <Text style={[styles.actionText, { color: Colors.primary }]}>
                                        {store.attendanceFrozen ? 'Unfreeze' : 'Freeze'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="calendar-outline" size={20} color={Colors.secondary} />
                                    <Text style={[styles.actionText, { color: Colors.secondary }]}>
                                        Holidays
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))
                )}

                {/* Add Store Modal (Simple implementation) */}
                {showAddModal && (
                    <Card variant="elevated" style={styles.modal}>
                        <Text style={styles.modalTitle}>Add New Store</Text>

                        <Input
                            label="Store Name *"
                            value={newStore.name}
                            onChangeText={(text) => setNewStore({ ...newStore, name: text })}
                            placeholder="Enter store name"
                        />

                        <Input
                            label="Address *"
                            value={newStore.address}
                            onChangeText={(text) => setNewStore({ ...newStore, address: text })}
                            placeholder="Enter store address"
                            multiline
                            numberOfLines={2}
                        />

                        <View style={styles.rowInputs}>
                            <View style={styles.halfInput}>
                                <Input
                                    label="Latitude"
                                    value={newStore.lat}
                                    onChangeText={(text) => setNewStore({ ...newStore, lat: text })}
                                    placeholder="0.0"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Input
                                    label="Longitude"
                                    value={newStore.lng}
                                    onChangeText={(text) => setNewStore({ ...newStore, lng: text })}
                                    placeholder="0.0"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <Input
                            label="Location Radius (meters)"
                            value={newStore.radius}
                            onChangeText={(text) => setNewStore({ ...newStore, radius: text })}
                            placeholder="100"
                            keyboardType="number-pad"
                        />

                        <View style={styles.rowInputs}>
                            <View style={styles.halfInput}>
                                <Input
                                    label="Start Time"
                                    value={newStore.startTime}
                                    onChangeText={(text) => setNewStore({ ...newStore, startTime: text })}
                                    placeholder="09:00"
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Input
                                    label="End Time"
                                    value={newStore.endTime}
                                    onChangeText={(text) => setNewStore({ ...newStore, endTime: text })}
                                    placeholder="18:00"
                                />
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <Button
                                title="Cancel"
                                variant="outlined"
                                onPress={() => setShowAddModal(false)}
                                style={styles.modalBtn}
                            />
                            <Button
                                title="Add Store"
                                onPress={handleAddStore}
                                style={styles.modalBtn}
                            />
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
    storeCard: {
        marginBottom: Spacing.md,
    },
    storeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    storeIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primaryContainer,
        alignItems: 'center',
        justifyContent: 'center',
    },
    storeInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    storeName: {
        ...Typography.titleMedium,
        color: Colors.onSurface,
    },
    storeAddress: {
        ...Typography.bodySmall,
        color: Colors.onSurfaceVariant,
    },
    storeDetails: {
        borderTopWidth: 1,
        borderTopColor: Colors.outlineVariant,
        paddingTop: Spacing.sm,
        marginTop: Spacing.sm,
        gap: Spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    detailText: {
        ...Typography.bodySmall,
        color: Colors.onSurfaceVariant,
    },
    frozenBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.primaryContainer,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
        marginTop: Spacing.xs,
    },
    frozenText: {
        ...Typography.labelSmall,
        color: Colors.primary,
    },
    storeActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: Colors.outlineVariant,
        paddingTop: Spacing.md,
        marginTop: Spacing.sm,
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
    rowInputs: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    halfInput: {
        flex: 1,
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

export default StoresScreen;
