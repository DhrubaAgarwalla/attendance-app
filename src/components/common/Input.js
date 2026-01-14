import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/theme';

const Input = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    error,
    helper,
    disabled = false,
    multiline = false,
    numberOfLines = 1,
    maxLength,
    leftIcon,
    rightIcon,
    onRightIconPress,
    style,
    inputStyle,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const getBorderColor = () => {
        if (error) return Colors.error;
        if (isFocused) return Colors.primary;
        return Colors.outline;
    };

    const getBackgroundColor = () => {
        if (disabled) return Colors.surfaceVariant;
        return Colors.surfaceContainerHigh;
    };

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={[
                    styles.label,
                    isFocused && { color: Colors.primary },
                    error && { color: Colors.error },
                ]}>
                    {label}
                </Text>
            )}
            <View
                style={[
                    styles.inputContainer,
                    {
                        borderColor: getBorderColor(),
                        backgroundColor: getBackgroundColor(),
                    },
                    multiline && { minHeight: numberOfLines * 24 + 32 },
                ]}
            >
                {leftIcon && (
                    <View style={styles.leftIcon}>
                        {leftIcon}
                    </View>
                )}
                <TextInput
                    style={[
                        styles.input,
                        multiline && styles.multilineInput,
                        inputStyle,
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.outline}
                    secureTextEntry={secureTextEntry && !showPassword}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    editable={!disabled}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    maxLength={maxLength}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.rightIcon}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={Colors.outline}
                        />
                    </TouchableOpacity>
                )}
                {rightIcon && !secureTextEntry && (
                    <TouchableOpacity
                        style={styles.rightIcon}
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>
            {(error || helper) && (
                <Text style={[styles.helper, error && styles.errorText]}>
                    {error || helper}
                </Text>
            )}
            {maxLength && (
                <Text style={styles.counter}>
                    {value?.length || 0}/{maxLength}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        ...Typography.bodySmall,
        color: Colors.onSurfaceVariant,
        marginBottom: Spacing.xs,
        marginLeft: Spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        minHeight: 56,
    },
    input: {
        flex: 1,
        ...Typography.bodyLarge,
        color: Colors.onSurface,
        paddingVertical: Spacing.sm,
    },
    multilineInput: {
        textAlignVertical: 'top',
    },
    leftIcon: {
        marginRight: Spacing.sm,
    },
    rightIcon: {
        marginLeft: Spacing.sm,
        padding: Spacing.xs,
    },
    helper: {
        ...Typography.bodySmall,
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.xs,
        marginLeft: Spacing.xs,
    },
    errorText: {
        color: Colors.error,
    },
    counter: {
        ...Typography.bodySmall,
        color: Colors.outline,
        textAlign: 'right',
        marginTop: Spacing.xs,
    },
});

export default Input;
