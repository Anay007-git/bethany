import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView
} from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';
import SubscriptionService from '../services/subscriptionService';
import { DEFAULT_ROOMS } from '../services/pricingService';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const SubscriptionCalendarScreen = ({ route, navigation }) => {
    const { membership, application } = route?.params || {};

    const [selectedRoomId, setSelectedRoomId] = useState('carmel');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Selected stay range
    const [checkIn, setCheckIn] = useState(null);
    const [checkOut, setCheckOut] = useState(null);

    // Availability data
    const [loadingAvailability, setLoadingAvailability] = useState(true);
    const [allocatedDates, setAllocatedDates] = useState(new Set());
    const [occupiedDates, setOccupiedDates] = useState(new Set());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    // Format YYYY-MM-DD
    const formatDate = (y, m, d) => {
        const mm = String(m + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return `${y}-${mm}-${dd}`;
    };

    // Load room availability
    const loadAvailability = useCallback(async () => {
        setLoadingAvailability(true);
        try {
            const startStr = formatDate(year, month, 1);
            const lastDay = new Date(year, month + 1, 0).getDate();
            const endStr = formatDate(year, month, lastDay);

            const res = await SubscriptionService.getSubscriptionCalendarAvailability(
                selectedRoomId,
                startStr,
                endStr
            );

            if (res.success) {
                setAllocatedDates(new Set(res.allocatedDates || []));

                // Combine public, OTA, and subscription conflicts
                const combinedOccupied = new Set([
                    ...(res.publicOccupiedDates || []),
                    ...(res.otaBlockedDates || []),
                    ...(res.subscriptionOccupiedDates || [])
                ]);
                setOccupiedDates(combinedOccupied);
            }
        } catch (err) {
            console.error('Error loading calendar availability:', err);
        } finally {
            setLoadingAvailability(false);
        }
    }, [selectedRoomId, year, month]);

    useEffect(() => {
        loadAvailability();
    }, [loadAvailability]);

    // Handle Month Nav
    const handlePrevMonth = () => {
        const prev = new Date(year, month - 1, 1);
        const today = new Date();
        if (prev.getFullYear() < today.getFullYear() || (prev.getFullYear() === today.getFullYear() && prev.getMonth() < today.getMonth())) {
            return; // Don't navigate to past months
        }
        setCurrentDate(prev);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // Calculate nights between two dates
    const calculateNights = (start, end) => {
        if (!start || !end) return 0;
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diff = d2 - d1;
        return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
    };

    // Date tap handler
    const handleDatePress = (dateStr) => {
        // 1. Unallocated dates are strictly unavailable
        if (!allocatedDates.has(dateStr)) {
            Alert.alert(
                'Date Not Allocated',
                'This date is not allocated for member residency bookings. Only dates marked in green are open for subscription members.'
            );
            return;
        }

        // 2. Occupied / blocked dates cannot be selected
        if (occupiedDates.has(dateStr)) {
            Alert.alert(
                'Room Occupied',
                'This date is already occupied by a reservation or synchronized OTA block.'
            );
            return;
        }

        // 3. Selection logic
        if (!checkIn || (checkIn && checkOut)) {
            // First tap: set check-in
            setCheckIn(dateStr);
            setCheckOut(null);
        } else if (checkIn && !checkOut) {
            // Second tap: set check-out
            if (dateStr <= checkIn) {
                // If tapped earlier date or same date, reset to new check-in
                setCheckIn(dateStr);
                setCheckOut(null);
            } else {
                // Verify all dates in between are allocated and free
                const nightsCount = calculateNights(checkIn, dateStr);
                let cur = new Date(checkIn);
                const outDate = new Date(dateStr);
                let hasInvalidDate = false;

                while (cur < outDate) {
                    const str = cur.toISOString().split('T')[0];
                    if (!allocatedDates.has(str) || occupiedDates.has(str)) {
                        hasInvalidDate = true;
                        break;
                    }
                    cur.setDate(cur.getDate() + 1);
                }

                if (hasInvalidDate) {
                    Alert.alert(
                        'Unavailable Date in Range',
                        'One or more dates in your selected range are either not allocated or already occupied. Please select an unbroken sequence of open green dates.'
                    );
                    return;
                }

                // Check remaining nights
                const remaining = membership?.nights_remaining_current_period || 0;
                if (nightsCount > remaining) {
                    Alert.alert(
                        'Night Limit Exceeded',
                        `You selected ${nightsCount} nights, but have ${remaining} nights remaining in your monthly subscription balance.`
                    );
                    return;
                }

                setCheckOut(dateStr);
            }
        }
    };

    // Build Month Calendar Days
    const renderCalendarGrid = () => {
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = new Date().toISOString().split('T')[0];

        const days = [];

        // Empty filler cells for days before first of month
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDate(year, month, day);
            const isPast = dateStr < todayStr;
            const isAllocated = allocatedDates.has(dateStr);
            const isOccupied = occupiedDates.has(dateStr);

            const isStart = checkIn === dateStr;
            const isEnd = checkOut === dateStr;
            const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;

            let cellBg = '#FFFFFF';
            let cellBorderColor = colors.borderSubtle;
            let textColor = colors.textMain;

            if (isPast) {
                textColor = colors.greySubtle;
            } else if (isStart || isEnd) {
                cellBg = colors.forest;
                textColor = colors.ivory;
                cellBorderColor = colors.forest;
            } else if (isInRange) {
                cellBg = 'rgba(35, 72, 59, 0.15)';
                textColor = colors.forestDark;
            } else if (isOccupied) {
                cellBg = '#FEE2E2';
                textColor = '#991B1B';
            } else if (isAllocated) {
                cellBg = '#ECFDF5';
                textColor = '#065F46';
                cellBorderColor = '#A7F3D0';
            } else {
                // Unallocated
                cellBg = '#F3F4F6';
                textColor = '#9CA3AF';
            }

            days.push(
                <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                        styles.calendarCell,
                        { backgroundColor: cellBg, borderColor: cellBorderColor }
                    ]}
                    onPress={() => !isPast && handleDatePress(dateStr)}
                    disabled={isPast}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.cellDayText, { color: textColor }]}>{day}</Text>
                    {isAllocated && !isOccupied && !isPast && !isStart && !isEnd && (
                        <View style={styles.openDot} />
                    )}
                </TouchableOpacity>
            );
        }

        return days;
    };

    const nights = calculateNights(checkIn, checkOut);
    const selectedRoom = DEFAULT_ROOMS.find(r => r.id === selectedRoomId) || DEFAULT_ROOMS[0];

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
                        <Text style={styles.headerSubtitle}>MEMBER INVENTORY</Text>
                        <Text style={styles.headerTitle}>Subscription Calendar</Text>
                    </View>
                </View>

                {/* Room Selector Tabs */}
                <View style={styles.roomTabs}>
                    {DEFAULT_ROOMS.map(room => (
                        <TouchableOpacity
                            key={room.id}
                            style={[
                                styles.roomTab,
                                selectedRoomId === room.id && styles.roomTabActive
                            ]}
                            onPress={() => {
                                setSelectedRoomId(room.id);
                                setCheckIn(null);
                                setCheckOut(null);
                            }}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.roomTabText,
                                    selectedRoomId === room.id && styles.roomTabTextActive
                                ]}
                            >
                                {room.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Calendar Card */}
                <View style={styles.calendarCard}>
                    {/* Month Nav */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity
                            onPress={handlePrevMonth}
                            style={styles.monthNavBtn}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.monthNavText}>◀</Text>
                        </TouchableOpacity>
                        <Text style={styles.monthHeading}>
                            {MONTH_NAMES[month]} {year}
                        </Text>
                        <TouchableOpacity
                            onPress={handleNextMonth}
                            style={styles.monthNavBtn}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.monthNavText}>▶</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Day Headers */}
                    <View style={styles.weekDaysRow}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd, idx) => (
                            <Text key={idx} style={styles.weekDayText}>{wd}</Text>
                        ))}
                    </View>

                    {/* Calendar Days */}
                    {loadingAvailability ? (
                        <View style={{ height: 220, alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator size="small" color={colors.forest} />
                            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
                                Loading dedicated room allocations...
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.calendarGrid}>
                            {renderCalendarGrid()}
                        </View>
                    )}

                    {/* Legend */}
                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]} />
                            <Text style={styles.legendText}>Allocated & Open</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendBox, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]} />
                            <Text style={styles.legendText}>Unallocated</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendBox, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]} />
                            <Text style={styles.legendText}>Reserved / Blocked</Text>
                        </View>
                    </View>
                </View>

                {/* Selection Bar */}
                <View style={styles.selectionBar}>
                    <View style={styles.selectionSummary}>
                        <View style={styles.dateBlock}>
                            <Text style={styles.dateLabel}>CHECK-IN</Text>
                            <Text style={styles.dateValue}>{checkIn || 'Select Date'}</Text>
                        </View>
                        <Text style={styles.dateArrow}>→</Text>
                        <View style={styles.dateBlock}>
                            <Text style={styles.dateLabel}>CHECK-OUT</Text>
                            <Text style={styles.dateValue}>{checkOut || 'Select Date'}</Text>
                        </View>
                        {nights > 0 && (
                            <View style={styles.nightsChip}>
                                <Text style={styles.nightsChipText}>{nights} Night(s)</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.confirmCta,
                            (!checkIn || !checkOut || nights <= 0) && styles.confirmCtaDisabled
                        ]}
                        onPress={() => {
                            if (!checkIn || !checkOut || nights <= 0) {
                                Alert.alert('Select Dates', 'Please tap an open green date for Check-In and a subsequent date for Check-Out.');
                                return;
                            }
                            navigation.navigate('SubscriptionBooking', {
                                membership,
                                application,
                                room: selectedRoom,
                                checkIn,
                                checkOut,
                                nights
                            });
                        }}
                        activeOpacity={0.85}
                        disabled={!checkIn || !checkOut || nights <= 0}
                    >
                        <Text style={styles.confirmCtaText}>
                            Continue to Review & Reserve →
                        </Text>
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
    roomTabs: {
        flexDirection: 'row',
        backgroundColor: colors.bgSurface,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
        gap: 8
    },
    roomTab: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.xs,
        backgroundColor: colors.ivoryWarm
    },
    roomTabActive: {
        backgroundColor: colors.forest
    },
    roomTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted
    },
    roomTabTextActive: {
        color: colors.ivory,
        fontWeight: '700'
    },
    calendarCard: {
        margin: spacing.md,
        backgroundColor: colors.bgSurface,
        borderRadius: radius.sm,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    monthNavBtn: {
        padding: 8
    },
    monthNavText: {
        fontSize: 14,
        color: colors.forest,
        fontWeight: '700'
    },
    monthHeading: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.forestDark
    },
    weekDaysRow: {
        flexDirection: 'row',
        marginBottom: 8
    },
    weekDayText: {
        width: '14.28%',
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '700',
        color: colors.greyLight
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    calendarCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 6,
        marginBottom: 4
    },
    cellDayText: {
        fontSize: 12,
        fontWeight: '700'
    },
    openDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#059669',
        marginTop: 2
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: colors.borderSubtle,
        marginTop: 10,
        paddingTop: 10
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    legendBox: {
        width: 12,
        height: 12,
        borderRadius: 3,
        borderWidth: 1,
        marginRight: 4
    },
    legendText: {
        fontSize: 10,
        color: colors.textMuted
    },
    selectionBar: {
        marginHorizontal: spacing.md,
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle,
        gap: 12
    },
    selectionSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    dateBlock: {
        flex: 1
    },
    dateLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.greyLight,
        letterSpacing: 0.8
    },
    dateValue: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.forestDark,
        marginTop: 2
    },
    dateArrow: {
        fontSize: 16,
        color: colors.gold,
        marginHorizontal: 8
    },
    nightsChip: {
        backgroundColor: colors.forestSubtle,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.full
    },
    nightsChipText: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.forest
    },
    confirmCta: {
        backgroundColor: colors.forest,
        paddingVertical: 14,
        borderRadius: radius.xs,
        alignItems: 'center',
        ...shadows.subtle
    },
    confirmCtaDisabled: {
        backgroundColor: colors.greySubtle
    },
    confirmCtaText: {
        color: colors.ivory,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5
    }
});

export default SubscriptionCalendarScreen;
