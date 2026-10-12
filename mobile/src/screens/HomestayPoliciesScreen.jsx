import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, radius, shadows } from '../theme';

const HomestayPoliciesScreen = ({ navigation }) => {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerSubtitle}>GUIDELINES</Text>
                    <Text style={styles.headerTitle}>House & Refund Rules</Text>
                </View>
            </View>

            <View style={styles.body}>
                {/* Timings */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🕒 Check-in & Check-out</Text>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Check-in time:</Text> 12:00 PM (Noon)</Text>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Check-out time:</Text> 11:00 AM</Text>
                    <Text style={styles.bullet}>• Early arrival or late departure can be arranged subject to availability upon informing the host beforehand.</Text>
                </View>

                {/* Cancellation Policy */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>💳 Cancellation & Refunds</Text>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Full Refund:</Text> Cancellations made 7 or more days prior to scheduled check-in receive a 100% refund.</Text>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Partial Refund (50%):</Text> Cancellations between 3 to 7 days receive a 50% refund.</Text>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Non-Refundable:</Text> Cancellations within 48 hours of check-in are non-refundable due to limited suite inventory.</Text>
                </View>

                {/* Homestay Etiquette */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🌲 Hillside Etiquette</Text>
                    <Text style={styles.bullet}>• Bethany Homestay is located in a quiet Himalayan residential area. Please respect peaceful quiet hours from 10:00 PM to 6:00 AM.</Text>
                    <Text style={styles.bullet}>• Smoking is strictly restricted to outdoor terraces and open balconies.</Text>
                    <Text style={styles.bullet}>• Please conserve water and electricity as hill resources are precious.</Text>
                </View>

                {/* Meals */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🍽️ Meal Coordination</Text>
                    <Text style={styles.bullet}>• Breakfast is served from 7:30 AM to 9:30 AM.</Text>
                    <Text style={styles.bullet}>• Lunch: 12:00 PM to 2:00 PM | Dinner: 8:00 PM to 10:00 PM.</Text>
                    <Text style={styles.bullet}>• Please advise our hosts of dietary restrictions (pure veg, no onion/garlic, etc.) ahead of meal preparation.</Text>
                </View>

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
        fontSize: 15,
        fontWeight: '700',
        color: colors.forestDark,
        marginBottom: 10
    },
    bullet: {
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 18,
        marginBottom: 6
    },
    bold: {
        fontWeight: '700',
        color: colors.textMain
    }
});

export default HomestayPoliciesScreen;
