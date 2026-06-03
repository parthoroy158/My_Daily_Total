import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';


const SUCCESS_VIBRATION = [0, 60, 80, 60, 80, 180];
const ERROR_VIBRATION = [0, 80, 60, 80];

function vibrateSuccess() {
    Vibration.vibrate(SUCCESS_VIBRATION);
}
function vibrateError() {
    Vibration.vibrate(ERROR_VIBRATION);
}

// ─── IN-APP NOTIFICATION BANNER (no native modules needed) ──────────────────
// We build our OWN animated banner so it works on every device instantly.
function SuccessBanner({ visible, amount, itemName, personName, color }) {
    const slideY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 10,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // auto-dismiss after 2.8 s
            const t = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(slideY, {
                        toValue: -120,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start();
            }, 2800);

            return () => clearTimeout(t);
        }
    }, [visible]);

    return (
        <Animated.View
            style={[
                styles.banner,
                { transform: [{ translateY: slideY }], opacity, borderLeftColor: color },
            ]}
            pointerEvents="none"
        >
            <View style={[styles.bannerIcon, { backgroundColor: color + '22' }]}>
                <Text style={{ fontSize: 20 }}>✓</Text>
            </View>
            <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>₹{amount} added!</Text>
                <Text style={styles.bannerSub}>{itemName} · {personName}</Text>
            </View>
        </Animated.View>
    );
}

// ─── THEME ───────────────────────────────────────────────────────────────────
const COLORS = {
    bg: '#0A0A0F',
    surface: '#111118',
    surfaceHigh: '#1A1A24',
    border: '#252535',
    accent: '#6C63FF',
    accentSoft: 'rgba(108,99,255,0.15)',
    green: '#00D4AA',
    yellow: '#FFB547',
    red: '#FF6B6B',
    white: '#F0EFFF',
    muted: '#5A5A7A',
    mutedLight: '#8A8AAA',
};

const PEOPLE = {
    Partho: { color: '#6C63FF', bg: 'rgba(108,99,255,0.15)' },
    Maity: { color: '#00D4AA', bg: 'rgba(0,212,170,0.12)' },
    Rudro: { color: '#FFB547', bg: 'rgba(255,181,71,0.12)' },
};

// ─── EXPENSE CARD ─────────────────────────────────────────────────────────────
function ExpenseCard({ item, index }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 40, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 40, useNativeDriver: true }),
        ]).start();
    }, []);

    const person = PEOPLE[item.name] || { color: COLORS.accent, bg: COLORS.accentSoft };

    const formatDate = (ds) => {
        if (!ds) return '';
        return new Date(ds).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', weekday: 'short',
        });
    };

    return (
        <Animated.View style={[styles.expenseCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.cardAccentBar, { backgroundColor: person.color }]} />
            <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                        <View style={[styles.personBadge, { backgroundColor: person.bg }]}>
                            <Text style={[styles.personBadgeText, { color: person.color }]}>{item.name}</Text>
                        </View>
                        <Text style={styles.cardItemName}>{item.item}</Text>
                    </View>
                    <Text style={styles.cardAmount}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
            </View>
        </Animated.View>
    );
}

