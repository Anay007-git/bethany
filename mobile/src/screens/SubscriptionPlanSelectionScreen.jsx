import React, { useState, useEffect } from 'react';
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

const SubscriptionPlanSelectionScreen = ({ route, navigation }) => {
    const passedApp = route?.params?.application || null;
    const [application, setApplication] = useState(passedApp);
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await SubscriptionService.getCurrentUserSession();
            if (!user) {
                navigation.replace('SubscriptionAuth');
                return;
            }

            let app = application;
            if (!app) {
                const appRes = await SubscriptionService.getUserApplication(user.id);
                if (appRes.success && appRes.application) {
                    app = appRes.application;
                    setApplication(app);
                }
            }

            // Enforce that only approved applicants can proceed to plan selection
            if (!app || app.status !== 'approved') {
                Alert.alert(
                    'Access Restricted',
                    'Only verified and approved applicants can select a subscription tier.',
                    [{ text: 'View Status', onPress: () => navigation.replace('SubscriptionStatus', { application: app }) }]
                );
                return;
            }

            // Load active plans
            const plansRes = await SubscriptionService.getPlans();
            if (plansRes.success && plansRes.plans.length > 0) {
                setPlans(plansRes.plans);
                // Preselect matching plan by category if possible
                const matching = plansRes.plans.find(p => p.category === app.category || p.category === 'both');
                setSelectedPlanId(matching ? matching.id : plansRes.plans[0].id);
            }
        } catch (err) {
            console.error('Error loading plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleContinueToAutoPay = () => {
        const chosen = plans.find(p => p.id === selectedPlanId);
        if (!chosen) {
            Alert.alert('Selection Required', 'Please select a subscription tier to continue.');
            return;
        }

        navigation.navigate('SubscriptionAutoPay', {
            application,
            plan: chosen
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.forest} />
                    <Text style={styles.loadingText}>Loading subscription tiers...</Text>
                </View>
            </SafeAreaView>
        );
    }

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
                        <Text style={styles.headerSubtitle}>STEP 1 OF 2 · TIER SELECTION</Text>
                        <Text style={styles.headerTitle}>Choose Monthly Residency</Text>
                    </View>
                </View>

                {/* Info Callout */}
                <View style={styles.commitmentNotice}>
                    <Text style={styles.commitmentIcon}>🛡️</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.commitmentTitle}>3-Month Minimum Commitment</Text>
                        <Text style={styles.commitmentDesc}>
                            Monthly rate locked with zero surge pricing. AutoPay authorized monthly via UPI or Card under RBI e-mandate rules.
                        </Text>
                    </View>
                </View>

                {/* Plans List */}
                <View style={styles.plansContainer}>
                    {plans.map((plan) => {
                        const isSelected = plan.id === selectedPlanId;
                        const perks = Array.isArray(plan.perks) ? plan.perks : [];

                        return (
                            <TouchableOpacity
                                key={plan.id}
                                style={[styles.planCard, isSelected && styles.planCardActive]}
                                onPress={() => setSelectedPlanId(plan.id)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.planCardTop}>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryBadgeText}>
                                                {plan.category === 'couple' ? '💑 COUPLE PLAN' : '👨‍👩‍👧‍👦 FAMILY PLAN'}
                                            </Text>
                                        </View>
                                        <Text style={styles.planTitle}>{plan.title}</Text>
                                    </View>
                                    <View style={styles.radioOuter}>
                                        {isSelected && <View style={styles.radioInner} />}
                                    </View>
                                </View>

                                <View style={styles.priceRow}>
                                    <Text style={styles.priceCurrency}>₹</Text>
                                    <Text style={styles.priceAmount}>
                                        {Number(plan.monthly_price).toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={styles.pricePeriod}>/ month</Text>
                                </View>

                                <View style={styles.nightsBadge}>
                                    <Text style={styles.nightsBadgeText}>
                                        ✨ {plan.nights_per_month} Mountain Room Nights Included Every Month
                                    </Text>
                                </View>

                                <Text style={styles.planDesc}>{plan.description}</Text>

                                <View style={styles.divider} />

                                <Text style={styles.perksHeader}>MEMBERSHIP PRIVILEGES:</Text>
                                <View style={styles.perksList}>
                                    {perks.map((perk, pIdx) => (
                                        <View key={pIdx} style={styles.perkRow}>
                                            <Text style={styles.perkBullet}>✓</Text>
                                            <Text style={styles.perkText}>{perk}</Text>
                                        </View>
                                    ))}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Bottom Action */}
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinueToAutoPay}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.continueButtonText}>
                            Authorize AutoPay & Activate →
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.bottomGuarantee}>
                        🔒 100% Secure RBI e-Mandate • 24hr Pre-Debit Notification Before Each Charge
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
        justifyContent: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: colors.textMuted,
        fontSize: 14
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
    commitmentNotice: {
        flexDirection: 'row',
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        margin: spacing.md,
        padding: spacing.md,
        borderRadius: radius.sm,
        alignItems: 'center'
    },
    commitmentIcon: {
        fontSize: 26,
        marginRight: 12
    },
    commitmentTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#065F46',
        marginBottom: 2
    },
    commitmentDesc: {
        fontSize: 11,
        color: '#047857',
        lineHeight: 16
    },
    plansContainer: {
        paddingHorizontal: spacing.md,
        gap: 16
    },
    planCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.sm,
        borderWidth: 1.5,
        borderColor: colors.borderSubtle,
        padding: spacing.md,
        ...shadows.subtle
    },
    planCardActive: {
        borderColor: colors.forest,
        backgroundColor: '#FFFFFF',
        ...shadows.card
    },
    planCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.forestSubtle,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full,
        marginBottom: 6
    },
    categoryBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.forest,
        letterSpacing: 0.8
    },
    planTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.forestDark
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.forest,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.forest
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 10,
        marginBottom: 8
    },
    priceCurrency: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.forestDark,
        marginRight: 2
    },
    priceAmount: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.forestDark
    },
    pricePeriod: {
        fontSize: 13,
        color: colors.textMuted,
        marginLeft: 4
    },
    nightsBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.ivoryWarm,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.xs,
        marginBottom: 10
    },
    nightsBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.gold
    },
    planDesc: {
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 17,
        marginBottom: 10
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderSubtle,
        marginVertical: 10
    },
    perksHeader: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.8,
        marginBottom: 6
    },
    perksList: {
        gap: 6
    },
    perkRow: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    perkBullet: {
        color: colors.success,
        fontSize: 12,
        fontWeight: '800',
        marginRight: 6
    },
    perkText: {
        flex: 1,
        fontSize: 11,
        color: colors.textMain,
        lineHeight: 16
    },
    bottomSection: {
        padding: spacing.md,
        marginTop: spacing.md
    },
    continueButton: {
        backgroundColor: colors.forest,
        paddingVertical: 15,
        borderRadius: radius.sm,
        alignItems: 'center',
        ...shadows.subtle
    },
    continueButtonText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    bottomGuarantee: {
        fontSize: 10,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 14
    }
});

export default SubscriptionPlanSelectionScreen;
