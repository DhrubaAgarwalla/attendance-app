import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

const EmptyState = ({
    icon = 'folder-open-outline',
    title = 'No data',
    message = 'There is nothing to display here.',
    actionLabel,
    onAction,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={64} color={Colors.outline} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity style={styles.button} onPress={onAction}>
                    <Text style={styles.buttonText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.surfaceVariant,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.titleLarge,
        color: Colors.onSurface,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    message: {
        ...Typography.bodyMedium,
        color: Colors.onSurfaceVariant,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.xl,
    },
    buttonText: {
        ...Typography.labelLarge,
        color: Colors.onPrimary,
    },
});

export default EmptyState;
