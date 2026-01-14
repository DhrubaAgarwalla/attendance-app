import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';

const Loading = ({
    size = 'large',
    color = Colors.primary,
    text,
    fullScreen = false,
    overlay = false,
}) => {
    const content = (
        <View style={[styles.container, fullScreen && styles.fullScreen]}>
            <ActivityIndicator size={size} color={color} />
            {text && <Text style={styles.text}>{text}</Text>}
        </View>
    );

    if (overlay) {
        return (
            <View style={styles.overlay}>
                {content}
            </View>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    fullScreen: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    text: {
        ...Typography.bodyMedium,
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.md,
    },
});

export default Loading;
