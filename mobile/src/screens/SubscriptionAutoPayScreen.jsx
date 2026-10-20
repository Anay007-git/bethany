import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView
} from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';
import SubscriptionService from '../services/subscriptionService';

const SubscriptionAutoPayScreen = ({ route, navigation }) => {
    const { application, plan } = route?.params || {};
    const [paymentMethod, setPaymentMethod] = useState('upi_autopay'); // 'upi_autopay' | 'card_emandate'
    const [loading, setLoading] = useState(false);

    if (!application || !plan) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerBox}>
                    <Text style={{ color: colors.error }}>Invalid session or plan selection.</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Home')}
                        style={{ marginTop: 12, padding: 8 }}
                    >
                        <Text style={{ color: colors.forest, fontWeight: '700' }}>Return to Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const monthlyAmount = Number(plan.monthly_price);
    const commitmentMonths = plan.commitment_months || 3;
    const totalCommitmentValue = monthlyAmount * commitmentMonths;

    // Handle Mandate Authorization & Server Activation
    const handleAuthorizeAutoPay = async () => {
        setLoading(true);

        try {
            const user = await SubscriptionService.getCurrentUserSession();
            if (!user) {
                setLoading(false);
                Alert.alert('Session Expired', 'Please sign in to complete authorization.');
                navigation.replace('SubscriptionAuth');
                return;
            }

            // Simulate UPI / Card Mandate Authorization Handshake
            // In a live production environment, this calls PhonePe/Razorpay e-Mandate SDK or redirect
            const simulatedMandate = {
                mandateId: `MANDATE-${Date.now().toString().slice(-8)}`,
                paymentMethod,
                gateway: 'phonepe_recurring'
            };

            const res = await SubscriptionService.activateMembership(
                user.id,
                application.id,
                plan.id,
                simulatedMandate
            );

            setLoading(false);

            if (!res.success) {
                Alert.alert('Authorization Failed', res.error || 'Failed to establish AutoPay mandate.');
                return;
            }

            Alert.alert(
                'AutoPay Mandate Authorized! 🎉',
                `Your ${plan.title} membership is officially active. You have been allocated ${plan.nights_per_month} mountain room nights for this month!`,
                [
                    {
                        text: 'Go to Member Dashboard →',
                        onPress: () => navigation.replace('SubscriptionDashboard')
                    }
                ]
            );
        } catch (err) {
            setLoading(false);
            Alert.alert('Error', err.message || 'AutoPay setup error.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleGroup}>
                        <Text style={styles.headerSubtitle}>STEP 2 OF 2 · MANDATE SETUP</Text>
                        <Text style={styles.headerTitle}>AutoPay Authorization</Text>
                    </View>
                </View>

                {/* Plan Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.summaryPlanCategory}>
                                {plan.category === 'couple' ? '💑 COUPLE PLAN' : '👨‍👩‍👧‍👦 FAMILY PLAN'}
                            </Text>
                            <Text style={styles.summaryPlanTitle}>{plan.title}</Text>
                        </View>
                        <View style={styles.summaryPriceBox}>
                            <Text style={styles.summaryPrice}>₹{monthlyAmount.toLocaleString('en-IN')}</Text>
                            <Text style={styles.summaryPriceSub}>/ month</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Monthly Room Nights:</Text>
                        <Text style={styles.summaryValue}>{plan.nights_per_month} Nights / month</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Minimum Commitment:</Text>
                        <Text style={styles.summaryValue}>3 Months (Mandatory)</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total 3-Month Value:</Text>
                        <Text style={[styles.summaryValue, { color: colors.gold }]}>
                            ₹{totalCommitmentValue.toLocaleString('en-IN')}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Billing Cycle:</Text>
                        <Text style={styles.summaryValue}>Every 30 Days via AutoPay</Text>
                    </View>
                </View>

                {/* Mandate Payment Method Selection */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>SELECT AUTOPAY PAYMENT METHOD</Text>
                    <Text style={styles.sectionDesc}>
                        Compliant with RBI e-Mandate Framework. No UPI PIN required for subsequent monthly debits.
                    </Text>

                    <TouchableOpacity
                        style={[styles.methodCard, paymentMethod === 'upi_autopay' && styles.methodCardActive]}
                        onPress={() => setPaymentMethod('upi_autopay')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.methodRadio}>
                            {paymentMethod === 'upi_autopay' && <View style={styles.methodRadioInner} />}
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.methodTitle}>UPI AutoPay (Recommended)</Text>
                            <Text style={styles.methodDesc}>
                                Set up recurring mandate using Google Pay, PhonePe, Paytm, or BHIM.
                            </Text>
                        </View>
                        <Text style={styles.methodIcon}>⚡</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.methodCard, paymentMethod === 'card_emandate' && styles.methodCardActive]}
                        onPress={() => setPaymentMethod('card_emandate')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.methodRadio}>
                            {paymentMethod === 'card_emandate' && <View style={styles.methodRadioInner} />}
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.methodTitle}>Debit / Credit Card e-Mandate</Text>
                            <Text style={styles.methodDesc}>
                                Standing instructions on Visa, Mastercard, or RuPay recurring cards.
                            </Text>
                        </View>
                        <Text style={styles.methodIcon}>💳</Text>
                    </TouchableOpacity>
                </View>

                {/* RBI Compliance & Terms Box */}
                <View style={styles.rbiBox}>
                    <Text style={styles.rbiTitle}>🏛️ RBI e-Mandate Protections:</Text>
                    <Text style={styles.rbiPoint}>
                        • <Text style={{ fontWeight: '700' }}>24-Hour Pre-Debit SMS/Email:</Text> You will receive an official notification at least 24 hours prior to each debit.
                    </Text>
                    <Text style={styles.rbiPoint}>
                        • <Text style={{ fontWeight: '700' }}>3-Month Lock-in Period:</Text> Cancellation requests can be submitted following completion of the initial 3 months.
                    </Text>
                    <Text style={styles.rbiPoint}>
                        • <Text style={{ fontWeight: '700' }}>Grace Period:</Text> In the event of a bank debit failure, a 3-day grace period is provided to resolve payment.
                    </Text>
                    <Text style={styles.rbiPoint}>
                        • <Text style={{ fontWeight: '700' }}>Security:</Text> We never store raw card numbers, CVVs, or UPI PINs.
                    </Text>
                </View>

                {/* Authorization CTA */}
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={styles.authButton}
                        onPress={handleAuthorizeAutoPay}
                        activeOpacity={0.85}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.ivory} size="small" />
                        ) : (
                            <Text style={styles.authButtonText}>
                                Authorize AutoPay & Activate Membership →
                            </Text>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.disclaimerText}>
                        By tapping authorize, you set up a monthly recurring standing mandate for ₹{monthlyAmount.toLocaleString('en-IN')}/month.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
    centerBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
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
    summaryCard: {
        margin: spacing.md,
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    summaryTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    summaryPlanCategory: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.gold,
        letterSpacing: 0.8,
        marginBottom: 4
    },
    summaryPlanTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.forestDark
    },
    summaryPriceBox: {
        alignItems: 'flex-end'
    },
    summaryPrice: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.forestDark
    },
    summaryPriceSub: {
        fontSize: 11,
        color: colors.textMuted
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderSubtle,
        marginVertical: 12
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5
    },
    summaryLabel: {
        fontSize: 12,
        color: colors.textMuted
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMain
    },
    sectionCard: {
        marginHorizontal: spacing.md,
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.8,
        marginBottom: 2
    },
    sectionDesc: {
        fontSize: 11,
        color: colors.textMuted,
        marginBottom: 12,
        lineHeight: 16
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: radius.xs,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        backgroundColor: colors.ivoryWarm,
        marginBottom: 10
    },
    methodCardActive: {
        borderColor: colors.forest,
        backgroundColor: 'rgba(35, 72, 59, 0.06)'
    },
    methodRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.forest,
        alignItems: 'center',
        justifyContent: 'center'
    },
    methodRadioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.forest
    },
    methodTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMain
    },
    methodDesc: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2
    },
    methodIcon: {
        fontSize: 22,
        marginLeft: 8
    },
    rbiBox: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        margin: spacing.md,
        padding: spacing.md,
        borderRadius: radius.xs
    },
    rbiTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 6
    },
    rbiPoint: {
        fontSize: 11,
        color: '#475569',
        lineHeight: 16,
        marginBottom: 4
    },
    actionSection: {
        paddingHorizontal: spacing.md,
        marginTop: spacing.sm,
        gap: 8
    },
    authButton: {
        backgroundColor: colors.forest,
        paddingVertical: 15,
        borderRadius: radius.sm,
        alignItems: 'center',
        ...shadows.subtle
    },
    authButtonText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    disclaimerText: {
        fontSize: 10,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 14
    }
});

export default SubscriptionAutoPayScreen;
