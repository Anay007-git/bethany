import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';
import SubscriptionService from '../services/subscriptionService';

const SubscriptionAuthScreen = ({ route, navigation }) => {
    const initialIsLogin = route?.params?.isLogin || false;
    const [authMode, setAuthMode] = useState(initialIsLogin ? 'login' : 'register'); // 'register' | 'login'
    const [step, setStep] = useState('input'); // 'input' | 'otp'

    // Form inputs
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');

    // State indicators
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [devOtpNotice, setDevOtpNotice] = useState('');

    // Cooldown timer
    useEffect(() => {
        let interval = null;
        if (cooldownSeconds > 0) {
            interval = setInterval(() => {
                setCooldownSeconds(prev => (prev <= 1 ? 0 : prev - 1));
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [cooldownSeconds]);

    // Handle Option B: Send Email OTP
    const handleSendOtp = async () => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address to receive your verification code.');
            return;
        }

        if (authMode === 'register' && !fullName.trim()) {
            Alert.alert('Name Required', 'Please enter your Full Name as it appears on your government photo ID.');
            return;
        }

        setLoading(true);

        try {
            const res = await SubscriptionService.requestEmailOtp(cleanEmail, fullName.trim());
            setLoading(false);

            if (!res.success) {
                if (res.cooldown) {
                    setCooldownSeconds(res.secondsLeft || 60);
                }
                Alert.alert('Verification Notice', res.error || 'Failed to dispatch verification code.');
                return;
            }

            // Start 60s cooldown
            setCooldownSeconds(60);
            setStep('otp');

            Alert.alert(
                'Verification Code Sent',
                `A 6-digit verification code has been dispatched to ${cleanEmail}. Please check your inbox (and spam folder) and enter the code below.`
            );
        } catch (err) {
            setLoading(false);
            Alert.alert('Connection Error', err.message || 'Unable to connect to verification server.');
        }
    };

    // Handle OTP Verification
    const handleVerifyOtp = async () => {
        const cleanOtp = otpCode.trim();
        if (cleanOtp.length !== 6) {
            Alert.alert('Invalid Code', 'Please enter the complete 6-digit verification code.');
            return;
        }

        setLoading(true);

        try {
            const res = await SubscriptionService.verifyEmailOtp(email.trim(), cleanOtp);
            setLoading(false);

            if (!res.success) {
                Alert.alert('Verification Failed', res.error || 'Invalid code.');
                return;
            }

            // Redirect user to appropriate step based on existing application status
            await routeUserPostAuth(res.user);
        } catch (err) {
            setLoading(false);
            Alert.alert('Error', err.message || 'Verification attempt failed.');
        }
    };

    // Handle Option A: Google Sign-In with Real Google OAuth
    const handleGoogleAuth = async () => {
        setGoogleLoading(true);

        try {
            const res = await SubscriptionService.signInWithGoogleOAuth();
            setGoogleLoading(false);

            if (!res.success) {
                if (!res.cancelled) {
                    Alert.alert('Google Sign-In Error', res.error || 'Google authentication could not be completed.');
                }
                return;
            }

            await routeUserPostAuth(res.user);
        } catch (err) {
            setGoogleLoading(false);
            Alert.alert('Google Auth Failed', err.message || 'Authentication error.');
        }
    };

    // Post-Authentication Router: Checks if user already has an application or membership
    const routeUserPostAuth = async (user) => {
        try {
            // 1. Check existing membership
            const memRes = await SubscriptionService.getUserMembership(user.id);
            if (memRes.success && memRes.membership && memRes.membership.status === 'active') {
                navigation.replace('SubscriptionDashboard');
                return;
            }

            // 2. Check existing application
            const appRes = await SubscriptionService.getUserApplication(user.id);
            if (appRes.success && appRes.application) {
                const app = appRes.application;
                if (app.status === 'approved') {
                    navigation.replace('SubscriptionPlanSelection', { application: app });
                } else {
                    navigation.replace('SubscriptionStatus', { application: app });
                }
                return;
            }

            // 3. New applicant -> go to Application Form
            navigation.replace('SubscriptionApplication', { user });
        } catch (err) {
            navigation.replace('SubscriptionApplication', { user });
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => {
                                if (step === 'otp') setStep('input');
                                else navigation.goBack();
                            }}
                            style={styles.backButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.backButtonText}>←</Text>
                        </TouchableOpacity>
                        <View style={styles.headerTitleGroup}>
                            <Text style={styles.headerSubtitle}>APPLICANT VERIFICATION</Text>
                            <Text style={styles.headerTitle}>
                                {step === 'otp' ? 'Enter Security Code' : authMode === 'register' ? 'Member Registration' : 'Member Sign In'}
                            </Text>
                        </View>
                    </View>

                    {step === 'input' ? (
                        <View style={styles.content}>
                            {/* Option A: Google Sign-In */}
                            <View style={styles.googleSection}>
                                <Text style={styles.oauthLabel}>FAST VERIFICATION WITH GOOGLE</Text>
                                <TouchableOpacity
                                    style={styles.googleButton}
                                    onPress={handleGoogleAuth}
                                    activeOpacity={0.85}
                                    disabled={googleLoading}
                                >
                                    {googleLoading ? (
                                        <ActivityIndicator color={colors.textMain} size="small" />
                                    ) : (
                                        <View style={styles.googleBtnRow}>
                                            <Text style={styles.googleG}>G</Text>
                                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.linkingNotice}>
                                    🔒 Safe & Instant: Automatic account linking if you registered previously with this email.
                                </Text>
                            </View>

                            {/* Divider */}
                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR MANUAL EMAIL OTP</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Mode Toggle Tabs */}
                            <View style={styles.tabToggle}>
                                <TouchableOpacity
                                    style={[styles.toggleBtn, authMode === 'register' && styles.toggleBtnActive]}
                                    onPress={() => setAuthMode('register')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.toggleBtnText, authMode === 'register' && styles.toggleBtnTextActive]}>
                                        New Registration
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.toggleBtn, authMode === 'login' && styles.toggleBtnActive]}
                                    onPress={() => setAuthMode('login')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.toggleBtnText, authMode === 'login' && styles.toggleBtnTextActive]}>
                                        Sign In
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Inputs */}
                            <View style={styles.formCard}>
                                {authMode === 'register' && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Full Name (As on Government ID) *</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="e.g. Anand Sharma"
                                            placeholderTextColor={colors.greyLight}
                                            value={fullName}
                                            onChangeText={setFullName}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                )}

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Email Address *</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="anand@example.com"
                                        placeholderTextColor={colors.greyLight}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    <Text style={styles.inputHelper}>
                                        A 6-digit time-limited OTP will be sent to this email address.
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.submitBtn}
                                    onPress={handleSendOtp}
                                    activeOpacity={0.85}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={colors.ivory} size="small" />
                                    ) : (
                                        <Text style={styles.submitBtnText}>Send Verification Code →</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        /* Step 2: OTP Verification */
                        <View style={styles.content}>
                            <View style={styles.otpHeaderCard}>
                                <Text style={styles.otpIcon}>✉️</Text>
                                <Text style={styles.otpCardTitle}>Check Your Inbox</Text>
                                <Text style={styles.otpCardSubtitle}>
                                    We sent a 6-digit verification code to:
                                </Text>
                                <Text style={styles.otpTargetEmail}>{email}</Text>
                            </View>

                            {devOtpNotice ? (
                                <View style={styles.devBanner}>
                                    <Text style={styles.devBannerLabel}>DEVELOPER FAST-TEST CODE:</Text>
                                    <Text style={styles.devBannerCode}>{devOtpNotice}</Text>
                                </View>
                            ) : null}

                            <View style={styles.formCard}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>6-Digit Security Code</Text>
                                    <TextInput
                                        style={[styles.textInput, styles.otpInput]}
                                        placeholder="• • • • • •"
                                        placeholderTextColor={colors.greyLight}
                                        value={otpCode}
                                        onChangeText={setOtpCode}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <Text style={styles.inputHelper}>
                                        Code expires in 10 minutes. Maximum 5 attempts allowed.
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.submitBtn}
                                    onPress={handleVerifyOtp}
                                    activeOpacity={0.85}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={colors.ivory} size="small" />
                                    ) : (
                                        <Text style={styles.submitBtnText}>Verify & Proceed →</Text>
                                    )}
                                </TouchableOpacity>

                                {/* Resend OTP */}
                                <View style={styles.resendRow}>
                                    {cooldownSeconds > 0 ? (
                                        <Text style={styles.cooldownText}>
                                            Resend code in <Text style={{ fontWeight: '700' }}>{cooldownSeconds}s</Text>
                                        </Text>
                                    ) : (
                                        <TouchableOpacity onPress={handleSendOtp} activeOpacity={0.7}>
                                            <Text style={styles.resendLink}>Didn't receive code? Resend Now</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.editEmailBtn}
                                onPress={() => setStep('input')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.editEmailBtnText}>← Edit Email Address</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.bgPage
    },
    container: {
        flex: 1
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.bgSurface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.ivoryWarm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm
    },
    backButtonText: {
        fontSize: 20,
        color: colors.forest,
        fontWeight: '700'
    },
    headerTitleGroup: {
        flex: 1
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.gold,
        letterSpacing: 1.2
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textMain
    },
    content: {
        padding: spacing.md
    },
    googleSection: {
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: spacing.md
    },
    oauthLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 1,
        marginBottom: 8
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 13,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DADCE0',
        ...shadows.subtle
    },
    googleBtnRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    googleG: {
        fontSize: 18,
        fontWeight: '800',
        color: '#4285F4',
        marginRight: 10
    },
    googleButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3C4043'
    },
    linkingNotice: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 8,
        lineHeight: 15
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.sm
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.borderSubtle
    },
    dividerText: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.greyLight,
        marginHorizontal: 12,
        letterSpacing: 0.8
    },
    tabToggle: {
        flexDirection: 'row',
        backgroundColor: colors.ivoryWarm,
        borderRadius: radius.sm,
        padding: 4,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: radius.xs
    },
    toggleBtnActive: {
        backgroundColor: colors.forest,
        ...shadows.subtle
    },
    toggleBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted
    },
    toggleBtnTextActive: {
        color: colors.ivory,
        fontWeight: '700'
    },
    formCard: {
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    inputGroup: {
        marginBottom: spacing.md
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: 6
    },
    textInput: {
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: radius.xs,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.textMain
    },
    otpInput: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 8,
        color: colors.forest
    },
    inputHelper: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 4
    },
    submitBtn: {
        backgroundColor: colors.forest,
        paddingVertical: 14,
        borderRadius: radius.xs,
        alignItems: 'center',
        marginTop: 4,
        ...shadows.subtle
    },
    submitBtnText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    otpHeaderCard: {
        alignItems: 'center',
        backgroundColor: colors.bgSurface,
        padding: spacing.lg,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: spacing.md
    },
    otpIcon: {
        fontSize: 40,
        marginBottom: 8
    },
    otpCardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.forestDark,
        marginBottom: 4
    },
    otpCardSubtitle: {
        fontSize: 12,
        color: colors.textMuted
    },
    otpTargetEmail: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.forest,
        marginTop: 2
    },
    devBanner: {
        backgroundColor: '#FFFBEA',
        borderWidth: 1,
        borderColor: '#F59E0B',
        padding: 10,
        borderRadius: radius.xs,
        marginBottom: spacing.md,
        alignItems: 'center'
    },
    devBannerLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#B45309'
    },
    devBannerCode: {
        fontSize: 20,
        fontWeight: '900',
        color: '#78350F',
        letterSpacing: 4,
        marginTop: 2
    },
    resendRow: {
        alignItems: 'center',
        marginTop: spacing.md
    },
    cooldownText: {
        fontSize: 12,
        color: colors.textMuted
    },
    resendLink: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.forest,
        textDecorationLine: 'underline'
    },
    editEmailBtn: {
        alignItems: 'center',
        marginTop: spacing.md,
        paddingVertical: 8
    },
    editEmailBtnText: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '600'
    }
});

export default SubscriptionAuthScreen;
