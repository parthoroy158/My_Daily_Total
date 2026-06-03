// components/AnalysisScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── EXACT SAME THEME AS HomeScreen ──────────────────────────────────────────
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
  Maity:  { color: '#00D4AA', bg: 'rgba(0,212,170,0.12)' },
  Rudro:  { color: '#FFB547', bg: 'rgba(255,181,71,0.12)' },
};

const { width: SW } = Dimensions.get('window');
const BAR_MAX_H = 90;
const API = 'https://daily-total.vercel.app/api/data';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatINR(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function getWeekKey(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function getDayLabel(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3);
}

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; isToday: boolean }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={bc.wrap}>
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * BAR_MAX_H, d.value > 0 ? 6 : 2);
        return (
          <View key={i} style={bc.col}>
            {d.value > 0 && (
              <Text style={bc.valLabel}>
                {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}
              </Text>
            )}
            <View
              style={[
                bc.bar,
                {
                  height: h,
                  backgroundColor: d.isToday ? COLORS.accent : COLORS.surfaceHigh,
                  borderColor: d.isToday ? COLORS.accent : COLORS.border,
                  opacity: d.value === 0 ? 0.25 : 1,
                },
              ]}
            />
            <Text style={[bc.dayLabel, d.isToday && { color: COLORS.accent }]}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
const bc = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: BAR_MAX_H + 44 },
  col:      { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  bar:      { width: '100%', borderRadius: 6, borderWidth: 1 },
  valLabel: { fontSize: 9, color: COLORS.mutedLight, fontWeight: '600' },
  dayLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '600' },
});

// ─── DONUT SEGMENT ────────────────────────────────────────────────────────────
// Pure RN donut — no SVG library needed
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;

  // Build stroke-dasharray equivalents as percent of circumference
  const SIZE = 110;
  const R = 40;
  const C = 2 * Math.PI * R; // ~251
  let offset = 0;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: SIZE, height: SIZE }}>
      {/* We fake a donut with stacked rotated views */}
      <View style={{ position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, overflow: 'hidden' }}>
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const deg = pct * 360;
          const style = {
            position: 'absolute' as const,
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            borderWidth: 14,
            borderColor: seg.color,
            transform: [{ rotate: `${offset}deg` }],
            // clip top half to show only one segment slice
          };
          offset += deg;
          return null; // fallback — pure RN donut is complex; use ring below
        })}
      </View>

      {/* Simplified: stacked colored rings as percentage bars instead */}
      {segments.map((seg, i) => {
        const pct = Math.round((seg.value / total) * 100);
        return (
          <View key={i} style={donut.row}>
            <View style={[donut.dot, { backgroundColor: seg.color }]} />
            <Text style={donut.label}>{seg.label}</Text>
            <View style={donut.barTrack}>
              <View style={[donut.barFill, { width: `${pct}%`, backgroundColor: seg.color }]} />
            </View>
            <Text style={[donut.pct, { color: seg.color }]}>{pct}%</Text>
          </View>
        );
      })}
    </View>
  );
}
const donut = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, width: '100%' },
  dot:      { width: 8, height: 8, borderRadius: 4 },
  label:    { color: COLORS.white, fontSize: 13, fontWeight: '600', width: 56 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.surfaceHigh },
  barFill:  { height: 6, borderRadius: 3 },
  pct:      { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
});

