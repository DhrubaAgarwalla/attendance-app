import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from '../components/common';
import { ROLES } from '../constants';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SuperAdminNavigator from './SuperAdminNavigator';
import AdminNavigator from './AdminNavigator';
import StaffNavigator from './StaffNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { user, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return <Loading fullScreen text="Loading..." />;
    }

    const getNavigator = () => {
        if (!isAuthenticated) {
            return (
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
            );
        }

        switch (user?.role) {
            case ROLES.SUPER_ADMIN:
                return (
                    <Stack.Screen
                        name="SuperAdminApp"
                        component={SuperAdminNavigator}
                        options={{ headerShown: false }}
                    />
                );
            case ROLES.ADMIN:
                return (
                    <Stack.Screen
                        name="AdminApp"
                        component={AdminNavigator}
                        options={{ headerShown: false }}
                    />
                );
            case ROLES.STAFF:
                return (
                    <Stack.Screen
                        name="StaffApp"
                        component={StaffNavigator}
                        options={{ headerShown: false }}
                    />
                );
            default:
                return (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                );
        }
    };

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {getNavigator()}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
