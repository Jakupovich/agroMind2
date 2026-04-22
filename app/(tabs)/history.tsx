import { ClimateHistoryChart } from "@/components/ClimateHistoryChart";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useClimateHistory } from "@/hooks/useClimateHistory";
import { useFarmProfile } from "@/hooks/useFarmProfile";
import { YearlyStats } from "@/services/historyService";
import { BlurView } from "expo-blur";
import {
  AlertCircle,
  BarChart2,
  Snowflake,
  TrendingUp,
} from "lucide-react-native";
import { MotiView } from "moti";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const { width } = Dimensions.get("window");

function decadeLabel(year: number): string {
  const start = Math.floor(year / 10) * 10;
  return `${start}–${start + 9}`;
}

function groupByDecade(yearly: YearlyStats[]) {
  const map = new Map<string, YearlyStats[]>();
  for (const y of yearly) {
    const label = decadeLabel(y.year);
    const arr = map.get(label) ?? [];
    arr.push(y);
    map.set(label, arr);
  }
  return [...map.entries()].map(([label, years]) => {
    const avg = years.reduce((a, y) => a + y.avgTemp, 0) / years.length;
    const frost = years.reduce((a, y) => a + y.frostDays, 0) / years.length;
    const precip = years.reduce((a, y) => a + y.precipitation, 0) / years.length;
    return {
      label,
      avg: Number(avg.toFixed(2)),
      frost: Number(frost.toFixed(1)),
      precip: Number(precip.toFixed(0)),
    };
  });
}

function extremeYears(yearly: YearlyStats[]) {
  return [...yearly]
    .sort((a, b) => Math.abs(b.anomaly) - Math.abs(a.anomaly))
    .slice(0, 5)
    .map((y) => ({
      year: y.year,
      avgTemp: y.avgTemp,
      anomaly: y.anomaly,
      precip: y.precipitation,
      impact:
        Math.abs(y.anomaly) >= 1.5
          ? "critical"
          : Math.abs(y.anomaly) >= 0.8
            ? "high"
            : "medium",
    }));
}