// ─── STAT CHIP ────────────────────────────────────────────────────────────────
function StatChip({ label, value, color, bg }) {
    return (
        <View style={[styles.statChip, { backgroundColor: bg }]}>
            <View style={[styles.statDot, { backgroundColor: color }]} />
            <View>
                <Text style={[styles.statLabel, { color }]}>{label}</Text>
                <Text style={[styles.statValue, { color: COLORS.white }]}>
                    ₹{Number(value).toLocaleString('en-IN')}
                </Text>
            </View>
        </View>
    );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
    const [entries, setEntries] = useState([]);
    const [name, setName] = useState('Partho');
    const [item, setItem] = useState('');
    const [date, setDate] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Banner state
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerData, setBannerData] = useState({ amount: '', item: '', name: '', color: '' });

    const headerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchEntries();
        Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const fetchEntries = async () => {
        setFetching(true);
        try {
            const res = await fetch('https://daily-total.vercel.app/api/data');
            const result = await res.json();
            setEntries(Array.isArray(result) ? result.reverse() : []);
        } catch (e) {
            console.log('Fetch Error:', e);
        } finally {
            setFetching(false);
        }
    };

    const onChangeDate = (event, selected) => {
        setShowDatePicker(false);
        if (selected) {
            setSelectedDate(selected);
            const y = selected.getFullYear();
            const m = String(selected.getMonth() + 1).padStart(2, '0');
            const d = String(selected.getDate()).padStart(2, '0');
            setDate(`${y}-${m}-${d}`);
        }
    };

    // ── SHOW SUCCESS FEEDBACK ──────────────────────────────────────────────────
    const showSuccessFeedback = (amt, itm, nmName) => {
        const personColor = PEOPLE[nmName]?.color || COLORS.accent;

        // 1. Haptic vibration pattern
        vibrateSuccess();

        // 2. Custom animated banner (works on ALL devices, no permissions needed)
        setBannerData({ amount: amt, item: itm, name: nmName, color: personColor });
        setBannerVisible(false);
        setTimeout(() => setBannerVisible(true), 50); // re-trigger if already showing

        // 3. Toast (existing)
        Toast.show({
            type: 'success',
            text1: `₹${amt} added`,
            text2: `${itm} • ${nmName}`,
        });

        // 4. Android native toast as extra confirmation
        if (Platform.OS === 'android') {
            ToastAndroid.showWithGravity(
                `✓ ₹${amt} saved!`,
                ToastAndroid.SHORT,
                ToastAndroid.TOP,
            );
        }
    };

    const addEntry = async () => {
        if (!item || !date || !amount) {
            vibrateError();
            Toast.show({ type: 'error', text1: 'All fields required', text2: 'Fill in item, date, and amount.' });
            return;
        }

        setLoading(true);
        try {
            await fetch('https://daily-total.vercel.app/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, item, date, amount: parseFloat(amount) }),
            });

            setEntries((prev) => [{ name, item, date, amount }, ...prev]);

            const savedItem = item;
            const savedAmount = amount;
            const savedName = name;

            setItem('');
            setDate('');
            setAmount('');

            showSuccessFeedback(savedAmount, savedItem, savedName);

        } catch (e) {
            console.log('POST Error:', e);
            vibrateError();
            Toast.show({ type: 'error', text1: 'Failed to save', text2: 'Check your connection.' });
        } finally {
            setLoading(false);
        }
    };

    // Totals
    const totalAmount = entries.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totals = Object.fromEntries(
        Object.keys(PEOPLE).map((p) => [
            p,
            entries
                .filter((e) => e.name?.toLowerCase() === p.toLowerCase())
                .reduce((s, e) => s + Number(e.amount || 0), 0),
        ])
    );

    const activePerson = PEOPLE[name];

    return (
        <>
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

                {/* ── FLOATING BANNER (overlays everything) ── */}
                <SuccessBanner
                    visible={bannerVisible}
                    amount={bannerData.amount}
                    itemName={bannerData.item}
                    personName={bannerData.name}
                    color={bannerData.color}
                />

                <FlatList
                    data={entries}
                    keyExtractor={(_, i) => i.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                    ListHeaderComponent={
                        <Animated.View style={{ opacity: headerAnim }}>
                            {/* HEADER */}
                            <View style={styles.header}>
                                <View>
                                    <Text style={styles.appTag}>EXPENSE TRACKER</Text>
                                    <Text style={styles.heading}>Daily Total</Text>
                                    <Text style={styles.subHeading}>Founder of কিনুন</Text>
                                </View>
                                <TouchableOpacity onPress={fetchEntries} style={styles.refreshBtn}>
                                    <Text style={styles.refreshIcon}>↻</Text>
                                </TouchableOpacity>
                            </View>

                            {/* GRAND TOTAL CARD */}
                            <View style={styles.totalCard}>
                                <View>
                                    <Text style={styles.totalLabel}>Grand Total</Text>
                                    <Text style={styles.totalAmount}>
                                        ₹{totalAmount.toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={styles.totalCount}>{entries.length} transactions</Text>
                                </View>
                                <View style={styles.totalDecorCircle} />
                            </View>

                            {/* STATS ROW */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.statsRow}
                                contentContainerStyle={{ paddingRight: 8 }}
                            >
                                {Object.entries(PEOPLE).map(([person, cfg]) => (
                                    <StatChip
                                        key={person}
                                        label={person}
                                        value={totals[person]}
                                        color={cfg.color}
                                        bg={cfg.bg}
                                    />
                                ))}
                            </ScrollView>

                            {/* FORM */}
                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>Add Expense</Text>

                                <View style={styles.personRow}>
                                    {Object.entries(PEOPLE).map(([person, cfg]) => (
                                        <TouchableOpacity
                                            key={person}
                                            style={[
                                                styles.personBtn,
                                                name === person && { backgroundColor: cfg.bg, borderColor: cfg.color },
                                            ]}
                                            onPress={() => setName(person)}
                                            activeOpacity={0.75}
                                        >
                                            <View style={[styles.personDot, { backgroundColor: name === person ? cfg.color : COLORS.muted }]} />
                                            <Text style={[styles.personBtnText, name === person && { color: cfg.color }]}>
                                                {person}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>ITEM</Text>
                                    <TextInput
                                        placeholder="What did you buy?"
                                        placeholderTextColor={COLORS.muted}
                                        style={styles.input}
                                        value={item}
                                        onChangeText={setItem}
                                    />
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>DATE</Text>
                                    <TouchableOpacity
                                        style={[styles.input, styles.datePressable]}
                                        onPress={() => setShowDatePicker(true)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={{ color: date ? COLORS.white : COLORS.muted, fontSize: 15 }}>
                                            {date
                                                ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : 'Select a date'}
                                        </Text>
                                        <Text style={styles.calIcon}>📅</Text>
                                    </TouchableOpacity>
                                </View>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={selectedDate}
                                        mode="date"
                                        display="default"
                                        onChange={onChangeDate}
                                        themeVariant="dark"
                                    />
                                )}

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>AMOUNT</Text>
                                    <View style={styles.amountRow}>
                                        <Text style={styles.rupeeSign}>₹</Text>
                                        <TextInput
                                            placeholder="0.00"
                                            placeholderTextColor={COLORS.muted}
                                            style={[styles.input, styles.amountInput]}
                                            value={amount}
                                            onChangeText={setAmount}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.addButton,
                                        { backgroundColor: activePerson?.color || COLORS.accent },
                                        loading && { opacity: 0.6 },
                                    ]}
                                    onPress={addEntry}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    {loading
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={styles.addButtonText}>+ Add Expense</Text>
                                    }
                                </TouchableOpacity>
                            </View>

                            {/* LIST HEADER */}
                            <View style={styles.listHeaderRow}>
                                <Text style={styles.listHeaderText}>Recent Transactions</Text>
                                <Text style={styles.listHeaderCount}>{entries.length}</Text>
                            </View>
                        </Animated.View>
                    }
                    renderItem={({ item: e, index }) => <ExpenseCard item={e} index={index} />}
                    ListEmptyComponent={
                        fetching ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator size="large" color={COLORS.accent} />
                                <Text style={styles.loadingText}>Loading transactions…</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyWrap}>
                                <Text style={styles.emptyIcon}>💸</Text>
                                <Text style={styles.emptyText}>No expenses yet</Text>
                                <Text style={styles.emptySubText}>Add your first entry above</Text>
                            </View>
                        )
                    }
                />
            </SafeAreaView>
            <Toast />
        </>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    listContainer: { paddingHorizontal: 16, paddingBottom: 48 },

    // ── Banner ──
    banner: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 16,
        left: 16,
        right: 16,
        zIndex: 9999,
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        borderLeftWidth: 4,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 12,
    },
    bannerIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerText: { flex: 1 },
    bannerTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
    bannerSub: { color: COLORS.mutedLight, fontSize: 13, marginTop: 2 },

    // ── Header ──
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 24, marginBottom: 22 },
    appTag: { fontSize: 11, color: COLORS.accent, letterSpacing: 3, fontWeight: '700', marginBottom: 6 },
    heading: { fontSize: 38, fontWeight: '800', color: COLORS.white, letterSpacing: -1 },
    subHeading: { fontSize: 14, color: COLORS.muted, marginTop: 3, fontWeight: '500' },
    refreshBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
    refreshIcon: { fontSize: 20, color: COLORS.mutedLight },

    // ── Total Card ──
    totalCard: { backgroundColor: COLORS.accent, borderRadius: 24, padding: 26, marginBottom: 14, overflow: 'hidden', position: 'relative' },
    totalLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
    totalAmount: { color: '#fff', fontSize: 46, fontWeight: '800', letterSpacing: -1.5, marginTop: 4 },
    totalCount: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 6, fontWeight: '500' },
    totalDecorCircle: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)', right: -40, top: -50 },

    // ── Stats ──
    statsRow: { marginBottom: 16 },
    statChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 16, marginRight: 10, minWidth: 130 },
    statDot: { width: 8, height: 8, borderRadius: 4 },
    statLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
    statValue: { fontSize: 17, fontWeight: '800' },

    // ── Form ──
    formCard: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, marginBottom: 22, borderWidth: 1, borderColor: COLORS.border },
    formTitle: { color: COLORS.white, fontSize: 17, fontWeight: '700', marginBottom: 18, letterSpacing: -0.3 },
    personRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
    personBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: 14, backgroundColor: COLORS.surfaceHigh, borderWidth: 1.5, borderColor: COLORS.border },
    personDot: { width: 7, height: 7, borderRadius: 4 },
    personBtnText: { color: COLORS.mutedLight, fontWeight: '700', fontSize: 13 },

    inputWrapper: { marginBottom: 14 },
    inputLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 7 },
    input: { backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 16, height: 52, color: COLORS.white, fontSize: 15, fontWeight: '500' },
    datePressable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    calIcon: { fontSize: 18 },
    amountRow: { flexDirection: 'row', alignItems: 'center' },
    rupeeSign: { color: COLORS.green, fontSize: 22, fontWeight: '700', position: 'absolute', left: 16, zIndex: 1 },
    amountInput: { flex: 1, paddingLeft: 36 },

    addButton: { height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
    addButtonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },

    // ── List Header ──
    listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    listHeaderText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    listHeaderCount: { backgroundColor: COLORS.surfaceHigh, color: COLORS.mutedLight, fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },

    // ── Expense Card ──
    expenseCard: { backgroundColor: COLORS.surface, borderRadius: 20, marginBottom: 10, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    cardAccentBar: { width: 3, alignSelf: 'stretch', borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
    cardBody: { flex: 1, padding: 16 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardLeft: { flex: 1, marginRight: 12 },
    personBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7, marginBottom: 6 },
    personBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    cardItemName: { color: COLORS.white, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
    cardAmount: { color: COLORS.green, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    cardDate: { color: COLORS.muted, fontSize: 12, marginTop: 8, fontWeight: '500' },

    // ── Empty / Loading ──
    loadingWrap: { paddingTop: 50, alignItems: 'center', gap: 14 },
    loadingText: { color: COLORS.muted, fontSize: 14 },
    emptyWrap: { paddingTop: 50, alignItems: 'center', gap: 8 },
    emptyIcon: { fontSize: 40, marginBottom: 6 },
    emptyText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
    emptySubText: { color: COLORS.muted, fontSize: 14 },
});
