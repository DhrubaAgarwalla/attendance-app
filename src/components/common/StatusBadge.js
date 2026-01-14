import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/theme';

const StatusBadge = ({
    status,
    label,
    size = 'medium', // small, medium, large
    style,
}) => {
    const getStatusColor = () => {
        switch (status) {
            case 'present':
            case 'approved':
            case 'active':
            case 'success':
                return {
                    background: Colors.successContainer,
                    text: Colors.success,
                };
            case 'absent':
            case 'rejected':
            case 'left':
            case 'error':
                return {
                    background: Colors.errorContainer,
                    text: Colors.error,
                };
            case 'late':
            case 'pending':
            case 'on_notice':
            case 'warning':
                return {
                    background: Colors.warningContainer,
                    text: Colors.warning,
                };
            case 'on_leave':
            case 'holiday':
            case 'info':
                return {
                    background: Colors.primaryContainer,
                    text: Colors.primary,
                };
            default:
                return {
                    background: Colors.surfaceVariant,
                    text: Colors.onSurfaceVariant,
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    container: {
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: Spacing.xs - 2,
                    },
                    text: Typography.labelSmall,
                };
            case 'large':
                return {
                    container: {
                        paddingHorizontal: Spacing.lg,
                        paddingVertical: Spacing.sm,
                    },
                    text: Typography.labelLarge,
                };
            case 'medium':
            default:
                return {
                    container: {
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.xs,
                    },
                    text: Typography.labelMedium,
                };
        }
    };

    const colors = getStatusColor();
    const sizeStyles = getSizeStyles();

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.background },
                sizeStyles.container,
                style,
            ]}
        >
            <Text style={[styles.text, { color: colors.text }, sizeStyles.text]}>
                {label || status?.replace(/_/g, ' ').toUpperCase()}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: '600',
        textTransform: 'uppercase',
    },
});

export default StatusBadge;
