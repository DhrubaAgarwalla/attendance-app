import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

// Placeholder screens - will be replaced with actual screens
import SuperAdminDashboard from '../screens/superadmin/Dashboard';
import StoresScreen from '../screens/superadmin/StoresScreen';
import AdminsScreen from '../screens/superadmin/AdminsScreen';
import StaffScreen from '../screens/superadmin/StaffScreen';
import GlobalLeavesScreen from '../screens/superadmin/GlobalLeavesScreen';
import ReportsScreen from '../screens/superadmin/ReportsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const SuperAdminNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Dashboard':
                            iconName = focused ? 'grid' : 'grid-outline';
                            break;
                        case 'Stores':
                            iconName = focused ? 'storefront' : 'storefront-outline';
                            break;
                        case 'Admins':
                            iconName = focused ? 'people' : 'people-outline';
                            break;
                        case 'Staff':
                            iconName = focused ? 'person-circle' : 'person-circle-outline';
                            break;
                        case 'Leaves':
                            iconName = focused ? 'calendar' : 'calendar-outline';
                            break;
                        case 'Reports':
                            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                            break;
                        default:
                            iconName = 'ellipse-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors.superAdminAccent,
                tabBarInactiveTintColor: Colors.outline,
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.outlineVariant,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={SuperAdminDashboard} />
            <Tab.Screen name="Stores" component={StoresScreen} />
            <Tab.Screen name="Admins" component={AdminsScreen} />
            <Tab.Screen name="Staff" component={StaffScreen} />
            <Tab.Screen name="Leaves" component={GlobalLeavesScreen} />
            <Tab.Screen name="Reports" component={ReportsScreen} />
        </Tab.Navigator>
    );
};

export default SuperAdminNavigator;
