import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/theme';

const Button = ({
    title,
    onPress,
    variant = 'filled', // filled, outlined, text, tonal
    size = 'medium', // small, medium, large
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
    textStyle,
    color,
}) => {
    const getVariantStyles = () => {
        const baseColor = color || Colors.primary;

        switch (variant) {
            case 'outlined':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: disabled ? Colors.outline : baseColor,
                    },
                    text: {
                        color: disabled ? Colors.outline : baseColor,
                    },
                };
            case 'text':
                return {
                    container: {
                        backgroundColor: 'transparent',
                    },
                    text: {
                        color: disabled ? Colors.outline : baseColor,
                    },
                };
            case 'tonal':
                return {
                    container: {
                        backgroundColor: disabled ? Colors.surfaceVariant : Colors.primaryContainer,
                    },
                    text: {
                        color: disabled ? Colors.outline : Colors.onPrimaryContainer,
                    },
                };
            case 'filled':
            default:
                return {
                    container: {
                        backgroundColor: disabled ? Colors.surfaceVariant : baseColor,
                    },
                    text: {
                        color: disabled ? Colors.outline : Colors.onPrimary,
                    },
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    container: {
                        paddingVertical: Spacing.xs,
                        paddingHorizontal: Spacing.md,
                        minHeight: 32,
                    },
                    text: Typography.labelMedium,
                };
            case 'large':
                return {
                    container: {
                        paddingVertical: Spacing.md,
                        paddingHorizontal: Spacing.xl,
                        minHeight: 56,
                    },
                    text: Typography.titleMedium,
                };
            case 'medium':
            default:
                return {
                    container: {
                        paddingVertical: Spacing.sm + 2,
                        paddingHorizontal: Spacing.lg,
                        minHeight: 44,
                    },
                    text: Typography.labelLarge,
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    return (
        <TouchableOpacity
            style={[
                styles.container,
                variantStyles.container,
                sizeStyles.container,
                fullWidth && styles.fullWidth,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variantStyles.text.color}
                />
            ) : (
                <View style={styles.content}>
                    {icon && iconPosition === 'left' && (
                        <View style={styles.iconLeft}>{icon}</View>
                    )}
                    <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <View style={styles.iconRight}>{icon}</View>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    fullWidth: {
        width: '100%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        textAlign: 'center',
    },
    iconLeft: {
        marginRight: Spacing.sm,
    },
    iconRight: {
        marginLeft: Spacing.sm,
    },
});

export default Button;
