import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { db } from '../../services/database';
import { Card, TopBar, Button, Input, StatusBadge, EmptyState, Loading } from '../../components/common';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { generateId } from '../../utils/helpers';

const StoresScreen = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStore, setSelectedStore] = useState(null);
    const [editStore, setEditStore] = useState(null);
    const [newHolidayDate, setNewHolidayDate] = useState('');
    const [fetchingLocation, setFetchingLocation] = useState(false);
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

    const fetchCurrentLocation = async () => {
        setFetchingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to fetch coordinates');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            setNewStore({
                ...newStore,
                lat: location.coords.latitude.toFixed(6),
                lng: location.coords.longitude.toFixed(6),
            });

            Alert.alert('Success', 'Location fetched successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to get location. Please try again.');
            console.error('Location error:', error);
        } finally {
            setFetchingLocation(false);
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

    const handleOpenHolidays = (store) => {
        setSelectedStore(store);
        setNewHolidayDate('');
        setShowHolidayModal(true);
    };

    const handleAddHoliday = async () => {
        if (!newHolidayDate || !selectedStore) return;

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newHolidayDate)) {
            Alert.alert('Invalid Date', 'Please use format YYYY-MM-DD (e.g., 2026-01-26)');
            return;
        }

        try {
            const currentHolidays = selectedStore.holidayDates || [];
            if (currentHolidays.includes(newHolidayDate)) {
                Alert.alert('Already Added', 'This date is already a holiday');
                return;
            }

            const updatedHolidays = [...currentHolidays, newHolidayDate].sort();
            await db.stores.update(selectedStore.id, { holidayDates: updatedHolidays });

            setStores(stores.map(s =>
                s.id === selectedStore.id ? { ...s, holidayDates: updatedHolidays } : s
            ));
            setSelectedStore({ ...selectedStore, holidayDates: updatedHolidays });
            setNewHolidayDate('');
            Alert.alert('Success', 'Holiday added');
        } catch (error) {
            Alert.alert('Error', 'Failed to add holiday');
        }
    };

    const handleRemoveHoliday = async (dateToRemove) => {
        if (!selectedStore) return;

        try {
            const updatedHolidays = (selectedStore.holidayDates || []).filter(d => d !== dateToRemove);
            await db.stores.update(selectedStore.id, { holidayDates: updatedHolidays });

            setStores(stores.map(s =>
                s.id === selectedStore.id ? { ...s, holidayDates: updatedHolidays } : s
            ));
            setSelectedStore({ ...selectedStore, holidayDates: updatedHolidays });
        } catch (error) {
            Alert.alert('Error', 'Failed to remove holiday');
        }
    };

    const handleEditStore = (store) => {
        setEditStore({
            ...store,
            lat: String(store.lat || ''),
            lng: String(store.lng || ''),
            radius: String(store.radius || '100'),
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editStore) return;
        try {
            const updates = {
                name: editStore.name,
                address: editStore.address,
                lat: parseFloat(editStore.lat) || 0,
                lng: parseFloat(editStore.lng) || 0,
                radius: parseInt(editStore.radius) || 100,
                defaultStartTime: editStore.defaultStartTime,
                defaultEndTime: editStore.defaultEndTime,
            };
            await db.stores.update(editStore.id, updates);
            setStores(stores.map(s => s.id === editStore.id ? { ...s, ...updates } : s));
            setShowEditModal(false);
            setEditStore(null);
            Alert.alert('Success', 'Store updated');
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

                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditStore(store)}>
                                    <Ionicons name="create-outline" size={20} color={Colors.warning} />
                                    <Text style={[styles.actionText, { color: Colors.warning }]}>Edit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenHolidays(store)}>
                                    <Ionicons name="calendar-outline" size={20} color={Colors.secondary} />
                                    <Text style={[styles.actionText, { color: Colors.secondary }]}>
                                        Holidays ({store.holidayDates?.length || 0})
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Inline Edit Form */}
                            {editStore?.id === store.id && (
                                <View style={styles.inlineEditForm}>
                                    <View style={styles.inlineEditHeader}>
                                        <Text style={styles.inlineEditTitle}>Edit Store</Text>
                                        <TouchableOpacity onPress={() => setEditStore(null)}>
                                            <Ionicons name="close-circle" size={24} color={Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                    <Input
                                        label="Store Name"
                                        value={editStore.name}
                                        onChangeText={(text) => setEditStore({ ...editStore, name: text })}
                                    />
                                    <Input
                                        label="Address"
                                        value={editStore.address}
                                        onChangeText={(text) => setEditStore({ ...editStore, address: text })}
                                        multiline
                                    />
                                    <View style={styles.rowInputs}>
                                        <View style={styles.halfInput}>
                                            <Input
                                                label="Latitude"
                                                value={editStore.lat}
                                                onChangeText={(text) => setEditStore({ ...editStore, lat: text })}
                                                keyboardType="decimal-pad"
                                            />
                                        </View>
                                        <View style={styles.halfInput}>
                                            <Input
                                                label="Longitude"
                                                value={editStore.lng}
                                                onChangeText={(text) => setEditStore({ ...editStore, lng: text })}
                                                keyboardType="decimal-pad"
                                            />
                                        </View>
                                    </View>
                                    <Input
                                        label="Radius (meters)"
                                        value={editStore.radius}
                                        onChangeText={(text) => setEditStore({ ...editStore, radius: text })}
                                        keyboardType="number-pad"
                                    />
                                    <View style={styles.rowInputs}>
                                        <View style={styles.halfInput}>
                                            <Input
                                                label="Start Time"
                                                value={editStore.defaultStartTime}
                                                onChangeText={(text) => setEditStore({ ...editStore, defaultStartTime: text })}
                                            />
                                        </View>
                                        <View style={styles.halfInput}>
                                            <Input
                                                label="End Time"
                                                value={editStore.defaultEndTime}
                                                onChangeText={(text) => setEditStore({ ...editStore, defaultEndTime: text })}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.modalActions}>
                                        <Button title="Cancel" variant="outlined" onPress={() => setEditStore(null)} style={styles.modalBtn} />
                                        <Button title="Save" onPress={handleSaveEdit} style={styles.modalBtn} />
                                    </View>
                                </View>
                            )}
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

                        <TouchableOpacity
                            style={styles.fetchLocationBtn}
                            onPress={fetchCurrentLocation}
                            disabled={fetchingLocation}
                        >
                            {fetchingLocation ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                                <Ionicons name="locate" size={20} color={Colors.primary} />
                            )}
                            <Text style={styles.fetchLocationText}>
                                {fetchingLocation ? 'Fetching...' : 'Use Current Location'}
                            </Text>
                        </TouchableOpacity>

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

                {/* Holiday Management Modal */}
                {showHolidayModal && selectedStore && (
                    <Card variant="elevated" style={styles.modal}>
                        <Text style={styles.modalTitle}>Holidays - {selectedStore.name}</Text>

                        <View style={styles.addHolidayRow}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Add Holiday (YYYY-MM-DD)"
                                    value={newHolidayDate}
                                    onChangeText={setNewHolidayDate}
                                    placeholder="2026-01-26"
                                />
                            </View>
                            <TouchableOpacity style={styles.addHolidayBtn} onPress={handleAddHoliday}>
                                <Ionicons name="add-circle" size={36} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.holidayListTitle}>
                            Current Holidays ({selectedStore.holidayDates?.length || 0})
                        </Text>

                        {selectedStore.holidayDates?.length > 0 ? (
                            <ScrollView style={styles.holidayList} nestedScrollEnabled>
                                {selectedStore.holidayDates.map((date) => (
                                    <View key={date} style={styles.holidayItem}>
                                        <Ionicons name="calendar" size={18} color={Colors.secondary} />
                                        <Text style={styles.holidayDate}>{date}</Text>
                                        <TouchableOpacity onPress={() => handleRemoveHoliday(date)}>
                                            <Ionicons name="close-circle" size={22} color={Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        ) : (
                            <Text style={styles.noHolidays}>No holidays set</Text>
                        )}

                        <Button
                            title="Close"
                            variant="outlined"
                            onPress={() => setShowHolidayModal(false)}
                            style={{ marginTop: Spacing.md }}
                        />
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
    fetchLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primaryContainer,
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
    },
    fetchLocationText: {
        ...Typography.labelMedium,
        color: Colors.primary,
    },
    addHolidayRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.sm,
    },
    addHolidayBtn: {
        padding: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    holidayListTitle: {
        ...Typography.labelMedium,
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    holidayList: {
        maxHeight: 200,
    },
    holidayItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.surfaceVariant,
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.xs,
    },
    holidayDate: {
        ...Typography.bodyMedium,
        color: Colors.onSurface,
        flex: 1,
    },
    noHolidays: {
        ...Typography.bodySmall,
        color: Colors.outline,
        textAlign: 'center',
        padding: Spacing.md,
    },
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

export default StoresScreen;
