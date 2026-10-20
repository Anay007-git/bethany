import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Switch
} from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';
import SubscriptionService from '../services/subscriptionService';

const MAX_OCCUPANTS = 4;

const SubscriptionApplicationScreen = ({ route, navigation }) => {
    const user = route?.params?.user || null;
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeUser, setActiveUser] = useState(user);

    // Form State
    const [category, setCategory] = useState('couple'); // 'couple' | 'family'
    const [primaryName, setPrimaryName] = useState(user?.full_name || '');
    const [primaryEmail, setPrimaryEmail] = useState(user?.email || '');
    const [primaryPhone, setPrimaryPhone] = useState(user?.phone || '');
    const [primaryAddress, setPrimaryAddress] = useState('');
    const [idProofType, setIdProofType] = useState('Aadhaar Card');
    const [idProofNumber, setIdProofNumber] = useState('');
    const [rulesAccepted, setRulesAccepted] = useState(false);

    // Admin notes (if status was additional_info_required)
    const [adminCorrectionNotes, setAdminCorrectionNotes] = useState('');

    // Occupants list: 1st is primary applicant (locked relationship: Self)
    const [occupants, setOccupants] = useState([
        { full_name: user?.full_name || '', age: '32', relationship: 'Self (Primary Applicant)' }
    ]);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        let currentUser = activeUser;
        if (!currentUser) {
            currentUser = await SubscriptionService.getCurrentUserSession();
            setActiveUser(currentUser);
        }

        if (!currentUser) {
            setLoading(false);
            Alert.alert('Session Required', 'Please sign in or register to complete your application.', [
                { text: 'OK', onPress: () => navigation.replace('SubscriptionAuth') }
            ]);
            return;
        }

        try {
            const appRes = await SubscriptionService.getUserApplication(currentUser.id);
            if (appRes.success && appRes.application) {
                const app = appRes.application;
                setCategory(app.category || 'couple');
                setPrimaryName(app.primary_name || currentUser.full_name);
                setPrimaryEmail(app.primary_email || currentUser.email);
                setPrimaryPhone(app.primary_phone || '');
                setPrimaryAddress(app.primary_address || '');
                setIdProofType(app.id_proof_type || 'Aadhaar Card');
                setIdProofNumber(app.id_proof_number || '');
                setRulesAccepted(app.rules_accepted || false);
                if (app.admin_notes) setAdminCorrectionNotes(app.admin_notes);

                if (app.subscription_occupants && app.subscription_occupants.length > 0) {
                    setOccupants(app.subscription_occupants.map(o => ({
                        full_name: o.full_name,
                        age: String(o.age || 30),
                        relationship: o.relationship
                    })));
                }
            } else {
                setPrimaryName(currentUser.full_name || '');
                setPrimaryEmail(currentUser.email || '');
            }
        } catch (err) {
            console.log('Error loading initial application:', err);
        } finally {
            setLoading(false);
        }
    };

    // Category toggle handler
    const handleCategoryChange = (newCat) => {
        setCategory(newCat);
        if (newCat === 'couple' && occupants.length > 2) {
            Alert.alert(
                'Occupant Limit Notice',
                'Couple tier accommodates up to 2 occupants. Only the first 2 occupants will be kept.',
                [
                    { text: 'Cancel' },
                    { text: 'Proceed', onPress: () => setOccupants(occupants.slice(0, 2)) }
                ]
            );
        }
    };

    // Add Occupant (Max 4 enforced)
    const handleAddOccupant = () => {
        const maxLimit = category === 'couple' ? 2 : MAX_OCCUPANTS;
        if (occupants.length >= maxLimit) {
            Alert.alert(
                'Occupancy Limit Reached',
                `A maximum of ${maxLimit} occupants (including yourself) are permitted for the ${category === 'couple' ? 'Couple' : 'Family'} Category.`
            );
            return;
        }

        setOccupants([
            ...occupants,
            { full_name: '', age: '', relationship: category === 'couple' ? 'Spouse / Partner' : 'Family Member' }
        ]);
    };

    // Remove Occupant
    const handleRemoveOccupant = (index) => {
        if (index === 0) {
            Alert.alert('Cannot Remove', 'The primary applicant cannot be removed from the occupants list.');
            return;
        }
        setOccupants(occupants.filter((_, idx) => idx !== index));
    };

    // Update Occupant
    const handleUpdateOccupant = (index, field, value) => {
        const updated = [...occupants];
        updated[index][field] = value;
        setOccupants(updated);
    };

    // Save Draft or Submit Application
    const handleSubmit = async (isFinalSubmission) => {
        if (!primaryName.trim()) {
            Alert.alert('Incomplete Form', 'Please enter the primary applicant name.');
            return;
        }
        if (!primaryPhone.trim() || primaryPhone.trim().length < 10) {
            Alert.alert('Incomplete Form', 'Please enter a valid 10-digit primary contact phone number.');
            return;
        }
        if (!primaryAddress.trim()) {
            Alert.alert('Incomplete Form', 'Please enter your residential address.');
            return;
        }

        // Validate occupants
        for (let i = 0; i < occupants.length; i++) {
            if (!occupants[i].full_name.trim()) {
                Alert.alert('Incomplete Occupants', `Please enter the full name for Occupant #${i + 1}.`);
                return;
            }
            if (!occupants[i].age.trim() || isNaN(occupants[i].age)) {
                Alert.alert('Incomplete Occupants', `Please enter a valid age for Occupant #${i + 1}.`);
                return;
            }
        }

        if (isFinalSubmission && !rulesAccepted) {
            Alert.alert(
                'Terms Acceptance Required',
                'Please review and accept the homestay house rules, privacy terms, and subscription conditions before submitting.'
            );
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                category,
                primary_name: primaryName.trim(),
                primary_email: primaryEmail.trim(),
                primary_phone: primaryPhone.trim(),
                primary_address: primaryAddress.trim(),
                id_proof_type: idProofType,
                id_proof_number: idProofNumber.trim(),
                rules_accepted: rulesAccepted
            };

            const res = await SubscriptionService.submitOrUpdateApplication(
                activeUser.id,
                payload,
                occupants,
                isFinalSubmission
            );

            setSubmitting(false);

            if (!res.success) {
                Alert.alert('Submission Error', res.error);
                return;
            }

            Alert.alert(
                isFinalSubmission ? 'Application Submitted!' : 'Draft Saved',
                res.message,
                [
                    {
                        text: 'View Status',
                        onPress: () => navigation.replace('SubscriptionStatus', { application: res.application })
                    }
                ]
            );
        } catch (err) {
            setSubmitting(false);
            Alert.alert('Error', err.message || 'Submission failed.');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.forest} />
                    <Text style={styles.loadingText}>Loading application details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const currentMax = category === 'couple' ? 2 : MAX_OCCUPANTS;

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
                        <Text style={styles.headerSubtitle}>MEMBERSHIP APPLICATION</Text>
                        <Text style={styles.headerTitle}>Family & Couple Profile</Text>
                    </View>
                </View>

                {/* Host Correction Alert Banner (if applicable) */}
                {adminCorrectionNotes ? (
                    <View style={styles.correctionBanner}>
                        <Text style={styles.correctionBannerTitle}>⚠️ Host Correction Request:</Text>
                        <Text style={styles.correctionBannerDesc}>{adminCorrectionNotes}</Text>
                        <Text style={styles.correctionBannerSub}>
                            Please update the highlighted information and resubmit your application.
                        </Text>
                    </View>
                ) : null}

                <View style={styles.formContainer}>
                    {/* Section 1: Category Selection */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionHeader}>1. SELECT RESIDENCY CATEGORY</Text>
                        <Text style={styles.sectionSub}>Choose your membership profile structure:</Text>

                        <View style={styles.categoryRow}>
                            <TouchableOpacity
                                style={[styles.categoryCard, category === 'couple' && styles.categoryCardActive]}
                                onPress={() => handleCategoryChange('couple')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.categoryIcon}>💑</Text>
                                <Text style={[styles.categoryTitle, category === 'couple' && styles.categoryTitleActive]}>
                                    Couple Retreat
                                </Text>
                                <Text style={styles.categorySubtitle}>Up to 2 Occupants</Text>
                                <Text style={styles.categoryPrice}>₹18,500 / month</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.categoryCard, category === 'family' && styles.categoryCardActive]}
                                onPress={() => handleCategoryChange('family')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.categoryIcon}>👨‍👩‍👧‍👦</Text>
                                <Text style={[styles.categoryTitle, category === 'family' && styles.categoryTitleActive]}>
                                    Family Sanctuary
                                </Text>
                                <Text style={styles.categorySubtitle}>Up to 4 Occupants</Text>
                                <Text style={styles.categoryPrice}>₹27,500 / month</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Section 2: Primary Applicant Details */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionHeader}>2. PRIMARY APPLICANT DETAILS</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name (As on Government ID) *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={primaryName}
                                onChangeText={setPrimaryName}
                                placeholder="e.g. Rahul Sen"
                                placeholderTextColor={colors.greyLight}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Registered Email Address *</Text>
                            <TextInput
                                style={[styles.textInput, styles.textInputDisabled]}
                                value={primaryEmail}
                                editable={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Contact Mobile Number (WhatsApp) *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={primaryPhone}
                                onChangeText={setPrimaryPhone}
                                placeholder="10-digit mobile number"
                                placeholderTextColor={colors.greyLight}
                                keyboardType="phone-pad"
                                maxLength={12}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Residential Address *</Text>
                            <TextInput
                                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                                value={primaryAddress}
                                onChangeText={setPrimaryAddress}
                                placeholder="Complete permanent residential address"
                                placeholderTextColor={colors.greyLight}
                                multiline
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.inputLabel}>Photo ID Type</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={idProofType}
                                    onChangeText={setIdProofType}
                                    placeholder="Aadhaar / Passport"
                                    placeholderTextColor={colors.greyLight}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>ID Document #</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={idProofNumber}
                                    onChangeText={setIdProofNumber}
                                    placeholder="XXXX-XXXX-XXXX"
                                    placeholderTextColor={colors.greyLight}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Section 3: Occupants Profile (Max 4 Total Enforced) */}
                    <View style={styles.sectionCard}>
                        <View style={styles.occupantHeaderRow}>
                            <View>
                                <Text style={styles.sectionHeader}>3. OCCUPANT PROFILES</Text>
                                <Text style={styles.sectionSub}>All members staying during your visits</Text>
                            </View>
                            <View style={styles.counterBadge}>
                                <Text style={styles.counterText}>
                                    {occupants.length} / {currentMax} Max
                                </Text>
                            </View>
                        </View>

                        {occupants.map((occ, idx) => (
                            <View key={idx} style={styles.occupantCard}>
                                <View style={styles.occupantCardHeader}>
                                    <Text style={styles.occupantNumber}>
                                        {idx === 0 ? '👑 Primary Applicant' : `Occupant #${idx + 1}`}
                                    </Text>
                                    {idx > 0 && (
                                        <TouchableOpacity
                                            onPress={() => handleRemoveOccupant(idx)}
                                            style={styles.removeBtn}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.removeBtnText}>✕ Remove</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Full Name</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={occ.full_name}
                                        onChangeText={(val) => handleUpdateOccupant(idx, 'full_name', val)}
                                        placeholder="Full Name"
                                        placeholderTextColor={colors.greyLight}
                                    />
                                </View>

                                <View style={styles.inputRow}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.inputLabel}>Age</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={occ.age}
                                            onChangeText={(val) => handleUpdateOccupant(idx, 'age', val)}
                                            placeholder="e.g. 30"
                                            placeholderTextColor={colors.greyLight}
                                            keyboardType="number-pad"
                                            maxLength={3}
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                        <Text style={styles.inputLabel}>Relationship</Text>
                                        <TextInput
                                            style={[styles.textInput, idx === 0 && styles.textInputDisabled]}
                                            value={occ.relationship}
                                            onChangeText={(val) => handleUpdateOccupant(idx, 'relationship', val)}
                                            placeholder="Spouse / Child"
                                            placeholderTextColor={colors.greyLight}
                                            editable={idx !== 0}
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}

                        {occupants.length < currentMax && (
                            <TouchableOpacity
                                style={styles.addOccupantBtn}
                                onPress={handleAddOccupant}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.addOccupantBtnText}>
                                    + Add Another Occupant ({occupants.length}/{currentMax})
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Section 4: House Rules & Subscription Terms Acceptance */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionHeader}>4. RULES & CONDITIONS</Text>

                        <View style={styles.ruleItem}>
                            <Text style={styles.ruleIcon}>🌲</Text>
                            <Text style={styles.ruleText}>
                                <Text style={{ fontWeight: '700' }}>Quiet Hours & Nature:</Text> Bethany Homestay maintains a tranquil environment above the clouds. Quiet hours are 10:00 PM – 7:00 AM.
                            </Text>
                        </View>

                        <View style={styles.ruleItem}>
                            <Text style={styles.ruleIcon}>👥</Text>
                            <Text style={styles.ruleText}>
                                <Text style={{ fontWeight: '700' }}>Strict Occupancy:</Text> Only verified occupants listed in this application may reside under the subscription. Non-member overnight guests are not permitted.
                            </Text>
                        </View>

                        <View style={styles.ruleItem}>
                            <Text style={styles.ruleIcon}>⏳</Text>
                            <Text style={styles.ruleText}>
                                <Text style={{ fontWeight: '700' }}>3-Month Minimum Term:</Text> Subscriptions require an initial 3-month recurring commitment via AutoPay before cancellation can be requested.
                            </Text>
                        </View>

                        <View style={styles.ruleItem}>
                            <Text style={styles.ruleIcon}>📅</Text>
                            <Text style={styles.ruleText}>
                                <Text style={{ fontWeight: '700' }}>Allocated Dates:</Text> Monthly room nights are selectable exclusively on dates allocated to subscription inventory by the host team.
                            </Text>
                        </View>

                        <View style={styles.termsAcceptRow}>
                            <Switch
                                value={rulesAccepted}
                                onValueChange={setRulesAccepted}
                                trackColor={{ false: colors.greySubtle, true: colors.forest }}
                                thumbColor={colors.ivory}
                            />
                            <Text style={styles.termsAcceptLabel}>
                                I certify that the information provided is accurate and agree to all homestay house rules, privacy terms, and subscription conditions.
                            </Text>
                        </View>
                    </View>

                    {/* Submit & Save Actions */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={() => handleSubmit(true)}
                            activeOpacity={0.85}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color={colors.ivory} size="small" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Application for Host Review →</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.saveDraftButton}
                            onPress={() => handleSubmit(false)}
                            activeOpacity={0.8}
                            disabled={submitting}
                        >
                            <Text style={styles.saveDraftButtonText}>Save Application as Draft</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </View>
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
    centerBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: colors.textMuted,
        fontSize: 14
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
    correctionBanner: {
        backgroundColor: '#FFFBEA',
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
        margin: spacing.md,
        padding: spacing.md,
        borderRadius: radius.xs
    },
    correctionBannerTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#B45309',
        marginBottom: 4
    },
    correctionBannerDesc: {
        fontSize: 12,
        color: '#78350F',
        lineHeight: 18
    },
    correctionBannerSub: {
        fontSize: 11,
        color: '#92400E',
        marginTop: 4,
        fontStyle: 'italic'
    },
    formContainer: {
        padding: spacing.md,
        gap: 16
    },
    sectionCard: {
        backgroundColor: colors.bgSurface,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...shadows.subtle
    },
    sectionHeader: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.forest,
        letterSpacing: 1,
        marginBottom: 2
    },
    sectionSub: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: spacing.md
    },
    categoryRow: {
        flexDirection: 'row',
        gap: 12
    },
    categoryCard: {
        flex: 1,
        backgroundColor: colors.ivoryWarm,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        alignItems: 'center'
    },
    categoryCardActive: {
        borderColor: colors.forest,
        backgroundColor: 'rgba(35, 72, 59, 0.06)'
    },
    categoryIcon: {
        fontSize: 28,
        marginBottom: 4
    },
    categoryTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMain,
        textAlign: 'center'
    },
    categoryTitleActive: {
        color: colors.forestDark
    },
    categorySubtitle: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2
    },
    categoryPrice: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.gold,
        marginTop: 6
    },
    inputGroup: {
        marginBottom: 12
    },
    inputRow: {
        flexDirection: 'row'
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: 4
    },
    textInput: {
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: radius.xs,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: colors.textMain
    },
    textInputDisabled: {
        backgroundColor: 'rgba(98, 92, 80, 0.08)',
        color: colors.grey
    },
    occupantHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    counterBadge: {
        backgroundColor: colors.forestSubtle,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full
    },
    counterText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.forest
    },
    occupantCard: {
        backgroundColor: colors.ivoryWarm,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: 12
    },
    occupantCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    occupantNumber: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.forestDark
    },
    removeBtn: {
        paddingHorizontal: 8,
        paddingVertical: 2
    },
    removeBtnText: {
        fontSize: 11,
        color: colors.error,
        fontWeight: '700'
    },
    addOccupantBtn: {
        backgroundColor: colors.ivoryWarm,
        borderWidth: 1.5,
        borderColor: colors.forest,
        borderStyle: 'dashed',
        paddingVertical: 12,
        borderRadius: radius.sm,
        alignItems: 'center',
        marginTop: 4
    },
    addOccupantBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.forest
    },
    ruleItem: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'flex-start'
    },
    ruleIcon: {
        fontSize: 16,
        marginRight: 8,
        marginTop: 2
    },
    ruleText: {
        flex: 1,
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 17
    },
    termsAcceptRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderSubtle
    },
    termsAcceptLabel: {
        flex: 1,
        marginLeft: 12,
        fontSize: 11,
        color: colors.textMain,
        lineHeight: 16
    },
    actionButtons: {
        gap: 12,
        marginTop: 8
    },
    submitButton: {
        backgroundColor: colors.forest,
        paddingVertical: 15,
        borderRadius: radius.sm,
        alignItems: 'center',
        ...shadows.subtle
    },
    submitButtonText: {
        color: colors.ivory,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    saveDraftButton: {
        backgroundColor: colors.bgSurface,
        paddingVertical: 13,
        borderRadius: radius.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderMedium
    },
    saveDraftButtonText: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '600'
    }
});

export default SubscriptionApplicationScreen;
