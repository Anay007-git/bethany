import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
        cancelledBookings: 0,
        allBookings: []
    });
    const [rooms, setRooms] = useState([]);
    const [blockedDates, setBlockedDates] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [crmGuests, setCrmGuests] = useState([]);

    // Filter & Search states
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Booking Status Change Modal
    const [statusModalBooking, setStatusModalBooking] = useState(null);

    // Room Editing Modal
    const [editingRoom, setEditingRoom] = useState(null);
    const [highPriceInput, setHighPriceInput] = useState('');
    const [lowPriceInput, setLowPriceInput] = useState('');
    const [editFeaturesInput, setEditFeaturesInput] = useState('');
    const [editCapacityInput, setEditCapacityInput] = useState('');
    const [editViewInput, setEditViewInput] = useState('');

    // List New Room Modal State
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [newRoomForm, setNewRoomForm] = useState({
        name: '',
        id: '',
        price_low_season: '2500',
        price_high_season: '3000',
        capacity: '4 Adults',
        view: 'Mountain View',
        size: '380 sq.ft',
        features: 'King Bed, Mountain View, Free High-speed WiFi, Geyser Water Heater, Electric Kettle',
        imageUrl: '',
        description: ''
    });

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

    // CRM Filter States
    const [crmTierFilter, setCrmTierFilter] = useState('all');
    const [crmSearchQuery, setCrmSearchQuery] = useState('');

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

    // Calculate OTA Revenue Estimate
    const otaRevenue = useMemo(() => {
        return (blockedDates || []).reduce((sum, d) => {
            const room = rooms.find(r => r.id === d.room_id);
            const avg = room ? ((room.price_low_season + room.price_high_season) / 2) : 3000;
            return sum + avg;
        }, 0);
    }, [blockedDates, rooms]);

    // Calculate Monthly Revenue Trends (Direct vs OTA)
    const monthlyRevenueData = useMemo(() => {
        const monthMap = {};

        // Direct Bookings Revenue
        (stats.allBookings || []).forEach(b => {
            if (['booked', 'confirmed'].includes((b.status || '').toLowerCase())) {
                const date = new Date(b.check_in);
                if (isNaN(date.getTime())) return;
                const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
                if (!monthMap[key]) monthMap[key] = { direct: 0, ota: 0, label: key, sortDate: date.getTime() };
                monthMap[key].direct += parseFloat(b.total_price || 0);
            }
        });

        // OTA Revenue from Blocked Dates
        (blockedDates || []).forEach(d => {
            const date = new Date(d.blocked_date);
            if (isNaN(date.getTime())) return;
            const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            if (!monthMap[key]) monthMap[key] = { direct: 0, ota: 0, label: key, sortDate: date.getTime() };

            const room = rooms.find(r => r.id === d.room_id);
            const avgPrice = room ? ((room.price_low_season + room.price_high_season) / 2) : 3000;
            monthMap[key].ota += avgPrice;
        });

        const list = Object.values(monthMap).sort((a, b) => a.sortDate - b.sortDate);
        return list.map(item => ({
            label: item.label,
            direct: Math.round(item.direct),
            ota: Math.round(item.ota),
            total: Math.round(item.direct + item.ota)
        }));
    }, [stats.allBookings, blockedDates, rooms]);

    // Calculate Booking Trends (Confirmed vs Cancelled)
    const bookingTrendsData = useMemo(() => {
        const monthMap = {};

        (stats.allBookings || []).forEach(b => {
            const date = new Date(b.check_in);
            if (isNaN(date.getTime())) return;
            const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            if (!monthMap[key]) monthMap[key] = { confirmed: 0, cancelled: 0, label: key, sortDate: date.getTime() };

            const status = (b.status || '').toLowerCase();
            if (['booked', 'confirmed'].includes(status)) {
                monthMap[key].confirmed += 1;
            } else if (status === 'cancelled') {
                monthMap[key].cancelled += 1;
            }
        });

        const list = Object.values(monthMap).sort((a, b) => a.sortDate - b.sortDate);
        return list.map(item => ({
            label: item.label,
            confirmed: item.confirmed,
            cancelled: item.cancelled,
            total: item.confirmed + item.cancelled
        }));
    }, [stats.allBookings]);

    // Salesforce Pipeline Counts
    const pipelineCounts = useMemo(() => {
        const all = stats.allBookings || [];
        return {
            all: all.length,
            pending: all.filter(b => (b.status || '').toLowerCase() === 'pending').length,
            confirmed: all.filter(b => (b.status || '').toLowerCase() === 'confirmed').length,
            booked: all.filter(b => (b.status || '').toLowerCase() === 'booked').length,
            cancelled: all.filter(b => (b.status || '').toLowerCase() === 'cancelled').length
        };
    }, [stats.allBookings]);

    // Live Walk-In Ledger Calculation
    const liveLedger = useMemo(() => {
        if (!offlineCheckIn || !offlineCheckOut || offlineSelectedRooms.length === 0) {
            return { nights: 0, roomTotal: 0, mealsTotal: 0, discount: 0, grandTotal: 0 };
        }
        const inD = new Date(offlineCheckIn);
        const outD = new Date(offlineCheckOut);
        const diff = outD - inD;
        const nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        if (isNaN(nights) || nights <= 0) {
            return { nights: 1, roomTotal: 0, mealsTotal: 0, discount: 0, grandTotal: 0 };
        }

        const selectedRoomObjects = rooms.filter(r => offlineSelectedRooms.includes(r.id));
        const roomRatePerNight = selectedRoomObjects.reduce((sum, r) => sum + (parseFloat(r.price_high_season) || 3000), 0);
        const roomTotal = roomRatePerNight * nights;

        const mealsTotal =
            (offlineMeals.breakfastVeg * 120 + offlineMeals.breakfastNonVeg * 150) +
            (offlineMeals.lunchVeg * 200 + offlineMeals.lunchNonVeg * 250) +
            (offlineMeals.dinnerVeg * 200 + offlineMeals.dinnerNonVeg * 250);

        const discount = parseFloat(offlineDiscount) || 0;
        const grandTotal = Math.max(0, roomTotal + mealsTotal - discount);

        return { nights, roomRatePerNight, roomTotal, mealsTotal, discount, grandTotal };
    }, [offlineCheckIn, offlineCheckOut, offlineSelectedRooms, offlineMeals, offlineDiscount, rooms]);

    // Filtered CRM Guests
    const maxCrmSpend = useMemo(() => {
        return Math.max(...(crmGuests.map(g => g.totalSpend) || [1]), 10000);
    }, [crmGuests]);

    const filteredCrmGuests = useMemo(() => {
        return crmGuests.filter(g => {
            const matchesTier =
                crmTierFilter === 'all' ||
                (crmTierFilter === 'vip' && (g.loyaltyTier || '').includes('VIP')) ||
                (crmTierFilter === 'returning' && (g.loyaltyTier || '').includes('Returning')) ||
                (crmTierFilter === 'new' && (g.loyaltyTier || '').includes('First-Time'));

            const q = crmSearchQuery.toLowerCase();
            const matchesSearch =
                !crmSearchQuery.trim() ||
                (g.name || '').toLowerCase().includes(q) ||
                (g.phone || '').includes(q) ||
                (g.email || '').toLowerCase().includes(q);

            return matchesTier && matchesSearch;
        });
    }, [crmGuests, crmTierFilter, crmSearchQuery]);

    // Update Booking Status
    const handleUpdateStatus = async (bookingId, newStatus) => {
        const res = await MobileSupabaseService.updateBookingStatus(bookingId, newStatus);
        if (res.success) {
            Alert.alert('Status Updated', `Booking status changed to "${newStatus.toUpperCase()}".`);
            setStatusModalBooking(null);
            loadAllAdminData();
        } else {
            Alert.alert('Error', res.error || 'Failed to update booking status.');
        }
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

    // Save Room Pricing & Features
    const handleSaveRoomPrice = async () => {
        if (!editingRoom) return;
        const hp = parseFloat(highPriceInput);
        const lp = parseFloat(lowPriceInput);
        if (isNaN(hp) || isNaN(lp)) {
            Alert.alert('Validation Error', 'Please enter valid numerical prices.');
            return;
        }

        const featuresArray = editFeaturesInput
            ? editFeaturesInput.split(',').map(f => f.trim()).filter(Boolean)
            : (Array.isArray(editingRoom.features) ? editingRoom.features : []);

        const res = await MobileSupabaseService.updateRoom(editingRoom.id, {
            price_high_season: hp,
            price_low_season: lp,
            features: featuresArray,
            capacity: editCapacityInput.trim() || editingRoom.capacity,
            view_type: editViewInput.trim() || editingRoom.view_type
        });

        if (res.success) {
            Alert.alert('Success', `${editingRoom.name} updated successfully.`);
            setEditingRoom(null);
            loadAllAdminData();
        } else {
            Alert.alert('Error', res.error || 'Failed to update room.');
        }
    };

    // Create & List New Room
    const handleCreateRoom = async () => {
        if (!newRoomForm.name.trim()) {
            Alert.alert('Validation Error', 'Please enter a Suite name.');
            return;
        }

        const slug = newRoomForm.id.trim()
            ? newRoomForm.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
            : newRoomForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        if (!slug) {
            Alert.alert('Validation Error', 'Please enter a valid unique Suite ID / Slug.');
            return;
        }

        if (rooms.some(r => r.id === slug)) {
            Alert.alert('Duplicate ID', `A room with ID "${slug}" already exists. Please choose a different name or ID.`);
            return;
        }

        const hp = parseFloat(newRoomForm.price_high_season) || 3000;
        const lp = parseFloat(newRoomForm.price_low_season) || 2500;
        const featuresArray = newRoomForm.features
            ? newRoomForm.features.split(',').map(f => f.trim()).filter(Boolean)
            : ['King Bed', 'Mountain View', 'High-Speed Wi-Fi'];

        const images = newRoomForm.imageUrl.trim()
            ? [newRoomForm.imageUrl.trim()]
            : ['https://r1imghtlak.mmtcdn.com/bc566280898d11ec90380a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500'];

        const payload = {
            id: slug,
            name: newRoomForm.name.trim(),
            price_low_season: lp,
            price_high_season: hp,
            capacity: newRoomForm.capacity || '4 Adults',
            view_type: newRoomForm.view || 'Mountain View',
            size: newRoomForm.size || '380 sq.ft',
            description: newRoomForm.description || '',
            features: featuresArray,
            images: images,
            is_active: true
        };

        const res = await MobileSupabaseService.createRoom(payload);
        if (res.success) {
            Alert.alert('Success', `🎉 Suite "${newRoomForm.name}" created and listed successfully!`);
            setShowCreateRoomModal(false);
            setNewRoomForm({
                name: '',
                id: '',
                price_low_season: '2500',
                price_high_season: '3000',
                capacity: '4 Adults',
                view: 'Mountain View',
                size: '380 sq.ft',
                features: 'King Bed, Mountain View, Free High-speed WiFi, Geyser Water Heater, Electric Kettle',
                imageUrl: '',
                description: ''
            });
            loadAllAdminData();
        } else {
            Alert.alert('Error', res.error || 'Failed to list new suite.');
        }
    };

    // Delete Room
    const handleDeleteRoom = (room) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to permanently delete "${room.name}"? This will remove it from app and web listings.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Suite',
                    style: 'destructive',
                    onPress: async () => {
                        const res = await MobileSupabaseService.deleteRoom(room.id);
                        if (res.success) {
                            Alert.alert('Deleted', `${room.name} has been removed.`);
                            loadAllAdminData();
                        } else {
                            Alert.alert('Error', res.error || 'Failed to delete room.');
                        }
                    }
                }
            ]
        );
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
            Alert.alert('Validation', 'Please select at least one suite.');
            return;
        }

        const selectedRoomObjects = rooms.filter(r => offlineSelectedRooms.includes(r.id));
        const mealSummary = `Breakfast(V:${offlineMeals.breakfastVeg},NV:${offlineMeals.breakfastNonVeg}) | Lunch(V:${offlineMeals.lunchVeg},NV:${offlineMeals.lunchNonVeg}) | Dinner(V:${offlineMeals.dinnerVeg},NV:${offlineMeals.dinnerNonVeg})`;

        const bookingPayload = {
            name: offlineGuestName,
            phone: offlinePhone,
            email: offlineEmail || 'walkin@bethany.com',
            checkIn: offlineCheckIn,
            checkOut: offlineCheckOut,
            guests: offlineGuestsCount,
            selectedRooms: selectedRoomObjects,
            totalPrice: liveLedger.grandTotal,
            mealSummary,
            status: 'confirmed',
            notes: 'Walk-in booking created via Staff App',
            invoiceItems: [
                { name: `Room Accommodations (${liveLedger.nights} Nights)`, amount: liveLedger.roomTotal },
                { name: 'Organic Himalayan Meals', amount: liveLedger.mealsTotal },
                { name: 'Courtesy Discount', amount: -liveLedger.discount }
            ]
        };

        const res = await MobileSupabaseService.createAdminManualBooking(bookingPayload);
        if (res.success) {
            Alert.alert('Success', 'Walk-in reservation confirmed & saved to database!');
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
                <Text style={styles.loadingText}>Syncing Himalayan Operations Database...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Navigation Bar */}
            <View style={styles.topBar}>
                <View style={{ flex: 1 }}>
                    <View style={styles.staffBadge}>
                        <Text style={styles.staffBadgeText}>🛡️ VERIFIED ADMIN CONSOLE</Text>
                    </View>
                    <Text style={styles.topBarTitle}>Bethany Operations Console</Text>
                    <Text style={styles.topBarSub}>Staff: Namastehills · Concierge Admin</Text>
                </View>
                <View style={styles.topBarActions}>
                    <TouchableOpacity
                        style={styles.guestViewBtn}
                        onPress={() => navigation.navigate('MainTabs')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.guestViewBtnText}>🏠 Guest App</Text>
                    </TouchableOpacity>
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
                            🛏️ Suites & OTA ({rooms.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'offline' && styles.tabItemActive]}
                        onPress={() => setActiveTab('offline')}
                    >
                        <Text style={[styles.tabText, activeTab === 'offline' && styles.tabTextActive]}>
                            ➕ Walk-In Studio
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'crm' && styles.tabItemActive]}
                        onPress={() => setActiveTab('crm')}
                    >
                        <Text style={[styles.tabText, activeTab === 'crm' && styles.tabTextActive]}>
                            👥 Customer 360 ({crmGuests.length})
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
                {/* TAB 1: OVERVIEW, ANALYTICS & LIVE RESERVATIONS                  */}
                {/* ============================================================== */}
                {activeTab === 'dashboard' && (
                    <View style={styles.tabContent}>
                        {/* Salesforce Pipeline Chevron Stages Path */}
                        <View style={styles.pipelineSection}>
                            <Text style={styles.pipelineSectionTitle}>SALESFORCE PIPELINE CHEVRON</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pipelineScroll}>
                                {[
                                    { key: 'all', title: '1. ALL RESERVATIONS', count: `${pipelineCounts.all} Total` },
                                    { key: 'pending', title: '2. PENDING REVIEW', count: `${pipelineCounts.pending} Action Needed` },
                                    { key: 'confirmed', title: '3. CONFIRMED STAYS', count: `${pipelineCounts.confirmed} Ready` },
                                    { key: 'booked', title: '4. IN-HOUSE / BOOKED', count: `${pipelineCounts.booked} Checked In` },
                                    { key: 'cancelled', title: '5. CANCELLED / CLOSED', count: `${pipelineCounts.cancelled} Archival` },
                                ].map(step => {
                                    const isActive = statusFilter === step.key;
                                    return (
                                        <TouchableOpacity
                                            key={step.key}
                                            style={[styles.pipelineStep, isActive && styles.pipelineStepActive]}
                                            onPress={() => setStatusFilter(step.key)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.pipelineStepTitle, isActive && styles.pipelineStepTitleActive]}>
                                                {step.title}
                                            </Text>
                                            <Text style={[styles.pipelineStepCount, isActive && styles.pipelineStepCountActive]}>
                                                {step.count}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* 5 KPI Cards Grid (Matches Web Salesforce Console) */}
                        <View style={styles.kpiGrid}>
                            <View style={[styles.kpiCard, { borderTopColor: colors.gold }]}>
                                <View style={styles.kpiIconWrap}><Text style={{ fontSize: 16 }}>💰</Text></View>
                                <Text style={styles.kpiLabel}>CONFIRMED REVENUE</Text>
                                <Text style={[styles.kpiValue, { color: colors.gold }]}>
                                    ₹{stats.totalRevenue.toLocaleString('en-IN')}
                                </Text>
                                <Text style={styles.kpiSub}>In selected range</Text>
                            </View>

                            <View style={[styles.kpiCard, { borderTopColor: '#0891B2' }]}>
                                <View style={styles.kpiIconWrap}><Text style={{ fontSize: 16 }}>🔗</Text></View>
                                <Text style={styles.kpiLabel}>OTA REVENUE</Text>
                                <Text style={[styles.kpiValue, { color: '#0891B2' }]}>
                                    ₹{otaRevenue.toLocaleString('en-IN')}
                                </Text>
                                <Text style={styles.kpiSub}>{blockedDates.length} nights synced</Text>
                            </View>

                            <View style={[styles.kpiCard, { borderTopColor: colors.forest }]}>
                                <View style={styles.kpiIconWrap}><Text style={{ fontSize: 16 }}>✅</Text></View>
                                <Text style={styles.kpiLabel}>CONFIRMED BOOKINGS</Text>
                                <Text style={[styles.kpiValue, { color: colors.forestDark }]}>
                                    {stats.confirmedBookings}
                                </Text>
                                <Text style={styles.kpiSub}>Validated stays</Text>
                            </View>

                            <View style={[styles.kpiCard, { borderTopColor: '#E76F51' }]}>
                                <View style={styles.kpiIconWrap}><Text style={{ fontSize: 16 }}>⏳</Text></View>
                                <Text style={styles.kpiLabel}>PENDING REVIEW</Text>
                                <Text style={[styles.kpiValue, { color: '#E76F51' }]}>
                                    {stats.pendingBookings}
                                </Text>
                                <Text style={styles.kpiSub}>Action needed</Text>
                            </View>

                            <View style={[styles.kpiCard, { borderTopColor: '#8B5CF6' }]}>
                                <View style={styles.kpiIconWrap}><Text style={{ fontSize: 16 }}>📊</Text></View>
                                <Text style={styles.kpiLabel}>TOTAL ENQUIRIES</Text>
                                <Text style={[styles.kpiValue, { color: '#8B5CF6' }]}>
                                    {stats.totalBookings}
                                </Text>
                                <Text style={styles.kpiSub}>All requests</Text>
                            </View>
                        </View>

                        {/* ============================================================== */}
                        {/* NATIVE VISUAL ANALYTICS CHARTS                                 */}
                        {/* ============================================================== */}

                        {/* Chart 1: Revenue Trends (Direct vs OTA) */}
                        <View style={styles.chartCard}>
                            <View style={styles.chartHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.chartTitle}>📈 Revenue Trends (Direct vs OTA)</Text>
                                    <Text style={styles.chartSub}>Direct folio revenue vs synced OTA channels</Text>
                                </View>
                                <View style={styles.chartLegend}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: colors.forest }]} />
                                        <Text style={styles.legendText}>Direct</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: colors.gold }]} />
                                        <Text style={styles.legendText}>OTA</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.chartContainer}>
                                {monthlyRevenueData.map((data, idx) => {
                                    const maxVal = Math.max(...monthlyRevenueData.map(d => Math.max(d.direct, d.ota)), 10000);
                                    const directHeight = Math.max(4, Math.round((data.direct / maxVal) * 115));
                                    const otaHeight = Math.max(data.ota > 0 ? 4 : 0, Math.round((data.ota / maxVal) * 115));

                                    return (
                                        <View key={idx} style={styles.barGroup}>
                                            <View style={styles.barsPair}>
                                                {/* Direct Bar */}
                                                <View style={styles.barCol}>
                                                    <Text style={styles.barValText}>
                                                        ₹{(data.direct / 1000).toFixed(1)}k
                                                    </Text>
                                                    <View style={styles.barTrack}>
                                                        <View style={[styles.barFill, { height: directHeight, backgroundColor: colors.forest }]} />
                                                    </View>
                                                </View>

                                                {/* OTA Bar */}
                                                <View style={styles.barCol}>
                                                    <Text style={styles.barValText}>
                                                        {data.ota > 0 ? `₹${(data.ota / 1000).toFixed(1)}k` : '₹0'}
                                                    </Text>
                                                    <View style={styles.barTrack}>
                                                        <View style={[styles.barFill, { height: otaHeight, backgroundColor: colors.gold }]} />
                                                    </View>
                                                </View>
                                            </View>
                                            <Text style={styles.barMonthLabel}>{data.label.split(' ')[0]}</Text>
                                        </View>
                                    );
                                })}
                                {monthlyRevenueData.length === 0 && (
                                    <Text style={styles.chartEmptyText}>No monthly revenue data available.</Text>
                                )}
                            </View>
                        </View>

                        {/* Chart 2: Booking Trends (Confirmed vs Cancelled) */}
                        <View style={styles.chartCard}>
                            <View style={styles.chartHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.chartTitle}>📉 Booking Trends (Confirmed vs Cancelled)</Text>
                                    <Text style={styles.chartSub}>Confirmed guest stays vs cancelled reservation folios</Text>
                                </View>
                                <View style={styles.chartLegend}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                                        <Text style={styles.legendText}>Confirmed</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                                        <Text style={styles.legendText}>Cancelled</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.chartContainer}>
                                {bookingTrendsData.map((data, idx) => {
                                    const maxVal = Math.max(...bookingTrendsData.map(d => Math.max(d.confirmed, d.cancelled)), 5);
                                    const confirmedHeight = Math.max(data.confirmed > 0 ? 6 : 0, Math.round((data.confirmed / maxVal) * 115));
                                    const cancelledHeight = Math.max(data.cancelled > 0 ? 6 : 0, Math.round((data.cancelled / maxVal) * 115));

                                    return (
                                        <View key={idx} style={styles.barGroup}>
                                            <View style={styles.barsPair}>
                                                {/* Confirmed Bar */}
                                                <View style={styles.barCol}>
                                                    <Text style={styles.barValText}>{data.confirmed}</Text>
                                                    <View style={styles.barTrack}>
                                                        <View style={[styles.barFill, { height: confirmedHeight, backgroundColor: '#10B981' }]} />
                                                    </View>
                                                </View>

                                                {/* Cancelled Bar */}
                                                <View style={styles.barCol}>
                                                    <Text style={styles.barValText}>{data.cancelled}</Text>
                                                    <View style={styles.barTrack}>
                                                        <View style={[styles.barFill, { height: cancelledHeight, backgroundColor: '#DC2626' }]} />
                                                    </View>
                                                </View>
                                            </View>
                                            <Text style={styles.barMonthLabel}>{data.label.split(' ')[0]}</Text>
                                        </View>
                                    );
                                })}
                                {bookingTrendsData.length === 0 && (
                                    <Text style={styles.chartEmptyText}>No booking trends recorded.</Text>
                                )}
                            </View>
                        </View>

                        {/* Search & Filter Section */}
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
                                        <Text style={{ color: colors.grey, fontWeight: '700' }}>✕</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Bookings List Header */}
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

                                            <TouchableOpacity
                                                style={styles.statusChangeBtn}
                                                onPress={() => setStatusModalBooking(b)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.statusChangeBtnText}>✏️ Status</Text>
                                            </TouchableOpacity>
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
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                                <Text style={styles.sectionHeader}>Suites & Live Pricing</Text>
                                <Text style={styles.sectionSub}>Manage tariffs, custom features, and live inventory.</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.addSuiteBtn}
                                onPress={() => setShowCreateRoomModal(true)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.addSuiteBtnText}>➕ List Suite</Text>
                            </TouchableOpacity>
                        </View>

                        {rooms.map(room => (
                            <View key={room.id} style={styles.roomCard}>
                                <View style={styles.roomHeaderRow}>
                                    <View style={{ flex: 1, paddingRight: 6 }}>
                                        <Text style={styles.roomName}>{room.name}</Text>
                                        <Text style={styles.roomMeta}>{room.capacity} · {room.view_type || 'Mountain View'}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                        <TouchableOpacity
                                            style={styles.editPriceBtn}
                                            onPress={() => {
                                                setEditingRoom(room);
                                                setHighPriceInput(String(room.price_high_season || ''));
                                                setLowPriceInput(String(room.price_low_season || ''));
                                                setEditFeaturesInput(Array.isArray(room.features) ? room.features.join(', ') : (room.features || ''));
                                                setEditCapacityInput(room.capacity || '');
                                                setEditViewInput(room.view_type || '');
                                            }}
                                        >
                                            <Text style={styles.editPriceBtnText}>✏️ Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.editPriceBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                                            onPress={() => handleDeleteRoom(room)}
                                        >
                                            <Text style={[styles.editPriceBtnText, { color: '#DC2626' }]}>🗑️</Text>
                                        </TouchableOpacity>
                                    </View>
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

                                {room.features && (Array.isArray(room.features) ? room.features : String(room.features).split(',')).length > 0 && (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                        {(Array.isArray(room.features) ? room.features : String(room.features).split(',')).map((f, i) => (
                                            <View key={i} style={{ backgroundColor: 'rgba(35, 72, 59, 0.08)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}>
                                                <Text style={{ fontSize: 10, color: colors.forestDark, fontWeight: '600' }}>✓ {f.trim()}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
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
                {/* TAB 3: OFFLINE / WALK-IN BOOKING STUDIO                        */}
                {/* ============================================================== */}
                {activeTab === 'offline' && (
                    <View style={styles.tabContent}>
                        <View style={styles.cardHeaderWrap}>
                            <Text style={styles.sectionHeader}>Reservation Studio (Walk-In Booking)</Text>
                            <Text style={styles.sectionSub}>Instant reservation creator for walk-in or offline guests with live ledger.</Text>
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
                                    <Text style={styles.mealLabel}>Breakfast (₹120 Veg / ₹150 NV)</Text>
                                    <Text style={styles.mealSub}>Veg: {offlineMeals.breakfastVeg} · Non-Veg: {offlineMeals.breakfastNonVeg}</Text>
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
                                    <Text style={styles.mealLabel}>Lunch / Dinner (₹200 Veg / ₹250 NV)</Text>
                                    <Text style={styles.mealSub}>Veg: {offlineMeals.dinnerVeg} · Non-Veg: {offlineMeals.dinnerNonVeg}</Text>
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

                            {/* Real-time Ledger Summary */}
                            <View style={styles.ledgerCard}>
                                <View style={styles.ledgerHeader}>
                                    <Text style={styles.ledgerTitle}>FOLIO PRICING LEDGER</Text>
                                    <Text style={styles.ledgerBadge}>LIVE ESTIMATE</Text>
                                </View>
                                <View style={styles.ledgerRow}>
                                    <Text style={styles.ledgerLabel}>
                                        Suites ({offlineSelectedRooms.length} room{offlineSelectedRooms.length > 1 ? 's' : ''} × {liveLedger.nights} night{liveLedger.nights > 1 ? 's' : ''}):
                                    </Text>
                                    <Text style={styles.ledgerVal}>₹{liveLedger.roomTotal.toLocaleString('en-IN')}</Text>
                                </View>
                                <View style={styles.ledgerRow}>
                                    <Text style={styles.ledgerLabel}>Organic Himalayan Meals:</Text>
                                    <Text style={styles.ledgerVal}>₹{liveLedger.mealsTotal.toLocaleString('en-IN')}</Text>
                                </View>
                                {liveLedger.discount > 0 && (
                                    <View style={styles.ledgerRow}>
                                        <Text style={[styles.ledgerLabel, { color: '#E63946' }]}>Courtesy Discount:</Text>
                                        <Text style={[styles.ledgerVal, { color: '#E63946' }]}>-₹{liveLedger.discount.toLocaleString('en-IN')}</Text>
                                    </View>
                                )}
                                <View style={styles.ledgerDivider} />
                                <View style={styles.ledgerTotalRow}>
                                    <Text style={styles.ledgerTotalLabel}>GRAND FOLIO TOTAL:</Text>
                                    <Text style={styles.ledgerTotalVal}>₹{liveLedger.grandTotal.toLocaleString('en-IN')}</Text>
                                </View>
                            </View>

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
                {/* TAB 4: CUSTOMER 360 CRM & GUEST HISTORY                        */}
                {/* ============================================================== */}
                {activeTab === 'crm' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionHeader}>Customer 360 CRM & Guest History</Text>
                        <Text style={styles.sectionSub}>Aggregated guest history, portfolio spend, and repeat guest loyalty tiers.</Text>

                        {/* CRM Search Input */}
                        <View style={styles.searchWrap}>
                            <Text style={{ marginRight: 6 }}>🔍</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search guests by name, phone, or email..."
                                placeholderTextColor={colors.grey}
                                value={crmSearchQuery}
                                onChangeText={setCrmSearchQuery}
                            />
                            {crmSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setCrmSearchQuery('')}>
                                    <Text style={{ color: colors.grey, fontWeight: '700' }}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Tier Filter Chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.crmFilterScroll}>
                            {[
                                { key: 'all', label: `All (${crmGuests.length})` },
                                { key: 'vip', label: `👑 VIP (${crmGuests.filter(g => (g.loyaltyTier || '').includes('VIP')).length})` },
                                { key: 'returning', label: `🌿 Returning (${crmGuests.filter(g => (g.loyaltyTier || '').includes('Returning')).length})` },
                                { key: 'new', label: `🌱 New (${crmGuests.filter(g => (g.loyaltyTier || '').includes('First-Time')).length})` }
                            ].map(tier => (
                                <TouchableOpacity
                                    key={tier.key}
                                    style={[styles.crmChip, crmTierFilter === tier.key && styles.crmChipActive]}
                                    onPress={() => setCrmTierFilter(tier.key)}
                                >
                                    <Text style={[styles.crmChipText, crmTierFilter === tier.key && styles.crmChipTextActive]}>
                                        {tier.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {filteredCrmGuests.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
                                <Text style={styles.emptyTitle}>No guest records found</Text>
                                <Text style={styles.emptySub}>Guest entries will populate as reservations are recorded.</Text>
                            </View>
                        ) : (
                            filteredCrmGuests.map(cust => (
                                <View key={cust.id} style={styles.crmCard}>
                                    <View style={styles.crmHeaderRow}>
                                        <View style={styles.crmAvatar}>
                                            <Text style={styles.crmAvatarText}>
                                                {(cust.name || 'G').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 10 }}>
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
                                            <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                                                {Array.from({ length: Math.min(5, cust.confirmedStays || 1) }).map((_, i) => (
                                                    <Text key={i} style={{ color: colors.gold, fontSize: 11 }}>★</Text>
                                                ))}
                                            </View>
                                        </View>
                                        <View style={styles.crmStatItem}>
                                            <Text style={styles.crmStatLabel}>TOTAL SPEND</Text>
                                            <Text style={styles.crmStatValHighlight}>₹{cust.totalSpend.toLocaleString('en-IN')}</Text>
                                        </View>
                                    </View>

                                    {/* LTV Spend Progress Bar */}
                                    <View style={styles.ltvMeterWrap}>
                                        <View style={styles.ltvMeterTrack}>
                                            <View
                                                style={[
                                                    styles.ltvMeterFill,
                                                    {
                                                        width: `${Math.min(100, Math.max(8, Math.round((cust.totalSpend / maxCrmSpend) * 100)))}%`,
                                                        backgroundColor: (cust.loyaltyTier || '').includes('VIP') ? colors.gold : colors.forest
                                                    }
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.ltvMeterLabel}>Portfolio LTV: ₹{cust.totalSpend.toLocaleString('en-IN')}</Text>
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
                                            <Text style={styles.btnTextWhite}>💬 Send VIP WhatsApp</Text>
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
                {/* TAB 5: COUPONS & PROMOTIONAL RATES                             */}
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

            {/* Modal: Status Change */}
            <Modal visible={!!statusModalBooking} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Update Reservation Status</Text>
                        <Text style={styles.modalSub}>
                            Change folio #{statusModalBooking?.id?.slice(0, 8)} status in Supabase.
                        </Text>

                        <View style={{ gap: 8, marginVertical: 10 }}>
                            {[
                                { key: 'confirmed', label: '✅ Mark as Confirmed', color: '#10B981' },
                                { key: 'booked', label: '🏠 Mark as Checked In / Booked', color: colors.forest },
                                { key: 'pending', label: '⏳ Mark as Pending Review', color: '#E76F51' },
                                { key: 'cancelled', label: '❌ Mark as Cancelled / Closed', color: '#DC2626' }
                            ].map(opt => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[styles.statusOptionBtn, { borderColor: opt.color }]}
                                    onPress={() => handleUpdateStatus(statusModalBooking.id, opt.key)}
                                >
                                    <Text style={[styles.statusOptionText, { color: opt.color }]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.modalCancelBtn, { alignSelf: 'center', marginTop: 8 }]}
                            onPress={() => setStatusModalBooking(null)}
                        >
                            <Text style={styles.modalCancelText}>Close Window</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal: Edit Room Price & Features */}
            <Modal visible={!!editingRoom} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { maxHeight: '90%' }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>Edit Suite: {editingRoom?.name}</Text>
                            <Text style={styles.modalSub}>Update tariffs, capacity, and custom amenities/features.</Text>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabelSmall}>HIGH SEASON (₹)</Text>
                                    <TextInput
                                        style={styles.simpleInput}
                                        keyboardType="numeric"
                                        value={highPriceInput}
                                        onChangeText={setHighPriceInput}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabelSmall}>LOW SEASON (₹)</Text>
                                    <TextInput
                                        style={styles.simpleInput}
                                        keyboardType="numeric"
                                        value={lowPriceInput}
                                        onChangeText={setLowPriceInput}
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabelSmall}>CAPACITY</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="e.g. 4 Adults + 1 Kid"
                                value={editCapacityInput}
                                onChangeText={setEditCapacityInput}
                            />

                            <Text style={styles.inputLabelSmall}>VIEW TYPE</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="e.g. 180° Kanchenjunga View"
                                value={editViewInput}
                                onChangeText={setEditViewInput}
                            />

                            <Text style={styles.inputLabelSmall}>ROOM FEATURES & AMENITIES (COMMA SEPARATED)</Text>
                            <TextInput
                                style={[styles.simpleInput, { height: 64, textAlignVertical: 'top' }]}
                                multiline
                                placeholder="e.g. King Bed, Mountain View, Geyser, Free WiFi"
                                value={editFeaturesInput}
                                onChangeText={setEditFeaturesInput}
                            />

                            <Text style={[styles.inputLabelSmall, { marginTop: 4, marginBottom: 4 }]}>QUICK ADD FEATURE:</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {['Mountain View', 'Private Balcony', 'King Bed', 'Geyser', 'Electric Kettle', 'Wi-Fi', 'Room Heater', 'Living Area'].map((feat, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={{ backgroundColor: colors.ivoryWarm, borderWidth: 1, borderColor: colors.borderSubtle, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.xs }}
                                        onPress={() => {
                                            const current = editFeaturesInput.trim();
                                            if (!current) {
                                                setEditFeaturesInput(feat);
                                            } else if (!current.toLowerCase().includes(feat.toLowerCase())) {
                                                setEditFeaturesInput(`${current}, ${feat}`);
                                            }
                                        }}
                                    >
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.forestDark }}>+ {feat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingRoom(null)}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveRoomPrice}>
                                    <Text style={styles.btnTextWhite}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal: List New Suite */}
            <Modal visible={showCreateRoomModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { maxHeight: '90%' }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>List New Boutique Suite</Text>
                            <Text style={styles.modalSub}>Add a new room listing to app and web catalog.</Text>

                            <Text style={styles.inputLabelSmall}>SUITE NAME *</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="e.g. Hermon Suite"
                                value={newRoomForm.name}
                                onChangeText={(text) => {
                                    const autoSlug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                    setNewRoomForm(prev => ({
                                        ...prev,
                                        name: text,
                                        id: prev.id ? prev.id : autoSlug
                                    }));
                                }}
                            />

                            <Text style={styles.inputLabelSmall}>UNIQUE ID / SLUG *</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="e.g. hermon"
                                autoCapitalize="none"
                                value={newRoomForm.id}
                                onChangeText={(text) => setNewRoomForm(prev => ({ ...prev, id: text.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                            />

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabelSmall}>LOW SEASON (₹) *</Text>
                                    <TextInput
                                        style={styles.simpleInput}
                                        keyboardType="numeric"
                                        placeholder="2500"
                                        value={newRoomForm.price_low_season}
                                        onChangeText={(text) => setNewRoomForm(prev => ({ ...prev, price_low_season: text }))}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabelSmall}>HIGH SEASON (₹) *</Text>
                                    <TextInput
                                        style={styles.simpleInput}
                                        keyboardType="numeric"
                                        placeholder="3000"
                                        value={newRoomForm.price_high_season}
                                        onChangeText={(text) => setNewRoomForm(prev => ({ ...prev, price_high_season: text }))}
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabelSmall}>CAPACITY</Text>
                                    <TextInput
                                        style={styles.simpleInput}
                                        placeholder="e.g. 4 Adults + 1 Kid"
                                        value={newRoomForm.capacity}
                                        onChangeText={(text) => setNewRoomForm(prev => ({ ...prev, capacity: text }))}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabelSmall}>SIZE</Text>
                                    <TextInput
                                        style={styles.simpleInput}
                                        placeholder="e.g. 400 sq.ft"
                                        value={newRoomForm.size}
                                        onChangeText={(text) => setNewRoomForm(prev => ({ ...prev, size: text }))}
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabelSmall}>VIEW TYPE</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="e.g. 180° Kanchenjunga View"
                                value={newRoomForm.view}
                                onChangeText={(text) => setNewRoomForm(prev => ({ ...prev, view: text }))}
                            />

                            <Text style={styles.inputLabelSmall}>ROOM FEATURES & AMENITIES (COMMA SEPARATED)</Text>
                            <TextInput
                                style={[styles.simpleInput, { height: 60, textAlignVertical: 'top' }]}
                                multiline
                                placeholder="e.g. King Bed, Mountain View, Geyser, Free WiFi"
                                value={newRoomForm.features}
                                onChangeText={(text) => setNewRoomForm(prev => ({ ...prev, features: text }))}
                            />

                            <Text style={[styles.inputLabelSmall, { marginTop: 4, marginBottom: 4 }]}>QUICK ADD FEATURE:</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {['Mountain View', 'Private Balcony', 'King Bed', 'Geyser', 'Electric Kettle', 'Wi-Fi', 'Room Heater', 'Living Area'].map((feat, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={{ backgroundColor: colors.ivoryWarm, borderWidth: 1, borderColor: colors.borderSubtle, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.xs }}
                                        onPress={() => {
                                            const current = (newRoomForm.features || '').trim();
                                            if (!current) {
                                                setNewRoomForm(prev => ({ ...prev, features: feat }));
                                            } else if (!current.toLowerCase().includes(feat.toLowerCase())) {
                                                setNewRoomForm(prev => ({ ...prev, features: `${current}, ${feat}` }));
                                            }
                                        }}
                                    >
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.forestDark }}>+ {feat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabelSmall}>COVER IMAGE URL</Text>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="https://..."
                                value={newRoomForm.imageUrl}
                                onChangeText={(text) => setNewRoomForm(prev => ({ ...prev, imageUrl: text }))}
                            />

                            <Text style={styles.inputLabelSmall}>DESCRIPTION</Text>
                            <TextInput
                                style={[styles.simpleInput, { height: 60, textAlignVertical: 'top' }]}
                                multiline
                                placeholder="Describe the room, ambiance, warmth and heritage..."
                                value={newRoomForm.description}
                                onChangeText={(text) => setNewRoomForm(prev => ({ ...prev, description: text }))}
                            />

                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCreateRoomModal(false)}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreateRoom}>
                                    <Text style={styles.btnTextWhite}>List Suite</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
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
    guestViewBtn: {
        backgroundColor: 'rgba(197, 160, 89, 0.2)',
        borderWidth: 1,
        borderColor: colors.gold,
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: radius.xs
    },
    guestViewBtnText: {
        color: colors.goldLight,
        fontSize: 11,
        fontWeight: '700'
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

    // Salesforce Pipeline Chevron Path
    pipelineSection: {
        marginBottom: 16
    },
    pipelineSectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.8,
        marginBottom: 6
    },
    pipelineScroll: {
        gap: 8
    },
    pipelineStep: {
        backgroundColor: colors.bgSurface,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: radius.sm,
        borderLeftWidth: 3,
        borderLeftColor: colors.borderMedium,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        minWidth: 140
    },
    pipelineStepActive: {
        backgroundColor: 'rgba(35, 72, 59, 0.08)',
        borderLeftColor: colors.forest,
        borderColor: colors.forest
    },
    pipelineStepTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.textMain,
        letterSpacing: 0.5
    },
    pipelineStepTitleActive: {
        color: colors.forestDark
    },
    pipelineStepCount: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '500',
        marginTop: 2
    },
    pipelineStepCountActive: {
        color: colors.forest,
        fontWeight: '700'
    },

    // 5 KPI Metric Cards
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
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderTopWidth: 3.5,
        ...shadows.subtle
    },
    kpiIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: colors.ivoryWarm,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6
    },
    kpiLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.8,
        marginBottom: 4
    },
    kpiValue: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2
    },
    kpiSub: {
        fontSize: 10,
        color: colors.textMuted
    },

    // Analytics Chart Cards
    chartCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.card
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14
    },
    chartTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.forestDark
    },
    chartSub: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 2
    },
    chartLegend: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        backgroundColor: colors.ivoryWarm,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.full
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 2
    },
    legendText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMain
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: 150,
        borderBottomWidth: 1.5,
        borderBottomColor: colors.borderMedium,
        paddingBottom: 4
    },
    barGroup: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%'
    },
    barsPair: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
        height: 120
    },
    barCol: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%'
    },
    barValText: {
        fontSize: 8,
        fontWeight: '700',
        color: colors.textMuted,
        marginBottom: 3
    },
    barTrack: {
        width: 22,
        height: 105,
        backgroundColor: 'rgba(35, 72, 59, 0.05)',
        borderRadius: 4,
        justifyContent: 'flex-end',
        overflow: 'hidden'
    },
    barFill: {
        width: '100%',
        borderRadius: 4
    },
    barMonthLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMain,
        marginTop: 6
    },
    chartEmptyText: {
        color: colors.textMuted,
        fontSize: 11,
        fontStyle: 'italic',
        alignSelf: 'center',
        marginBottom: 40
    },

    // Filter & Search
    filterSection: {
        marginBottom: 12
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgSurface,
        borderRadius: radius.sm,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        marginBottom: 8
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 13,
        color: colors.textMain
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
        color: colors.grey,
        textAlign: 'center'
    },

    // Booking Card
    bookingCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.card
    },
    bookingHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    guestAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(35, 72, 59, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(35, 72, 59, 0.2)'
    },
    guestAvatarText: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.forestDark
    },
    guestName: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.forestDark
    },
    bookingRef: {
        fontSize: 11,
        color: colors.textMuted
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    bookingDivider: {
        height: 1,
        backgroundColor: colors.borderSubtle,
        marginVertical: 10
    },
    bookingDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.5
    },
    detailVal: {
        fontSize: 12,
        color: colors.textMain
    },
    detailValBold: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.forestDark
    },
    priceHighlight: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.goldDark || '#99732B'
    },
    actionBtnRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
        flexWrap: 'wrap'
    },
    waBtn: {
        backgroundColor: colors.whatsapp,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.xs
    },
    callBtn: {
        backgroundColor: colors.forest,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.xs
    },
    confirmBtn: {
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.xs
    },
    statusChangeBtn: {
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: radius.xs
    },
    statusChangeBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMain
    },
    btnTextWhite: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700'
    },

    // Suites & Inventory
    addSuiteBtn: {
        backgroundColor: colors.forest,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.xs,
        flexDirection: 'row',
        alignItems: 'center'
    },
    addSuiteBtnText: {
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
        paddingVertical: 5,
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
        padding: 8,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    priceBadgeLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.grey,
        marginBottom: 2
    },
    priceBadgeVal: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.forestDark
    },
    blockDateCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 16,
        marginTop: 10,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    blockDateTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.forestDark,
        marginBottom: 4
    },
    blockDateSub: {
        fontSize: 11,
        color: colors.textMuted,
        marginBottom: 14
    },
    inputLabelSmall: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.5,
        marginBottom: 4
    },
    simpleInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: radius.xs,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        color: colors.textMain,
        marginBottom: 10
    },
    roomSelectRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10
    },
    roomChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.full,
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    roomChipActive: {
        backgroundColor: colors.forest,
        borderColor: colors.forest
    },
    roomChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.grey
    },
    roomChipTextActive: {
        color: colors.ivory,
        fontWeight: '700'
    },
    blockSubmitBtn: {
        backgroundColor: colors.forest,
        paddingVertical: 10,
        borderRadius: radius.xs,
        alignItems: 'center',
        marginTop: 6
    },
    blockedItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.ivoryWarm,
        padding: 10,
        borderRadius: radius.sm,
        marginTop: 6
    },
    blockedDateText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.forestDark
    },
    blockedRoomText: {
        fontSize: 10,
        color: colors.grey
    },
    unblockBtn: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.xs
    },
    unblockBtnText: {
        color: '#DC2626',
        fontSize: 11,
        fontWeight: '700'
    },

    // Walk-In Studio & Ledger
    cardHeaderWrap: {
        marginBottom: 12
    },
    formCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.card
    },
    mealCounterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.ivoryWarm,
        padding: 10,
        borderRadius: radius.sm,
        marginBottom: 8
    },
    mealLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.forestDark
    },
    mealSub: {
        fontSize: 10,
        color: colors.grey
    },
    counterBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.forest,
        alignItems: 'center',
        justifyContent: 'center'
    },
    counterBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700'
    },
    counterVal: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.forestDark,
        marginHorizontal: 12
    },
    ledgerCard: {
        backgroundColor: 'rgba(22, 46, 37, 0.04)',
        borderRadius: radius.sm,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.4)',
        marginVertical: 12
    },
    ledgerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    ledgerTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.forestDark,
        letterSpacing: 0.8
    },
    ledgerBadge: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.gold,
        backgroundColor: 'rgba(197, 160, 89, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4
    },
    ledgerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    ledgerLabel: {
        fontSize: 11,
        color: colors.textMuted
    },
    ledgerVal: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMain
    },
    ledgerDivider: {
        height: 1,
        backgroundColor: 'rgba(98, 92, 80, 0.2)',
        marginVertical: 6
    },
    ledgerTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    ledgerTotalLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.forestDark
    },
    ledgerTotalVal: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.gold
    },
    createOfflineBtn: {
        backgroundColor: colors.gold,
        paddingVertical: 12,
        borderRadius: radius.sm,
        alignItems: 'center',
        marginTop: 6
    },

    // Customer 360 CRM
    crmFilterScroll: {
        gap: 6,
        marginBottom: 12
    },
    crmChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.full,
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    crmChipActive: {
        backgroundColor: colors.forest,
        borderColor: colors.forest
    },
    crmChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.grey
    },
    crmChipTextActive: {
        color: colors.ivory
    },
    crmCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.card
    },
    crmHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    crmAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(197, 160, 89, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: colors.gold
    },
    crmAvatarText: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.forestDark
    },
    crmName: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.forestDark
    },
    crmPhone: {
        fontSize: 11,
        color: colors.grey
    },
    loyaltyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full
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
        marginBottom: 8
    },
    crmStatItem: {
        flex: 1
    },
    crmStatLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.grey,
        letterSpacing: 0.5
    },
    crmStatVal: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMain
    },
    crmStatValHighlight: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.gold
    },
    ltvMeterWrap: {
        marginVertical: 6
    },
    ltvMeterTrack: {
        height: 5,
        backgroundColor: 'rgba(98, 92, 80, 0.15)',
        borderRadius: 3,
        overflow: 'hidden'
    },
    ltvMeterFill: {
        height: '100%',
        borderRadius: 3
    },
    ltvMeterLabel: {
        fontSize: 9,
        color: colors.textMuted,
        marginTop: 3
    },
    crmActionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8
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

    // Coupons
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

    // Modals
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
    statusOptionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: radius.xs,
        borderWidth: 1.5,
        backgroundColor: colors.ivoryWarm
    },
    statusOptionText: {
        fontSize: 13,
        fontWeight: '700'
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
