import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
    Linking
} from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';
import SubscriptionService from '../services/subscriptionService';

const SubscriptionDashboardScreen = ({ navigation }) => {
    const [membership, setMembership] = useState(null);
    const [application, setApplication] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadMemberData = useCallback(async () => {
        try {
            const currentUser = await SubscriptionService.getCurrentUserSession();
            if (!currentUser) {
                navigation.replace('SubscriptionAuth');
                return;
            }
            setUser(currentUser);

            const [memRes, appRes] = await Promise.all([
                SubscriptionService.getUserMembership(currentUser.id),
                SubscriptionService.getUserApplication(currentUser.id)
            ]);

            if (memRes.success && memRes.membership) {
                setMembership(memRes.membership);
            } else {
                // Not active membership yet -> redirect to status
                navigation.replace('SubscriptionStatus');
                return;
            }

            if (appRes.success && appRes.application) {
                setApplication(appRes.application);
            }
        } catch (err) {
            console.error('Error loading member dashboard:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigation]);

    useEffect(() => {
        loadMemberData();
    }, [loadMemberData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadMemberData();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.forest} />
                    <Text style={styles.loadingText}>Opening your member sanctuary...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const plan = membership?.subscription_plans;
    const remainingNights = membership?.nights_remaining_current_period || 0;
    const totalMonthlyNights = membership?.nights_allocated_monthly || 5;
    const renewalDate = membership?.renewal_date ? new Date(membership.renewal_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
    const occupants = application?.subscription_occupants || [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Home')}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleGroup}>
                        <Text style={styles.headerSubtitle}>MEMBER SANCTUARY</Text>
                        <Text style={styles.headerTitle}>Residency Portal</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            SubscriptionService.logout();
                            navigation.replace('SubscriptionIntro');
                        }}
                        style={styles.logoutBtn}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.logoutBtnText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Membership Card (Golden Boutique Aesthetics) */}
                <View style={styles.membershipCard}>
                    <View style={styles.cardGoldHeader}>
                        <View>
                            <Text style={styles.cardClubLabel}>BETHANY HOMESTAY RESIDENCY</Text>
                            <Text style={styles.cardTierTitle}>{plan?.title || 'Mountain Sanctuary'}</Text>
                        </View>
                        <View style={styles.statusPill}>
                            <Text style={styles.statusPillText}>● ACTIVE</Text>
                        </View>
                    </View>

                    <View style={styles.cardMidRow}>
                        <View>
                            <Text style={styles.cardSublabel}>PRIMARY MEMBER</Text>
                            <Text style={styles.cardMemberName}>{user?.full_name || 'Member'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.cardSublabel}>CATEGORY</Text>
                            <Text style={styles.cardMemberCat}>
                                {application?.category === 'couple' ? '💑 Couple Tier' : '👨‍👩‍👧‍👦 Family Tier'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardBottomRow}>
                        <View>
                            <Text style={styles.cardSublabel}>RENEWAL & AUTOPAY</Text>
                            <Text style={styles.cardDateValue}>{renewalDate}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.cardSublabel}>MEMBER ID</Text>
                            <Text style={styles.cardMemberId}>
                                BTH-{membership?.id?.slice(0, 8).toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Night Balance Widget */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceHeader}>
                        <View>
                            <Text style={styles.balanceLabel}>MONTHLY NIGHTS BALANCE</Text>
                            <Text style={styles.balanceSub}>Valid until {renewalDate}</Text>
                        </View>
                        <View style={styles.nightsCounterBadge}>
                            <Text style={styles.nightsNumber}>{remainingNights}</Text>
                            <Text style={styles.nightsTotal}>/{totalMonthlyNights} Nights</Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                styles.progressBar,
                                { width: `${Math.min(100, Math.max(0, (remainingNights / totalMonthlyNights) * 100))}%` }
                            ]}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.bookNowCta}
                        onPress={() => navigation.navigate('SubscriptionCalendar', { membership, application })}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.bookNowCtaText}>📅 Reserve Stays on Member Calendar →</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Navigation Hub */}
                <View style={styles.navGrid}>
                    <TouchableOpacity
                        style={styles.navTile}
                        onPress={() => navigation.navigate('SubscriptionMyBookings', { user, membership })}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.navIcon}>🧾</Text>
                        <Text style={styles.navTileTitle}>My Stays</Text>
                        <Text style={styles.navTileSub}>Upcoming & past vouchers</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navTile}
                        onPress={() => navigation.navigate('SubscriptionBillingHistory', { membership })}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.navIcon}>💳</Text>
                        <Text style={styles.navTileTitle}>AutoPay Mandate</Text>
                        <Text style={styles.navTileSub}>Receipts & billing</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navTile}
                        onPress={() => navigation.navigate('SubscriptionHelpPolicy')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.navIcon}>🏔️</Text>
                        <Text style={styles.navTileTitle}>Homestay Rules</Text>
                        <Text style={styles.navTileSub}>Quiet hours & guidelines</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navTile}
                        onPress={() => Linking.openURL('https://wa.me/918348993048?text=Hello%20Bethany%20Homestay,%20Member%20Concierge%20inquiry.')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.navIcon}>💬</Text>
                        <Text style={styles.navTileTitle}>Host Concierge</Text>
                        <Text style={styles.navTileSub}>Direct WhatsApp chat</Text>
                    </TouchableOpacity>
                </View>

                {/* Verified Occupants Capsule */}
                <View style={styles.occupantsSection}>
                    <Text style={styles.occupantsSectionTitle}>REGISTERED OCCUPANTS ({occupants.length}/4)</Text>
                    <View style={styles.occupantsChipsRow}>
                        {occupants.map((occ, idx) => (
                            <View key={idx} style={styles.occupantChip}>
                                <Text style={styles.occupantChipIcon}>{idx === 0 ? '👑' : '👤'}</Text>
                                <View>
                                    <Text style={styles.occupantChipName}>{occ.full_name}</Text>
                                    <Text style={styles.occupantChipRelation}>{occ.relationship}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
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
    logoutBtn: {
        paddingHorizontal: 10,
        paddingVertical: 5
    },
    logoutBtnText: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '600'
    },
    membershipCard: {
        margin: spacing.md,
        backgroundColor: colors.forestDark,
        borderRadius: radius.md,
        padding: spacing.lg,
        borderWidth: 1.5,
        borderColor: colors.gold,
        ...shadows.card
    },
    cardGoldHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16
    },
    cardClubLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.gold,
        letterSpacing: 1.2
    },
    cardTierTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.ivory,
        marginTop: 2
    },
    statusPill: {
        backgroundColor: 'rgba(42, 157, 143, 0.25)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.success
    },
    cardMidRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14
    },
    cardSublabel: {
        fontSize: 8,
        fontWeight: '700',
        color: colors.beigeDark,
        letterSpacing: 0.8
    },
    cardMemberName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.ivory,
        marginTop: 2
    },
    cardMemberCat: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.beige,
        marginTop: 2
    },
    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingTop: 10
    },
    cardDateValue: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.ivory,
        marginTop: 2
    },
    cardMemberId: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.gold,
        marginTop: 2,
        letterSpacing: 0.5
    },
    balanceCard: {
        marginHorizontal: spacing.md,
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle,
        marginBottom: spacing.md
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.8
    },
    balanceSub: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2
    },
    nightsCounterBadge: {
        flexDirection: 'row',
        alignItems: 'baseline'
    },
    nightsNumber: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.forest
    },
    nightsTotal: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMuted,
        marginLeft: 2
    },
    progressTrack: {
        height: 6,
        backgroundColor: colors.ivoryWarm,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 14
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.forest,
        borderRadius: 3
    },
    bookNowCta: {
        backgroundColor: colors.forest,
        paddingVertical: 13,
        borderRadius: radius.xs,
        alignItems: 'center',
        ...shadows.subtle
    },
    bookNowCtaText: {
        color: colors.ivory,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    navGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.md,
        gap: 12,
        marginBottom: spacing.md
    },
    navTile: {
        width: '48%',
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    navIcon: {
        fontSize: 24,
        marginBottom: 6
    },
    navTileTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMain
    },
    navTileSub: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 2
    },
    occupantsSection: {
        marginHorizontal: spacing.md,
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    occupantsSectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.8,
        marginBottom: 10
    },
    occupantsChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    occupantChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.ivoryWarm,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.xs,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    occupantChipIcon: {
        fontSize: 14,
        marginRight: 6
    },
    occupantChipName: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.forestDark
    },
    occupantChipRelation: {
        fontSize: 10,
        color: colors.textMuted
    }
});

export default SubscriptionDashboardScreen;
