import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, BorderRadius, Typography } from '../../constants/theme';
import { getInitials } from '../../utils/helpers';

const Avatar = ({
    source,
    name,
    size = 48,
    style,
    textStyle,
    backgroundColor,
}) => {
    const bgColor = backgroundColor || Colors.primaryContainer;
    const textColor = Colors.onPrimaryContainer;

    if (source) {
        return (
            <Image
                source={typeof source === 'string' ? { uri: source } : source}
                style={[
                    styles.image,
                    { width: size, height: size, borderRadius: size / 2 },
                    style,
                ]}
            />
        );
    }

    const fontSize = size * 0.4;

    return (
        <View
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: bgColor,
                },
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    { fontSize, color: textColor },
                    textStyle,
                ]}
            >
                {getInitials(name)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        resizeMode: 'cover',
    },
    text: {
        fontWeight: '600',
    },
});

export default Avatar;
