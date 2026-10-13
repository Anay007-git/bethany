import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { colors, radius, shadows } from '../theme';

const ContactScreen = ({ navigation }) => {
    const handleCall = (num) => {
        Linking.openURL(`tel:${num}`);
    };

    const handleWhatsApp = (num) => {
        Linking.openURL(`https://wa.me/${num.replace(/\D/g, '')}?text=Hello%20Bethany%20Homestay,%20I%20am%20inquiring%20about%20a%20stay.`);
    };

    const handleEmail = () => {
        Linking.openURL('mailto:namastehills.kol@gmail.com');
    };

    const handleMaps = () => {
        Linking.openURL('https://maps.google.com/?q=Dr.+Graham%27s+Homes,+Kalimpong');
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerSubtitle}>HOST CONCIERGE</Text>
                <Text style={styles.headerTitle}>Contact & Location</Text>
                <Text style={styles.headerDesc}>
                    Get in touch with your hosts Mr. Wangchuck & Family for direct booking inquiries and Kalimpong travel advice.
                </Text>
            </View>

            <View style={styles.body}>
                {/* Host Numbers Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Host Phone & WhatsApp</Text>

                    <View style={styles.contactItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.contactLabel}>PRIMARY HOST</Text>
                            <Text style={styles.contactValue}>+91 83489 93048</Text>
                        </View>
                        <View style={styles.actionBtns}>
                            <TouchableOpacity
                                style={styles.whatsappActionBtn}
                                onPress={() => handleWhatsApp('+918348993048')}
                            >
                                <Text style={styles.actionBtnText}>💬 WhatsApp</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.callActionBtn}
                                onPress={() => handleCall('+918348993048')}
                            >
                                <Text style={styles.actionBtnText}>📞 Call</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.contactItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.contactLabel}>SECONDARY LINE</Text>
                            <Text style={styles.contactValue}>+91 89109 11758</Text>
                        </View>
                        <View style={styles.actionBtns}>
                            <TouchableOpacity
                                style={styles.whatsappActionBtn}
                                onPress={() => handleWhatsApp('+918910911758')}
                            >
                                <Text style={styles.actionBtnText}>💬 WhatsApp</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.callActionBtn}
                                onPress={() => handleCall('+918910911758')}
                            >
                                <Text style={styles.actionBtnText}>📞 Call</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Email & Address */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Email Concierge</Text>
                    <TouchableOpacity onPress={handleEmail}>
                        <Text style={styles.emailText}>namastehills.kol@gmail.com ↗</Text>
                    </TouchableOpacity>
                </View>

                {/* Physical Location */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Homestay Address & Elevation</Text>
                    <Text style={styles.addressText}>
                        Graham's Home Block B, Dr. Graham's Homes, Kalimpong-I{'\n'}
                        Kalimpong, West Bengal 734301, India{'\n'}
                        <Text style={{ fontWeight: '700' }}>Landmark:</Text> Near Science Centre{'\n'}
                        <Text style={{ fontWeight: '700' }}>Altitude:</Text> 1,250 Meters
                    </Text>

                    <TouchableOpacity style={styles.mapsBtn} onPress={handleMaps}>
                        <Text style={styles.mapsBtnText}>📍 Open In Maps App ↗</Text>
                    </TouchableOpacity>
                </View>

                {/* Policies Link */}
                <TouchableOpacity
                    style={styles.policiesCard}
                    onPress={() => navigation.navigate('Policies')}
                    activeOpacity={0.85}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={styles.policiesTitle}>House Guidelines & Cancellation Terms</Text>
                        <Text style={styles.policiesSub}>Review check-in rules, refund timelines, and homestay policies.</Text>
                    </View>
                    <Text style={styles.arrowIcon}>→</Text>
                </TouchableOpacity>

                {/* Staff Admin Portal Access */}
                <TouchableOpacity
                    style={styles.adminCard}
                    onPress={() => navigation.navigate('AdminLogin')}
                    activeOpacity={0.85}
                >
                    <View style={styles.adminIconBox}>
                        <Text style={{ fontSize: 18 }}>🔐</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.adminCardTitle}>Staff Administration Suite</Text>
                        <Text style={styles.adminCardSub}>Concierge login · Live bookings · Tariff manager · CRM</Text>
                    </View>
                    <Text style={styles.adminArrowIcon}>→</Text>
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
    body: {
        padding: 16
    },
    card: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 12
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    contactLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.grey,
        marginBottom: 2
    },
    contactValue: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMain
    },
    actionBtns: {
        flexDirection: 'row',
        gap: 6
    },
    whatsappActionBtn: {
        backgroundColor: colors.whatsapp,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.xs
    },
    callActionBtn: {
        backgroundColor: colors.forest,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.xs
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700'
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderSubtle,
        marginVertical: 12
    },
    emailText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.forest
    },
    addressText: {
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 18,
        marginBottom: 12
    },
    mapsBtn: {
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        paddingVertical: 10,
        borderRadius: radius.xs,
        alignItems: 'center'
    },
    mapsBtnText: {
        color: colors.forestDark,
        fontSize: 12,
        fontWeight: '700'
    },
    policiesCard: {
        backgroundColor: colors.beigeLight,
        borderRadius: radius.md,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderMedium
    },
    policiesTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 3
    },
    policiesSub: {
        fontSize: 11,
        color: colors.grey
    },
    arrowIcon: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.forest,
        marginLeft: 12
    },
    adminCard: {
        backgroundColor: colors.forestDark,
        borderRadius: radius.md,
        padding: 16,
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.gold,
        ...shadows.card
    },
    adminIconBox: {
        width: 36,
        height: 36,
        borderRadius: radius.xs,
        backgroundColor: 'rgba(197, 160, 89, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    adminCardTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.ivory,
        marginBottom: 2
    },
    adminCardSub: {
        fontSize: 10,
        color: colors.beige,
        opacity: 0.85
    },
    adminArrowIcon: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.goldLight,
        marginLeft: 10
    }
});

export default ContactScreen;
