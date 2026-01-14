import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

// Screens
import StaffDashboard from '../screens/staff/Dashboard';
import AttendanceHistoryScreen from '../screens/staff/AttendanceHistoryScreen';
import LeaveApplicationScreen from '../screens/staff/LeaveApplicationScreen';
import SalaryScreen from '../screens/staff/SalaryScreen';
import ProfileScreen from '../screens/staff/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const StaffNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Attendance':
                            iconName = focused ? 'calendar' : 'calendar-outline';
                            break;
                        case 'Leave':
                            iconName = focused ? 'airplane' : 'airplane-outline';
                            break;
                        case 'Salary':
                            iconName = focused ? 'wallet' : 'wallet-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'ellipse-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors.staffAccent,
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
            <Tab.Screen name="Home" component={StaffDashboard} />
            <Tab.Screen name="Attendance" component={AttendanceHistoryScreen} />
            <Tab.Screen name="Leave" component={LeaveApplicationScreen} />
            <Tab.Screen name="Salary" component={SalaryScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default StaffNavigator;
