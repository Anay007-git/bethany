import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { colors, radius, shadows } from '../theme';
import { MobileSupabaseService } from '../services/SupabaseService';

const MyBookingsScreen = () => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (!phone || phone.trim().length < 10) {
            Alert.alert('Phone Number Required', 'Please enter a valid 10-digit mobile number.');
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const res = await MobileSupabaseService.getBookingsByPhone(phone.trim());
            if (res.success) {
                setBookings(res.data || []);
            } else {
                Alert.alert('Lookup Error', res.error || 'Failed to search reservations.');
            }
        } catch (err) {
            Alert.alert('Error', 'Network connection issue.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'confirmed' || s === 'booked') {
            return { bg: 'rgba(42, 157, 143, 0.14)', text: colors.success, label: 'Confirmed' };
        }
        if (s === 'cancelled') {
            return { bg: 'rgba(230, 57, 70, 0.14)', text: colors.error, label: 'Cancelled' };
        }
        return { bg: 'rgba(231, 111, 81, 0.14)', text: colors.warning, label: 'Pending Payment' };
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerSubtitle}>RESERVATION LEDGER</Text>
                <Text style={styles.headerTitle}>My Bookings & Bills</Text>
                <Text style={styles.headerDesc}>
                    Look up past stays, active vouchers, and invoice details using your registered phone number.
                </Text>
            </View>

            {/* Phone Search Form */}
            <View style={styles.searchCard}>
                <Text style={styles.inputLabel}>ENTER REGISTERED PHONE NUMBER</Text>
                <View style={styles.searchRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 9876543210"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />
                    <TouchableOpacity
                        style={styles.searchBtn}
                        onPress={handleSearch}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.ivory} size="small" />
                        ) : (
                            <Text style={styles.searchBtnText}>Search</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Results */}
            <View style={styles.resultsContainer}>
                {hasSearched && bookings.length === 0 && !loading && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyIcon}>🔍</Text>
                        <Text style={styles.emptyTitle}>No Reservations Found</Text>
                        <Text style={styles.emptyDesc}>
                            We could not find any active or past bookings associated with +91 {phone}. Please verify the digits or contact the homestay.
                        </Text>
                    </View>
                )}

                {bookings.map(item => {
                    const statusConfig = getStatusStyle(item.status);
                    const roomNames = Array.isArray(item.room_ids)
                        ? item.room_ids.map(r => r.name || r.id).join(', ')
                        : 'Carmel Suite';
                    const guestData = Array.isArray(item.guests) ? item.guests[0] : item.guests;

                    return (
                        <View key={item.id} style={styles.bookingCard}>
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.bookingRef}>Ref: {item.id.slice(0, 8).toUpperCase()}</Text>
                                    <Text style={styles.roomTitle}>{roomNames}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                                    <Text style={[styles.statusText, { color: statusConfig.text }]}>
                                        {statusConfig.label}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.cardDivider} />

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Stay Dates:</Text>
                                <Text style={styles.detailVal}>{item.check_in} → {item.check_out}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Guests:</Text>
                                <Text style={styles.detailVal}>{item.guests_count || 2} Persons</Text>
                            </View>

                            {guestData?.full_name ? (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Guest Name:</Text>
                                    <Text style={styles.detailVal}>{guestData.full_name}</Text>
                                </View>
                            ) : null}

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Total Bill Amount:</Text>
                                <Text style={styles.detailTotal}>₹{Number(item.total_price).toLocaleString('en-IN')}</Text>
                            </View>

                            {/* Invoices Line Items If Present */}
                            {Array.isArray(item.invoices) && item.invoices.length > 0 && item.invoices[0].items ? (
                                <View style={styles.invoiceBreakdown}>
                                    <Text style={styles.invoiceTitle}>
                                        Invoice {item.invoices[0].invoice_number}
                                    </Text>
                                    {item.invoices[0].items.map((line, idx) => (
                                        <View key={idx} style={styles.lineItemRow}>
                                            <Text style={styles.lineDesc}>{line.description}</Text>
                                            <Text style={styles.lineTotal}>₹{line.total}</Text>
                                        </View>
                                    ))}
                                </View>
                            ) : null}
                        </View>
                    );
                })}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPage
    },
    header: {
        paddingTop: 54,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: colors.bgSurface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.terracotta,
        letterSpacing: 1.5,
        marginBottom: 2
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 4
    },
    headerDesc: {
        fontSize: 12,
        color: colors.grey,
        lineHeight: 16
    },
    searchCard: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.grey,
        letterSpacing: 0.5,
        marginBottom: 6
    },
    searchRow: {
        flexDirection: 'row',
        gap: 10
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: radius.xs,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        fontWeight: '600',
        backgroundColor: colors.ivoryWarm
    },
    searchBtn: {
        backgroundColor: colors.forest,
        paddingHorizontal: 20,
        justifyContent: 'center',
        borderRadius: radius.xs
    },
    searchBtnText: {
        color: colors.ivory,
        fontSize: 13,
        fontWeight: '700'
    },
    resultsContainer: {
        padding: 16
    },
    emptyCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginTop: 20
    },
    emptyIcon: {
        fontSize: 32,
        marginBottom: 10
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 6
    },
    emptyDesc: {
        fontSize: 12,
        color: colors.grey,
        textAlign: 'center',
        lineHeight: 17
    },
    bookingCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.card
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    bookingRef: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.grey,
        letterSpacing: 0.5,
        marginBottom: 2
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.forestDark
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700'
    },
    cardDivider: {
        height: 1,
        backgroundColor: colors.borderSubtle,
        marginVertical: 12
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    detailLabel: {
        fontSize: 12,
        color: colors.grey
    },
    detailVal: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMain
    },
    detailTotal: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.forest
    },
    invoiceBreakdown: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.borderSubtle,
        backgroundColor: colors.ivoryWarm,
        padding: 10,
        borderRadius: radius.xs
    },
    invoiceTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 6
    },
    lineItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3
    },
    lineDesc: {
        fontSize: 10,
        color: colors.grey
    },
    lineTotal: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textMain
    }
});

export default MyBookingsScreen;
