import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Linking
} from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';

const SubscriptionBillingHistoryScreen = ({ route, navigation }) => {
    const { membership } = route?.params || {};

    const plan = membership?.subscription_plans;
    const mandate = membership?.subscription_mandates?.[0] || {
        mandate_id: `MANDATE-${Date.now().toString().slice(-8)}`,
        mandate_status: 'active',
        payment_method: 'upi_autopay',
        next_billing_date: membership?.renewal_date || '2026-11-20'
    };

    const monthlyAmount = Number(membership?.monthly_price || plan?.monthly_price || 18500);
    const startDate = membership?.start_date || '2026-10-21';
    const renewalDate = membership?.renewal_date || '2026-11-21';
    const commitmentEndDate = membership?.commitment_end_date || '2027-01-21';

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
                        <Text style={styles.headerSubtitle}>MANDATE & STATEMENTS</Text>
                        <Text style={styles.headerTitle}>Billing & Receipts</Text>
                    </View>
                </View>

                {/* Mandate Status Card */}
                <View style={styles.mandateCard}>
                    <View style={styles.mandateTop}>
                        <View>
                            <Text style={styles.mandateLabel}>AUTOPAY MANDATE STATUS</Text>
                            <Text style={styles.mandateStatusText}>● ACTIVE & AUTHORIZED</Text>
                        </View>
                        <Text style={styles.mandateIcon}>🛡️</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Text style={styles.label}>Mandate Reference:</Text>
                        <Text style={styles.val}>{mandate.mandate_id}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Payment Method:</Text>
                        <Text style={styles.val}>
                            {mandate.payment_method === 'upi_autopay' ? 'UPI AutoPay (GooglePay / PhonePe)' : 'Debit / Credit Card e-Mandate'}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Recurring Monthly Fee:</Text>
                        <Text style={[styles.val, { color: colors.forest, fontWeight: '800' }]}>
                            ₹{monthlyAmount.toLocaleString('en-IN')}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Next Scheduled Charge:</Text>
                        <Text style={styles.val}>{renewalDate}</Text>
                    </View>
                </View>

                {/* 3-Month Commitment Details */}
                <View style={styles.commitmentCard}>
                    <Text style={styles.sectionHeader}>MINIMUM COMMITMENT SCHEDULE</Text>
                    <View style={styles.commitmentRow}>
                        <View style={styles.commCol}>
                            <Text style={styles.commLabel}>START DATE</Text>
                            <Text style={styles.commVal}>{startDate}</Text>
                        </View>
                        <View style={styles.commCol}>
                            <Text style={styles.commLabel}>RENEWAL DATE</Text>
                            <Text style={styles.commVal}>{renewalDate}</Text>
                        </View>
                        <View style={styles.commCol}>
                            <Text style={styles.commLabel}>COMMITMENT END</Text>
                            <Text style={styles.commVal}>{commitmentEndDate}</Text>
                        </View>
                    </View>
                    <Text style={styles.commNotes}>
                        Under the 3-month minimum commitment policy, membership charges recur monthly until completion of the minimum term, after which membership may be paused or cancelled at any time.
                    </Text>
                </View>

                {/* Recent Invoices / Receipts */}
                <View style={styles.invoicesCard}>
                    <Text style={styles.sectionHeader}>PAYMENT STATEMENTS & RECEIPTS</Text>

                    <View style={styles.invoiceItem}>
                        <View style={styles.invLeft}>
                            <Text style={styles.invTitle}>Monthly Residency Authorization</Text>
                            <Text style={styles.invSub}>{startDate} • Paid via {mandate.payment_method === 'upi_autopay' ? 'UPI AutoPay' : 'e-Mandate'}</Text>
                            <Text style={styles.invNum}>INV-{membership?.id?.slice(0, 6).toUpperCase() || 'MEMBER-01'}</Text>
                        </View>
                        <View style={styles.invRight}>
                            <Text style={styles.invAmount}>₹{monthlyAmount.toLocaleString('en-IN')}</Text>
                            <View style={styles.paidBadge}>
                                <Text style={styles.paidBadgeText}>PAID</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Cancellation & Help */}
                <View style={styles.supportBox}>
                    <Text style={styles.supportTitle}>Need Help with Billing?</Text>
                    <Text style={styles.supportDesc}>
                        For invoice copy requests, payment method updates, or grace period inquiries, contact host concierge directly.
                    </Text>
                    <TouchableOpacity
                        style={styles.supportBtn}
                        onPress={() => Linking.openURL('https://wa.me/918348993048?text=Hello%20Bethany%20Homestay,%20Billing%20question.')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.supportBtnText}>💬 WhatsApp Host Concierge</Text>
                    </TouchableOpacity>
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
    mandateCard: {
        margin: spacing.md,
        backgroundColor: colors.bgSurface,
        borderRadius: radius.sm,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    mandateTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    mandateLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.8
    },
    mandateStatusText: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.success,
        marginTop: 2
    },
    mandateIcon: {
        fontSize: 24
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderSubtle,
        marginVertical: 12
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5
    },
    label: {
        fontSize: 12,
        color: colors.textMuted
    },
    val: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMain
    },
    commitmentCard: {
        marginHorizontal: spacing.md,
        backgroundColor: colors.bgSurface,
        borderRadius: radius.sm,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: spacing.md,
        ...shadows.subtle
    },
    sectionHeader: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 1,
        marginBottom: 12
    },
    commitmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.ivoryWarm,
        padding: 10,
        borderRadius: radius.xs
    },
    commCol: {
        flex: 1
    },
    commLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: colors.greyLight,
        letterSpacing: 0.8
    },
    commVal: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.forestDark,
        marginTop: 2
    },
    commNotes: {
        fontSize: 11,
        color: colors.textMuted,
        lineHeight: 16,
        marginTop: 10
    },
    invoicesCard: {
        marginHorizontal: spacing.md,
        backgroundColor: colors.bgSurface,
        borderRadius: radius.sm,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: spacing.md,
        ...shadows.subtle
    },
    invoiceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8
    },
    invLeft: {
        flex: 1
    },
    invTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMain
    },
    invSub: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2
    },
    invNum: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.gold,
        marginTop: 2
    },
    invRight: {
        alignItems: 'flex-end'
    },
    invAmount: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.forestDark
    },
    paidBadge: {
        backgroundColor: 'rgba(42, 157, 143, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4
    },
    paidBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.success
    },
    supportBox: {
        marginHorizontal: spacing.md,
        backgroundColor: colors.ivoryWarm,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    supportTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 4
    },
    supportDesc: {
        fontSize: 11,
        color: colors.textMuted,
        lineHeight: 16,
        marginBottom: 10
    },
    supportBtn: {
        backgroundColor: colors.forest,
        paddingVertical: 10,
        borderRadius: radius.xs,
        alignItems: 'center'
    },
    supportBtnText: {
        color: colors.ivory,
        fontSize: 12,
        fontWeight: '700'
    }
});

export default SubscriptionBillingHistoryScreen;
