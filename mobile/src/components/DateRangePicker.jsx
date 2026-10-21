import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    SafeAreaView
} from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Format YYYY-MM-DD string
 */
export const formatDateStr = (year, month, day) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
};

/**
 * Format human-readable date: "24 Oct 2026"
 */
export const formatHumanDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            return `${d} ${MONTH_NAMES[m]?.slice(0, 3)} ${y}`;
        }
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : `${d.getDate()} ${MONTH_NAMES[d.getMonth()]?.slice(0, 3)} ${d.getFullYear()}`;
    } catch (_) {
        return dateStr;
    }
};

/**
 * Calculate nights between YYYY-MM-DD strings
 */
export const calculateDateNights = (startStr, endStr) => {
    if (!startStr || !endStr) return 0;
    try {
        const d1 = new Date(startStr);
        const d2 = new Date(endStr);
        const diff = d2 - d1;
        return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
    } catch (_) {
        return 0;
    }
};

/**
 * DateRangePicker Component
 * An interactive, visual calendar for selecting check-in and check-out dates.
 * Can be rendered inline or as a modal dialog.
 */
export const DateRangePicker = ({
    checkIn,
    checkOut,
    onSelectRange,
    occupiedDates = [],
    minDate = null,
    title = 'Select Reservation Dates'
}) => {
    const [viewDate, setViewDate] = useState(() => {
        if (checkIn) {
            const p = checkIn.split('-');
            if (p.length === 3) return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, 1);
        }
        return new Date();
    });

    // Local in-progress selection
    const [tempCheckIn, setTempCheckIn] = useState(checkIn || null);
    const [tempCheckOut, setTempCheckOut] = useState(checkOut || null);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth(); // 0-indexed

    const todayStr = useMemo(() => {
        const t = new Date();
        return formatDateStr(t.getFullYear(), t.getMonth(), t.getDate());
    }, []);

    const minimumDateStr = minDate || todayStr;

    const occupiedSet = useMemo(() => {
        if (occupiedDates instanceof Set) return occupiedDates;
        if (Array.isArray(occupiedDates)) return new Set(occupiedDates);
        return new Set();
    }, [occupiedDates]);

    // Handle Month Nav
    const handlePrevMonth = () => {
        const prev = new Date(year, month - 1, 1);
        const minD = new Date(minimumDateStr);
        if (prev.getFullYear() < minD.getFullYear() || 
            (prev.getFullYear() === minD.getFullYear() && prev.getMonth() < minD.getMonth())) {
            return; // Don't go before min date
        }
        setViewDate(prev);
    };

    const handleNextMonth = () => {
        setViewDate(new Date(year, month + 1, 1));
    };

    // Date Cell Press Logic
    const handleDayPress = (dateStr) => {
        if (dateStr < minimumDateStr) return;
        if (occupiedSet.has(dateStr)) return;

        if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
            // First tap: set check-in
            setTempCheckIn(dateStr);
            setTempCheckOut(null);
            if (onSelectRange) onSelectRange(dateStr, null, 0);
        } else if (tempCheckIn && !tempCheckOut) {
            // Second tap: set check-out
            if (dateStr <= tempCheckIn) {
                // Tapped same or earlier date -> reset check-in to this date
                setTempCheckIn(dateStr);
                setTempCheckOut(null);
                if (onSelectRange) onSelectRange(dateStr, null, 0);
            } else {
                // Check if any date in the range is occupied
                let cur = new Date(tempCheckIn);
                const outDate = new Date(dateStr);
                let hasConflict = false;

                while (cur < outDate) {
                    const dStr = cur.toISOString().split('T')[0];
                    if (occupiedSet.has(dStr)) {
                        hasConflict = true;
                        break;
                    }
                    cur.setDate(cur.getDate() + 1);
                }

                if (hasConflict) {
                    alert('Selected range includes dates that are already reserved or blocked.');
                    return;
                }

                setTempCheckOut(dateStr);
                const nightsCount = calculateDateNights(tempCheckIn, dateStr);
                if (onSelectRange) onSelectRange(tempCheckIn, dateStr, nightsCount);
            }
        }
    };

    const handleClear = () => {
        setTempCheckIn(null);
        setTempCheckOut(null);
        if (onSelectRange) onSelectRange(null, null, 0);
    };

    // Calculate nights
    const currentNights = calculateDateNights(tempCheckIn, tempCheckOut);

    // Build Calendar Grid
    const renderCalendarGrid = () => {
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const cells = [];

        // Filler for days before 1st of month
        for (let i = 0; i < firstDayOfWeek; i++) {
            cells.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
        }

        // Month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDateStr(year, month, day);
            const isPast = dateStr < minimumDateStr;
            const isOccupied = occupiedSet.has(dateStr);

            const isStart = tempCheckIn === dateStr;
            const isEnd = tempCheckOut === dateStr;
            const isInRange = tempCheckIn && tempCheckOut && dateStr > tempCheckIn && dateStr < tempCheckOut;

            let cellBg = '#FFFFFF';
            let cellBorderColor = '#E5E7EB';
            let textColor = '#1F2937';

            if (isPast) {
                cellBg = '#F9FAFB';
                textColor = '#9CA3AF';
                cellBorderColor = '#F3F4F6';
            } else if (isStart || isEnd) {
                cellBg = colors.forest;
                textColor = '#FFFFFF';
                cellBorderColor = colors.forest;
            } else if (isInRange) {
                cellBg = 'rgba(22, 46, 37, 0.12)';
                textColor = colors.forest;
                cellBorderColor = 'rgba(22, 46, 37, 0.25)';
            } else if (isOccupied) {
                cellBg = '#FEE2E2';
                textColor = '#991B1B';
                cellBorderColor = '#FCA5A5';
            }

            cells.push(
                <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                        styles.calendarCell,
                        { backgroundColor: cellBg, borderColor: cellBorderColor },
                        (isStart || isEnd) && styles.selectedCell
                    ]}
                    onPress={() => handleDayPress(dateStr)}
                    disabled={isPast || isOccupied}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        styles.cellDayText,
                        { color: textColor },
                        (isStart || isEnd) && styles.selectedDayText
                    ]}>
                        {day}
                    </Text>
                    {isOccupied && !isPast && (
                        <Text style={styles.occBadge}>OCC</Text>
                    )}
                    {(isStart || isEnd) && (
                        <Text style={styles.startEndBadge}>{isStart ? 'IN' : 'OUT'}</Text>
                    )}
                </TouchableOpacity>
            );
        }

        return cells;
    };

    return (
        <View style={styles.container}>
            {/* Range Summary Header */}
            <View style={styles.summaryRow}>
                <View style={styles.summaryBlock}>
                    <Text style={styles.summaryLabel}>CHECK-IN</Text>
                    <Text style={[styles.summaryVal, tempCheckIn && styles.summaryValActive]}>
                        {tempCheckIn ? formatHumanDate(tempCheckIn) : 'Tap date'}
                    </Text>
                </View>
                <View style={styles.arrowWrap}>
                    <Text style={styles.arrowIcon}>→</Text>
                    {currentNights > 0 && (
                        <Text style={styles.nightsChip}>{currentNights} nt{currentNights > 1 ? 's' : ''}</Text>
                    )}
                </View>
                <View style={styles.summaryBlock}>
                    <Text style={styles.summaryLabel}>CHECK-OUT</Text>
                    <Text style={[styles.summaryVal, tempCheckOut && styles.summaryValActive]}>
                        {tempCheckOut ? formatHumanDate(tempCheckOut) : (tempCheckIn ? 'Tap date' : '—')}
                    </Text>
                </View>
                {(tempCheckIn || tempCheckOut) && (
                    <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
                        <Text style={styles.clearBtnText}>✕ Clear</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Month Navigation */}
            <View style={styles.monthNav}>
                <TouchableOpacity
                    onPress={handlePrevMonth}
                    style={styles.navBtn}
                    activeOpacity={0.7}
                >
                    <Text style={styles.navBtnText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                    {MONTH_NAMES[month]} {year}
                </Text>
                <TouchableOpacity
                    onPress={handleNextMonth}
                    style={styles.navBtn}
                    activeOpacity={0.7}
                >
                    <Text style={styles.navBtnText}>▶</Text>
                </TouchableOpacity>
            </View>

            {/* Weekday Labels */}
            <View style={styles.weekDaysRow}>
                {WEEK_DAYS.map((wd, idx) => (
                    <Text key={idx} style={[styles.weekDayText, (idx === 0 || idx === 6) && styles.weekendText]}>
                        {wd}
                    </Text>
                ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.grid}>
                {renderCalendarGrid()}
            </View>

            {/* Helper Hint */}
            <Text style={styles.helpHint}>
                {!tempCheckIn
                    ? '👉 Tap a date on the calendar to set your Check-In.'
                    : !tempCheckOut
                    ? '👉 Tap a subsequent date to set your Check-Out.'
                    : `✓ Selected ${currentNights} night(s): ${tempCheckIn} to ${tempCheckOut}`}
            </Text>
        </View>
    );
};

/**
 * Modal wrapper for DateRangePicker
 */
export const DateRangeModal = ({
    visible,
    onClose,
    checkIn,
    checkOut,
    onConfirm,
    occupiedDates = [],
    title = 'Select Stay Dates'
}) => {
    const [selectedIn, setSelectedIn] = useState(checkIn || null);
    const [selectedOut, setSelectedOut] = useState(checkOut || null);
    const [nights, setNights] = useState(calculateDateNights(checkIn, checkOut));

    const handleSelect = (sIn, sOut, n) => {
        setSelectedIn(sIn);
        setSelectedOut(sOut);
        setNights(n);
    };

    const handleSave = () => {
        if (selectedIn && selectedOut && onConfirm) {
            onConfirm(selectedIn, selectedOut, nights);
        }
        if (onClose) onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <DateRangePicker
                                checkIn={selectedIn}
                                checkOut={selectedOut}
                                onSelectRange={handleSelect}
                                occupiedDates={occupiedDates}
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.applyBtn, (!selectedIn || !selectedOut) && styles.applyBtnDisabled]}
                                onPress={handleSave}
                                disabled={!selectedIn || !selectedOut}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.applyBtnText}>
                                    Confirm Dates ({nights > 0 ? `${nights} Night${nights > 1 ? 's' : ''}` : 'Select Out'})
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E6E2DD'
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.ivoryWarm,
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E6E2DD'
    },
    summaryBlock: {
        flex: 1
    },
    summaryLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.gold,
        letterSpacing: 0.8
    },
    summaryVal: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 2
    },
    summaryValActive: {
        color: colors.forest,
        fontWeight: '800'
    },
    arrowWrap: {
        alignItems: 'center',
        paddingHorizontal: 6
    },
    arrowIcon: {
        fontSize: 14,
        color: colors.forest,
        fontWeight: '700'
    },
    nightsChip: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.forest,
        backgroundColor: 'rgba(22, 46, 37, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2
    },
    clearBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4
    },
    clearBtnText: {
        fontSize: 11,
        color: '#991B1B',
        fontWeight: '700'
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 4
    },
    navBtn: {
        padding: 6,
        backgroundColor: colors.ivoryWarm,
        borderRadius: 6
    },
    navBtnText: {
        fontSize: 14,
        color: colors.forest,
        fontWeight: '700'
    },
    monthTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.forestDark
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        paddingHorizontal: 2
    },
    weekDayText: {
        width: '13.5%',
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280'
    },
    weekendText: {
        color: colors.gold
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    calendarCell: {
        width: '13.5%',
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        borderWidth: 1,
        marginVertical: 2
    },
    selectedCell: {
        transform: [{ scale: 1.05 }]
    },
    cellDayText: {
        fontSize: 13,
        fontWeight: '600'
    },
    selectedDayText: {
        fontWeight: '800'
    },
    occBadge: {
        fontSize: 6.5,
        color: '#991B1B',
        fontWeight: '800',
        marginTop: -1
    },
    startEndBadge: {
        fontSize: 7,
        color: colors.gold,
        fontWeight: '800',
        marginTop: -2
    },
    helpHint: {
        fontSize: 11,
        color: colors.forest,
        marginTop: 10,
        textAlign: 'center',
        fontWeight: '600'
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end'
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        maxHeight: '90%'
    },
    modalCard: {
        padding: 16
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.forestDark
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.ivoryWarm,
        alignItems: 'center',
        justifyContent: 'center'
    },
    closeBtnText: {
        fontSize: 16,
        color: colors.forest,
        fontWeight: '700'
    },
    modalFooter: {
        marginTop: 14
    },
    applyBtn: {
        backgroundColor: colors.forest,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center'
    },
    applyBtnDisabled: {
        backgroundColor: '#9CA3AF'
    },
    applyBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800'
    }
});

export default DateRangePicker;