// ─── INSIGHT CARD ─────────────────────────────────────────────────────────────
function InsightCard({ icon, label, value, sub, accent }: any) {
  return (
    <View style={[ins.card, { borderLeftColor: accent }]}>
      <Text style={ins.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={ins.label}>{label}</Text>
        <Text style={[ins.value, { color: accent }]}>{value}</Text>
        {sub ? <Text style={ins.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}
const ins = StyleSheet.create({
  card:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3, padding: 16, marginBottom: 10 },
  icon:  { fontSize: 22 },
  label: { color: COLORS.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  value: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  sub:   { color: COLORS.mutedLight, fontSize: 12, marginTop: 2 },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function AnalysisScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<'7d' | '30d' | 'all'>('30d');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetching(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (e) {
      console.log('Fetch error:', e);
    } finally {
      setFetching(false);
    }
  };

  // ── Filter entries by time range ──────────────────────────────────────────
  const filtered = entries.filter(e => {
    if (!e.date) return false;
    if (filter === 'all') return true;
    const days = filter === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(e.date) >= cutoff;
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const grandTotal = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
  const txCount    = filtered.length;
  const avgTx      = txCount > 0 ? grandTotal / txCount : 0;

  // Per-person totals
  const personTotals = Object.fromEntries(
    Object.keys(PEOPLE).map(p => [
      p,
      filtered.filter(e => e.name?.toLowerCase() === p.toLowerCase())
              .reduce((s, e) => s + Number(e.amount || 0), 0),
    ])
  );

  // Top spender
  const topSpender = Object.entries(personTotals).sort((a, b) => b[1] - a[1])[0];

  // ── Last 7 days bar chart ─────────────────────────────────────────────────
  const last7 = getLast7Days();
  const today = new Date().toISOString().slice(0, 10);
  const barData = last7.map(day => ({
    label: getDayLabel(day),
    isToday: day === today,
    value: entries
      .filter(e => e.date === day)
      .reduce((s, e) => s + Number(e.amount || 0), 0),
  }));

  // ── Monthly trend (last 6 months) ─────────────────────────────────────────
  const monthlyMap: Record<string, number> = {};
  entries.forEach(e => {
    if (!e.date) return;
    const key = e.date.slice(0, 7); // YYYY-MM
    monthlyMap[key] = (monthlyMap[key] || 0) + Number(e.amount || 0);
  });
  const last6Months = Object.entries(monthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([k, v]) => ({
      label: new Date(k + '-01').toLocaleDateString('en-IN', { month: 'short' }),
      value: v,
      isToday: k === today.slice(0, 7),
    }));

  // ── Top items ─────────────────────────────────────────────────────────────
  const itemMap: Record<string, number> = {};
  filtered.forEach(e => {
    if (!e.item) return;
    itemMap[e.item] = (itemMap[e.item] || 0) + Number(e.amount || 0);
  });
  const topItems = Object.entries(itemMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (fetching) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={s.loadingText}>Crunching numbers…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.appTag}>INSIGHTS</Text>
            <Text style={s.heading}>Analysis</Text>
          </View>
          <TouchableOpacity onPress={fetchData} style={[s.refreshBtn, { marginTop: 30 }]}>
            <Text style={[s.refreshIcon]}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* ── FILTER TABS ── */}
        <View style={s.filterRow}>
          {(['7d', '30d', 'all'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterBtn, filter === f && s.filterBtnActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f === '7d' ? 'Last 7 days' : f === '30d' ? 'Last 30 days' : 'All time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── GRAND TOTAL CARD ── */}
        <View style={s.totalCard}>
          <View>
            <Text style={s.totalLabel}>Total Spent</Text>
            <Text style={s.totalAmount}>{formatINR(grandTotal)}</Text>
            <Text style={s.totalSub}>{txCount} transactions · avg {formatINR(Math.round(avgTx))}</Text>
          </View>
          <View style={s.totalDecorCircle} />
        </View>

        {/* ── PER PERSON BARS ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Spending by Person</Text>
          {Object.entries(PEOPLE).map(([person, cfg]) => {
            const val = personTotals[person] || 0;
            const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
            return (
              <View key={person} style={s.personRow}>
                <View style={s.personRowLeft}>
                  <View style={[s.personDot, { backgroundColor: cfg.color }]} />
                  <Text style={s.personName}>{person}</Text>
                </View>
                <View style={s.personBarTrack}>
                  <Animated.View
                    style={[s.personBarFill, { width: `${pct}%`, backgroundColor: cfg.color }]}
                  />
                </View>
                <Text style={[s.personAmt, { color: cfg.color }]}>
                  {formatINR(val)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── DAILY BAR CHART (last 7 days) ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Daily Spend · Last 7 Days</Text>
          <BarChart data={barData} />
        </View>

        {/* ── MONTHLY TREND ── */}
        {last6Months.length > 1 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Monthly Trend</Text>
            <BarChart data={last6Months} />
          </View>
        )}

        {/* ── KEY INSIGHTS ── */}
        <Text style={s.sectionTitle}>Key Insights</Text>
        <InsightCard
          icon="🏆"
          label="Top Spender"
          value={topSpender ? topSpender[0] : '—'}
          sub={topSpender ? formatINR(topSpender[1]) : ''}
          accent={topSpender ? PEOPLE[topSpender[0] as keyof typeof PEOPLE]?.color || COLORS.accent : COLORS.accent}
        />
        <InsightCard
          icon="📊"
          label="Avg per Transaction"
          value={formatINR(Math.round(avgTx))}
          sub={`Across ${txCount} entries`}
          accent={COLORS.yellow}
        />
        <InsightCard
          icon="📅"
          label="Busiest Day (this week)"
          value={barData.reduce((a, b) => (b.value > a.value ? b : a), barData[0])?.label || '—'}
          sub={formatINR(Math.max(...barData.map(d => d.value)))}
          accent={COLORS.green}
        />

        {/* ── TOP ITEMS TABLE ── */}
        {topItems.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Top Items ({filter === 'all' ? 'all time' : filter})</Text>
            {topItems.map(([itm, val], i) => (
              <View key={itm} style={s.itemRow}>
                <Text style={s.itemRank}>#{i + 1}</Text>
                <Text style={s.itemName} numberOfLines={1}>{itm}</Text>
                <View style={s.itemBarTrack}>
                  <View
                    style={[
                      s.itemBarFill,
                      { width: `${(val / topItems[0][1]) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={s.itemAmt}>{formatINR(val)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── SHARE SPLIT ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Expense Share</Text>
          {Object.entries(PEOPLE).map(([person, cfg]) => {
            const val  = personTotals[person] || 0;
            const pct  = grandTotal > 0 ? Math.round((val / grandTotal) * 100) : 0;
            return (
              <View key={person} style={donut.row}>
                <View style={[donut.dot, { backgroundColor: cfg.color }]} />
                <Text style={donut.label}>{person}</Text>
                <View style={donut.barTrack}>
                  <View style={[donut.barFill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                </View>
                <Text style={[donut.pct, { color: cfg.color }]}>{pct}%</Text>
              </View>
            );
          })}
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { paddingHorizontal: 16, paddingBottom: 60 },
  loadingWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText:  { color: COLORS.muted, fontSize: 14 },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 24, marginBottom: 18 },
  appTag:       { fontSize: 11, color: COLORS.accent, letterSpacing: 2, fontWeight: '700', marginBottom: 4, marginTop: 20 },
  heading:      { fontSize: 38, fontWeight: '800', color: COLORS.white, letterSpacing: -1 },
  refreshBtn:   { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  refreshIcon:  { fontSize: 20, color: COLORS.mutedLight },

  filterRow:       { flexDirection: 'row', gap: 8, marginBottom: 18 },
  filterBtn:       { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  filterBtnActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  filterText:      { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  filterTextActive:{ color: COLORS.accent },

  totalCard:        { backgroundColor: COLORS.accent, borderRadius: 24, padding: 26, marginBottom: 14, overflow: 'hidden', position: 'relative' },
  totalLabel:       { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  totalAmount:      { color: '#fff', fontSize: 46, fontWeight: '800', letterSpacing: -1.5, marginTop: 4 },
  totalSub:         { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 6, fontWeight: '500' },
  totalDecorCircle: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)', right: -40, top: -50 },

  card:      { backgroundColor: COLORS.surface, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 14 },
  cardTitle: { color: COLORS.white, fontSize: 15, fontWeight: '700', marginBottom: 16, letterSpacing: -0.3 },

  sectionTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 10 },

  personRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  personRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 80 },
  personDot:     { width: 8, height: 8, borderRadius: 4 },
  personName:    { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  personBarTrack:{ flex: 1, height: 7, borderRadius: 4, backgroundColor: COLORS.surfaceHigh },
  personBarFill: { height: 7, borderRadius: 4 },
  personAmt:     { fontSize: 13, fontWeight: '700', width: 72, textAlign: 'right' },

  itemRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  itemRank:    { color: COLORS.muted, fontSize: 11, fontWeight: '700', width: 20 },
  itemName:    { color: COLORS.white, fontSize: 13, fontWeight: '600', width: 90 },
  itemBarTrack:{ flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.surfaceHigh },
  itemBarFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  itemAmt:     { color: COLORS.green, fontSize: 12, fontWeight: '700', width: 64, textAlign: 'right' },
});