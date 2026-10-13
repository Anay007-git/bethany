import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    SafeAreaView,
    Modal
} from 'react-native';
import { colors, radius, shadows } from '../theme';
import { MobileSupabaseService } from '../services/SupabaseService';
import AuthService from '../services/authService';

const AdminDashboardScreen = ({ navigation }) => {
    // Current Active Tab: 'dashboard' | 'inventory' | 'offline' | 'crm' | 'coupons'
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data states
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        allBookings: []
    });
    const [rooms, setRooms] = useState([]);
    const [blockedDates, setBlockedDates] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [crmGuests, setCrmGuests] = useState([]);

    // Filter & Search states
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Room Editing Modal
    const [editingRoom, setEditingRoom] = useState(null);
    const [highPriceInput, setHighPriceInput] = useState('');
    const [lowPriceInput, setLowPriceInput] = useState('');

    // Block Date inputs
    const [selectedRoomForBlock, setSelectedRoomForBlock] = useState('carmel');
    const [dateToBlock, setDateToBlock] = useState('');
    const [blockReason, setBlockReason] = useState('OTA Sync Block');

    // Offline Booking State
    const [offlineGuestName, setOfflineGuestName] = useState('');
    const [offlinePhone, setOfflinePhone] = useState('');
    const [offlineEmail, setOfflineEmail] = useState('');
    const [offlineCheckIn, setOfflineCheckIn] = useState('');
    const [offlineCheckOut, setOfflineCheckOut] = useState('');
    const [offlineGuestsCount, setOfflineGuestsCount] = useState('2');
    const [offlineSelectedRooms, setOfflineSelectedRooms] = useState(['carmel']);
    const [offlineDiscount, setOfflineDiscount] = useState('0');
    const [offlineMeals, setOfflineMeals] = useState({
        breakfastVeg: 0,
        breakfastNonVeg: 0,
        lunchVeg: 0,
        lunchNonVeg: 0,
        dinnerVeg: 0,
        dinnerNonVeg: 0
    });

    // Coupon Creation Form
    const [newCouponCode, setNewCouponCode] = useState('');
    const [newCouponType, setNewCouponType] = useState('percentage');
    const [newCouponValue, setNewCouponValue] = useState('');
    const [newCouponLimit, setNewCouponLimit] = useState('');
    const [newCouponExpiry, setNewCouponExpiry] = useState('');
    const [showCouponModal, setShowCouponModal] = useState(false);

    // Initial session verification & data loading
    const loadAllAdminData = useCallback(async () => {
        try {
            // 1. Verify session validity
            const session = await AuthService.validateSession();
            if (!session.valid) {
                Alert.alert('Session Expired', 'Please login again to access the Staff Admin Suite.', [
                    { text: 'OK', onPress: () => navigation.replace('AdminLogin') }
                ]);
                return;
            }

            // 2. Fetch stats & bookings
            const statsRes = await MobileSupabaseService.getAdminDashboardStats();
            if (statsRes.success) {
                setStats(statsRes);
            }

            // 3. Fetch rooms
            const roomsData = await MobileSupabaseService.getRooms();
            setRooms(roomsData || []);

            // 4. Fetch blocked dates
            const blockedRes = await MobileSupabaseService.getBlockedDates();
            if (blockedRes.success) {
                setBlockedDates(blockedRes.data || []);
            }

            // 5. Fetch coupons
            const couponsRes = await MobileSupabaseService.getCoupons();
            if (couponsRes.success) {
                setCoupons(couponsRes.data || []);
            }

            // 6. Fetch CRM Analytics
            const crmRes = await MobileSupabaseService.getCRMAnalytics();
            if (crmRes.success) {
                setCrmGuests(crmRes.data || []);
            }
        } catch (err) {
            console.error('Error loading admin data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigation]);

    useEffect(() => {
        loadAllAdminData();
    }, [loadAllAdminData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadAllAdminData();
    };

    const handleLogout = () => {
        Alert.alert('Staff Logout', 'Are you sure you want to exit the Admin Suite?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    await AuthService.logout();
                    navigation.replace('AdminLogin');
                }
            }
        ]);
    };

    // Update Booking Status
    const handleUpdateStatus = async (bookingId, newStatus) => {
        Alert.alert(
            'Confirm Status Change',
            `Change reservation status to "${newStatus.toUpperCase()}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        const res = await MobileSupabaseService.updateBookingStatus(bookingId, newStatus);
                        if (res.success) {
                            Alert.alert('Success', `Booking status updated to ${newStatus}.`);
                            loadAllAdminData();
                        } else {
                            Alert.alert('Error', res.error || 'Failed to update booking status.');
                        }
                    }
                }
            ]
        );
    };

    // WhatsApp Guest
    const handleWhatsAppGuest = (guest, booking) => {
        if (!guest?.phone) {
            Alert.alert('Notice', 'No phone number on record for this guest.');
            return;
        }
        const cleanPhone = guest.phone.replace(/\D/g, '');
        const message = `Namaste ${guest.full_name || 'Guest'}! Greetings from Bethany Homestay, Kalimpong.\n\nRegarding your reservation (Ref: #${(booking.id || '').slice(0, 8)}):\n• Check-In: ${booking.check_in}\n• Check-Out: ${booking.check_out}\n• Status: ${(booking.status || '').toUpperCase()}\n\nPlease let us know if you need any assistance with Kalimpong taxi transfers, organic meal timings, or directions!`;
        Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`);
    };

    // Call Guest
    const handleCallGuest = (phone) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
    };

    // Save Room Pricing
    const handleSaveRoomPrice = async () => {
        if (!editingRoom) return;
        const hp = parseFloat(highPriceInput);
        const lp = parseFloat(lowPriceInput);
        if (isNaN(hp) || isNaN(lp)) {
            Alert.alert('Validation Error', 'Please enter valid numerical prices.');
            return;
        }

        const res = await MobileSupabaseService.updateRoom(editingRoom.id, {
            price_high_season: hp,
            price_low_season: lp
        });

        if (res.success) {
            Alert.alert('Success', `${editingRoom.name} pricing updated.`);
            setEditingRoom(null);
            loadAllAdminData();
        } else {
            Alert.alert('Error', res.error || 'Failed to update room pricing.');
        }
    };

    // Block Date
    const handleBlockDate = async () => {
        if (!dateToBlock.trim()) {
            Alert.alert('Validation', 'Please provide a date in YYYY-MM-DD format.');
            return;
        }
        const res = await MobileSupabaseService.blockDate(selectedRoomForBlock, dateToBlock.trim(), blockReason);
        if (res.success) {
            Alert.alert('Success', `Date ${dateToBlock} blocked for room.`);
            setDateToBlock('');
            loadAllAdminData();
        } else {
            Alert.alert('Error', res.error || 'Failed to block date.');
        }
    };

    // Unblock Date
    const handleUnblockDate = async (roomId, dateStr) => {
        const res = await MobileSupabaseService.unblockDate(roomId, dateStr);
        if (res.success) {
            Alert.alert('Success', `Unblocked ${dateStr}.`);
            loadAllAdminData();
        } else {
            Alert.alert('Error', res.error || 'Failed to unblock date.');
        }
    };

    // Create Offline / Walk-in Booking
    const handleCreateOfflineBooking = async () => {
        if (!offlineGuestName.trim() || !offlinePhone.trim() || !offlineCheckIn.trim() || !offlineCheckOut.trim()) {
            Alert.alert('Validation', 'Please fill in Guest Name, Phone, Check-In, and Check-Out dates.');
            return;
        }

        if (offlineSelectedRooms.length === 0) {
            Alert.alert('Validation', 'Please select at least one room.');
            return;
        }

        // Calculate nights
        const inD = new Date(offlineCheckIn);
        const outD = new Date(offlineCheckOut);
        const diffTime = outD - inD;
        const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        // Base room price
        const selectedRoomObjects = rooms.filter(r => offlineSelectedRooms.includes(r.id));
        const roomTotal = selectedRoomObjects.reduce((sum, r) => sum + (parseFloat(r.price_high_season) || 3000), 0) * nights;

        // Meal total
        const mealsCost =
            (offlineMeals.breakfastVeg * 120 + offlineMeals.breakfastNonVeg * 150) +
            (offlineMeals.lunchVeg * 200 + offlineMeals.lunchNonVeg * 250) +
            (offlineMeals.dinnerVeg * 200 + offlineMeals.dinnerNonVeg * 250);

        const discountVal = parseFloat(offlineDiscount) || 0;
        const grandTotal = Math.max(0, roomTotal + mealsCost - discountVal);

        const mealSummary = `Breakfast(V:${offlineMeals.breakfastVeg},NV:${offlineMeals.breakfastNonVeg}) | Lunch(V:${offlineMeals.lunchVeg},NV:${offlineMeals.lunchNonVeg}) | Dinner(V:${offlineMeals.dinnerVeg},NV:${offlineMeals.dinnerNonVeg})`;

        const bookingPayload = {
            name: offlineGuestName,
            phone: offlinePhone,
            email: offlineEmail || 'walkin@bethany.com',
            checkIn: offlineCheckIn,
            checkOut: offlineCheckOut,
            guests: offlineGuestsCount,
            selectedRooms: selectedRoomObjects,
            totalPrice: grandTotal,
            mealSummary,
            status: 'confirmed',
            notes: 'Walk-in booking created via Staff App',
            invoiceItems: [
                { name: `Room Accommodations (${nights} Night${nights > 1 ? 's' : ''})`, amount: roomTotal },
                { name: 'Organic Himalayan Meals', amount: mealsCost },
                { name: 'Concierge Courtesy Discount', amount: -discountVal }
            ]
        };

        const res = await MobileSupabaseService.createAdminManualBooking(bookingPayload);
        if (res.success) {
            Alert.alert('Success', 'Walk-in reservation confirmed & saved to database!');
            // Reset form
            setOfflineGuestName('');
            setOfflinePhone('');
            setOfflineEmail('');
            setOfflineCheckIn('');
            setOfflineCheckOut('');
            setOfflineDiscount('0');
            loadAllAdminData();
            setActiveTab('dashboard');
        } else {
            Alert.alert('Error', res.error || 'Could not create reservation.');
        }
    };

    // Create New Coupon
    const handleSaveNewCoupon = async () => {
        if (!newCouponCode.trim() || !newCouponValue.trim()) {
            Alert.alert('Validation', 'Please provide both Coupon Code and Value.');
            return;
        }

        const res = await MobileSupabaseService.createCoupon({
            code: newCouponCode,
            discount_type: newCouponType,
            discount_value: newCouponValue,
            usage_limit: newCouponLimit,
            expiry_date: newCouponExpiry
        });

        if (res.success) {
            Alert.alert('Success', `Coupon ${newCouponCode.toUpperCase()} created!`);
            setShowCouponModal(false);
            setNewCouponCode('');
            setNewCouponValue('');
            setNewCouponLimit('');
            setNewCouponExpiry('');
            loadAllAdminData();
        } else {
            Alert.alert('Error', res.error || 'Failed to create coupon.');
        }
    };

    // Toggle Coupon Active
    const handleToggleCoupon = async (coupon) => {
        const res = await MobileSupabaseService.toggleCouponActive(coupon.id, !coupon.is_active);
        if (res.success) {
            loadAllAdminData();
        } else {
            Alert.alert('Error', res.error || 'Failed to toggle coupon.');
        }
    };

    // Delete Coupon
    const handleDeleteCoupon = (coupon) => {
        Alert.alert('Delete Coupon', `Are you sure you want to delete "${coupon.code}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const res = await MobileSupabaseService.deleteCoupon(coupon.id);
                    if (res.success) {
                        loadAllAdminData();
                    } else {
                        Alert.alert('Error', res.error || 'Failed to delete coupon.');
                    }
                }
            }
        ]);
    };

    // Filtered Bookings
    const filteredBookings = stats.allBookings.filter(b => {
        const matchesStatus = statusFilter === 'all' || (b.status || '').toLowerCase() === statusFilter;
        let g = b.guests;
        if (Array.isArray(g)) g = g[0];
        const nameMatch = (g?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const phoneMatch = (g?.phone || '').includes(searchQuery);
        const idMatch = (b.id || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && (nameMatch || phoneMatch || idMatch);
    });

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.gold} />
                <Text style={styles.loadingText}>Syncing Himalayan Sanctuary Database...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Navigation Bar */}
            <View style={styles.topBar}>
                <View style={{ flex: 1 }}>
                    <View style={styles.staffBadge}>
                        <Text style={styles.staffBadgeText}>🛡️ VERIFIED ADMIN SESSION</Text>
                    </View>
                    <Text style={styles.topBarTitle}>Bethany Concierge Suite</Text>
                    <Text style={styles.topBarSub}>Staff: Namastehills (Administrator)</Text>
                </View>
                <View style={styles.topBarActions}>
                    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
                        <Text style={styles.refreshBtnText}>🔄 Sync</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                        <Text style={styles.logoutBtnText}>🚪 Exit</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Segmented Horizontal Tabs */}
            <View style={styles.tabsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
                        onPress={() => setActiveTab('dashboard')}
                    >
                        <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>
                            📊 Overview ({stats.totalBookings})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'inventory' && styles.tabItemActive]}
                        onPress={() => setActiveTab('inventory')}
                    >
                        <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
                            🛏️ Rooms & OTA ({rooms.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'offline' && styles.tabItemActive]}
                        onPress={() => setActiveTab('offline')}
                    >
                        <Text style={[styles.tabText, activeTab === 'offline' && styles.tabTextActive]}>
                            ➕ Walk-In Booking
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'crm' && styles.tabItemActive]}
                        onPress={() => setActiveTab('crm')}
                    >
                        <Text style={[styles.tabText, activeTab === 'crm' && styles.tabTextActive]}>
                            👥 CRM ({crmGuests.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'coupons' && styles.tabItemActive]}
                        onPress={() => setActiveTab('coupons')}
                    >
                        <Text style={[styles.tabText, activeTab === 'coupons' && styles.tabTextActive]}>
                            🏷️ Coupons ({coupons.length})
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView
                style={styles.mainContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* ============================================================== */}
                {/* TAB 1: OVERVIEW & LIVE BOOKINGS                                 */}
                {/* ============================================================== */}
                {activeTab === 'dashboard' && (
                    <View style={styles.tabContent}>
                        {/* KPI Cards Grid */}
                        <View style={styles.kpiGrid}>
                            <View style={[styles.kpiCard, { borderColor: colors.gold }]}>
                                <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
                                <Text style={[styles.kpiValue, { color: colors.goldDark || '#99732B' }]}>
                                    ₹{stats.totalRevenue.toLocaleString('en-IN')}
                                </Text>
                                <Text style={styles.kpiSub}>Excludes cancelled</Text>
                            </View>

                            <View style={[styles.kpiCard, { borderColor: colors.forest }]}>
                                <Text style={styles.kpiLabel}>TOTAL BOOKINGS</Text>
                                <Text style={[styles.kpiValue, { color: colors.forestDark }]}>
                                    {stats.totalBookings}
                                </Text>
                                <Text style={styles.kpiSub}>All-time reservations</Text>
                            </View>

                            <View style={[styles.kpiCard, { borderColor: '#E76F51' }]}>
                                <Text style={styles.kpiLabel}>PENDING APPROVAL</Text>
                                <Text style={[styles.kpiValue, { color: '#E76F51' }]}>
                                    {stats.pendingBookings}
                                </Text>
                                <Text style={styles.kpiSub}>Awaiting confirmation</Text>
                            </View>

                            <View style={[styles.kpiCard, { borderColor: colors.success }]}>
                                <Text style={styles.kpiLabel}>CONFIRMED STAYS</Text>
                                <Text style={[styles.kpiValue, { color: colors.success }]}>
                                    {stats.confirmedBookings}
                                </Text>
                                <Text style={styles.kpiSub}>Ready for check-in</Text>
                            </View>
                        </View>

                        {/* Search & Filter Header */}
                        <View style={styles.filterSection}>
                            <View style={styles.searchWrap}>
                                <Text style={{ marginRight: 6 }}>🔍</Text>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search by guest name, phone, or ID..."
                                    placeholderTextColor={colors.grey}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Text style={{ color: colors.grey }}>✕</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Status Filter Pills */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
                                {['all', 'pending', 'confirmed', 'booked', 'cancelled'].map(st => (
                                    <TouchableOpacity
                                        key={st}
                                        style={[styles.pill, statusFilter === st && styles.pillActive]}
                                        onPress={() => setStatusFilter(st)}
                                    >
                                        <Text style={[styles.pillText, statusFilter === st && styles.pillTextActive]}>
                                            {st.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Bookings List */}
                        <Text style={styles.sectionHeader}>
                            Reservations ({filteredBookings.length})
                        </Text>

                        {filteredBookings.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={{ fontSize: 32, marginBottom: 8 }}>🏔️</Text>
                                <Text style={styles.emptyTitle}>No matching bookings found</Text>
                                <Text style={styles.emptySub}>Try adjusting search criteria or status filter.</Text>
                            </View>
                        ) : (
                            filteredBookings.map(b => {
                                let g = b.guests;
                                if (Array.isArray(g)) g = g[0];
                                const status = (b.status || 'pending').toLowerCase();
                                const isPending = status === 'pending';
                                const isConfirmed = ['confirmed', 'booked'].includes(status);
                                const isCancelled = status === 'cancelled';

                                let badgeBg = '#FEF3C7';
                                let badgeColor = '#92400E';
                                if (isConfirmed) {
                                    badgeBg = '#D1FAE5';
                                    badgeColor = '#065F46';
                                } else if (isCancelled) {
                                    badgeBg = '#FEE2E2';
                                    badgeColor = '#991B1B';
                                }

                                const roomNames = Array.isArray(b.room_ids)
                                    ? b.room_ids.map(r => r.name || r.id).join(', ')
                                    : 'Bethany Suite';

                                return (
                                    <View key={b.id} style={styles.bookingCard}>
                                        <View style={styles.bookingHeaderRow}>
                                            <View style={styles.guestAvatar}>
                                                <Text style={styles.guestAvatarText}>
                                                    {(g?.full_name || 'G').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 10 }}>
                                                <Text style={styles.guestName}>{g?.full_name || 'Guest'}</Text>
                                                <Text style={styles.bookingRef}>Ref: #{b.id.slice(0, 8)} · {b.source || 'website'}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                                                <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                                                    {status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.bookingDivider} />

                                        {/* Room & Dates Info */}
                                        <View style={styles.bookingDetailRow}>
                                            <Text style={styles.detailLabel}>ROOMS:</Text>
                                            <Text style={styles.detailValBold}>{roomNames}</Text>
                                        </View>

                                        <View style={styles.bookingDetailRow}>
                                            <Text style={styles.detailLabel}>STAY DATES:</Text>
                                            <Text style={styles.detailValBold}>
                                                📅 {b.check_in} ➔ {b.check_out}
                                            </Text>
                                        </View>

                                        <View style={styles.bookingDetailRow}>
                                            <Text style={styles.detailLabel}>GUESTS & MEALS:</Text>
                                            <Text style={styles.detailVal}>
                                                👥 {b.guests_count || 1} Guests · {b.meal_preferences || 'No meal plan'}
                                            </Text>
                                        </View>

                                        <View style={styles.bookingDetailRow}>
                                            <Text style={styles.detailLabel}>TOTAL AMOUNT:</Text>
                                            <Text style={styles.priceHighlight}>₹{parseFloat(b.total_price || 0).toLocaleString('en-IN')}</Text>
                                        </View>

                                        {/* Direct Contact & Action Buttons */}
                                        <View style={styles.actionBtnRow}>
                                            <TouchableOpacity
                                                style={styles.waBtn}
                                                onPress={() => handleWhatsAppGuest(g, b)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.btnTextWhite}>💬 WhatsApp</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.callBtn}
                                                onPress={() => handleCallGuest(g?.phone)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.btnTextWhite}>📞 Call</Text>
                                            </TouchableOpacity>

                                            {isPending && (
                                                <TouchableOpacity
                                                    style={styles.confirmBtn}
                                                    onPress={() => handleUpdateStatus(b.id, 'confirmed')}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={styles.btnTextWhite}>✅ Confirm</Text>
                                                </TouchableOpacity>
                                            )}

                                            {!isCancelled && (
                                                <TouchableOpacity
                                                    style={styles.cancelBtn}
                                                    onPress={() => handleUpdateStatus(b.id, 'cancelled')}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={styles.cancelBtnText}>❌ Cancel</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}

                {/* ============================================================== */}
                {/* TAB 2: ROOM INVENTORY & OTA CALENDAR                           */}
                {/* ============================================================== */}
                {activeTab === 'inventory' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionHeader}>Suites & Live Pricing</Text>
                        <Text style={styles.sectionSub}>Tap any suite to update high & low season tariffs.</Text>

                        {rooms.map(room => (
                            <View key={room.id} style={styles.roomCard}>
                                <View style={styles.roomHeaderRow}>
                                    <View>
                                        <Text style={styles.roomName}>{room.name}</Text>
                                        <Text style={styles.roomMeta}>{room.capacity} · {room.view_type || 'Mountain View'}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.editPriceBtn}
                                        onPress={() => {
                                            setEditingRoom(room);
                                            setHighPriceInput(String(room.price_high_season || ''));
                                            setLowPriceInput(String(room.price_low_season || ''));
                                        }}
                                    >
                                        <Text style={styles.editPriceBtnText}>✏️ Edit Price</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.priceRow}>
                                    <View style={styles.priceBadge}>
                                        <Text style={styles.priceBadgeLabel}>HIGH SEASON</Text>
                                        <Text style={styles.priceBadgeVal}>₹{room.price_high_season}/night</Text>
                                    </View>
                                    <View style={styles.priceBadge}>
                                        <Text style={styles.priceBadgeLabel}>LOW SEASON</Text>
                                        <Text style={styles.priceBadgeVal}>₹{room.price_low_season}/night</Text>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Block Dates Section */}
                        <View style={styles.blockDateCard}>
                            <Text style={styles.blockDateTitle}>🚫 Block Dates for OTA / Maintenance</Text>
                            <Text style={styles.blockDateSub}>
                                Prevents double bookings across Airbnb, Booking.com, or off-season repairs.
                            </Text>

                            <Text style={styles.inputLabelSmall}>SELECT SUITE</Text>
                            <View style={styles.roomSelectRow}>
                                {rooms.map(r => (
                                    <TouchableOpacity
                                        key={r.id}
                                        style={[styles.roomChip, selectedRoomForBlock === r.id && styles.roomChipActive]}
                                        onPress={() => setSelectedRoomForBlock(r.id)}
                                    >
                                        <Text style={[styles.roomChipText, selectedRoomForBlock === r.id && styles.roomChipTextActive]}>
                                            {r.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabelSmall}>DATE TO BLOCK (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="e.g. 2026-11-20"
                                placeholderTextColor={colors.grey}
                                value={dateToBlock}
                                onChangeText={setDateToBlock}
                            />

                            <Text style={styles.inputLabelSmall}>BLOCK REASON</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="e.g. Airbnb Reserved / Deep Cleaning"
                                placeholderTextColor={colors.grey}
                                value={blockReason}
                                onChangeText={setBlockReason}
                            />

                            <TouchableOpacity style={styles.blockSubmitBtn} onPress={handleBlockDate} activeOpacity={0.85}>
                                <Text style={styles.btnTextWhite}>🔒 Block This Date</Text>
                            </TouchableOpacity>

                            {/* Currently Blocked Dates List */}
                            <Text style={[styles.sectionHeader, { marginTop: 20 }]}>
                                Currently Blocked Dates ({blockedDates.length})
                            </Text>

                            {blockedDates.length === 0 ? (
                                <Text style={{ color: colors.grey, fontStyle: 'italic', marginTop: 8 }}>
                                    No dates currently blocked in Supabase.
                                </Text>
                            ) : (
                                blockedDates.slice(0, 15).map(bd => (
                                    <View key={bd.id || `${bd.room_id}-${bd.blocked_date}`} style={styles.blockedItem}>
                                        <View>
                                            <Text style={styles.blockedDateText}>📅 {bd.blocked_date}</Text>
                                            <Text style={styles.blockedRoomText}>Suite: {bd.room_id.toUpperCase()} · {bd.source || 'OTA'}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.unblockBtn}
                                            onPress={() => handleUnblockDate(bd.room_id, bd.blocked_date)}
                                        >
                                            <Text style={styles.unblockBtnText}>🗑️ Unblock</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                )}

                {/* ============================================================== */}
                {/* TAB 3: OFFLINE / WALK-IN BOOKING ENGINE                        */}
                {/* ============================================================== */}
                {activeTab === 'offline' && (
                    <View style={styles.tabContent}>
                        <View style={styles.cardHeaderWrap}>
                            <Text style={styles.sectionHeader}>Create Direct / Walk-In Reservation</Text>
                            <Text style={styles.sectionSub}>Instant reservation creator for walk-in or offline guests.</Text>
                        </View>

                        <View style={styles.formCard}>
                            <Text style={styles.inputLabelSmall}>GUEST FULL NAME *</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="Enter guest's full name"
                                placeholderTextColor={colors.grey}
                                value={offlineGuestName}
                                onChangeText={setOfflineGuestName}
                            />

                            <Text style={styles.inputLabelSmall}>WHATSAPP / PHONE NUMBER *</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="+91 98765 43210"
                                placeholderTextColor={colors.grey}
                                keyboardType="phone-pad"
                                value={offlinePhone}
                                onChangeText={setOfflinePhone}
                            />

                            <Text style={styles.inputLabelSmall}>EMAIL ADDRESS (OPTIONAL)</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="guest@example.com"
                                placeholderTextColor={colors.grey}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={offlineEmail}
                                onChangeText={setOfflineEmail}
                            />

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabelSmall}>CHECK-IN (YYYY-MM-DD) *</Text>
                                    <TextInput
                                        style={styles.simpleInput}
                                        placeholder="2026-10-15"
                                        placeholderTextColor={colors.grey}
                                        value={offlineCheckIn}
                                        onChangeText={setOfflineCheckIn}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabelSmall}>CHECK-OUT (YYYY-MM-DD) *</Text>
                                    <TextInput
                                        style={styles.simpleInput}
                                        placeholder="2026-10-17"
                                        placeholderTextColor={colors.grey}
                                        value={offlineCheckOut}
                                        onChangeText={setOfflineCheckOut}
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabelSmall}>SELECT SUITE(S) *</Text>
                            <View style={styles.roomSelectRow}>
                                {rooms.map(r => {
                                    const isSel = offlineSelectedRooms.includes(r.id);
                                    return (
                                        <TouchableOpacity
                                            key={r.id}
                                            style={[styles.roomChip, isSel && styles.roomChipActive]}
                                            onPress={() => {
                                                if (isSel) {
                                                    setOfflineSelectedRooms(offlineSelectedRooms.filter(id => id !== r.id));
                                                } else {
                                                    setOfflineSelectedRooms([...offlineSelectedRooms, r.id]);
                                                }
                                            }}
                                        >
                                            <Text style={[styles.roomChipText, isSel && styles.roomChipTextActive]}>
                                                {isSel ? '✓ ' : ''}{r.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={styles.inputLabelSmall}>NUMBER OF GUESTS</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="2"
                                placeholderTextColor={colors.grey}
                                keyboardType="number-pad"
                                value={offlineGuestsCount}
                                onChangeText={setOfflineGuestsCount}
                            />

                            {/* Meal Plan Options */}
                            <Text style={[styles.inputLabelSmall, { marginTop: 14 }]}>ORGANIC MEAL SELECTION (DAILY)</Text>
                            <View style={styles.mealCounterRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mealLabel}>Breakfast (₹120)</Text>
                                    <Text style={styles.mealSub}>Veg: {offlineMeals.breakfastVeg}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => setOfflineMeals(m => ({ ...m, breakfastVeg: Math.max(0, m.breakfastVeg - 1) }))}
                                >
                                    <Text style={styles.counterBtnText}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.counterVal}>{offlineMeals.breakfastVeg}</Text>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => setOfflineMeals(m => ({ ...m, breakfastVeg: m.breakfastVeg + 1 }))}
                                >
                                    <Text style={styles.counterBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.mealCounterRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mealLabel}>Lunch / Dinner (₹200)</Text>
                                    <Text style={styles.mealSub}>Meals count: {offlineMeals.dinnerVeg}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => setOfflineMeals(m => ({ ...m, dinnerVeg: Math.max(0, m.dinnerVeg - 1) }))}
                                >
                                    <Text style={styles.counterBtnText}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.counterVal}>{offlineMeals.dinnerVeg}</Text>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => setOfflineMeals(m => ({ ...m, dinnerVeg: m.dinnerVeg + 1 }))}
                                >
                                    <Text style={styles.counterBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabelSmall}>COURTESY DISCOUNT (₹)</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="0"
                                placeholderTextColor={colors.grey}
                                keyboardType="numeric"
                                value={offlineDiscount}
                                onChangeText={setOfflineDiscount}
                            />

                            <TouchableOpacity
                                style={styles.createOfflineBtn}
                                onPress={handleCreateOfflineBooking}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.btnTextWhite}>Confirm & Create Walk-In Stay →</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ============================================================== */}
                {/* TAB 4: CUSTOMER CRM & LOYALTY                                  */}
                {/* ============================================================== */}
                {activeTab === 'crm' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionHeader}>Customer CRM & Loyalty</Text>
                        <Text style={styles.sectionSub}>Aggregated guest history, lifetime spend, and repeat guest tiers.</Text>

                        {crmGuests.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
                                <Text style={styles.emptyTitle}>No guest records found</Text>
                                <Text style={styles.emptySub}>Guest entries will populate as reservations are recorded.</Text>
                            </View>
                        ) : (
                            crmGuests.map(cust => (
                                <View key={cust.id} style={styles.crmCard}>
                                    <View style={styles.crmHeaderRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.crmName}>{cust.name}</Text>
                                            <Text style={styles.crmPhone}>📞 {cust.phone} · ✉️ {cust.email}</Text>
                                        </View>
                                        <View style={[styles.loyaltyBadge, { backgroundColor: cust.tierColor + '20' }]}>
                                            <Text style={[styles.loyaltyBadgeText, { color: cust.tierColor }]}>
                                                {cust.loyaltyTier}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.crmDivider} />

                                    <View style={styles.crmStatsRow}>
                                        <View style={styles.crmStatItem}>
                                            <Text style={styles.crmStatLabel}>CONFIRMED STAYS</Text>
                                            <Text style={styles.crmStatVal}>{cust.confirmedStays} Visits</Text>
                                        </View>
                                        <View style={styles.crmStatItem}>
                                            <Text style={styles.crmStatLabel}>TOTAL SPEND</Text>
                                            <Text style={styles.crmStatValHighlight}>₹{cust.totalSpend.toLocaleString('en-IN')}</Text>
                                        </View>
                                    </View>

                                    {/* Action row */}
                                    <View style={styles.crmActionRow}>
                                        <TouchableOpacity
                                            style={styles.crmWaBtn}
                                            onPress={() => {
                                                const clean = cust.phone.replace(/\D/g, '');
                                                const msg = `Namaste ${cust.name}! Wangchuck & Family from Bethany Homestay Kalimpong wish you well. As our valued ${cust.loyaltyTier}, we are delighted to offer you special seasonal dates!`;
                                                Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`);
                                            }}
                                        >
                                            <Text style={styles.btnTextWhite}>💬 Send Loyalty WA</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.crmCallBtn}
                                            onPress={() => handleCallGuest(cust.phone)}
                                        >
                                            <Text style={styles.btnTextWhite}>📞 Call</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* ============================================================== */}
                {/* TAB 5: COUPONS & PROMOTIONS                                    */}
                {/* ============================================================== */}
                {activeTab === 'coupons' && (
                    <View style={styles.tabContent}>
                        <View style={styles.couponTopHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sectionHeader}>Promotional Coupons</Text>
                                <Text style={styles.sectionSub}>Active discount codes verified during guest checkout.</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.newCouponBtn}
                                onPress={() => setShowCouponModal(true)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.btnTextWhite}>+ New Coupon</Text>
                            </TouchableOpacity>
                        </View>

                        {coupons.map(c => (
                            <View key={c.id} style={styles.couponCard}>
                                <View style={styles.couponHeaderRow}>
                                    <View>
                                        <Text style={styles.couponCode}>{c.code}</Text>
                                        <Text style={styles.couponDiscount}>
                                            {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: c.is_active ? '#D1FAE5' : '#F3F4F6' }]}>
                                        <Text style={{ color: c.is_active ? '#065F46' : '#6B7280', fontWeight: '800', fontSize: 10 }}>
                                            {c.is_active ? 'ACTIVE' : 'DISABLED'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.couponMetaRow}>
                                    <Text style={styles.couponMetaText}>
                                        Usage: {c.usage_count || 0} / {c.usage_limit || 'Unlimited'}
                                    </Text>
                                    {c.expiry_date && (
                                        <Text style={styles.couponMetaText}>
                                            Expires: {c.expiry_date.split('T')[0]}
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.couponActions}>
                                    <TouchableOpacity
                                        style={[styles.couponToggleBtn, { backgroundColor: c.is_active ? '#E5E7EB' : colors.forest }]}
                                        onPress={() => handleToggleCoupon(c)}
                                    >
                                        <Text style={{ color: c.is_active ? '#374151' : '#FFFFFF', fontWeight: '700', fontSize: 12 }}>
                                            {c.is_active ? 'Disable' : 'Enable'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.couponDeleteBtn}
                                        onPress={() => handleDeleteCoupon(c)}
                                    >
                                        <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 12 }}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Modal: Edit Room Price */}
            <Modal visible={!!editingRoom} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Edit Tariff: {editingRoom?.name}</Text>
                        <Text style={styles.modalSub}>Update season prices per room per night.</Text>

                        <Text style={styles.inputLabelSmall}>HIGH SEASON PRICE (₹)</Text>
                        <TextInput
                            style={styles.simpleInput}
                            keyboardType="numeric"
                            value={highPriceInput}
                            onChangeText={setHighPriceInput}
                        />

                        <Text style={styles.inputLabelSmall}>LOW SEASON PRICE (₹)</Text>
                        <TextInput
                            style={styles.simpleInput}
                            keyboardType="numeric"
                            value={lowPriceInput}
                            onChangeText={setLowPriceInput}
                        />

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingRoom(null)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveRoomPrice}>
                                <Text style={styles.btnTextWhite}>Save Tariff</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal: Create Coupon */}
            <Modal visible={showCouponModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Create New Coupon</Text>
                        <Text style={styles.modalSub}>Configure code & discount for homestay guests.</Text>

                        <Text style={styles.inputLabelSmall}>COUPON CODE (UPPERCASE)</Text>
                        <TextInput
                            style={styles.simpleInput}
                            placeholder="e.g. MONSOON15"
                            placeholderTextColor={colors.grey}
                            autoCapitalize="characters"
                            value={newCouponCode}
                            onChangeText={setNewCouponCode}
                        />

                        <Text style={styles.inputLabelSmall}>DISCOUNT TYPE</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                            <TouchableOpacity
                                style={[styles.roomChip, newCouponType === 'percentage' && styles.roomChipActive]}
                                onPress={() => setNewCouponType('percentage')}
                            >
                                <Text style={[styles.roomChipText, newCouponType === 'percentage' && styles.roomChipTextActive]}>
                                    Percentage (%)
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roomChip, newCouponType === 'fixed' && styles.roomChipActive]}
                                onPress={() => setNewCouponType('fixed')}
                            >
                                <Text style={[styles.roomChipText, newCouponType === 'fixed' && styles.roomChipTextActive]}>
                                    Fixed Flat (₹)
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabelSmall}>DISCOUNT VALUE</Text>
                        <TextInput
                            style={styles.simpleInput}
                            placeholder={newCouponType === 'percentage' ? '15 (for 15%)' : '500 (for ₹500)'}
                            placeholderTextColor={colors.grey}
                            keyboardType="numeric"
                            value={newCouponValue}
                            onChangeText={setNewCouponValue}
                        />

                        <Text style={styles.inputLabelSmall}>USAGE LIMIT (OPTIONAL)</Text>
                        <TextInput
                            style={styles.simpleInput}
                            placeholder="e.g. 50 (leave blank for unlimited)"
                            placeholderTextColor={colors.grey}
                            keyboardType="numeric"
                            value={newCouponLimit}
                            onChangeText={setNewCouponLimit}
                        />

                        <Text style={styles.inputLabelSmall}>EXPIRY DATE (YYYY-MM-DD OPTIONAL)</Text>
                        <TextInput
                            style={styles.simpleInput}
                            placeholder="e.g. 2026-12-31"
                            placeholderTextColor={colors.grey}
                            value={newCouponExpiry}
                            onChangeText={setNewCouponExpiry}
                        />

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCouponModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveNewCoupon}>
                                <Text style={styles.btnTextWhite}>Save Coupon</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPage
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.forestDark,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        color: colors.ivory,
        marginTop: 16,
        fontSize: 13,
        letterSpacing: 0.5
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 14,
        backgroundColor: colors.forestDark,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(197, 160, 89, 0.25)'
    },
    staffBadge: {
        backgroundColor: 'rgba(197, 160, 89, 0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radius.xs,
        marginBottom: 3
    },
    staffBadgeText: {
        color: colors.goldLight,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1
    },
    topBarTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.ivory
    },
    topBarSub: {
        fontSize: 11,
        color: colors.beige,
        opacity: 0.8
    },
    topBarActions: {
        flexDirection: 'row',
        gap: 8
    },
    refreshBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.xs
    },
    refreshBtnText: {
        color: colors.ivory,
        fontSize: 11,
        fontWeight: '700'
    },
    logoutBtn: {
        backgroundColor: 'rgba(230, 57, 70, 0.2)',
        borderWidth: 1,
        borderColor: '#E63946',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.xs
    },
    logoutBtnText: {
        color: '#FF8A8A',
        fontSize: 11,
        fontWeight: '700'
    },
    tabsWrapper: {
        backgroundColor: colors.bgSurface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle
    },
    tabsScroll: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8
    },
    tabItem: {
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: radius.full,
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    tabItemActive: {
        backgroundColor: colors.forest,
        borderColor: colors.forest
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.grey
    },
    tabTextActive: {
        color: colors.ivory
    },
    mainContent: {
        flex: 1
    },
    tabContent: {
        padding: 16
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16
    },
    kpiCard: {
        width: '48%',
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 14,
        borderWidth: 1.5,
        ...shadows.subtle
    },
    kpiLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.8,
        marginBottom: 4
    },
    kpiValue: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 2
    },
    kpiSub: {
        fontSize: 10,
        color: colors.textMuted
    },
    filterSection: {
        marginBottom: 16
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgSurface,
        borderRadius: radius.sm,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        marginBottom: 10
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 13,
        color: colors.textMain
    },
    filterPills: {
        gap: 6
    },
    pill: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: radius.full,
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    pillActive: {
        backgroundColor: colors.forest,
        borderColor: colors.forest
    },
    pillText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.grey
    },
    pillTextActive: {
        color: colors.ivory
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.forestDark,
        marginBottom: 4
    },
    sectionSub: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 14
    },
    emptyCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 32,
        alignItems: 'center',
        marginTop: 10
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 4
    },
    emptySub: {
        fontSize: 12,
        color: colors.grey
    },
    bookingCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    bookingHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    guestAvatar: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.forestSubtle,
        borderWidth: 1,
        borderColor: colors.forest,
        alignItems: 'center',
        justifyContent: 'center'
    },
    guestAvatarText: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.forest
    },
    guestName: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.forestDark
    },
    bookingRef: {
        fontSize: 11,
        color: colors.grey
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.xs
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '800'
    },
    bookingDivider: {
        height: 1,
        backgroundColor: colors.borderSubtle,
        marginVertical: 10
    },
    bookingDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.grey
    },
    detailVal: {
        fontSize: 12,
        color: colors.textMain,
        fontWeight: '600'
    },
    detailValBold: {
        fontSize: 12,
        color: colors.forestDark,
        fontWeight: '700'
    },
    priceHighlight: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.terracotta
    },
    actionBtnRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 12
    },
    waBtn: {
        backgroundColor: colors.whatsapp,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: radius.xs
    },
    callBtn: {
        backgroundColor: colors.forest,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: radius.xs
    },
    confirmBtn: {
        backgroundColor: colors.success,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: radius.xs
    },
    cancelBtn: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: radius.xs
    },
    cancelBtnText: {
        color: '#991B1B',
        fontSize: 11,
        fontWeight: '700'
    },
    btnTextWhite: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700'
    },
    roomCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    roomHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    roomName: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.forestDark
    },
    roomMeta: {
        fontSize: 11,
        color: colors.grey
    },
    editPriceBtn: {
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.xs
    },
    editPriceBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.forestDark
    },
    priceRow: {
        flexDirection: 'row',
        gap: 10
    },
    priceBadge: {
        flex: 1,
        backgroundColor: colors.ivoryWarm,
        borderRadius: radius.xs,
        padding: 8
    },
    priceBadgeLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.grey
    },
    priceBadgeVal: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.forestDark
    },
    blockDateCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 18,
        marginTop: 10,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    blockDateTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.forestDark,
        marginBottom: 3
    },
    blockDateSub: {
        fontSize: 12,
        color: colors.grey,
        marginBottom: 14
    },
    inputLabelSmall: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.8,
        marginBottom: 5,
        marginTop: 8
    },
    simpleInput: {
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: radius.xs,
        paddingHorizontal: 10,
        paddingVertical: 9,
        fontSize: 13,
        color: colors.textMain,
        marginBottom: 6
    },
    roomSelectRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8
    },
    roomChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.xs,
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1,
        borderColor: colors.borderMedium
    },
    roomChipActive: {
        backgroundColor: colors.forest,
        borderColor: colors.forest
    },
    roomChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.grey
    },
    roomChipTextActive: {
        color: colors.ivory
    },
    blockSubmitBtn: {
        backgroundColor: colors.terracotta,
        paddingVertical: 12,
        borderRadius: radius.xs,
        alignItems: 'center',
        marginTop: 8
    },
    blockedItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.ivoryWarm,
        padding: 10,
        borderRadius: radius.xs,
        marginBottom: 6
    },
    blockedDateText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMain
    },
    blockedRoomText: {
        fontSize: 10,
        color: colors.grey
    },
    unblockBtn: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: radius.xs
    },
    unblockBtnText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#991B1B'
    },
    cardHeaderWrap: {
        marginBottom: 10
    },
    formCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    mealCounterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.ivoryWarm,
        borderRadius: radius.xs,
        padding: 10,
        marginBottom: 6
    },
    mealLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMain
    },
    mealSub: {
        fontSize: 10,
        color: colors.grey
    },
    counterBtn: {
        backgroundColor: colors.forest,
        width: 28,
        height: 28,
        borderRadius: radius.xs,
        justifyContent: 'center',
        alignItems: 'center'
    },
    counterBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    counterVal: {
        fontSize: 14,
        fontWeight: '800',
        marginHorizontal: 12,
        color: colors.forestDark
    },
    createOfflineBtn: {
        backgroundColor: colors.forest,
        paddingVertical: 14,
        borderRadius: radius.sm,
        alignItems: 'center',
        marginTop: 16
    },
    crmCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    crmHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    crmName: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.forestDark
    },
    crmPhone: {
        fontSize: 11,
        color: colors.grey,
        marginTop: 2
    },
    loyaltyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.xs
    },
    loyaltyBadgeText: {
        fontSize: 10,
        fontWeight: '800'
    },
    crmDivider: {
        height: 1,
        backgroundColor: colors.borderSubtle,
        marginVertical: 10
    },
    crmStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    crmStatItem: {
        flex: 1
    },
    crmStatLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.grey
    },
    crmStatVal: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMain
    },
    crmStatValHighlight: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.goldDark || '#99732B'
    },
    crmActionRow: {
        flexDirection: 'row',
        gap: 8
    },
    crmWaBtn: {
        backgroundColor: colors.whatsapp,
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: radius.xs
    },
    crmCallBtn: {
        backgroundColor: colors.forest,
        paddingHorizontal: 14,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: radius.xs
    },
    couponTopHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    newCouponBtn: {
        backgroundColor: colors.forest,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.xs
    },
    couponCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    couponHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    couponCode: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.forestDark,
        letterSpacing: 1
    },
    couponDiscount: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.terracotta
    },
    couponMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 8
    },
    couponMetaText: {
        fontSize: 11,
        color: colors.grey
    },
    couponActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8
    },
    couponToggleBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: radius.xs
    },
    couponDeleteBtn: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: radius.xs
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalCard: {
        width: '100%',
        backgroundColor: colors.bgSurface,
        borderRadius: radius.lg,
        padding: 20,
        ...shadows.elevated
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.forestDark,
        marginBottom: 2
    },
    modalSub: {
        fontSize: 12,
        color: colors.grey,
        marginBottom: 14
    },
    modalBtnRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 14
    },
    modalCancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16
    },
    modalCancelText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.grey
    },
    modalSaveBtn: {
        backgroundColor: colors.forest,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: radius.xs
    }
});

export default AdminDashboardScreen;
