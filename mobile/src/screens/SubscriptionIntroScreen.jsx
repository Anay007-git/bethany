import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    SafeAreaView
} from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';

const SubscriptionIntroScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header with back */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleGroup}>
                        <Text style={styles.headerSubtitle}>EXCLUSIVE RESIDENCY</Text>
                        <Text style={styles.headerTitle}>Himalayan Sanctuary</Text>
                    </View>
                </View>

                {/* Hero Banner */}
                <View style={styles.heroCard}>
                    <Image
                        source={{ uri: 'https://r1imghtlak.mmtcdn.com/bc566280898d11ec90380a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500' }}
                        style={styles.heroImage}
                    />
                    <View style={styles.heroOverlay}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>⭐ PRIVILEGE CLUB</Text>
                        </View>
                        <Text style={styles.heroHeading}>Monthly Room Subscription</Text>
                        <Text style={styles.heroSubheading}>
                            Guaranteed boutique Himalayan stays every month for couples and families at Kalimpong.
                        </Text>
                    </View>
                </View>

                {/* Core Benefits */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Why Choose Monthly Residency?</Text>
                    <Text style={styles.sectionDesc}>
                        Transform Bethany Homestay into your private mountain sanctuary with guaranteed seasonal allocations and transparent monthly billing.
                    </Text>

                    <View style={styles.featureGrid}>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>🏔️</Text>
                            <View style={styles.featureTextGroup}>
                                <Text style={styles.featureTitle}>5–6 Nights Every Month</Text>
                                <Text style={styles.featureDesc}>
                                    Spread your stays or enjoy an extended mountain workation with panoramic Kanchenjunga views.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>👨‍👩‍👧‍👦</Text>
                            <View style={styles.featureTextGroup}>
                                <Text style={styles.featureTitle}>Couples & Families (Up to 4)</Text>
                                <Text style={styles.featureDesc}>
                                    Designed specifically for intimate couples or families of up to four verified occupants.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>🔄</Text>
                            <View style={styles.featureTextGroup}>
                                <Text style={styles.featureTitle}>3-Month Minimum Commitment</Text>
                                <Text style={styles.featureDesc}>
                                    Predictable AutoPay recurring billing with zero seasonal surge pricing or peak-holiday markup.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>📅</Text>
                            <View style={styles.featureTextGroup}>
                                <Text style={styles.featureTitle}>Dedicated Member Inventory</Text>
                                <Text style={styles.featureDesc}>
                                    Select exclusively allocated dates directly in your private in-app subscription calendar.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* How it Works Stepper */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Four Simple Steps</Text>
                    <View style={styles.stepsCard}>
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Register & Apply</Text>
                                <Text style={styles.stepDesc}>Submit your profile and details for up to 4 occupants.</Text>
                            </View>
                        </View>
                        <View style={styles.stepDivider} />
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Host Team Verification</Text>
                                <Text style={styles.stepDesc}>Our family reviews your application within 24 hours.</Text>
                            </View>
                        </View>
                        <View style={styles.stepDivider} />
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Authorize AutoPay Mandate</Text>
                                <Text style={styles.stepDesc}>Select your preferred tier and setup monthly AutoPay via UPI or Card.</Text>
                            </View>
                        </View>
                        <View style={styles.stepDivider} />
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Reserve Allocated Dates</Text>
                                <Text style={styles.stepDesc}>Select your dates on the member calendar and pack your bags!</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('SubscriptionAuth')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>Apply for Membership →</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('SubscriptionAuth', { isLogin: true })}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.secondaryButtonText}>Already an Applicant? Sign In</Text>
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
    heroCard: {
        margin: spacing.md,
        borderRadius: radius.md,
        overflow: 'hidden',
        height: 230,
        backgroundColor: colors.forestDark,
        ...shadows.card
    },
    heroImage: {
        width: '100%',
        height: '100%',
        position: 'absolute'
    },
    heroOverlay: {
        flex: 1,
        backgroundColor: 'rgba(22, 46, 37, 0.72)',
        padding: spacing.lg,
        justifyContent: 'flex-end'
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.gold,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full,
        marginBottom: 8
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.forestDark,
        letterSpacing: 0.8
    },
    heroHeading: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.ivory,
        marginBottom: 6
    },
    heroSubheading: {
        fontSize: 13,
        color: colors.beige,
        lineHeight: 18
    },
    section: {
        paddingHorizontal: spacing.md,
        marginTop: spacing.md
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: 4
    },
    sectionDesc: {
        fontSize: 13,
        color: colors.textMuted,
        lineHeight: 19,
        marginBottom: spacing.md
    },
    featureGrid: {
        gap: 12
    },
    featureItem: {
        flexDirection: 'row',
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        alignItems: 'center'
    },
    featureIcon: {
        fontSize: 26,
        marginRight: spacing.md
    },
    featureTextGroup: {
        flex: 1
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 2
    },
    featureDesc: {
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 16
    },
    stepsCard: {
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.forest,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md
    },
    stepNumberText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '700'
    },
    stepContent: {
        flex: 1
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textMain
    },
    stepDesc: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2
    },
    stepDivider: {
        height: 16,
        width: 2,
        backgroundColor: colors.borderSubtle,
        marginLeft: 15,
        marginVertical: 4
    },
    actionSection: {
        paddingHorizontal: spacing.md,
        marginTop: spacing.lg,
        gap: 12
    },
    primaryButton: {
        backgroundColor: colors.forest,
        paddingVertical: 15,
        borderRadius: radius.sm,
        alignItems: 'center',
        ...shadows.subtle
    },
    primaryButtonText: {
        color: colors.ivory,
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    secondaryButton: {
        backgroundColor: colors.bgSurface,
        paddingVertical: 14,
        borderRadius: radius.sm,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.forest
    },
    secondaryButtonText: {
        color: colors.forest,
        fontSize: 14,
        fontWeight: '700'
    }
});

export default SubscriptionIntroScreen;
