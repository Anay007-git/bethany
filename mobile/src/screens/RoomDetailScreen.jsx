import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions
} from 'react-native';
import { colors, radius, shadows } from '../theme';

const { width } = Dimensions.get('window');

const RoomDetailScreen = ({ route, navigation }) => {
    const { room } = route.params;
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const handleScroll = (event) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveImageIndex(slideIndex);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Photo Carousel */}
                <View style={styles.carouselContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {room.images.map((imgUri, index) => (
                            <Image
                                key={index}
                                source={{ uri: imgUri }}
                                style={styles.slideImage}
                            />
                        ))}
                    </ScrollView>

                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backBtnText}>←</Text>
                    </TouchableOpacity>

                    {/* Image Counter Badge */}
                    <View style={styles.counterBadge}>
                        <Text style={styles.counterText}>
                            {activeImageIndex + 1} / {room.images.length}
                        </Text>
                    </View>
                </View>

                {/* Content Body */}
                <View style={styles.body}>
                    <View style={styles.viewBadge}>
                        <Text style={styles.viewBadgeText}>{room.view}</Text>
                    </View>

                    <Text style={styles.roomTitle}>{room.name}</Text>
                    <Text style={styles.specsText}>{room.capacity} · {room.size}</Text>

                    {room.extraBed && (
                        <View style={styles.extraBedBox}>
                            <Text style={styles.extraBedText}>🛏️ {room.extraBed}</Text>
                        </View>
                    )}

                    {/* Seasonal Rates Breakdown */}
                    <View style={styles.seasonalCard}>
                        <Text style={styles.seasonalTitle}>Authoritative Rates</Text>
                        <View style={styles.seasonRow}>
                            <Text style={styles.seasonLabel}>Standard Season:</Text>
                            <Text style={styles.seasonPrice}>₹{room.priceLowSeason} / night</Text>
                        </View>
                        <View style={styles.seasonRow}>
                            <Text style={styles.seasonLabel}>Peak Season (Dec-Jan, Mar-Apr, Oct-Nov):</Text>
                            <Text style={styles.seasonPricePeak}>₹{room.priceHighSeason} / night</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.sectionHeader}>Suite Overview</Text>
                    <Text style={styles.descText}>{room.description}</Text>

                    {/* Verified Facilities */}
                    <Text style={styles.sectionHeader}>Facilities & Features</Text>
                    <View style={styles.featuresList}>
                        {room.features.map((feat, i) => (
                            <View key={i} style={styles.featureItem}>
                                <Text style={styles.checkIcon}>✓</Text>
                                <Text style={styles.featureItemText}>{feat}</Text>
                            </View>
                        ))}
                        <View style={styles.featureItem}>
                            <Text style={styles.checkIcon}>✓</Text>
                            <Text style={styles.featureItemText}>24/7 Geyser Hot Water</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.checkIcon}>✓</Text>
                            <Text style={styles.featureItemText}>Organic Mountain Breakfast Options</Text>
                        </View>
                    </View>

                    {/* Homestay Guidelines */}
                    <View style={styles.guidelinesBox}>
                        <Text style={styles.guidelinesTitle}>Homestay House Rules</Text>
                        <Text style={styles.guidelinesItem}>• Check-in: 12:00 PM | Check-out: 11:00 AM</Text>
                        <Text style={styles.guidelinesItem}>• Peaceful mountain sanctuary: Quiet hours 10 PM - 6 AM</Text>
                        <Text style={styles.guidelinesItem}>• Free parking on premises</Text>
                    </View>

                    <View style={{ height: 90 }} />
                </View>
            </ScrollView>

            {/* Sticky Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={styles.bottomBarPrice}>₹{room.priceLowSeason}</Text>
                    <Text style={styles.bottomBarSub}>Starting rate / night</Text>
                </View>

                <TouchableOpacity
                    style={styles.bottomBookBtn}
                    onPress={() => navigation.navigate('BookingFlow', { preSelectedRoom: room })}
                    activeOpacity={0.85}
                >
                    <Text style={styles.bottomBookBtnText}>Reserve Suite →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPage
    },
    carouselContainer: {
        height: 290,
        position: 'relative'
    },
    slideImage: {
        width: width,
        height: 290,
        resizeMode: 'cover'
    },
    backBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(22, 46, 37, 0.75)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    backBtnText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold'
    },
    counterBadge: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full
    },
    counterText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700'
    },
    body: {
        padding: 20
    },
    viewBadge: {
        backgroundColor: colors.forestSubtle,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full,
        alignSelf: 'flex-start',
        marginBottom: 8
    },
    viewBadgeText: {
        color: colors.forest,
        fontSize: 11,
        fontWeight: '700'
    },
    roomTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 4
    },
    specsText: {
        fontSize: 13,
        color: colors.grey,
        marginBottom: 12
    },
    extraBedBox: {
        backgroundColor: colors.ivoryWarm,
        padding: 10,
        borderRadius: radius.xs,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: 16
    },
    extraBedText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.forest
    },
    seasonalCard: {
        backgroundColor: colors.bgSurface,
        padding: 16,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: 20,
        ...shadows.subtle
    },
    seasonalTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 8
    },
    seasonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    seasonLabel: {
        fontSize: 11,
        color: colors.grey
    },
    seasonPrice: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.forest
    },
    seasonPricePeak: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.terracotta
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.forestDark,
        marginTop: 10,
        marginBottom: 8
    },
    descText: {
        fontSize: 13,
        lineHeight: 19,
        color: colors.textMuted,
        marginBottom: 16
    },
    featuresList: {
        backgroundColor: colors.bgSurface,
        padding: 16,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: 16
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    checkIcon: {
        color: colors.forest,
        fontWeight: 'bold',
        fontSize: 13,
        marginRight: 8
    },
    featureItemText: {
        fontSize: 12,
        color: colors.textMain
    },
    guidelinesBox: {
        backgroundColor: colors.ivoryWarm,
        padding: 14,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle
    },
    guidelinesTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 6
    },
    guidelinesItem: {
        fontSize: 11,
        color: colors.grey,
        lineHeight: 16
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.bgSurface,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: colors.borderSubtle,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.elevated
    },
    bottomBarPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.forest
    },
    bottomBarSub: {
        fontSize: 10,
        color: colors.grey
    },
    bottomBookBtn: {
        backgroundColor: colors.forest,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: radius.sm
    },
    bottomBookBtnText: {
        color: colors.ivory,
        fontSize: 13,
        fontWeight: '700'
    }
});

export default RoomDetailScreen;
