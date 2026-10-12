import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator
} from 'react-native';
import { colors, radius, shadows } from '../theme';
import { MobileSupabaseService } from '../services/SupabaseService';
import { DEFAULT_ROOMS } from '../services/pricingService';

const RoomsScreen = ({ navigation }) => {
    const [rooms, setRooms] = useState(DEFAULT_ROOMS);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        setLoading(true);
        try {
            const dbRooms = await MobileSupabaseService.getRooms();
            if (dbRooms && dbRooms.length > 0) {
                const mapped = dbRooms.map(r => ({
                    id: r.id,
                    name: r.name,
                    priceLowSeason: Number(r.price_low_season || 2500),
                    priceHighSeason: Number(r.price_high_season || 3000),
                    capacity: r.capacity || '4 Adults',
                    view: r.view_type || r.view || 'Mountain View',
                    size: r.size || '380 sq.ft',
                    extraBed: r.id === 'carmel' ? 'Extra 1 Mattress' : r.id === 'sion' ? 'Extra 1 Cot' : null,
                    features: r.features && r.features.length > 0 ? r.features : ['Attached Bathroom', 'Wi-Fi', 'Daily Housekeeping'],
                    images: r.images && r.images.length > 0 ? r.images : DEFAULT_ROOMS.find(dr => dr.id === r.id)?.images || [],
                    description: r.description || DEFAULT_ROOMS.find(dr => dr.id === r.id)?.description || ''
                }));
                setRooms(mapped);
            }
        } catch {
            setRooms(DEFAULT_ROOMS);
        } finally {
            setLoading(false);
        }
    };

    const renderRoomCard = ({ item }) => (
        <View style={styles.roomCard}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('RoomDetail', { room: item })}
            >
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.images[0] }} style={styles.roomImage} />
                    <View style={styles.viewBadge}>
                        <Text style={styles.viewBadgeText}>{item.view}</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <View style={styles.cardContent}>
                <View style={styles.titleRow}>
                    <Text style={styles.roomName}>{item.name}</Text>
                    <View style={styles.rateBox}>
                        <Text style={styles.priceText}>₹{item.priceLowSeason}</Text>
                        <Text style={styles.perNightText}>/ night</Text>
                    </View>
                </View>

                <Text style={styles.roomSpecs}>{item.capacity} · {item.size}</Text>

                {item.extraBed && (
                    <View style={styles.extraBedPill}>
                        <Text style={styles.extraBedText}>🛏️ {item.extraBed}</Text>
                    </View>
                )}

                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>

                {/* Features Pills */}
                <View style={styles.featuresRow}>
                    {item.features.slice(0, 3).map((feat, idx) => (
                        <View key={idx} style={styles.featurePill}>
                            <Text style={styles.featureText}>{feat}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => navigation.navigate('RoomDetail', { room: item })}
                    >
                        <Text style={styles.detailsBtnText}>View Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bookBtn}
                        onPress={() => navigation.navigate('BookingFlow', { preSelectedRoom: item })}
                    >
                        <Text style={styles.bookBtnText}>Book Room</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerSubtitle}>KALIMPONG SANCTUARY</Text>
                <Text style={styles.headerTitle}>Available Suites</Text>
                <Text style={styles.headerDesc}>
                    All 4 private rooms feature attached western bathrooms, geyser hot water, and tranquil hillside balconies.
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.forest} />
                    <Text style={styles.loadingText}>Fetching available suites...</Text>
                </View>
            ) : (
                <FlatList
                    data={rooms}
                    keyExtractor={item => item.id}
                    renderItem={renderRoomCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
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
    listContent: {
        padding: 16,
        paddingBottom: 40
    },
    roomCard: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: 20,
        ...shadows.card
    },
    imageContainer: {
        height: 190,
        position: 'relative'
    },
    roomImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    viewBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(22, 46, 37, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full
    },
    viewBadgeText: {
        color: colors.ivory,
        fontSize: 11,
        fontWeight: '700'
    },
    cardContent: {
        padding: 16
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2
    },
    roomName: {
        fontSize: 19,
        fontWeight: '700',
        color: colors.forestDark
    },
    rateBox: {
        flexDirection: 'row',
        alignItems: 'baseline'
    },
    priceText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.forest
    },
    perNightText: {
        fontSize: 11,
        color: colors.grey,
        marginLeft: 2
    },
    roomSpecs: {
        fontSize: 12,
        color: colors.grey,
        marginBottom: 8
    },
    extraBedPill: {
        backgroundColor: colors.forestSubtle,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.xs,
        alignSelf: 'flex-start',
        marginBottom: 10
    },
    extraBedText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.forest
    },
    description: {
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 17,
        marginBottom: 12
    },
    featuresRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16
    },
    featurePill: {
        backgroundColor: colors.ivoryWarm,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.xs,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    featureText: {
        fontSize: 10,
        color: colors.textMain,
        fontWeight: '500'
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10
    },
    detailsBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        alignItems: 'center',
        backgroundColor: colors.beigeLight
    },
    detailsBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.forestDark
    },
    bookBtn: {
        flex: 1.2,
        paddingVertical: 10,
        borderRadius: radius.sm,
        alignItems: 'center',
        backgroundColor: colors.forest
    },
    bookBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.ivory
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80
    },
    loadingText: {
        marginTop: 12,
        fontSize: 13,
        color: colors.grey
    }
});

export default RoomsScreen;
