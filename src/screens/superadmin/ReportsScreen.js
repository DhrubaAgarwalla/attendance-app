import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopBar, EmptyState } from '../../components/common';
import { Colors } from '../../constants/theme';

const ReportsScreen = () => {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TopBar title="Reports" subtitle="Global analytics" />
            <View style={styles.content}>
                <EmptyState
                    icon="bar-chart-outline"
                    title="Reports Coming Soon"
                    message="Excel export and detailed analytics will be available here"
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1 },
});

export default ReportsScreen;
