import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, LogBox, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';

LogBox.ignoreAllLogs(true);

const { width: winWidth, height: winHeight } = Dimensions.get('window');
const { width: scrWidth, height: scrHeight } = Dimensions.get('screen');

const initialWidth = (winWidth && winWidth > 0) ? winWidth : ((scrWidth && scrWidth > 0) ? scrWidth : 390);
const initialHeight = (winHeight && winHeight > 0) ? winHeight : ((scrHeight && scrHeight > 0) ? scrHeight : 844);

// Guarantee insets and frame are strictly non-zero so views never collapse
const safeMetrics = {
    insets: (initialWindowMetrics?.insets?.top !== undefined && initialWindowMetrics?.insets?.bottom !== undefined)
        ? initialWindowMetrics.insets
        : { top: 24, left: 0, right: 0, bottom: 0 },
    frame: (initialWindowMetrics?.frame?.width && initialWindowMetrics.frame.width > 0 && initialWindowMetrics?.frame?.height && initialWindowMetrics.frame.height > 0)
        ? initialWindowMetrics.frame
        : { x: 0, y: 0, width: initialWidth, height: initialHeight }
};

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
                <View style={{ flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#162E25', padding: 28 }}>
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
    useEffect(() => {
        let isMounted = true;
        const dismissNativeSplash = async () => {
            try {
                // Short grace delay allowing the native hierarchy and navigation tree to mount
                await new Promise(resolve => setTimeout(resolve, 200));
                if (isMounted) {
                    await SplashScreen.hideAsync().catch(() => {});
                }
            } catch (err) {
                console.warn('Splash dismiss notice:', err);
            }
        };
        dismissNativeSplash();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#162E25' }}>
            <GestureHandlerRootView style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#162E25' }}>
                <ErrorBoundary>
                    <SafeAreaProvider initialMetrics={safeMetrics} style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#162E25' }}>
                        <StatusBar style="light" backgroundColor="#162E25" />
                        <AppNavigator />
                    </SafeAreaProvider>
                </ErrorBoundary>
            </GestureHandlerRootView>
        </View>
    );
}

