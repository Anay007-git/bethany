import 'react-native-url-polyfill/auto';
import React from 'react';
import { View, Text, TouchableOpacity, LogBox, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

LogBox.ignoreAllLogs(true);

const { width, height } = Dimensions.get('window');
const defaultMetrics = {
    insets: { top: 24, left: 0, right: 0, bottom: 0 },
    frame: { x: 0, y: 0, width: width || 360, height: height || 640 }
};

// Guarantee initial insets are non-null so SafeAreaProvider never renders null
const safeMetrics = (initialWindowMetrics && initialWindowMetrics.insets)
    ? initialWindowMetrics
    : defaultMetrics;

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.warn('Mobile App Runtime Warning:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#162E25', padding: 28 }}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>🏔️</Text>
                    <Text style={{ color: '#F8F6F0', fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center', letterSpacing: 0.5 }}>
                        Bethany Homestay
                    </Text>
                    <Text style={{ color: '#EAE3D5', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 22, opacity: 0.9 }}>
                        {this.state.error?.message || 'The sanctuary app encountered a temporary loading interruption. Tap below to reload your session.'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => this.setState({ hasError: false, error: null })}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: '#23483B',
                            paddingVertical: 14,
                            paddingHorizontal: 28,
                            borderRadius: 10,
                            borderWidth: 1.5,
                            borderColor: '#C5A059'
                        }}
                    >
                        <Text style={{ color: '#F8F6F0', fontWeight: '700', fontSize: 15 }}>
                            Reload Homestay Experience
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    return (
        <View style={{ flex: 1, backgroundColor: '#162E25' }}>
            <ErrorBoundary>
                <SafeAreaProvider initialMetrics={safeMetrics} style={{ flex: 1 }}>
                    <StatusBar style="light" />
                    <AppNavigator />
                </SafeAreaProvider>
            </ErrorBoundary>
        </View>
    );
}

