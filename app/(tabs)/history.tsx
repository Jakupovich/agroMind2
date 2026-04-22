import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { BarChart2, TrendingUp, AlertCircle, Calendar } from 'lucide-react-native';
import { WeatherChart } from '../../components/WeatherChart';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { temperatureHistory } from '@/constants/mockData';

const climateEvents = [
  { year: 2022, event: 'Record European Heatwave', impact: 'critical', tempAnomaly: '+3.4°C', loss: '€2.1B' },
  { year: 2020, event: 'Extreme Drought Season', impact: 'high', tempAnomaly: '+3.1°C', loss: '€890M' },
  { year: 2018, event: 'Summer Drought & Wildfire', impact: 'critical', tempAnomaly: '+2.8°C', loss: '€1.4B' },
  { year: 2012, event: 'Spring Frost Anomaly', impact: 'medium', tempAnomaly: '+1.3°C', loss: '€340M' },
  { year: 2010, event: 'Cold Winter Extreme', impact: 'high', tempAnomaly: '-1.1°C', loss: '€670M' },
];

const impactColor = (impact: string) => {
  if (impact === 'critical') return Colors.red;
  if (impact === 'high') return Colors.amber;
  return Colors.blue;
};

const decadeStats = [
  { decade: '2004–2009', avg: 9.9, trend: '+0.12°C/yr', crop: 'Stable' },
  { decade: '2010–2014', avg: 10.6, trend: '+0.18°C/yr', crop: 'Moderate stress' },
  { decade: '2015–2019', avg: 11.8, trend: '+0.24°C/yr', crop: 'Elevated risk' },
  { decade: '2020–2024', avg: 13.1, trend: '+0.31°C/yr', crop: 'High adaptation needed' },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDecade, setSelectedDecade] = useState(3);

  const latest = temperatureHistory[temperatureHistory.length - 1];
  const earliest = temperatureHistory[0];
  const totalAnomaly = (latest.avgTemp - earliest.avgTemp).toFixed(1);

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.header}
        >
          <View style={styles.titleRow}>
            <BarChart2 size={18} color={Colors.green} strokeWidth={2} />
            <Text style={styles.pageTag}>CLIMATE ARCHIVE</Text>
          </View>
          <Text style={styles.pageTitle}>Historical Data</Text>
          <Text style={styles.pageSubtitle}>20-year temperature analysis · Bavaria Region</Text>
        </MotiView>

        <View style={styles.kpiRow}>
          {[
            { label: 'Total Warming', value: `+${totalAnomaly}°C`, color: Colors.red, sub: '2004→2024' },
            { label: '2024 Average', value: `${latest.avgTemp}°C`, color: Colors.amber, sub: 'Hottest on record' },
            { label: 'Record High', value: `${latest.maxTemp}°C`, color: Colors.red, sub: 'Summer 2024' },
          ].map((kpi, i) => (
            <MotiView
              key={kpi.label}
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 100 + i * 100 }}
              style={styles.kpiCard}
            >
              <BlurView intensity={16} tint="dark" style={styles.kpiInner}>
                <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <Text style={styles.kpiSub}>{kpi.sub}</Text>
              </BlurView>
            </MotiView>
          ))}
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 300 }}
        >
          <WeatherChart />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 500 }}
        >
          <BlurView intensity={16} tint="dark" style={styles.decadeCard}>
            <Text style={styles.sectionTitle}>Decade Analysis</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.decadeScroll}
            >
              {decadeStats.map((d, i) => (
                <Pressable key={d.decade} onPress={() => setSelectedDecade(i)}>
                  <MotiView
                    animate={{
                      backgroundColor: selectedDecade === i ? Colors.greenDim : Colors.bgCardAlt,
                      borderColor: selectedDecade === i ? Colors.border : Colors.borderSubtle,
                    }}
                    transition={{ type: 'timing', duration: 200 }}
                    style={styles.decadeChip}
                  >
                    <Text style={[styles.decadeYear, { color: selectedDecade === i ? Colors.green : Colors.textSecondary }]}>
                      {d.decade}
                    </Text>
                    <Text style={[styles.decadeAvg, { color: Colors.textPrimary }]}>{d.avg}°C</Text>
                    <Text style={[styles.decadeTrend, { color: Colors.amber }]}>{d.trend}</Text>
                    <Text style={[styles.decadeCrop, { color: Colors.textSecondary }]}>{d.crop}</Text>
                  </MotiView>
                </Pressable>
              ))}
            </ScrollView>
          </BlurView>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 650 }}
        >
          <BlurView intensity={16} tint="dark" style={styles.eventsCard}>
            <View style={styles.eventsHeader}>
              <AlertCircle size={16} color={Colors.amber} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Extreme Climate Events</Text>
            </View>
            <View style={styles.eventsList}>
              {climateEvents.map((ev, i) => (
                <MotiView
                  key={ev.year}
                  from={{ opacity: 0, translateX: -16 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 500, delay: 700 + i * 100 }}
                  style={styles.eventItem}
                >
                  <View style={[styles.eventYearBadge, { backgroundColor: impactColor(ev.impact) + '1A', borderColor: impactColor(ev.impact) + '44' }]}>
                    <Text style={[styles.eventYear, { color: impactColor(ev.impact) }]}>{ev.year}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{ev.event}</Text>
                    <View style={styles.eventMeta}>
                      <Text style={[styles.eventAnomaly, { color: impactColor(ev.impact) }]}>{ev.tempAnomaly}</Text>
                      <Text style={styles.eventDot}>·</Text>
                      <Text style={styles.eventLoss}>Loss: {ev.loss}</Text>
                    </View>
                  </View>
                  <View style={[styles.impactBadge, { backgroundColor: impactColor(ev.impact) + '1A' }]}>
                    <Text style={[styles.impactLabel, { color: impactColor(ev.impact) }]}>{ev.impact}</Text>
                  </View>
                </MotiView>
              ))}
            </View>
          </BlurView>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 900 }}
        >
          <BlurView intensity={16} tint="dark" style={styles.projectionCard}>
            <View style={styles.projectionHeader}>
              <TrendingUp size={16} color={Colors.red} strokeWidth={2} />
              <Text style={styles.sectionTitle}>2030 Climate Projection</Text>
            </View>
            <View style={styles.projectionGrid}>
              {[
                { label: 'Avg Temperature', current: '14.2°C', proj: '15.8°C', delta: '+1.6°C' },
                { label: 'Frost-Free Days', current: '198 days', proj: '217 days', delta: '+19 days' },
                { label: 'Dry Spell Risk', current: 'Moderate', proj: 'High', delta: '↑' },
                { label: 'Yield Adaptation', current: 'Standard', proj: 'Needed', delta: '⚠️' },
              ].map((item, i) => (
                <View key={item.label} style={styles.projRow}>
                  <Text style={styles.projLabel}>{item.label}</Text>
                  <Text style={styles.projCurrent}>{item.current}</Text>
                  <Text style={styles.projArrow}>→</Text>
                  <Text style={[styles.projFuture, { color: Colors.amber }]}>{item.proj}</Text>
                  <Text style={[styles.projDelta, { color: Colors.red }]}>{item.delta}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pageTag: {
    fontSize: FontSize.xs,
    color: Colors.green,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  pageTitle: {
    fontSize: FontSize.xxl,
    color: Colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  kpiCard: {
    flex: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  kpiInner: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 3,
    overflow: 'hidden',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  kpiSub: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  decadeCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  decadeScroll: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  decadeChip: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 4,
    minWidth: 150,
  },
  decadeYear: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  decadeAvg: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  decadeTrend: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  decadeCrop: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  eventsCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  eventYearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  eventYear: {
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  eventName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventAnomaly: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  eventDot: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  eventLoss: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  impactLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  projectionCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  projectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectionGrid: {
    gap: 12,
  },
  projRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  projLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1.2,
  },
  projCurrent: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  projArrow: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  projFuture: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    flex: 1,
  },
  projDelta: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'right',
  },
});