const impactColor = (impact: string) => {
  if (impact === "critical") return Colors.red;
  if (impact === "high") return Colors.amber;
  return Colors.blue;
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const farm = useFarmProfile();
  const { data, loading, error, refreshing } = useClimateHistory(
    farm.location?.latitude ?? null,
    farm.location?.longitude ?? null,
  );

  const decades = useMemo(
    () => (data ? groupByDecade(data.yearly) : []),
    [data],
  );
  const extremes = useMemo(
    () => (data ? extremeYears(data.yearly) : []),
    [data],
  );

  const totalWarming = data?.totalWarmingC ?? 0;
  const latest = data?.yearly[data.yearly.length - 1];
  const wettestYear = data
    ? [...data.yearly].sort((a, b) => b.precipitation - a.precipitation)[0]
    : null;

  const maxMonthlyPrecip = data
    ? Math.max(...data.byMonth.map((m) => m.precipitation), 1)
    : 1;
  const maxMonthlyFrost = data
    ? Math.max(...data.byMonth.map((m) => m.frostDays), 1)
    : 1;

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          style={styles.header}
        >
          <View style={styles.titleRow}>
            <BarChart2 size={18} color={Colors.green} strokeWidth={2} />
            <Text style={styles.pageTag}>CLIMATE ARCHIVE</Text>
            {refreshing ? (
              <ActivityIndicator color={Colors.green} size="small" />
            ) : null}
          </View>
          <Text style={styles.pageTitle}>Historical Data</Text>
          <Text style={styles.pageSubtitle}>
            {data
              ? `${data.rangeEnd - data.rangeStart + 1}-year climate analysis · ${farm.location ? `${farm.location.latitude.toFixed(3)}, ${farm.location.longitude.toFixed(3)}` : "your farm"}`
              : "Fetching Open-Meteo archive for your farm…"}
          </Text>
        </MotiView>

        {!farm.loading && !farm.location ? (
          <BlurView intensity={16} tint="dark" style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Finish onboarding (pin your farm location) to see 20 years of
              historical climate data for your field.
            </Text>
          </BlurView>
        ) : loading && !data ? (
          <BlurView intensity={16} tint="dark" style={styles.loadingCard}>
            <ActivityIndicator color={Colors.green} size="large" />
            <Text style={styles.loadingText}>
              Loading 20 years of archive data…
            </Text>
            <Text style={styles.loadingSub}>
              First run can take ~10s. Cached for 24h afterwards.
            </Text>
          </BlurView>
        ) : error && !data ? (
          <BlurView intensity={16} tint="dark" style={styles.emptyCard}>
            <Text style={styles.errorText}>{error}</Text>
          </BlurView>
        ) : data ? (
          <>
            <View style={styles.kpiRow}>
              {[
                {
                  label: "Total Warming",
                  value: `${totalWarming > 0 ? "+" : ""}${totalWarming}°C`,
                  color: totalWarming >= 0 ? Colors.red : Colors.blue,
                  sub: `${data.rangeStart}→${data.rangeEnd}`,
                },
                {
                  label: `${latest?.year ?? ""} Avg`,
                  value: `${latest?.avgTemp ?? "—"}°C`,
                  color: Colors.amber,
                  sub: `${latest?.frostDays ?? 0} frost days`,
                },
                {
                  label: "Wettest Year",
                  value: `${wettestYear?.precipitation ?? 0}mm`,
                  color: Colors.blue,
                  sub: `${wettestYear?.year ?? ""}`,
                },
              ].map((kpi, i) => (
                <MotiView
                  key={kpi.label}
                  from={{ opacity: 0, translateY: 24 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "timing",
                    duration: 600,
                    delay: 100 + i * 100,
                  }}
                  style={styles.kpiCard}
                >
                  <BlurView intensity={16} tint="dark" style={styles.kpiInner}>
                    <Text style={[styles.kpiValue, { color: kpi.color }]}>
                      {kpi.value}
                    </Text>
                    <Text style={styles.kpiLabel}>{kpi.label}</Text>
                    <Text style={styles.kpiSub}>{kpi.sub}</Text>
                  </BlurView>
                </MotiView>
              ))}
            </View>

            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 700, delay: 300 }}
            >
              <ClimateHistoryChart
                yearly={data.yearly}
                rangeStart={data.rangeStart}
                rangeEnd={data.rangeEnd}
              />
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 700, delay: 400 }}
            >
              <BlurView intensity={16} tint="dark" style={styles.monthlyCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Monthly Climate</Text>
                  <Text style={styles.sectionSub}>
                    Avg across {data.rangeEnd - data.rangeStart + 1} years
                  </Text>
                </View>
                <View style={styles.monthlyTable}>
                  <View style={styles.monthlyHeaderRow}>
                    <Text style={[styles.monthlyHeader, { flex: 0.8 }]}>
                      MONTH
                    </Text>
                    <Text style={[styles.monthlyHeader, { flex: 1 }]}>
                      AVG °C
                    </Text>
                    <Text style={[styles.monthlyHeader, { flex: 1.6 }]}>
                      RAINFALL
                    </Text>
                    <Text style={[styles.monthlyHeader, { flex: 1.6 }]}>
                      FROST
                    </Text>
                  </View>
                  {data.byMonth.map((m) => (
                    <View key={m.month} style={styles.monthlyRow}>
                      <Text style={[styles.monthlyCell, { flex: 0.8 }]}>
                        {MONTH_LABELS[m.month - 1]}
                      </Text>
                      <Text
                        style={[
                          styles.monthlyCell,
                          { flex: 1, color: Colors.textPrimary },
                        ]}
                      >
                        {m.avgTemp.toFixed(1)}
                      </Text>
                      <View style={[styles.monthlyBarWrap, { flex: 1.6 }]}>
                        <View
                          style={[
                            styles.monthlyBar,
                            {
                              width: `${Math.min(
                                100,
                                (m.precipitation / maxMonthlyPrecip) * 100,
                              )}%`,
                              backgroundColor: "#60a5fa" + "cc",
                            },
                          ]}
                        />
                        <Text style={styles.monthlyValue}>
                          {m.precipitation.toFixed(0)} mm
                        </Text>
                      </View>
                      <View style={[styles.monthlyBarWrap, { flex: 1.6 }]}>
                        <View
                          style={[
                            styles.monthlyBar,
                            {
                              width: `${Math.min(
                                100,
                                (m.frostDays / maxMonthlyFrost) * 100,
                              )}%`,
                              backgroundColor: "#a855f7" + "cc",
                            },
                          ]}
                        />
                        <Text style={styles.monthlyValue}>
                          {m.frostDays.toFixed(1)} d
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </BlurView>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 700, delay: 500 }}
            >
              <BlurView intensity={16} tint="dark" style={styles.decadeCard}>
                <View style={styles.sectionHeader}>
                  <TrendingUp size={16} color={Colors.amber} strokeWidth={2} />
                  <Text style={styles.sectionTitle}>Decade Comparison</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.decadeScroll}
                >
                  {decades.map((d) => (
                    <View key={d.label} style={styles.decadeChip}>
                      <Text style={styles.decadeYear}>{d.label}</Text>
                      <Text style={styles.decadeAvg}>{d.avg}°C</Text>
                      <View style={styles.decadeMetaRow}>
                        <Snowflake
                          size={10}
                          color={Colors.blue}
                          strokeWidth={2}
                        />
                        <Text style={styles.decadeMeta}>{d.frost} d/yr</Text>
                      </View>
                      <Text style={styles.decadeMeta}>{d.precip} mm/yr</Text>
                    </View>
                  ))}
                </ScrollView>
              </BlurView>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 700, delay: 650 }}
            >
              <BlurView intensity={16} tint="dark" style={styles.eventsCard}>
                <View style={styles.sectionHeader}>
                  <AlertCircle size={16} color={Colors.amber} strokeWidth={2} />
                  <Text style={styles.sectionTitle}>Extreme Years</Text>
                  <Text style={styles.sectionSub}>
                    Top 5 by |anomaly| vs baseline
                  </Text>
                </View>
                <View style={styles.eventsList}>
                  {extremes.map((ev) => (
                    <View key={ev.year} style={styles.eventItem}>
                      <View
                        style={[
                          styles.eventYearBadge,
                          {
                            backgroundColor: impactColor(ev.impact) + "1A",
                            borderColor: impactColor(ev.impact) + "44",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.eventYear,
                            { color: impactColor(ev.impact) },
                          ]}
                        >
                          {ev.year}
                        </Text>
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventName}>
                          {ev.anomaly >= 0 ? "Warmer" : "Cooler"} than baseline
                        </Text>
                        <View style={styles.eventMeta}>
                          <Text
                            style={[
                              styles.eventAnomaly,
                              { color: impactColor(ev.impact) },
                            ]}
                          >
                            {ev.anomaly > 0 ? "+" : ""}
                            {ev.anomaly.toFixed(1)}°C
                          </Text>
                          <Text style={styles.eventDot}>·</Text>
                          <Text style={styles.eventLoss}>
                            {ev.avgTemp}°C avg · {ev.precip} mm
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.impactBadge,
                          { backgroundColor: impactColor(ev.impact) + "1A" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.impactLabel,
                            { color: impactColor(ev.impact) },
                          ]}
                        >
                          {ev.impact}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </BlurView>
            </MotiView>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { gap: Spacing.lg, paddingHorizontal: Spacing.md },
  header: { gap: 4 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  pageTag: {
    fontSize: FontSize.xs,
    color: Colors.green,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  pageTitle: {
    fontSize: FontSize.xxl,
    color: Colors.textPrimary,
    fontWeight: "900",
  },
  pageSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  kpiRow: { flexDirection: "row", gap: Spacing.sm },
  kpiCard: { flex: 1, borderRadius: Radius.lg, overflow: "hidden" },
  kpiInner: {
    padding: Spacing.md,
    gap: 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiValue: { fontSize: FontSize.lg, fontWeight: "900", letterSpacing: -0.4 },
  kpiLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  kpiSub: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: "500" },
  loadingCard: {
    alignItems: "center",
    gap: 10,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  loadingText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: "700",
    marginTop: 6,
  },
  loadingSub: { fontSize: FontSize.sm, color: Colors.textMuted },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.red,
    fontWeight: "600",
  },
  monthlyCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  sectionSub: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: "600" },
  monthlyTable: { gap: 6 },
  monthlyHeaderRow: { flexDirection: "row", gap: 8 },
  monthlyHeader: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  monthlyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  monthlyCell: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  monthlyBarWrap: {
    position: "relative",
    height: 20,
    justifyContent: "center",
    backgroundColor: Colors.bgCardAlt,
    borderRadius: 6,
    overflow: "hidden",
  },
  monthlyBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
  },
  monthlyValue: {
    position: "absolute",
    right: 6,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  decadeCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    gap: Spacing.sm,
  },
  decadeScroll: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  decadeChip: {
    minWidth: width * 0.32,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCardAlt,
    gap: 4,
  },
  decadeYear: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  decadeAvg: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: "900",
  },
  decadeMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  decadeMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "700",
  },
  eventsCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    gap: Spacing.sm,
  },
  eventsList: { gap: 8 },
  eventItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  eventYearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  eventYear: { fontSize: FontSize.sm, fontWeight: "800" },
  eventInfo: { flex: 1, gap: 2 },
  eventName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  eventAnomaly: { fontSize: FontSize.xs, fontWeight: "800" },
  eventDot: { fontSize: FontSize.xs, color: Colors.textMuted },
  eventLoss: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: "600" },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  impactLabel: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
