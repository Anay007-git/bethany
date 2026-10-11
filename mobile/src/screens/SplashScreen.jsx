import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme';

const SplashScreen = ({ navigation }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('MainTabs');
        }, 1500);
        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoBadge}>
                    <Text style={styles.logoIcon}>🏔️</Text>
                </View>
                <Text style={styles.brandTitle}>BETHANY HOMESTAY</Text>
                <Text style={styles.brandSubtitle}>KALIMPONG · 1,250 M ELEVATION</Text>
                <Text style={styles.tagline}>A peaceful sanctuary above the clouds</Text>

                <ActivityIndicator
                    size="small"
                    color={colors.gold}
                    style={styles.spinner}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.forestDark,
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 24
    },
    logoBadge: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgba(234, 227, 213, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: colors.gold
    },
    logoIcon: {
        fontSize: 40
    },
    brandTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.ivory,
        letterSpacing: 2,
        marginBottom: 6,
        textAlign: 'center'
    },
    brandSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.gold,
        letterSpacing: 2.5,
        marginBottom: 16,
        textAlign: 'center'
    },
    tagline: {
        fontSize: 14,
        color: colors.beige,
        opacity: 0.85,
        marginBottom: 36,
        textAlign: 'center'
    },
    spinner: {
        marginTop: 10
    }
});

export default SplashScreen;
