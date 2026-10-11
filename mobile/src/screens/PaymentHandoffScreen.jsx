import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking
} from 'react-native';
import { colors, radius, shadows } from '../theme';
import { MobileSupabaseService } from '../services/SupabaseService';

const PaymentHandoffScreen = ({ route, navigation }) => {
    const bookingPayload = route?.params?.bookingPayload || {
        name: 'Guest',
        phone: '',
        email: '',
        nights: 1,
        selectedRooms: [],
        roomTotal: 0,
        mealTotal: 0,
        discountAmount: 0,
        finalTotal: 0
    };
    const [loading, setLoading] = useState(false);

    const handleConfirmBooking = async () => {
        setLoading(true);

        try {
            // 1. Create Dual-Write Booking in Supabase authoritative database
            const invoiceItems = [];

            // Line items for selected rooms
            bookingPayload.selectedRooms.forEach(r => {
                invoiceItems.push({
                    description: `${r.name} (${bookingPayload.nights} Nights)`,
                    quantity: 1,
                    unit_price: bookingPayload.roomTotal,
                    total: bookingPayload.roomTotal
                });
            });

            // Line items for meals
            if (bookingPayload.mealTotal > 0) {
                invoiceItems.push({
                    description: `Homestay Meals (${bookingPayload.nights} Nights)`,
                    quantity: 1,
                    unit_price: bookingPayload.mealTotal,
                    total: bookingPayload.mealTotal
                });
            }

            // Line items for discount
            if (bookingPayload.discountAmount > 0) {
                invoiceItems.push({
                    description: 'Promotional Discount',
                    quantity: 1,
                    unit_price: -bookingPayload.discountAmount,
                    total: -bookingPayload.discountAmount
                });
            }

            const res = await MobileSupabaseService.createBooking({
                name: bookingPayload.name,
                email: bookingPayload.email,
                phone: bookingPayload.phone,
                selectedRooms: bookingPayload.selectedRooms,
                checkIn: bookingPayload.checkIn,
                checkOut: bookingPayload.checkOut,
                guests: bookingPayload.guests,
                totalPrice: bookingPayload.finalTotal,
                meals: bookingPayload.mealTotal > 0 ? 'Selected Meal Plan' : 'None',
                message: bookingPayload.message,
                invoiceItems
            });

            if (!res.success) {
                setLoading(false);
                Alert.alert('Booking Error', res.error || 'Failed to record reservation. Please check your network.');
                return;
            }

            const bookingId = res.booking.id;

            // 2. Launch PhonePe Gateway or Confirmation
            const amountInPaise = Math.round(bookingPayload.finalTotal * 100);

            try {
                // If payment endpoint is accessible on deployed web
                const initiateRes = await fetch('https://bethanyhomestay.com/api/payment/initiate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        merchantOrderId: bookingId,
                        amount: amountInPaise,
                        phone: bookingPayload.phone,
                        redirectUrl: `https://bethanyhomestay.com/payment-status?id=${bookingId}`,
                        message: `Stay at Bethany Homestay for ${bookingPayload.nights} nights.`
                    })
                });

                if (initiateRes.ok) {
                    const data = await initiateRes.json();
                    const redirectUrl = data.redirectUrl || data.redirect_url;
                    if (redirectUrl) {
                        Linking.openURL(redirectUrl);
                    }
                }
            } catch (err) {
                console.log('Mobile web payment handoff notice (offline fallback):', err);
            }

            setLoading(false);
            navigation.replace('BookingConfirmation', {
                booking: res.booking,
                bookingPayload
            });

        } catch (error) {
            setLoading(false);
            Alert.alert('Reservation Failed', error.message || 'An error occurred during booking.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerSubtitle}>CHECKOUT VERIFICATION</Text>
                    <Text style={styles.headerTitle}>Review & Confirm</Text>
                </View>
            </View>

            <View style={styles.body}>
                {/* Stay Card */}
                <View style={styles.card}>
                    <Text style={styles.cardSectionTitle}>Reservation Summary</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Dates:</Text>
                        <Text style={styles.val}>{bookingPayload.checkIn} → {bookingPayload.checkOut} ({bookingPayload.nights} Nights)</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Suites:</Text>
                        <Text style={styles.val}>{bookingPayload.selectedRooms.map(r => r.name).join(', ')}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Guests:</Text>
                        <Text style={styles.val}>{bookingPayload.guests} Guests</Text>
                    </View>

                    {bookingPayload.message ? (
                        <View style={styles.row}>
                            <Text style={styles.label}>Requests:</Text>
                            <Text style={styles.val}>{bookingPayload.message}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Guest Details */}
                <View style={styles.card}>
                    <Text style={styles.cardSectionTitle}>Guest Details</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Primary Guest:</Text>
                        <Text style={styles.val}>{bookingPayload.name}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Phone:</Text>
                        <Text style={styles.val}>{bookingPayload.phone}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.val}>{bookingPayload.email}</Text>
                    </View>
                </View>

                {/* Price Breakdown */}
                <View style={[styles.card, styles.billCard]}>
                    <Text style={styles.cardSectionTitle}>Total Bill</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Accommodation:</Text>
                        <Text style={styles.val}>₹{bookingPayload.roomTotal.toLocaleString('en-IN')}</Text>
                    </View>

                    {bookingPayload.mealTotal > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Homestay Meals:</Text>
                            <Text style={styles.val}>₹{bookingPayload.mealTotal.toLocaleString('en-IN')}</Text>
                        </View>
                    )}

                    {bookingPayload.discountAmount > 0 && (
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.terracotta }]}>Discount:</Text>
                            <Text style={[styles.val, { color: colors.terracotta }]}>-₹{bookingPayload.discountAmount.toLocaleString('en-IN')}</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Advance Payable:</Text>
                        <Text style={styles.totalVal}>₹{bookingPayload.finalTotal.toLocaleString('en-IN')}</Text>
                    </View>
                </View>

                {/* Security Note */}
                <View style={styles.securityNote}>
                    <Text style={styles.shieldIcon}>🛡️</Text>
                    <Text style={styles.securityText}>
                        Your reservation will be created immediately in the authoritative Supabase ledger. Payment is securely handled via PhonePe gateway.
                    </Text>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirmBooking}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.ivory} size="small" />
                    ) : (
                        <Text style={styles.confirmBtnText}>
                            Confirm & Pay via PhonePe (₹{bookingPayload.finalTotal.toLocaleString('en-IN')})
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPage
    },
    header: {
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: colors.bgSurface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.forestSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    backBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.forest
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.terracotta,
        letterSpacing: 1.5
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.forestDark
    },
    body: {
        padding: 16
    },
    card: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    billCard: {
        backgroundColor: colors.beigeLight
    },
    cardSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 12
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    label: {
        fontSize: 12,
        color: colors.grey
    },
    val: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMain,
        maxWidth: '65%',
        textAlign: 'right'
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderMedium,
        marginVertical: 10
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.forestDark
    },
    totalVal: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.forest
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.ivoryWarm,
        padding: 14,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: 20
    },
    shieldIcon: {
        fontSize: 20
    },
    securityText: {
        flex: 1,
        fontSize: 11,
        color: colors.grey,
        lineHeight: 15
    },
    confirmBtn: {
        backgroundColor: colors.forest,
        paddingVertical: 14,
        borderRadius: radius.sm,
        alignItems: 'center',
        ...shadows.card
    },
    confirmBtnText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '700'
    }
});

export default PaymentHandoffScreen;
