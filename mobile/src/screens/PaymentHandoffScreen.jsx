import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { colors, radius, shadows } from '../theme';
import { MobileSupabaseService, supabase } from '../services/SupabaseService';

// Ensure web browser auth session completes cleanly (web only)
if (Platform.OS === 'web') {
    WebBrowser.maybeCompleteAuthSession();
}

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
    const [verifying, setVerifying] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [paymentError, setPaymentError] = useState('');

    // Polling helper to verify PhonePe order status
    const pollPaymentStatus = async (merchantOrderId, maxAttempts = 6, intervalMs = 2500) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const res = await fetch(`https://bethanyhomestay.com/api/payment/status?orderId=${merchantOrderId}`);
                if (res.ok) {
                    const statusData = await res.json();
                    const state = statusData.state || (statusData.data && statusData.data.state);

                    if (state === 'COMPLETED' || state === 'SUCCESS') {
                        return { verified: true, state: 'COMPLETED', raw: statusData };
                    }
                    if (state === 'FAILED') {
                        return { verified: false, state: 'FAILED', raw: statusData };
                    }
                }
            } catch (pollErr) {
                console.warn(`Payment status poll attempt ${attempt} error:`, pollErr);
            }

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            }
        }

        // Final check against Supabase booking record (webhook may have marked it confirmed)
        try {
            const { data: dbBooking } = await supabase
                .from('bookings')
                .select('status')
                .eq('id', merchantOrderId)
                .maybeSingle();

            if (dbBooking && dbBooking.status === 'confirmed') {
                return { verified: true, state: 'COMPLETED' };
            }
        } catch (_) {}

        return { verified: false, state: 'PENDING_OR_TIMEOUT' };
    };

    const handleConfirmAndPay = async () => {
        setLoading(true);
        setPaymentError('');
        setStatusMessage('Creating reservation ledger...');

        try {
            // 1. Prepare invoice breakdown
            const invoiceItems = [];
            bookingPayload.selectedRooms.forEach(r => {
                invoiceItems.push({
                    description: `${r.name} (${bookingPayload.nights} Nights)`,
                    quantity: 1,
                    unit_price: bookingPayload.roomTotal,
                    total: bookingPayload.roomTotal
                });
            });

            if (bookingPayload.mealTotal > 0) {
                invoiceItems.push({
                    description: `Homestay Meals (${bookingPayload.nights} Nights)`,
                    quantity: 1,
                    unit_price: bookingPayload.mealTotal,
                    total: bookingPayload.mealTotal
                });
            }

            if (bookingPayload.discountAmount > 0) {
                invoiceItems.push({
                    description: 'Promotional Discount',
                    quantity: 1,
                    unit_price: -bookingPayload.discountAmount,
                    total: -bookingPayload.discountAmount
                });
            }

            // 2. Create authoritative booking in Supabase with status 'pending'
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
                setStatusMessage('');
                Alert.alert('Booking Error', res.error || 'Failed to record reservation. Please check your dates and network.');
                return;
            }

            const booking = res.booking;
            const bookingId = booking.id;
            const amountInPaise = Math.round(bookingPayload.finalTotal * 100);

            // 3. Initiate PhonePe Order through backend
            setStatusMessage('Opening PhonePe Secure Gateway...');
            const returnUrl = `https://bethanyhomestay.com/payment-status?id=${bookingId}`;

            const initiateRes = await fetch('https://bethanyhomestay.com/api/payment/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merchantOrderId: bookingId,
                    amount: amountInPaise,
                    phone: bookingPayload.phone,
                    redirectUrl: returnUrl,
                    message: `Bethany Homestay: ${bookingPayload.nights} night(s) stay`
                })
            });

            if (!initiateRes.ok) {
                const errData = await initiateRes.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to initialize payment gateway.');
            }

            const initiateData = await initiateRes.json();
            const redirectUrl = initiateData.redirectUrl || initiateData.redirect_url;

            if (!redirectUrl) {
                throw new Error('Payment gateway did not provide a valid checkout URL.');
            }

            // 4. Launch In-App Browser Gateway Sheet
            setLoading(false);
            setVerifying(true);
            setStatusMessage('Awaiting payment authorization...');

            const authResult = await WebBrowser.openAuthSessionAsync(
                redirectUrl,
                'bethanyhomestay://payment-status'
            );

            // 5. User returned to app -> Verify payment status with server
            setStatusMessage('Verifying transaction with PhonePe...');
            const verification = await pollPaymentStatus(bookingId);

            if (verification.verified) {
                // Payment Successful: Update Supabase status to confirmed
                await supabase
                    .from('bookings')
                    .update({ status: 'confirmed' })
                    .eq('id', bookingId);

                // Insert payment record
                try {
                    await supabase
                        .from('payments')
                        .insert([{
                            booking_id: bookingId,
                            amount: bookingPayload.finalTotal,
                            status: 'completed',
                            payment_method: 'phonepe'
                        }]);
                } catch (payErr) {
                    console.warn('Payment record insert error:', payErr);
                }

                // Send email confirmation
                try {
                    await supabase.functions.invoke('send-booking-email', {
                        body: { booking: { ...booking, status: 'confirmed' } }
                    });
                } catch (_) {
                    try {
                        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://bethanyhomestay.com';
                        await fetch(`${apiUrl}/api/booking/send-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ booking: { ...booking, status: 'confirmed' } })
                        });
                    } catch (_) {}
                }

                setVerifying(false);
                setStatusMessage('');

                // Navigate to confirmation voucher
                navigation.replace('BookingConfirmation', {
                    booking: { ...booking, status: 'confirmed' },
                    bookingPayload
                });
            } else {
                // Payment was cancelled or failed
                setVerifying(false);
                setStatusMessage('');

                if (verification.state === 'FAILED') {
                    await supabase
                        .from('bookings')
                        .update({ status: 'cancelled' })
                        .eq('id', bookingId);

                    // Dispatch payment declined notification
                    try {
                        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://bethanyhomestay.com';
                        fetch(`${apiUrl}/api/payment/send-failed-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                booking: { ...booking, status: 'cancelled' },
                                bookingId,
                                reason: 'Payment was declined by your bank or PhonePe.'
                            })
                        }).catch(() => {});
                    } catch (_) {}

                    setPaymentError('Your payment was declined by your bank or PhonePe. Please check your payment details and retry.');
                    Alert.alert('Payment Declined', 'The transaction was declined. Your booking has not been confirmed.');
                } else {
                    setPaymentError('The checkout window was closed before completion. If your account was debited, your booking will be confirmed automatically via webhook.');
                    Alert.alert('Payment Incomplete', 'Payment verification was not completed. You can tap Retry Payment to complete your reservation.');
                }
            }

        } catch (error) {
            setLoading(false);
            setVerifying(false);
            setStatusMessage('');
            setPaymentError(error.message || 'An error occurred during checkout.');
            Alert.alert('Payment Error', error.message || 'Unable to proceed to payment.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} disabled={loading || verifying}>
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

                {/* Configured Payment Methods Display */}
                <View style={styles.paymentMethodsCard}>
                    <Text style={styles.paymentMethodsTitle}>Available Payment Methods</Text>
                    <View style={styles.methodsGrid}>
                        <View style={styles.methodBadge}>
                            <Text style={styles.methodBadgeIcon}>⚡</Text>
                            <Text style={styles.methodBadgeText}>UPI Apps (GPay, PhonePe, Paytm)</Text>
                        </View>
                        <View style={styles.methodBadge}>
                            <Text style={styles.methodBadgeIcon}>💳</Text>
                            <Text style={styles.methodBadgeText}>Debit & Credit Cards (Visa, MC, RuPay)</Text>
                        </View>
                        <View style={styles.methodBadge}>
                            <Text style={styles.methodBadgeIcon}>🏦</Text>
                            <Text style={styles.methodBadgeText}>Net Banking (All Major Indian Banks)</Text>
                        </View>
                    </View>
                </View>

                {/* Error Banner */}
                {paymentError ? (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorText}>{paymentError}</Text>
                    </View>
                ) : null}

                {/* Status Indicator */}
                {(loading || verifying) && (
                    <View style={styles.verifyingBanner}>
                        <ActivityIndicator color={colors.forest} size="small" style={{ marginRight: 10 }} />
                        <Text style={styles.verifyingText}>{statusMessage || 'Processing checkout...'}</Text>
                    </View>
                )}

                {/* Security Note */}
                <View style={styles.securityNote}>
                    <Text style={styles.shieldIcon}>🛡️</Text>
                    <Text style={styles.securityText}>
                        End-to-end 256-bit encrypted checkout via PhonePe. Your booking is confirmed instantly upon successful bank authorization.
                    </Text>
                </View>

                {/* Confirm & Pay Button */}
                <TouchableOpacity
                    style={[styles.confirmBtn, (loading || verifying) && styles.btnDisabled]}
                    onPress={handleConfirmAndPay}
                    disabled={loading || verifying}
                    activeOpacity={0.85}
                >
                    {loading || verifying ? (
                        <ActivityIndicator color={colors.ivory} size="small" />
                    ) : (
                        <Text style={styles.confirmBtnText}>
                            Pay via PhonePe • ₹{bookingPayload.finalTotal.toLocaleString('en-IN')}
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
        paddingTop: Platform.OS === 'ios' ? 56 : 46,
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
    paymentMethodsCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    paymentMethodsTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.forestDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10
    },
    methodsGrid: {
        gap: 8
    },
    methodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.ivoryWarm,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: radius.xs
    },
    methodBadgeIcon: {
        fontSize: 14
    },
    methodBadgeText: {
        fontSize: 12,
        color: colors.textMain,
        fontWeight: '500'
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FDF2F2',
        borderColor: '#F87171',
        borderWidth: 1,
        padding: 12,
        borderRadius: radius.sm,
        marginBottom: 14
    },
    errorIcon: {
        fontSize: 16
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        color: '#B91C1C',
        lineHeight: 16
    },
    verifyingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.forestSubtle,
        padding: 14,
        borderRadius: radius.sm,
        marginBottom: 14
    },
    verifyingText: {
        fontSize: 13,
        fontWeight: '600',
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
        paddingVertical: 15,
        borderRadius: radius.sm,
        alignItems: 'center',
        ...shadows.card
    },
    btnDisabled: {
        opacity: 0.7
    },
    confirmBtnText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '700'
    }
});

export default PaymentHandoffScreen;
