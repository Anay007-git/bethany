import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { colors, radius, shadows } from '../theme';

const BookingConfirmationScreen = ({ route, navigation }) => {
    const { booking, bookingPayload } = route.params;

    const handleWhatsAppHost = () => {
        const text = encodeURIComponent(`Hello Mr. Wangchuck, I have booked Bethany Homestay (ID: ${booking.id.slice(0, 8)}). Looking forward to staying from ${booking.check_in} to ${booking.check_out}!`);
        Linking.openURL(`https://wa.me/918348993048?text=${text}`);
    };

    const handleCallHost = () => {
        Linking.openURL('tel:+918348993048');
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.successIconBox}>
                    <Text style={styles.successIcon}>🏔️</Text>
                </View>

                <Text style={styles.title}>Reservation Recorded!</Text>
                <Text style={styles.subtitle}>
                    Welcome to Bethany Homestay. Your reservation request has been successfully registered.
                </Text>

                {/* Booking Reference Card */}
                <View style={styles.refCard}>
                    <Text style={styles.refLabel}>BOOKING REFERENCE ID</Text>
                    <Text style={styles.refId}>{booking.id}</Text>

                    <View style={styles.refDivider} />

                    <View style={styles.refRow}>
                        <Text style={styles.rowLabel}>Check-In:</Text>
                        <Text style={styles.rowValue}>{booking.check_in} (from 12:00 PM)</Text>
                    </View>

                    <View style={styles.refRow}>
                        <Text style={styles.rowLabel}>Check-Out:</Text>
                        <Text style={styles.rowValue}>{booking.check_out} (by 11:00 AM)</Text>
                    </View>

                    <View style={styles.refRow}>
                        <Text style={styles.rowLabel}>Total Amount:</Text>
                        <Text style={styles.rowValueHighlight}>₹{Number(booking.total_price).toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.refRow}>
                        <Text style={styles.rowLabel}>Guest Name:</Text>
                        <Text style={styles.rowValue}>{bookingPayload?.name || 'Guest'}</Text>
                    </View>
                </View>

                {/* Arrival & Directions */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>📍 Homestay Location & Directions</Text>
                    <Text style={styles.infoDesc}>
                        Dr. Graham's Homes, Block B, Kalimpong-I, West Bengal 734301. Near Kalimpong Science Centre.
                    </Text>
                    <TouchableOpacity
                        style={styles.mapBtn}
                        onPress={() => Linking.openURL('https://maps.google.com/?q=Dr.+Graham%27s+Homes,+Kalimpong')}
                    >
                        <Text style={styles.mapBtnText}>Open in Google / Apple Maps ↗</Text>
                    </TouchableOpacity>
                </View>

                {/* Direct Host Connect */}
                <View style={styles.hostConnectCard}>
                    <Text style={styles.hostTitle}>Contact Your Host</Text>
                    <Text style={styles.hostSubtitle}>
                        Mr. Wangchuck & Family are available for check-in coordination, taxi assistance from NJP/Bagdogra, and dining preferences.
                    </Text>

                    <View style={styles.hostActions}>
                        <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppHost}>
                            <Text style={styles.whatsappBtnText}>💬 WhatsApp Host</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.callBtn} onPress={handleCallHost}>
                            <Text style={styles.callBtnText}>📞 Call Host</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Navigation Buttons */}
                <TouchableOpacity
                    style={styles.myBookingsBtn}
                    onPress={() => navigation.navigate('My Bookings')}
                >
                    <Text style={styles.myBookingsBtnText}>View in My Bookings 🧾</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.homeBtn}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.homeBtnText}>Return to Home</Text>
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
    content: {
        padding: 24,
        paddingTop: 60,
        alignItems: 'center'
    },
    successIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(35, 72, 59, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16
    },
    successIcon: {
        fontSize: 38
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 13,
        color: colors.grey,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 24
    },
    refCard: {
        width: '100%',
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: 16,
        ...shadows.card
    },
    refLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        color: colors.grey,
        marginBottom: 4
    },
    refId: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.forest,
        marginBottom: 12
    },
    refDivider: {
        height: 1,
        backgroundColor: colors.borderMedium,
        marginBottom: 12
    },
    refRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    rowLabel: {
        fontSize: 12,
        color: colors.grey
    },
    rowValue: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMain
    },
    rowValueHighlight: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.forest
    },
    infoCard: {
        width: '100%',
        backgroundColor: colors.ivoryWarm,
        borderRadius: radius.md,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: 16
    },
    infoTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 6
    },
    infoDesc: {
        fontSize: 11,
        color: colors.textMuted,
        lineHeight: 16,
        marginBottom: 10
    },
    mapBtn: {
        alignSelf: 'flex-start',
        paddingVertical: 4
    },
    mapBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.terracotta
    },
    hostConnectCard: {
        width: '100%',
        backgroundColor: colors.forestDark,
        borderRadius: radius.md,
        padding: 18,
        marginBottom: 20
    },
    hostTitle: {
        color: colors.ivory,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4
    },
    hostSubtitle: {
        color: colors.beige,
        fontSize: 11,
        lineHeight: 16,
        opacity: 0.9,
        marginBottom: 14
    },
    hostActions: {
        flexDirection: 'row',
        gap: 10
    },
    whatsappBtn: {
        flex: 1,
        backgroundColor: colors.whatsapp,
        paddingVertical: 10,
        borderRadius: radius.xs,
        alignItems: 'center'
    },
    whatsappBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700'
    },
    callBtn: {
        flex: 1,
        backgroundColor: colors.forestLight,
        paddingVertical: 10,
        borderRadius: radius.xs,
        alignItems: 'center'
    },
    callBtnText: {
        color: colors.ivory,
        fontSize: 12,
        fontWeight: '700'
    },
    myBookingsBtn: {
        width: '100%',
        backgroundColor: colors.forest,
        paddingVertical: 13,
        borderRadius: radius.sm,
        alignItems: 'center',
        marginBottom: 10
    },
    myBookingsBtnText: {
        color: colors.ivory,
        fontSize: 13,
        fontWeight: '700'
    },
    homeBtn: {
        width: '100%',
        backgroundColor: colors.bgSurface,
        paddingVertical: 12,
        borderRadius: radius.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderMedium
    },
    homeBtnText: {
        color: colors.forestDark,
        fontSize: 13,
        fontWeight: '600'
    }
});

export default BookingConfirmationScreen;
