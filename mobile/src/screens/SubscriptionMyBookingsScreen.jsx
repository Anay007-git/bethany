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

const SubscriptionMyBookingsScreen = ({ navigation }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadBookings = useCallback(async () => {
        try {
            const user = await SubscriptionService.getCurrentUserSession();
            if (!user) {
                navigation.replace('SubscriptionAuth');
                return;
            }

            const res = await SubscriptionService.getMemberBookings(user.id);
            if (res.success) {
                setBookings(res.bookings || []);
            }
        } catch (err) {
            console.error('Error loading member bookings:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigation]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const onRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.forest} />
                    <Text style={styles.loadingText}>Loading your stay vouchers...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingBookings = bookings.filter(b => b.check_out >= todayStr);
    const pastBookings = bookings.filter(b => b.check_out < todayStr);

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
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleGroup}>
                        <Text style={styles.headerSubtitle}>MEMBER VOUCHERS</Text>
                        <Text style={styles.headerTitle}>My Subscription Stays</Text>
                    </View>
                </View>

                {/* Upcoming Stays Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>UPCOMING RETREATS ({upcomingBookings.length})</Text>

                    {upcomingBookings.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyIcon}>🏔️</Text>
                            <Text style={styles.emptyTitle}>No Upcoming Stays Reserved</Text>
                            <Text style={styles.emptyDesc}>
                                Ready for a breath of mountain air? Check the member calendar to book your allocated suite.
                            </Text>
                            <TouchableOpacity
                                style={styles.bookCta}
                                onPress={() => navigation.navigate('SubscriptionDashboard')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.bookCtaText}>Go to Calendar →</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        upcomingBookings.map(b => {
                            const occupants = Array.isArray(b.attending_occupants) ? b.attending_occupants : [];
                            return (
                                <View key={b.id} style={styles.bookingCard}>
                                    <View style={styles.bookingTop}>
                                        <View>
                                            <View style={styles.confirmedPill}>
                                                <Text style={styles.confirmedPillText}>● CONFIRMED STAY</Text>
                                            </View>
                                            <Text style={styles.roomName}>{b.rooms?.name || 'Mountain Suite'}</Text>
                                        </View>
                                        <Text style={styles.nightsBadge}>{b.nights} Night(s)</Text>
                                    </View>

                                    <View style={styles.divider} />

                                    <View style={styles.datesGrid}>
                                        <View style={styles.dateCol}>
                                            <Text style={styles.dateLabel}>CHECK-IN</Text>
                                            <Text style={styles.dateVal}>{b.check_in}</Text>
                                            <Text style={styles.timeVal}>1:00 PM</Text>
                                        </View>
                                        <Text style={styles.arrowIcon}>→</Text>
                                        <View style={styles.dateCol}>
                                            <Text style={styles.dateLabel}>CHECK-OUT</Text>
                                            <Text style={styles.dateVal}>{b.check_out}</Text>
                                            <Text style={styles.timeVal}>11:00 AM</Text>
                                        </View>
                                    </View>

                                    {occupants.length > 0 && (
                                        <View style={styles.occupantsRow}>
                                            <Text style={styles.occupantsLabel}>Attending:</Text>
                                            <Text style={styles.occupantsVal}>{occupants.join(', ')}</Text>
                                        </View>
                                    )}

                                    <View style={styles.actionsRow}>
                                        <TouchableOpacity
                                            style={styles.chatHostBtn}
                                            onPress={() => Linking.openURL(`https://wa.me/918348993048?text=Hello%20Bethany%20Homestay,%20inquiring%20about%20my%20reservation%20%23${b.id.slice(0, 8)}`)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.chatHostBtnText}>💬 Message Host</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.directionsBtn}
                                            onPress={() => Linking.openURL('https://maps.google.com/?q=Bethany+Homestay+Kalimpong')}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.directionsBtnText}>📍 Get Directions</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Past Stays Section */}
                {pastBookings.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionHeading}>PAST COMPLETED STAYS ({pastBookings.length})</Text>
                        {pastBookings.map(b => (
                            <View key={b.id} style={[styles.bookingCard, { opacity: 0.85 }]}>
                                <View style={styles.bookingTop}>
                                    <Text style={styles.roomName}>{b.rooms?.name || 'Suite'}</Text>
                                    <Text style={styles.nightsBadge}>{b.nights} Nights</Text>
                                </View>
                                <Text style={styles.pastDateRange}>
                                    {b.check_in} — {b.check_out} • Completed
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

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
    section: {
        padding: spacing.md
    },
    sectionHeading: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 1,
        marginBottom: 10
    },
    emptyCard: {
        backgroundColor: colors.bgSurface,
        padding: spacing.xl,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        alignItems: 'center',
        ...shadows.subtle
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 8
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.forestDark,
        marginBottom: 4
    },
    emptyDesc: {
        fontSize: 12,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 14
    },
    bookCta: {
        backgroundColor: colors.forest,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: radius.xs
    },
    bookCtaText: {
        color: colors.ivory,
        fontSize: 12,
        fontWeight: '700'
    },
    bookingCard: {
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: 12,
        ...shadows.subtle
    },
    bookingTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    confirmedPill: {
        backgroundColor: 'rgba(42, 157, 143, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full,
        alignSelf: 'flex-start',
        marginBottom: 4
    },
    confirmedPillText: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.success
    },
    roomName: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.forestDark
    },
    nightsBadge: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.gold,
        backgroundColor: colors.ivoryWarm,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.xs
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderSubtle,
        marginVertical: 10
    },
    datesGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    dateCol: {
        flex: 1
    },
    dateLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.greyLight,
        letterSpacing: 0.8
    },
    dateVal: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMain,
        marginTop: 2
    },
    timeVal: {
        fontSize: 10,
        color: colors.textMuted
    },
    arrowIcon: {
        fontSize: 16,
        color: colors.gold,
        marginHorizontal: 8
    },
    occupantsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.ivoryWarm,
        padding: 8,
        borderRadius: radius.xs,
        marginBottom: 10
    },
    occupantsLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.forest,
        marginRight: 6
    },
    occupantsVal: {
        fontSize: 11,
        color: colors.textMain,
        flex: 1
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8
    },
    chatHostBtn: {
        flex: 1,
        backgroundColor: colors.ivoryWarm,
        paddingVertical: 8,
        borderRadius: radius.xs,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    chatHostBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.forest
    },
    directionsBtn: {
        flex: 1,
        backgroundColor: colors.ivoryWarm,
        paddingVertical: 8,
        borderRadius: radius.xs,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    directionsBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMain
    },
    pastDateRange: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4
    }
});

export default SubscriptionMyBookingsScreen;
