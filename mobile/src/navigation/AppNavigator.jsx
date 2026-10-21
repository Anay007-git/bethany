import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../theme';

const NavigationTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: colors.forestDark
    }
};

// Screens
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import RoomsScreen from '../screens/RoomsScreen';
import RoomDetailScreen from '../screens/RoomDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import PaymentHandoffScreen from '../screens/PaymentHandoffScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import ContactScreen from '../screens/ContactScreen';
import HomestayPoliciesScreen from '../screens/HomestayPoliciesScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

// Subscription Screens (Exclusive Mobile Feature)
import SubscriptionIntroScreen from '../screens/SubscriptionIntroScreen';
import SubscriptionAuthScreen from '../screens/SubscriptionAuthScreen';
import SubscriptionApplicationScreen from '../screens/SubscriptionApplicationScreen';
import SubscriptionStatusScreen from '../screens/SubscriptionStatusScreen';
import SubscriptionPlanSelectionScreen from '../screens/SubscriptionPlanSelectionScreen';
import SubscriptionAutoPayScreen from '../screens/SubscriptionAutoPayScreen';
import SubscriptionDashboardScreen from '../screens/SubscriptionDashboardScreen';
import SubscriptionCalendarScreen from '../screens/SubscriptionCalendarScreen';
import SubscriptionBookingScreen from '../screens/SubscriptionBookingScreen';
import SubscriptionMyBookingsScreen from '../screens/SubscriptionMyBookingsScreen';
import SubscriptionBillingHistoryScreen from '../screens/SubscriptionBillingHistoryScreen';
import SubscriptionHelpPolicyScreen from '../screens/SubscriptionHelpPolicyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.forest,
                tabBarInactiveTintColor: colors.grey,
                tabBarStyle: {
                    backgroundColor: colors.bgSurface,
                    borderTopColor: colors.borderSubtle,
                    height: 64,
                    paddingBottom: 10,
                    paddingTop: 8
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600'
                },
                tabBarIcon: () => {
                    let iconName = '🏔️';
                    if (route.name === 'Home') iconName = '🏔️';
                    if (route.name === 'Suites') iconName = '🛏️';
                    if (route.name === 'My Bookings') iconName = '🧾';
                    if (route.name === 'Concierge') iconName = '💬';
                    return <Text style={{ fontSize: 18 }}>{iconName}</Text>;
                }
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Suites" component={RoomsScreen} />
            <Tab.Screen name="My Bookings" component={MyBookingsScreen} />
            <Tab.Screen name="Concierge" component={ContactScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer theme={NavigationTheme}>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.forestDark }
                }}
            >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
                <Stack.Screen name="BookingFlow" component={BookingScreen} />
                <Stack.Screen name="PaymentHandoff" component={PaymentHandoffScreen} />
                <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
                <Stack.Screen name="Policies" component={HomestayPoliciesScreen} />
                <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />

                {/* Family & Couple Monthly Room Subscription Flow */}
                <Stack.Screen name="SubscriptionIntro" component={SubscriptionIntroScreen} />
                <Stack.Screen name="SubscriptionAuth" component={SubscriptionAuthScreen} />
                <Stack.Screen name="SubscriptionApplication" component={SubscriptionApplicationScreen} />
                <Stack.Screen name="SubscriptionStatus" component={SubscriptionStatusScreen} />
                <Stack.Screen name="SubscriptionPlanSelection" component={SubscriptionPlanSelectionScreen} />
                <Stack.Screen name="SubscriptionAutoPay" component={SubscriptionAutoPayScreen} />
                <Stack.Screen name="SubscriptionDashboard" component={SubscriptionDashboardScreen} />
                <Stack.Screen name="SubscriptionCalendar" component={SubscriptionCalendarScreen} />
                <Stack.Screen name="SubscriptionBooking" component={SubscriptionBookingScreen} />
                <Stack.Screen name="SubscriptionMyBookings" component={SubscriptionMyBookingsScreen} />
                <Stack.Screen name="SubscriptionBillingHistory" component={SubscriptionBillingHistoryScreen} />
                <Stack.Screen name="SubscriptionHelpPolicy" component={SubscriptionHelpPolicyScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
