import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import * as SplashScreen from 'expo-splash-screen';
import { registerRootComponent } from 'expo';
import App from './App';

// Prevent splash screen from auto-hiding before React finishes measuring and mounting
SplashScreen.preventAutoHideAsync().catch(() => {});

registerRootComponent(App);
