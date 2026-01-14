import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants/theme';

const TopBar = ({
    title,
    subtitle,
    leftIcon,
    onLeftPress,
    rightIcon,
    onRightPress,
    rightComponent,
    backgroundColor = Colors.surface,
    textColor = Colors.onSurface,
    elevated = false,
    centerTitle = false,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                { paddingTop: insets.top, backgroundColor },
                elevated && styles.elevated,
            ]}
        >
            <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
            <View style={styles.content}>
                <View style={styles.left}>
                    {leftIcon && (
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onLeftPress}
                        >
                            <Ionicons name={leftIcon} size={24} color={textColor} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[styles.center, centerTitle && styles.centerAligned]}>
                    <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={[styles.subtitle, { color: Colors.onSurfaceVariant }]} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    )}
                </View>

                <View style={styles.right}>
                    {rightComponent}
                    {rightIcon && !rightComponent && (
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onRightPress}
                        >
                            <Ionicons name={rightIcon} size={24} color={textColor} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        zIndex: 100,
    },
    elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        paddingHorizontal: Spacing.xs,
    },
    left: {
        minWidth: 48,
        alignItems: 'flex-start',
    },
    center: {
        flex: 1,
        paddingHorizontal: Spacing.sm,
    },
    centerAligned: {
        alignItems: 'center',
    },
    right: {
        minWidth: 48,
        alignItems: 'flex-end',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    iconButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
    },
    title: {
        ...Typography.titleLarge,
    },
    subtitle: {
        ...Typography.bodySmall,
    },
});

export default TopBar;
