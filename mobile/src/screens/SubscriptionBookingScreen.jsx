import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    SafeAreaView
} from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';
import SubscriptionService from '../services/subscriptionService';

const SubscriptionBookingScreen = ({ route, navigation }) => {
    const { membership, application, room, checkIn, checkOut, nights } = route?.params || {};

    const occupants = application?.subscription_occupants || [];
    const [selectedOccupantNames, setSelectedOccupantNames] = useState(
        occupants.map(o => o.full_name) // Default: all verified occupants selected
    );
    const [specialNotes, setSpecialNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [bookingSuccessData, setBookingSuccessData] = useState(null);

    const toggleOccupant = (name) => {
        if (selectedOccupantNames.includes(name)) {
            if (selectedOccupantNames.length === 1) {
                Alert.alert('Required', 'At least one verified occupant must be attending the stay.');
                return;
            }
            setSelectedOccupantNames(selectedOccupantNames.filter(n => n !== name));
        } else {
            setSelectedOccupantNames([...selectedOccupantNames, name]);
        }
    };

    const handleConfirmBooking = async () => {
        setSubmitting(true);

        try {
            const user = await SubscriptionService.getCurrentUserSession();
            if (!user) {
                setSubmitting(false);
                Alert.alert('Session Expired', 'Please sign in again.');
                navigation.replace('SubscriptionAuth');
                return;
            }

            const res = await SubscriptionService.bookStay({
                membershipId: membership.id,
                userId: user.id,
                roomId: room.id,
                checkIn,
                checkOut,
                nights,
                attendingOccupants: selectedOccupantNames,
                specialNotes: specialNotes.trim()
            });

            setSubmitting(false);

            if (!res.success) {
                Alert.alert('Booking Error', res.error || 'Failed to complete reservation.');
                return;
            }

            setBookingSuccessData({
                bookingId: res.bookingId,
                remainingNights: res.remainingNights
            });
        } catch (err) {
            setSubmitting(false);
            Alert.alert('Error', err.message || 'Atomic reservation check encountered an error.');
        }
    };

    // If reservation is confirmed, show Stay Voucher
    if (bookingSuccessData) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.voucherCard}>
                        <View style={styles.voucherTop}>
                            <Text style={styles.voucherSuccessIcon}>🏔️</Text>
                            <Text style={styles.voucherSuccessTag}>CONFIRMED STAY VOUCHER</Text>
                            <Text style={styles.voucherTitle}>{room?.name} Suite</Text>
                            <Text style={styles.voucherBookingId}>
                                Reservation ID: #{bookingSuccessData.bookingId.slice(0, 8).toUpperCase()}
                            </Text>
                        </View>

                        <View style={styles.voucherDottedLine} />

                        <View style={styles.voucherDetails}>
                            <View style={styles.voucherRow}>
                                <Text style={styles.vLabel}>CHECK-IN</Text>
                                <Text style={styles.vVal}>{checkIn} (From 1:00 PM)</Text>
                            </View>
                            <View style={styles.voucherRow}>
                                <Text style={styles.vLabel}>CHECK-OUT</Text>
                                <Text style={styles.vVal}>{checkOut} (Until 11:00 AM)</Text>
                            </View>
                            <View style={styles.voucherRow}>
                                <Text style={styles.vLabel}>DURATION</Text>
                                <Text style={styles.vVal}>{nights} Night(s)</Text>
                            </View>
                            <View style={styles.voucherRow}>
                                <Text style={styles.vLabel}>BALANCE</Text>
                                <Text style={[styles.vVal, { color: colors.forest }]}>
                                    {bookingSuccessData.remainingNights} Monthly Nights Remaining
                                </Text>
                            </View>
                            <View style={styles.voucherRow}>
                                <Text style={styles.vLabel}>ATTENDING</Text>
                                <Text style={styles.vVal}>{selectedOccupantNames.join(', ')}</Text>
                            </View>
                        </View>

                        <View style={styles.voucherDottedLine} />

                        <View style={styles.voucherLocation}>
                            <Text style={styles.vLocTitle}>📍 BETHANY HOMESTAY</Text>
                            <Text style={styles.vLocDesc}>
                                Upper Cart Road, Near Dr. Graham's Homes, Kalimpong, West Bengal 734301
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => navigation.replace('SubscriptionDashboard')}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.doneBtnText}>Return to Member Dashboard →</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
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
                        <Text style={styles.headerSubtitle}>CONFIRM RESERVATION</Text>
                        <Text style={styles.headerTitle}>Review Member Stay</Text>
                    </View>
                </View>

                {/* Stay Summary Card */}
                <View style={styles.card}>
                    <Text style={styles.cardPretitle}>RESERVED SUITE</Text>
                    <Text style={styles.suiteTitle}>{room?.name}</Text>
                    <Text style={styles.suiteMeta}>
                        {room?.viewType || room?.view || 'Mountain View'} • {room?.capacity || '4 Adults'}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryCol}>
                            <Text style={styles.summaryLabel}>CHECK-IN</Text>
                            <Text style={styles.summaryValue}>{checkIn}</Text>
                        </View>
                        <View style={styles.summaryCol}>
                            <Text style={styles.summaryLabel}>CHECK-OUT</Text>
                            <Text style={styles.summaryValue}>{checkOut}</Text>
                        </View>
                        <View style={styles.summaryCol}>
                            <Text style={styles.summaryLabel}>DURATION</Text>
                            <Text style={styles.summaryValue}>{nights} Night(s)</Text>
                        </View>
                    </View>
                </View>

                {/* Attending Occupants Selection */}
                <View style={styles.card}>
                    <Text style={styles.cardPretitle}>ATTENDING OCCUPANTS</Text>
                    <Text style={styles.cardDesc}>
                        Select which verified occupants will be staying during this visit:
                    </Text>

                    <View style={styles.occupantsList}>
                        {occupants.map((occ, idx) => {
                            const isChecked = selectedOccupantNames.includes(occ.full_name);
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.occupantRow, isChecked && styles.occupantRowChecked]}
                                    onPress={() => toggleOccupant(occ.full_name)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.occupantName}>{occ.full_name}</Text>
                                        <Text style={styles.occupantMeta}>
                                            {occ.relationship} • {occ.age} yrs
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Special Requests */}
                <View style={styles.card}>
                    <Text style={styles.cardPretitle}>SPECIAL ARRIVAL NOTES</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="Estimated arrival time, tea preferences, or mountain workation requests..."
                        placeholderTextColor={colors.greyLight}
                        value={specialNotes}
                        onChangeText={setSpecialNotes}
                        multiline
                    />
                </View>

                {/* Night Deduction Notice */}
                <View style={styles.deductionNotice}>
                    <Text style={styles.deductionIcon}>ℹ️</Text>
                    <Text style={styles.deductionText}>
                        This reservation will deduct <Text style={{ fontWeight: '800' }}>{nights} night(s)</Text> from your active monthly allocation upon confirmation.
                    </Text>
                </View>

                {/* Action Button */}
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={handleConfirmBooking}
                        activeOpacity={0.85}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color={colors.ivory} size="small" />
                        ) : (
                            <Text style={styles.confirmBtnText}>Confirm Mountain Stay Voucher →</Text>
                        )}
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
    card: {
        margin: spacing.md,
        marginBottom: 0,
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    cardPretitle: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.8,
        marginBottom: 2
    },
    suiteTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.forestDark
    },
    suiteMeta: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2
    },
    cardDesc: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 10
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderSubtle,
        marginVertical: 12
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    summaryCol: {
        flex: 1
    },
    summaryLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.greyLight,
        letterSpacing: 0.8
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.forestDark,
        marginTop: 2
    },
    occupantsList: {
        gap: 8
    },
    occupantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: radius.xs,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        backgroundColor: colors.ivoryWarm
    },
    occupantRowChecked: {
        borderColor: colors.forest,
        backgroundColor: 'rgba(35, 72, 59, 0.05)'
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: colors.grey,
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkboxActive: {
        backgroundColor: colors.forest,
        borderColor: colors.forest
    },
    checkmark: {
        color: colors.ivory,
        fontSize: 12,
        fontWeight: '800'
    },
    occupantName: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMain
    },
    occupantMeta: {
        fontSize: 11,
        color: colors.textMuted
    },
    notesInput: {
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: radius.xs,
        padding: 10,
        fontSize: 12,
        color: colors.textMain,
        height: 70,
        textAlignVertical: 'top'
    },
    deductionNotice: {
        flexDirection: 'row',
        backgroundColor: '#ECFDF5',
        margin: spacing.md,
        padding: spacing.md,
        borderRadius: radius.xs,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        alignItems: 'center'
    },
    deductionIcon: {
        fontSize: 18,
        marginRight: 8
    },
    deductionText: {
        flex: 1,
        fontSize: 12,
        color: '#065F46',
        lineHeight: 16
    },
    actionSection: {
        paddingHorizontal: spacing.md,
        marginTop: 4
    },
    confirmBtn: {
        backgroundColor: colors.forest,
        paddingVertical: 15,
        borderRadius: radius.sm,
        alignItems: 'center',
        ...shadows.subtle
    },
    confirmBtnText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    // Voucher Styles
    voucherCard: {
        margin: spacing.md,
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: spacing.lg,
        borderWidth: 2,
        borderColor: colors.gold,
        ...shadows.card
    },
    voucherTop: {
        alignItems: 'center',
        marginBottom: 12
    },
    voucherSuccessIcon: {
        fontSize: 48,
        marginBottom: 8
    },
    voucherSuccessTag: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.gold,
        letterSpacing: 1.2
    },
    voucherTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.forestDark,
        marginTop: 2
    },
    voucherBookingId: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.greyLight,
        marginTop: 4
    },
    voucherDottedLine: {
        height: 1,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderStyle: 'dashed',
        marginVertical: 16
    },
    voucherDetails: {
        gap: 10
    },
    voucherRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    },
    vLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.8
    },
    vVal: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMain,
        maxWidth: '60%',
        textAlign: 'right'
    },
    voucherLocation: {
        backgroundColor: colors.ivoryWarm,
        padding: 12,
        borderRadius: radius.xs,
        marginBottom: 16
    },
    vLocTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.forest,
        marginBottom: 2
    },
    vLocDesc: {
        fontSize: 11,
        color: colors.textMuted,
        lineHeight: 15
    },
    doneBtn: {
        backgroundColor: colors.forest,
        paddingVertical: 14,
        borderRadius: radius.sm,
        alignItems: 'center',
        ...shadows.subtle
    },
    doneBtnText: {
        color: colors.ivory,
        fontSize: 13,
        fontWeight: '700'
    }
});

export default SubscriptionBookingScreen;
