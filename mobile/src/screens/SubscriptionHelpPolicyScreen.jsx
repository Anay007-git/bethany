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

const SubscriptionHelpPolicyScreen = ({ navigation }) => {
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
                        <Text style={styles.headerSubtitle}>MEMBER GUIDELINES</Text>
                        <Text style={styles.headerTitle}>Policies & Host Support</Text>
                    </View>
                </View>

                {/* 1. 3-Month Minimum Commitment Policy */}
                <View style={styles.policyCard}>
                    <Text style={styles.policyIcon}>⏳</Text>
                    <Text style={styles.policyTitle}>3-Month Minimum Commitment</Text>
                    <Text style={styles.policyText}>
                        Bethany Homestay Monthly Room Subscriptions operate on an initial minimum term of three consecutive months. During this commitment period, AutoPay recurring mandates cannot be prematurely cancelled, ensuring locked member pricing with zero peak season surcharge.
                    </Text>
                    <Text style={styles.policyText}>
                        Following the completion of the 3rd billing cycle, members may request membership pause or cancellation at any time with a 15-day advance notice.
                    </Text>
                </View>

                {/* 2. Cancellation & Refund Policy */}
                <View style={styles.policyCard}>
                    <Text style={styles.policyIcon}>🔄</Text>
                    <Text style={styles.policyTitle}>Cancellations & Refunds</Text>
                    <Text style={styles.policyText}>
                        • Monthly subscription fees are non-refundable once processed for that billing cycle.
                    </Text>
                    <Text style={styles.policyText}>
                        • Unused room nights do not roll over past the 60-day extension window, maintaining fair access to mountain inventory for all members.
                    </Text>
                    <Text style={styles.policyText}>
                        • Member reservations may be rescheduled with at least 48 hours notice prior to check-in, subject to open inventory on the member calendar.
                    </Text>
                </View>

                {/* 3. Grace Periods & Payment Failures */}
                <View style={styles.policyCard}>
                    <Text style={styles.policyIcon}>🛡️</Text>
                    <Text style={styles.policyTitle}>Grace Periods & AutoPay Retries</Text>
                    <Text style={styles.policyText}>
                        In the event of an automated debit failure due to bank server timeouts or insufficient account balance:
                    </Text>
                    <Text style={styles.policyText}>
                        • A 3-day grace period is activated, during which existing confirmed vouchers remain fully honored.
                    </Text>
                    <Text style={styles.policyText}>
                        • The gateway retries the transaction up to 2 times. If unresolved after the grace period, calendar booking privileges are temporarily paused until the monthly charge succeeds.
                    </Text>
                </View>

                {/* 4. Homestay House Rules */}
                <View style={styles.policyCard}>
                    <Text style={styles.policyIcon}>🌲</Text>
                    <Text style={styles.policyTitle}>Sanctuary House Rules</Text>
                    <Text style={styles.policyText}>
                        • <Text style={{ fontWeight: '700' }}>Quiet Hours:</Text> 10:00 PM to 7:00 AM to preserve peaceful tranquility for all guests and nature.
                    </Text>
                    <Text style={styles.policyText}>
                        • <Text style={{ fontWeight: '700' }}>Strict Occupants Only:</Text> Only verified occupants declared in your approved application profile may stay. Commercial photo-shoots or non-member gatherings require prior written host permission.
                    </Text>
                    <Text style={styles.policyText}>
                        • <Text style={{ fontWeight: '700' }}>Check-in & Check-out:</Text> Check-in is from 1:00 PM; Check-out is by 11:00 AM to allow thorough housekeeping.
                    </Text>
                </View>

                {/* Contact Host Section */}
                <View style={styles.contactCard}>
                    <Text style={styles.contactCardTitle}>Direct Host Concierge Support</Text>
                    <Text style={styles.contactCardSubtitle}>
                        Our family is stationed on-site at Kalimpong to assist you at all times.
                    </Text>

                    <TouchableOpacity
                        style={styles.actionBtnWhatsApp}
                        onPress={() => Linking.openURL('https://wa.me/918348993048?text=Hello%20Bethany%20Homestay,%20I%20need%20assistance%20with%20my%20subscription.')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.actionBtnText}>💬 WhatsApp Host: +91 83489 93048</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtnCall}
                        onPress={() => Linking.openURL('tel:+918910911758')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.actionBtnCallText}>📞 Call Front Desk: +91 89109 11758</Text>
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
    policyCard: {
        margin: spacing.md,
        marginBottom: 0,
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    policyIcon: {
        fontSize: 26,
        marginBottom: 6
    },
    policyTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.forestDark,
        marginBottom: 6
    },
    policyText: {
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 18,
        marginBottom: 6
    },
    contactCard: {
        margin: spacing.md,
        backgroundColor: colors.ivoryWarm,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    contactCardTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.forestDark,
        marginBottom: 2
    },
    contactCardSubtitle: {
        fontSize: 11,
        color: colors.textMuted,
        marginBottom: 12
    },
    actionBtnWhatsApp: {
        backgroundColor: colors.whatsapp,
        paddingVertical: 12,
        borderRadius: radius.xs,
        alignItems: 'center',
        marginBottom: 8
    },
    actionBtnCall: {
        backgroundColor: colors.forest,
        paddingVertical: 12,
        borderRadius: radius.xs,
        alignItems: 'center'
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700'
    },
    actionBtnCallText: {
        color: colors.ivory,
        fontSize: 13,
        fontWeight: '700'
    }
});

export default SubscriptionHelpPolicyScreen;
