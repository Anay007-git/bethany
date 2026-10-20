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

const SubscriptionStatusScreen = ({ route, navigation }) => {
    const passedApp = route?.params?.application || null;
    const [application, setApplication] = useState(passedApp);
    const [loading, setLoading] = useState(!passedApp);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const user = await SubscriptionService.getCurrentUserSession();
            if (!user) {
                navigation.replace('SubscriptionAuth');
                return;
            }

            const res = await SubscriptionService.getUserApplication(user.id);
            if (res.success && res.application) {
                setApplication(res.application);
            }
        } catch (err) {
            console.log('Error refreshing status:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigation]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStatus();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.forest} />
                    <Text style={styles.loadingText}>Checking application status...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const status = application?.status || 'pending_approval';

    // Status styling configuration
    const getStatusConfig = () => {
        switch (status) {
            case 'approved':
                return {
                    icon: '🎉',
                    badgeText: 'APPROVED & VERIFIED',
                    badgeBg: '#D1FAE5',
                    badgeColor: '#065F46',
                    title: 'Congratulations! Membership Approved',
                    description: 'Your family profile has been verified and approved by the Bethany Homestay host team. You are now eligible to activate your monthly subscription and authorize AutoPay.',
                    showPlanCta: true
                };
            case 'additional_info_required':
                return {
                    icon: '⚠️',
                    badgeText: 'CORRECTIONS REQUESTED',
                    badgeBg: '#FEF3C7',
                    badgeColor: '#92400E',
                    title: 'Additional Information Required',
                    description: 'Our host team reviewed your application and requested some additional clarifications before approval.',
                    showEditCta: true
                };
            case 'rejected':
                return {
                    icon: '🛑',
                    badgeText: 'APPLICATION NOT APPROVED',
                    badgeBg: '#FEE2E2',
                    badgeColor: '#991B1B',
                    title: 'Application Unsuccessful',
                    description: 'Thank you for your interest. Unfortunately, we are unable to approve your monthly subscription application at this time based on current sanctuary capacity.',
                    showContactCta: true
                };
            case 'draft':
                return {
                    icon: '📝',
                    badgeText: 'DRAFT IN PROGRESS',
                    badgeBg: colors.ivoryWarm,
                    badgeColor: colors.forest,
                    title: 'Application Saved as Draft',
                    description: 'Your application has not yet been submitted for review. Please complete and submit it to initiate verification.',
                    showEditCta: true
                };
            default:
                return {
                    icon: '⏳',
                    badgeText: 'PENDING HOST REVIEW',
                    badgeBg: '#E0F2FE',
                    badgeColor: '#075985',
                    title: 'Application Under Review',
                    description: 'Our host family is reviewing your applicant details and occupant documentation. Verification typically completes within 24 hours.',
                    isPending: true
                };
        }
    };

    const config = getStatusConfig();

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
                        <Text style={styles.backButtonText}>✕</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleGroup}>
                        <Text style={styles.headerSubtitle}>APPLICATION TRACKER</Text>
                        <Text style={styles.headerTitle}>Membership Status</Text>
                    </View>
                </View>

                {/* Status Hero Card */}
                <View style={styles.statusCard}>
                    <Text style={styles.statusIcon}>{config.icon}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: config.badgeBg }]}>
                        <Text style={[styles.statusBadgeText, { color: config.badgeColor }]}>
                            {config.badgeText}
                        </Text>
                    </View>
                    <Text style={styles.statusTitle}>{config.title}</Text>
                    <Text style={styles.statusDesc}>{config.description}</Text>

                    {/* Admin notes box if present */}
                    {application?.admin_notes ? (
                        <View style={styles.adminNoteBox}>
                            <Text style={styles.adminNoteLabel}>Note from Host Staff:</Text>
                            <Text style={styles.adminNoteText}>"{application.admin_notes}"</Text>
                            {application.reviewed_by && (
                                <Text style={styles.adminNoteAuthor}>— Reviewed by {application.reviewed_by}</Text>
                            )}
                        </View>
                    ) : null}
                </View>

                {/* Application Snapshot */}
                <View style={styles.detailsCard}>
                    <Text style={styles.cardHeader}>APPLICATION SUMMARY</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Category:</Text>
                        <Text style={styles.detailValue}>
                            {application?.category === 'couple' ? 'Couple Retreat' : 'Family Sanctuary'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Primary Applicant:</Text>
                        <Text style={styles.detailValue}>{application?.primary_name || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Email:</Text>
                        <Text style={styles.detailValue}>{application?.primary_email || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Contact Phone:</Text>
                        <Text style={styles.detailValue}>{application?.primary_phone || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Occupants:</Text>
                        <Text style={styles.detailValue}>
                            {application?.subscription_occupants?.length || 1} Occupants
                        </Text>
                    </View>

                    {/* Occupant names list */}
                    {application?.subscription_occupants && application.subscription_occupants.length > 0 && (
                        <View style={styles.occupantsSubList}>
                            <Text style={styles.occupantsSubTitle}>Registered Occupants:</Text>
                            {application.subscription_occupants.map((occ, idx) => (
                                <Text key={idx} style={styles.occupantItem}>
                                    • {occ.full_name} ({occ.relationship}, {occ.age} yrs)
                                </Text>
                            ))}
                        </View>
                    )}
                </View>

                {/* Primary Actions Based on Status */}
                <View style={styles.actionsContainer}>
                    {config.showPlanCta && (
                        <TouchableOpacity
                            style={styles.ctaPrimary}
                            onPress={() => navigation.navigate('SubscriptionPlanSelection', { application })}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.ctaPrimaryText}>Choose Plan & Setup AutoPay →</Text>
                        </TouchableOpacity>
                    )}

                    {config.showEditCta && (
                        <TouchableOpacity
                            style={styles.ctaPrimary}
                            onPress={() => navigation.navigate('SubscriptionApplication', { application })}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.ctaPrimaryText}>Edit & Resubmit Application →</Text>
                        </TouchableOpacity>
                    )}

                    {config.showContactCta && (
                        <TouchableOpacity
                            style={styles.ctaSecondary}
                            onPress={() => Linking.openURL('https://wa.me/918348993048?text=Hello%20Bethany%20Homestay,%20inquiring%20about%20my%20subscription%20application.')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.ctaSecondaryText}>💬 Speak with Homestay Concierge</Text>
                        </TouchableOpacity>
                    )}

                    {config.isPending && (
                        <View style={styles.pendingNotice}>
                            <Text style={styles.pendingNoticeText}>
                                🔄 Pull down to refresh your application status at any time.
                            </Text>
                        </View>
                    )}
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
        fontSize: 18,
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
    statusCard: {
        margin: spacing.md,
        backgroundColor: colors.bgSurface,
        padding: spacing.lg,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        alignItems: 'center',
        ...shadows.subtle
    },
    statusIcon: {
        fontSize: 48,
        marginBottom: 10
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: radius.full,
        marginBottom: 12
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.forestDark,
        textAlign: 'center',
        marginBottom: 8
    },
    statusDesc: {
        fontSize: 13,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 19
    },
    adminNoteBox: {
        backgroundColor: colors.ivoryWarm,
        borderLeftWidth: 3,
        borderLeftColor: colors.gold,
        padding: 12,
        borderRadius: radius.xs,
        marginTop: spacing.md,
        width: '100%'
    },
    adminNoteLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 4
    },
    adminNoteText: {
        fontSize: 12,
        color: colors.textMain,
        fontStyle: 'italic',
        lineHeight: 17
    },
    adminNoteAuthor: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 4,
        textAlign: 'right'
    },
    detailsCard: {
        marginHorizontal: spacing.md,
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    cardHeader: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 1,
        marginBottom: 12
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(98, 92, 80, 0.08)'
    },
    detailLabel: {
        fontSize: 12,
        color: colors.textMuted
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMain
    },
    occupantsSubList: {
        marginTop: 10,
        paddingTop: 8
    },
    occupantsSubTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.forest,
        marginBottom: 4
    },
    occupantItem: {
        fontSize: 11,
        color: colors.textMuted,
        marginVertical: 2
    },
    actionsContainer: {
        padding: spacing.md,
        gap: 12
    },
    ctaPrimary: {
        backgroundColor: colors.forest,
        paddingVertical: 15,
        borderRadius: radius.sm,
        alignItems: 'center',
        ...shadows.subtle
    },
    ctaPrimaryText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    ctaSecondary: {
        backgroundColor: colors.bgSurface,
        paddingVertical: 13,
        borderRadius: radius.sm,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.forest
    },
    ctaSecondaryText: {
        color: colors.forest,
        fontSize: 13,
        fontWeight: '700'
    },
    pendingNotice: {
        alignItems: 'center',
        paddingVertical: 8
    },
    pendingNoticeText: {
        fontSize: 12,
        color: colors.textMuted
    }
});

export default SubscriptionStatusScreen;
