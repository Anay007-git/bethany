import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Linking
} from 'react-native';
import { colors, radius, shadows } from '../theme';
import { DEFAULT_ROOMS, getSeasonalRoomPrice } from '../services/pricingService';
import { MobileSupabaseService } from '../services/SupabaseService';

const HomeScreen = ({ navigation }) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const [checkIn, setCheckIn] = useState(today);
    const [checkOut, setCheckOut] = useState(tomorrow);
    const [guests, setGuests] = useState('2');
    const [rooms, setRooms] = useState(DEFAULT_ROOMS);

    const loadRooms = async () => {
        try {
            const dbRooms = await MobileSupabaseService.getRooms();
            if (dbRooms && dbRooms.length > 0) {
                const mapped = dbRooms.map(r => ({
                    id: r.id,
                    name: r.name,
                    priceLowSeason: Number(r.price_low_season || 2500),
                    priceHighSeason: Number(r.price_high_season || 3000),
                    price_low_season: Number(r.price_low_season || 2500),
                    price_high_season: Number(r.price_high_season || 3000),
                    capacity: r.capacity || '4 Adults',
                    view: r.view_type || r.view || 'Mountain View',
                    size: r.size || '380 sq.ft',
                    extraBed: r.extra_bed || (r.id === 'carmel' ? 'Extra 1 Mattress' : r.id === 'sion' ? 'Extra 1 Cot' : null),
                    features: r.features && r.features.length > 0 ? r.features : ['Attached Bathroom', 'Wi-Fi', 'Daily Housekeeping'],
                    images: r.images && r.images.length > 0 ? r.images : DEFAULT_ROOMS.find(dr => dr.id === r.id)?.images || ['https://r1imghtlak.mmtcdn.com/bc566280898d11ec90380a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500'],
                    description: r.description || DEFAULT_ROOMS.find(dr => dr.id === r.id)?.description || ''
                }));
                setRooms(mapped);
            }
        } catch (err) {
            console.log('Error loading rooms on home:', err);
        }
    };

    useEffect(() => {
        loadRooms();
        const unsubscribe = navigation?.addListener ? navigation.addListener('focus', loadRooms) : undefined;
        return unsubscribe;
    }, [navigation]);

    const handleQuickSearch = () => {
        navigation.navigate('BookingFlow', {
            initialCheckIn: checkIn,
            initialCheckOut: checkOut,
            initialGuests: guests
        });
    };

    const handleWhatsApp = () => {
        Linking.openURL('https://wa.me/918348993048?text=Hello%20Bethany%20Homestay,%20I%20am%20interested%20in%20reserving%20a%20stay.');
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Hero Banner */}
            <View style={styles.heroBanner}>
                <Image
                    source={{ uri: 'https://r1imghtlak.mmtcdn.com/bc566280898d11ec90380a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500' }}
                    style={styles.heroImage}
                />
                <View style={styles.heroOverlay}>
                    <View style={styles.heroTopRow}>
                        <View style={styles.elevationBadge}>
                            <Text style={styles.elevationText}>📍 1,250 M · KALIMPONG</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.staffPortalBadge}
                            onPress={() => navigation.navigate('AdminLogin')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.staffPortalBadgeText}>🔐 Staff</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.heroTitle}>Wake Up Above The Himalayan Clouds</Text>
                    <Text style={styles.heroSubtitle}>Unobstructed views of Mt. Kanchenjunga & authentic organic hospitality</Text>

                    <View style={styles.googleBadge}>
                        <Text style={styles.googleText}>★ 4.9 on Google · 120+ Verified Reviews</Text>
                    </View>
                </View>
            </View>

            {/* Quick Availability Search Card */}
            <View style={styles.searchCard}>
                <Text style={styles.searchCardTitle}>Plan Your Himalayan Escape</Text>

                <View style={styles.searchRow}>
                    <View style={styles.searchItem}>
                        <Text style={styles.searchLabel}>CHECK-IN</Text>
                        <Text style={styles.searchValue}>{checkIn}</Text>
                    </View>

                    <View style={styles.searchDivider} />

                    <View style={styles.searchItem}>
                        <Text style={styles.searchLabel}>CHECK-OUT</Text>
                        <Text style={styles.searchValue}>{checkOut}</Text>
                    </View>

                    <View style={styles.searchDivider} />

                    <View style={styles.searchItem}>
                        <Text style={styles.searchLabel}>GUESTS</Text>
                        <Text style={styles.searchValue}>{guests} Guests</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleQuickSearch}
                    activeOpacity={0.85}
                >
                    <Text style={styles.searchButtonText}>Check Availability & Rates →</Text>
                </TouchableOpacity>
            </View>

            {/* Exclusive Mobile Privilege: Family & Couple Monthly Room Subscription */}
            <View style={styles.subscriptionBannerCard}>
                <View style={styles.subscriptionTopRow}>
                    <View style={styles.subPrivilegeBadge}>
                        <Text style={styles.subPrivilegeBadgeText}>⭐ MEMBER RESIDENCY</Text>
                    </View>
                    <Text style={styles.subCommitmentTag}>3-Month AutoPay</Text>
                </View>
                <Text style={styles.subscriptionHeading}>Family & Couple Monthly Subscription</Text>
                <Text style={styles.subscriptionSubtitle}>
                    Enjoy 5–6 guaranteed mountain suite nights every month for up to 4 occupants with dedicated member calendar allocations.
                </Text>

                <View style={styles.subPillsRow}>
                    <View style={styles.subPill}>
                        <Text style={styles.subPillText}>💑 Couples & Families</Text>
                    </View>
                    <View style={styles.subPill}>
                        <Text style={styles.subPillText}>📅 Dedicated Inventory</Text>
                    </View>
                    <View style={styles.subPill}>
                        <Text style={styles.subPillText}>🔒 Zero Surge Pricing</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.subscriptionCtaBtn}
                    onPress={() => navigation.navigate('SubscriptionIntro')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.subscriptionCtaBtnText}>Explore Residency & Apply →</Text>
                </TouchableOpacity>
            </View>

            {/* Featured Suites Preview */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTag}>PRIVATE SUITES</Text>
                        <Text style={styles.sectionTitle}>Our {rooms.length > 0 ? rooms.length : 4} Boutique Rooms</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Suites')}>
                        <Text style={styles.seeAllText}>See All →</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {rooms.map(room => {
                        const currentPrice = getSeasonalRoomPrice(new Date(), room.id, rooms);
                        return (
                            <TouchableOpacity
                                key={room.id}
                                style={styles.roomCard}
                                activeOpacity={0.9}
                                onPress={() => navigation.navigate('RoomDetail', { room })}
                            >
                                <Image source={{ uri: room.images[0] }} style={styles.roomImage} />
                                <View style={styles.roomBadge}>
                                    <Text style={styles.roomBadgeText}>{room.view}</Text>
                                </View>
                                <View style={styles.roomCardBody}>
                                    <Text style={styles.roomName}>{room.name}</Text>
                                    <Text style={styles.roomMeta}>{room.capacity} · {room.size}</Text>
                                    <View style={styles.roomPriceRow}>
                                        <Text style={styles.roomPrice}>₹{currentPrice.toLocaleString('en-IN')} <Text style={styles.roomPerNight}>/ night</Text></Text>
                                        <Text style={styles.bookActionText}>View Details →</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Verified Amenities */}
            <View style={styles.section}>
                <Text style={styles.sectionTag}>EXPERIENCE</Text>
                <Text style={styles.sectionTitle}>What Awaits You</Text>

                <View style={styles.amenitiesGrid}>
                    <View style={styles.amenityCard}>
                        <Text style={styles.amenityIcon}>🏔️</Text>
                        <Text style={styles.amenityTitle}>180° Kanchenjunga</Text>
                        <Text style={styles.amenityDesc}>Direct view from rooms & terrace</Text>
                    </View>

                    <View style={styles.amenityCard}>
                        <Text style={styles.amenityIcon}>🥗</Text>
                        <Text style={styles.amenityTitle}>Organic Kitchen</Text>
                        <Text style={styles.amenityDesc}>Fresh home-cooked hill meals</Text>
                    </View>

                    <View style={styles.amenityCard}>
                        <Text style={styles.amenityIcon}>📶</Text>
                        <Text style={styles.amenityTitle}>Fast Wi-Fi</Text>
                        <Text style={styles.amenityDesc}>Workation & streaming ready</Text>
                    </View>

                    <View style={styles.amenityCard}>
                        <Text style={styles.amenityIcon}>🚿</Text>
                        <Text style={styles.amenityTitle}>24/7 Hot Water</Text>
                        <Text style={styles.amenityDesc}>En-suite western bathrooms</Text>
                    </View>
                </View>
            </View>

            {/* Direct Host Contact Banner */}
            <View style={styles.hostCard}>
                <View style={styles.hostInfo}>
                    <Text style={styles.hostTitle}>Need personalized assistance?</Text>
                    <Text style={styles.hostSubtitle}>Speak directly with hosts Mr. Wangchuck & Family for customized hill packages and cab bookings.</Text>
                </View>

                <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
                    <Text style={styles.whatsappBtnText}>💬 WhatsApp Concierge</Text>
                </TouchableOpacity>
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
    heroBanner: {
        height: 380,
        position: 'relative'
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(22, 46, 37, 0.62)',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 24,
        justifyContent: 'flex-end'
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    elevationBadge: {
        backgroundColor: 'rgba(244, 239, 230, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: radius.full,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(244, 239, 230, 0.3)'
    },
    elevationText: {
        color: colors.gold,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1
    },
    staffPortalBadge: {
        backgroundColor: 'rgba(22, 46, 37, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.gold
    },
    staffPortalBadgeText: {
        color: colors.ivory,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    heroTitle: {
        color: colors.ivory,
        fontSize: 26,
        fontWeight: '700',
        lineHeight: 32,
        marginBottom: 8
    },
    heroSubtitle: {
        color: colors.beige,
        fontSize: 13,
        lineHeight: 18,
        opacity: 0.9,
        marginBottom: 14
    },
    googleBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.xs
    },
    googleText: {
        color: colors.goldLight,
        fontSize: 11,
        fontWeight: '700'
    },
    searchCard: {
        marginHorizontal: 16,
        marginTop: -30,
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.card
    },
    searchCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.ivoryWarm,
        borderRadius: radius.sm,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: 14
    },
    searchItem: {
        flex: 1,
        alignItems: 'center'
    },
    searchDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.borderMedium
    },
    searchLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.grey,
        marginBottom: 2
    },
    searchValue: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.forestDark
    },
    searchButton: {
        backgroundColor: colors.forest,
        paddingVertical: 12,
        borderRadius: radius.sm,
        alignItems: 'center'
    },
    searchButtonText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '700'
    },
    section: {
        marginTop: 28,
        paddingHorizontal: 16
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 14
    },
    sectionTag: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.terracotta,
        letterSpacing: 1,
        marginBottom: 2
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.forestDark
    },
    seeAllText: {
        color: colors.forest,
        fontSize: 13,
        fontWeight: '600'
    },
    horizontalScroll: {
        marginHorizontal: -16,
        paddingHorizontal: 16
    },
    roomCard: {
        width: 260,
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        overflow: 'hidden',
        marginRight: 14,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    roomImage: {
        width: '100%',
        height: 140,
        resizeMode: 'cover'
    },
    roomBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(22, 46, 37, 0.85)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full
    },
    roomBadgeText: {
        color: colors.ivory,
        fontSize: 10,
        fontWeight: '700'
    },
    roomCardBody: {
        padding: 12
    },
    roomName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 2
    },
    roomMeta: {
        fontSize: 11,
        color: colors.grey,
        marginBottom: 10
    },
    roomPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    roomPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.forest
    },
    roomPerNight: {
        fontSize: 10,
        fontWeight: '400',
        color: colors.grey
    },
    bookActionText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.terracotta
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 12
    },
    amenityCard: {
        width: '48%',
        backgroundColor: colors.bgSurface,
        padding: 14,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    amenityIcon: {
        fontSize: 22,
        marginBottom: 6
    },
    amenityTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 2
    },
    amenityDesc: {
        fontSize: 11,
        color: colors.grey,
        lineHeight: 14
    },
    hostCard: {
        marginHorizontal: 16,
        marginTop: 28,
        backgroundColor: colors.forestDark,
        borderRadius: radius.md,
        padding: 20
    },
    hostTitle: {
        color: colors.ivory,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6
    },
    hostSubtitle: {
        color: colors.beige,
        fontSize: 12,
        lineHeight: 17,
        opacity: 0.9,
        marginBottom: 16
    },
    whatsappBtn: {
        backgroundColor: colors.whatsapp,
        paddingVertical: 11,
        borderRadius: radius.sm,
        alignItems: 'center'
    },
    whatsappBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700'
    },
    subscriptionBannerCard: {
        marginHorizontal: 16,
        marginTop: 18,
        backgroundColor: colors.forestDark,
        borderRadius: radius.md,
        padding: 18,
        borderWidth: 1.5,
        borderColor: colors.gold,
        ...shadows.card
    },
    subscriptionTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    subPrivilegeBadge: {
        backgroundColor: colors.gold,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full
    },
    subPrivilegeBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.forestDark,
        letterSpacing: 0.8
    },
    subCommitmentTag: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.beige
    },
    subscriptionHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.ivory,
        marginBottom: 4
    },
    subscriptionSubtitle: {
        fontSize: 12,
        color: colors.beige,
        lineHeight: 17,
        opacity: 0.95,
        marginBottom: 12
    },
    subPillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 14
    },
    subPill: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.xs
    },
    subPillText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.ivory
    },
    subscriptionCtaBtn: {
        backgroundColor: colors.forest,
        borderWidth: 1,
        borderColor: colors.gold,
        paddingVertical: 12,
        borderRadius: radius.xs,
        alignItems: 'center'
    },
    subscriptionCtaBtnText: {
        color: colors.ivory,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5
    }
});

export default HomeScreen;
