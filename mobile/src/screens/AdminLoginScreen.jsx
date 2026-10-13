import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    SafeAreaView
} from 'react-native';
import { colors, radius, shadows } from '../theme';
import AuthService from '../services/authService';

const AdminLoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [lockoutRemaining, setLockoutRemaining] = useState(0);

    // Auto-check active session on mount
    useEffect(() => {
        let timer = null;
        const checkExistingSession = async () => {
            try {
                const res = await AuthService.validateSession();
                if (res.valid) {
                    navigation.replace('AdminDashboard');
                    return;
                }

                // Check lockout
                const lockout = await AuthService.checkLockoutStatus();
                if (lockout.isLocked) {
                    setLockoutRemaining(lockout.remainingSeconds);
                }
            } catch {
                // proceed
            } finally {
                setCheckingSession(false);
            }
        };

        checkExistingSession();

        // Lockout countdown timer
        timer = setInterval(async () => {
            const lockout = await AuthService.checkLockoutStatus();
            if (lockout.isLocked) {
                setLockoutRemaining(lockout.remainingSeconds);
            } else {
                setLockoutRemaining(0);
            }
        }, 1000);

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [navigation]);

    const handleLogin = async () => {
        setErrorMsg('');
        if (!username.trim() || !password.trim()) {
            setErrorMsg('Please enter both Staff Username and Password.');
            return;
        }

        setLoading(true);
        try {
            const result = await AuthService.login(username, password);
            if (result.success) {
                navigation.replace('AdminDashboard');
            } else {
                setErrorMsg(result.error || 'Authentication failed. Please verify credentials.');
                // Update lockout if triggered
                const lockout = await AuthService.checkLockoutStatus();
                if (lockout.isLocked) {
                    setLockoutRemaining(lockout.remainingSeconds);
                }
            }
        } catch (err) {
            setErrorMsg('Network or service exception during login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.gold} />
                <Text style={styles.checkingText}>Verifying secure session...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.brandContainer}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>🔒 CONCIERGE ACCESS ONLY</Text>
                        </View>
                        <Text style={styles.brandTitle}>Bethany Homestay</Text>
                        <Text style={styles.brandSubtitle}>Staff Administration & Operations Portal</Text>
                    </View>

                    {/* Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardHeader}>Secure Staff Login</Text>
                        <Text style={styles.cardSub}>
                            Manage direct bookings, calendar availability, customer CRM, and seasonal rates.
                        </Text>

                        {/* Lockout Notice */}
                        {lockoutRemaining > 0 && (
                            <View style={styles.lockoutBox}>
                                <Text style={styles.lockoutTitle}>⚠️ Security Lockout Triggered</Text>
                                <Text style={styles.lockoutSub}>
                                    Too many incorrect attempts. Retry available in {lockoutRemaining}s.
                                </Text>
                            </View>
                        )}

                        {/* Error Message */}
                        {!!errorMsg && lockoutRemaining === 0 && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{errorMsg}</Text>
                            </View>
                        )}

                        {/* Username Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>STAFF USERNAME / ID</Text>
                            <View style={styles.inputWrap}>
                                <Text style={styles.inputIcon}>👤</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter Staff Login ID"
                                    placeholderTextColor={colors.grey}
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={lockoutRemaining === 0 && !loading}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>SECURE PASSWORD</Text>
                            <View style={styles.inputWrap}>
                                <Text style={styles.inputIcon}>🔑</Text>
                                <TextInput
                                    style={[styles.textInput, { flex: 1 }]}
                                    placeholder="Enter Password"
                                    placeholderTextColor={colors.grey}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={lockoutRemaining === 0 && !loading}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeBtn}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🙈'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Security Notice */}
                        <View style={styles.securityPill}>
                            <Text style={styles.securityPillText}>
                                🛡️ SHA-256 Verified · 12-Hour Encrypted Session · Rate-Limited
                            </Text>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.loginBtn,
                                (lockoutRemaining > 0 || loading) && styles.loginBtnDisabled
                            ]}
                            onPress={handleLogin}
                            disabled={lockoutRemaining > 0 || loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.loginBtnText}>
                                    {lockoutRemaining > 0 ? `Locked (${lockoutRemaining}s)` : 'Access Admin Suite →'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Back to Guest Sanctuary */}
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => navigation.navigate('MainTabs')}
                            disabled={loading}
                        >
                            <Text style={styles.cancelBtnText}>← Return to Guest Sanctuary</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.forestDark
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.forestDark,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    checkingText: {
        color: colors.ivory,
        marginTop: 16,
        fontSize: 14,
        letterSpacing: 0.5
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 32
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 28
    },
    badge: {
        backgroundColor: 'rgba(197, 160, 89, 0.2)',
        borderColor: colors.gold,
        borderWidth: 1,
        borderRadius: radius.full,
        paddingHorizontal: 14,
        paddingVertical: 5,
        marginBottom: 12
    },
    badgeText: {
        color: colors.goldLight,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5
    },
    brandTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.ivory,
        letterSpacing: 0.8,
        marginBottom: 6
    },
    brandSubtitle: {
        fontSize: 13,
        color: colors.beige,
        textAlign: 'center',
        opacity: 0.85
    },
    card: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.lg,
        padding: 24,
        ...shadows.elevated
    },
    cardHeader: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.forestDark,
        marginBottom: 6
    },
    cardSub: {
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 18,
        marginBottom: 20
    },
    errorBox: {
        backgroundColor: '#FDE8E8',
        borderColor: '#F98080',
        borderWidth: 1,
        borderRadius: radius.sm,
        padding: 12,
        marginBottom: 16
    },
    errorText: {
        color: '#9B1C1C',
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16
    },
    lockoutBox: {
        backgroundColor: '#FEF08A',
        borderColor: '#EAB308',
        borderWidth: 1,
        borderRadius: radius.sm,
        padding: 12,
        marginBottom: 16
    },
    lockoutTitle: {
        color: '#854D0E',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2
    },
    lockoutSub: {
        color: '#A16207',
        fontSize: 12
    },
    inputGroup: {
        marginBottom: 16
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 1,
        marginBottom: 6
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        borderRadius: radius.sm,
        paddingHorizontal: 12
    },
    inputIcon: {
        fontSize: 15,
        marginRight: 8
    },
    textInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.textMain,
        fontWeight: '600'
    },
    eyeBtn: {
        padding: 6
    },
    securityPill: {
        backgroundColor: colors.forestSubtle,
        borderRadius: radius.xs,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 20,
        marginTop: 4
    },
    securityPillText: {
        fontSize: 10,
        color: colors.forestLight,
        fontWeight: '700',
        textAlign: 'center'
    },
    loginBtn: {
        backgroundColor: colors.forest,
        borderRadius: radius.sm,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 14
    },
    loginBtnDisabled: {
        opacity: 0.6
    },
    loginBtnText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    cancelBtn: {
        alignItems: 'center',
        paddingVertical: 10
    },
    cancelBtnText: {
        color: colors.grey,
        fontSize: 12,
        fontWeight: '700'
    }
});

export default AdminLoginScreen;
