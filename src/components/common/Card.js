import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Elevation, Spacing } from '../../constants/theme';

const Card = ({
    children,
    style,
    variant = 'elevated', // elevated, filled, outlined
    elevation = 'level1',
    padding = 'md',
    onPress,
}) => {
    const Container = onPress ? require('react-native').TouchableOpacity : View;

    const getVariantStyles = () => {
        switch (variant) {
            case 'filled':
                return {
                    backgroundColor: Colors.surfaceContainerHigh,
                };
            case 'outlined':
                return {
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.outlineVariant,
                };
            case 'elevated':
            default:
                return {
                    backgroundColor: Colors.surfaceContainerLow,
                    ...Elevation[elevation],
                };
        }
    };

    return (
        <Container
            style={[
                styles.card,
                getVariantStyles(),
                { padding: Spacing[padding] },
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {children}
        </Container>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
});

export default Card;
