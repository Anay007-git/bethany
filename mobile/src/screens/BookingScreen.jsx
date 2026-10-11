import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { colors, radius, shadows } from '../theme';
import { MobileSupabaseService } from '../services/SupabaseService';
import {
    DEFAULT_ROOMS,
    calculateRoomTotal,
    calculateMealTotal,
    calculateDiscount,
    MEAL_PRICES
} from '../services/pricingService';

const BookingScreen = ({ route, navigation }) => {
    const params = route.params || {};

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // State
    const [checkIn, setCheckIn] = useState(params.initialCheckIn || today);
    const [checkOut, setCheckOut] = useState(params.initialCheckOut || tomorrow);
    const [guests, setGuests] = useState(params.initialGuests || '2');

    const [rooms, setRooms] = useState(DEFAULT_ROOMS);
    const [selectedRooms, setSelectedRooms] = useState(
        params.preSelectedRoom ? [params.preSelectedRoom] : [DEFAULT_ROOMS[0]]
    );

    // Meals State
    const [showMeals, setShowMeals] = useState(false);
    const [mealSelection, setMealSelection] = useState({
        breakfast: { veg: 0, nonVeg: 0 },
        lunch: { veg: 0, nonVeg: 0 },
        dinner: { veg: 0, nonVeg: 0 }
    });

    // Guest Info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

    // Submission & Data State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingBookings, setExistingBookings] = useState([]);
    const [blockedDates, setBlockedDates] = useState({});

    // Calculations
    const { nights, roomTotal } = calculateRoomTotal(checkIn, checkOut, selectedRooms, rooms);
    const mealTotal = calculateMealTotal(mealSelection, nights);
    const subtotal = roomTotal + mealTotal;
    const discountAmount = calculateDiscount(subtotal, appliedCoupon);
    const finalTotal = Math.max(0, subtotal - discountAmount);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [dbRooms, dbBookings, dbBlocked] = await Promise.all([
                MobileSupabaseService.getRooms(),
                MobileSupabaseService.getAllBookings(),
                MobileSupabaseService.getBlockedDates()
            ]);

            if (dbRooms && dbRooms.length > 0) {
                setRooms(dbRooms.map(r => ({
                    id: r.id,
                    name: r.name,
                    priceLowSeason: Number(r.price_low_season || 2500),
                    priceHighSeason: Number(r.price_high_season || 3000),
                    capacity: r.capacity || '4 Adults',
                    view: r.view_type || 'Mountain View',
                    size: r.size || '380 sq.ft'
                })));
            }

            if (dbBookings) setExistingBookings(dbBookings);

            if (dbBlocked && dbBlocked.data) {
                const map = {};
                dbBlocked.data.forEach(row => {
                    if (!map[row.room_id]) map[row.room_id] = [];
                    map[row.room_id].push(row.blocked_date);
                });
                setBlockedDates(map);
            }
        } catch (err) {
            console.warn('Mobile booking data fetch warning:', err);
        }
    };

    // Loyalty auto-check on entering 10-digit phone
    useEffect(() => {
        const clean = phone.replace(/\D/g, '');
        if (clean.length >= 10 && !appliedCoupon) {
            MobileSupabaseService.checkReturningCustomer(clean).then(isReturning => {
                if (isReturning) {
                    setAppliedCoupon({
                        code: 'LOYALTY5',
                        discount_type: 'percentage',
                        discount_value: 5
                    });
                    setCouponCode('LOYALTY5');
                    Alert.alert('Loyalty Benefit', 'Welcome back! A 5% returning guest loyalty discount has been applied to your stay.');
                }
            });
        }
    }, [phone]);

    const toggleRoom = (room) => {
        const exists = selectedRooms.some(r => r.id === room.id);
        if (exists) {
            if (selectedRooms.length === 1) {
                Alert.alert('Selection Required', 'Please select at least one room.');
                return;
            }
            setSelectedRooms(selectedRooms.filter(r => r.id !== room.id));
        } else {
            setSelectedRooms([...selectedRooms, room]);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsCheckingCoupon(true);
        const res = await MobileSupabaseService.validateCoupon(couponCode.trim());
        setIsCheckingCoupon(false);

        if (res.success && res.coupon) {
            setAppliedCoupon(res.coupon);
            Alert.alert('Coupon Applied', `Code ${res.coupon.code} applied successfully!`);
        } else {
            Alert.alert('Invalid Coupon', res.error || 'The entered coupon is invalid or has expired.');
        }
    };

    const handleProceedToPayment = () => {
        if (!name.trim() || !phone.trim() || !email.trim()) {
            Alert.alert('Required Fields', 'Please fill in your name, phone number, and email address.');
            return;
        }

        if (selectedRooms.length === 0) {
            Alert.alert('No Rooms Selected', 'Please select at least one room.');
            return;
        }

        if (nights <= 0) {
            Alert.alert('Invalid Dates', 'Check-out date must be after check-in date.');
            return;
        }

        navigation.navigate('PaymentHandoff', {
            bookingPayload: {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                checkIn,
                checkOut,
                guests,
                selectedRooms,
                message: message.trim(),
                nights,
                roomTotal,
                mealTotal,
                discountAmount,
                finalTotal,
                mealSelection
            }
        });
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>←</Text>
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerSubtitle}>DIRECT RESERVATION</Text>
                        <Text style={styles.headerTitle}>Book Your Suite</Text>
                    </View>
                </View>

                {/* Step 1: Dates & Duration */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>1. Reservation Dates</Text>
                    <View style={styles.datesRow}>
                        <View style={styles.dateField}>
                            <Text style={styles.inputLabel}>CHECK-IN</Text>
                            <TextInput
                                style={styles.dateInput}
                                value={checkIn}
                                onChangeText={setCheckIn}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>

                        <View style={styles.nightBadge}>
                            <Text style={styles.nightText}>{nights} {nights === 1 ? 'Night' : 'Nights'}</Text>
                        </View>

                        <View style={styles.dateField}>
                            <Text style={styles.inputLabel}>CHECK-OUT</Text>
                            <TextInput
                                style={styles.dateInput}
                                value={checkOut}
                                onChangeText={setCheckOut}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                    </View>
                </View>

                {/* Step 2: Select Rooms */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>2. Choose Suites</Text>
                    <Text style={styles.cardHint}>Tap rooms to include them in your reservation.</Text>

                    {rooms.map(room => {
                        const isSelected = selectedRooms.some(r => r.id === room.id);
                        return (
                            <TouchableOpacity
                                key={room.id}
                                style={[styles.roomSelectItem, isSelected && styles.roomSelectItemActive]}
                                onPress={() => toggleRoom(room)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.checkbox}>
                                    <Text style={[styles.checkMark, isSelected && styles.checkMarkActive]}>
                                        {isSelected ? '✓' : ''}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.roomSelectName}>{room.name}</Text>
                                    <Text style={styles.roomSelectMeta}>{room.view} · {room.capacity}</Text>
                                </View>
                                <Text style={styles.roomSelectPrice}>₹{room.priceLowSeason}/nt</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Step 3: Guests & Meal Plan */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>3. Guests & Dining</Text>
                        <TouchableOpacity onPress={() => setShowMeals(!showMeals)}>
                            <Text style={styles.toggleText}>{showMeals ? 'Hide Meals ▲' : 'Add Meals ▼'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.guestRow}>
                        <Text style={styles.guestLabel}>Total Guests:</Text>
                        <View style={styles.stepper}>
                            <TouchableOpacity
                                style={styles.stepBtn}
                                onPress={() => setGuests(Math.max(1, parseInt(guests, 10) - 1).toString())}
                            >
                                <Text style={styles.stepBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.stepVal}>{guests}</Text>
                            <TouchableOpacity
                                style={styles.stepBtn}
                                onPress={() => setGuests((parseInt(guests, 10) + 1).toString())}
                            >
                                <Text style={styles.stepBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showMeals && (
                        <View style={styles.mealsBox}>
                            <Text style={styles.mealsNotice}>
                                Organic home-cooked meals by our host family. Plates per day:
                            </Text>

                            <View style={styles.mealRow}>
                                <Text style={styles.mealName}>Breakfast (₹120)</Text>
                                <View style={styles.mealSteppers}>
                                    <Text style={styles.dietLabel}>Veg:</Text>
                                    <TouchableOpacity
                                        style={styles.dietBtn}
                                        onPress={() => setMealSelection(p => ({
                                            ...p,
                                            breakfast: { ...p.breakfast, veg: Math.max(0, p.breakfast.veg - 1) }
                                        }))}
                                    ><Text style={styles.dietBtnText}>−</Text></TouchableOpacity>
                                    <Text style={styles.dietVal}>{mealSelection.breakfast.veg}</Text>
                                    <TouchableOpacity
                                        style={styles.dietBtn}
                                        onPress={() => setMealSelection(p => ({
                                            ...p,
                                            breakfast: { ...p.breakfast, veg: p.breakfast.veg + 1 }
                                        }))}
                                    ><Text style={styles.dietBtnText}>+</Text></TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.mealRow}>
                                <Text style={styles.mealName}>Dinner (₹200)</Text>
                                <View style={styles.mealSteppers}>
                                    <Text style={styles.dietLabel}>Plates:</Text>
                                    <TouchableOpacity
                                        style={styles.dietBtn}
                                        onPress={() => setMealSelection(p => ({
                                            ...p,
                                            dinner: { ...p.dinner, veg: Math.max(0, p.dinner.veg - 1) }
                                        }))}
                                    ><Text style={styles.dietBtnText}>−</Text></TouchableOpacity>
                                    <Text style={styles.dietVal}>{mealSelection.dinner.veg}</Text>
                                    <TouchableOpacity
                                        style={styles.dietBtn}
                                        onPress={() => setMealSelection(p => ({
                                            ...p,
                                            dinner: { ...p.dinner, veg: p.dinner.veg + 1 }
                                        }))}
                                    ><Text style={styles.dietBtnText}>+</Text></TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Step 4: Promo Code */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>4. Promotional Code</Text>
                    <View style={styles.couponRow}>
                        <TextInput
                            style={styles.couponInput}
                            placeholder="e.g. WELCOMEBACK5"
                            value={couponCode}
                            onChangeText={setCouponCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={styles.couponBtn}
                            onPress={handleApplyCoupon}
                            disabled={isCheckingCoupon}
                        >
                            {isCheckingCoupon ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.couponBtnText}>Apply</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {appliedCoupon && (
                        <View style={styles.appliedPill}>
                            <Text style={styles.appliedPillText}>
                                ✓ Code {appliedCoupon.code} Applied ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% Off` : `₹${appliedCoupon.discount_value} Off`})
                            </Text>
                        </View>
                    )}
                </View>

                {/* Step 5: Guest Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>5. Guest Information</Text>

                    <Text style={styles.inputLabel}>FULL NAME *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Subhabrata Bhowmick"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.inputLabel}>WHATSAPP / PHONE NUMBER *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="+91 98765 43210"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />

                    <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="subhabrata@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.inputLabel}>SPECIAL REQUESTS / ARRIVAL TIME</Text>
                    <TextInput
                        style={[styles.input, { height: 70 }]}
                        placeholder="e.g. Need pickup cab from NJP, extra blankets..."
                        multiline
                        value={message}
                        onChangeText={setMessage}
                    />
                </View>

                {/* Bill Breakdown Summary */}
                <View style={[styles.card, styles.billCard]}>
                    <Text style={styles.cardTitle}>Reservation Breakdown</Text>

                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Suites ({selectedRooms.length} rooms × {nights} nights):</Text>
                        <Text style={styles.billValue}>₹{roomTotal.toLocaleString('en-IN')}</Text>
                    </View>

                    {mealTotal > 0 && (
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Homestay Meal Charges:</Text>
                            <Text style={styles.billValue}>₹{mealTotal.toLocaleString('en-IN')}</Text>
                        </View>
                    )}

                    {discountAmount > 0 && (
                        <View style={styles.billRow}>
                            <Text style={[styles.billLabel, { color: colors.terracotta }]}>Promotional Discount:</Text>
                            <Text style={[styles.billValue, { color: colors.terracotta }]}>-₹{discountAmount.toLocaleString('en-IN')}</Text>
                        </View>
                    )}

                    <View style={styles.billDivider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Advance Payable:</Text>
                        <Text style={styles.totalAmount}>₹{finalTotal.toLocaleString('en-IN')}</Text>
                    </View>
                </View>

                {/* Submit Action */}
                <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleProceedToPayment}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitBtnText}>
                        Proceed to Secure Checkout (₹{finalTotal.toLocaleString('en-IN')}) →
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 60 }} />
            </ScrollView>
        </KeyboardAvoidingView>
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
    card: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 4
    },
    cardHint: {
        fontSize: 12,
        color: colors.grey,
        marginBottom: 12
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.terracotta
    },
    datesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8
    },
    dateField: {
        flex: 1
    },
    dateInput: {
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: radius.xs,
        padding: 10,
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMain,
        backgroundColor: colors.ivoryWarm
    },
    nightBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginHorizontal: 8,
        backgroundColor: colors.forestSubtle,
        borderRadius: radius.xs
    },
    nightText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.forest
    },
    roomSelectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.ivoryWarm,
        marginBottom: 8
    },
    roomSelectItemActive: {
        borderColor: colors.forest,
        backgroundColor: '#FFFFFF'
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: colors.forest,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    checkMark: {
        fontSize: 12,
        color: 'transparent'
    },
    checkMarkActive: {
        color: colors.forest,
        fontWeight: 'bold'
    },
    roomSelectName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.forestDark
    },
    roomSelectMeta: {
        fontSize: 11,
        color: colors.grey
    },
    roomSelectPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.forest
    },
    guestRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8
    },
    guestLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMain
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: radius.xs,
        backgroundColor: colors.ivoryWarm
    },
    stepBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6
    },
    stepBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.forest
    },
    stepVal: {
        paddingHorizontal: 8,
        fontSize: 14,
        fontWeight: '700',
        color: colors.textMain
    },
    mealsBox: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.borderSubtle
    },
    mealsNotice: {
        fontSize: 11,
        color: colors.grey,
        marginBottom: 10
    },
    mealRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    mealName: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMain
    },
    mealSteppers: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    dietLabel: {
        fontSize: 11,
        color: colors.grey,
        marginRight: 6
    },
    dietBtn: {
        width: 26,
        height: 26,
        borderRadius: 4,
        backgroundColor: colors.borderMedium,
        alignItems: 'center',
        justifyContent: 'center'
    },
    dietBtnText: {
        fontSize: 14,
        fontWeight: 'bold'
    },
    dietVal: {
        marginHorizontal: 8,
        fontSize: 13,
        fontWeight: '700'
    },
    couponRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6
    },
    couponInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: radius.xs,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        backgroundColor: colors.ivoryWarm,
        fontWeight: '700'
    },
    couponBtn: {
        backgroundColor: colors.forestLight,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderRadius: radius.xs
    },
    couponBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13
    },
    appliedPill: {
        marginTop: 8,
        backgroundColor: 'rgba(42, 157, 143, 0.12)',
        padding: 8,
        borderRadius: radius.xs
    },
    appliedPillText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.success
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: colors.grey,
        marginTop: 10,
        marginBottom: 4
    },
    input: {
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: radius.xs,
        padding: 10,
        fontSize: 13,
        backgroundColor: colors.ivoryWarm
    },
    billCard: {
        backgroundColor: colors.beigeLight
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    billLabel: {
        fontSize: 12,
        color: colors.grey
    },
    billValue: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.forestDark
    },
    billDivider: {
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
    totalAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.forest
    },
    submitBtn: {
        marginHorizontal: 16,
        marginTop: 20,
        backgroundColor: colors.forest,
        paddingVertical: 14,
        borderRadius: radius.sm,
        alignItems: 'center',
        ...shadows.card
    },
    submitBtnText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '700'
    }
});

export default BookingScreen;
