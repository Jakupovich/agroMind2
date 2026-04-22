import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { YearlyStats } from "@/services/historyService";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";

type Mode = "avgTemp" | "maxTemp" | "minTemp" | "precipitation" | "frostDays" | "anomaly";

const MODES: { key: Mode; label: string; color: string; unit: string }[] = [
  { key: "avgTemp", label: "Avg Temp", color: Colors.green, unit: "°C" },
  { key: "maxTemp", label: "Max Temp", color: Colors.amber, unit: "°C" },
  { key: "minTemp", label: "Min Temp", color: Colors.blue, unit: "°C" },
  { key: "precipitation", label: "Rainfall", color: "#60a5fa", unit: "mm" },
  { key: "frostDays", label: "Frost Days", color: "#a855f7", unit: "d" },
  { key: "anomaly", label: "Anomaly", color: Colors.red, unit: "°C" },
];

const { width } = Dimensions.get("window");

interface Props {
  yearly: YearlyStats[];
  rangeStart: number;
  rangeEnd: number;
}

export function ClimateHistoryChart({ yearly, rangeStart, rangeEnd }: Props) {
  const [mode, setMode] = useState<Mode>("avgTemp");
  const current = MODES.find((m) => m.key === mode)!;

  const chartData = yearly.map((y) => ({
    value: y[mode],
    label: y.year % 5 === 0 ? `${y.year}` : "",
    dataPointText: "",
  }));

  const values = yearly.map((y) => y[mode]);
  const maxVal = values.length ? Math.max(...values) : 1;

  const latest = yearly[yearly.length - 1];
  const earliest = yearly[0];

  return (
    <BlurView intensity={16} tint="dark" style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Climate Trends</Text>
          <Text style={styles.subtitle}>
            {rangeStart}–{rangeEnd} · your farm location
          </Text>
        </View>
        <View style={[styles.liveChip, { borderColor: current.color + "55" }]}>
          <MotiView
            from={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 800, loop: true }}
            style={[styles.liveDot, { backgroundColor: current.color }]}
          />
          <Text style={[styles.liveText, { color: current.color }]}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeRow}
      >
        {MODES.map((m) => (
          <Pressable key={m.key} onPress={() => setMode(m.key)}>
            <MotiView
              animate={{
                backgroundColor: mode === m.key ? m.color + "22" : Colors.bgCardAlt,
                borderColor: mode === m.key ? m.color + "66" : Colors.borderSubtle,
              }}
              transition={{ type: "timing", duration: 180 }}
              style={styles.modeChip}
            >
              <Text
                style={[
                  styles.modeLabel,
                  { color: mode === m.key ? m.color : Colors.textSecondary },
                ]}
              >
                {m.label}
              </Text>
            </MotiView>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.chartWrap}>
        <LineChart
          data={chartData}
          width={width - Spacing.md * 4}
          height={180}
          thickness={3}
          color={current.color}
          areaChart
          startFillColor={current.color}
          endFillColor={current.color}
          startOpacity={0.25}
          endOpacity={0.02}
          curved
          hideDataPoints
          hideRules
          yAxisColor="transparent"
          xAxisColor={Colors.borderSubtle}
          yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
          noOfSections={4}
          maxValue={maxVal * 1.1 || 1}
          initialSpacing={6}
          endSpacing={6}
          adjustToWidth
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Earliest</Text>
          <Text style={styles.statValue}>
            {earliest ? `${earliest[mode]}${current.unit}` : "—"}
          </Text>
          <Text style={styles.statSub}>{earliest?.year ?? ""}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Latest</Text>
          <Text style={[styles.statValue, { color: current.color }]}>
            {latest ? `${latest[mode]}${current.unit}` : "—"}
          </Text>
          <Text style={styles.statSub}>{latest?.year ?? ""}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Change</Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  latest && earliest && latest[mode] >= earliest[mode]
                    ? Colors.red
                    : Colors.green,
              },
            ]}
          >
            {latest && earliest
              ? `${latest[mode] - earliest[mode] > 0 ? "+" : ""}${(
                  latest[mode] - earliest[mode]
                ).toFixed(1)}${current.unit}`
              : "—"}
          </Text>
          <Text style={styles.statSub}>over period</Text>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: FontSize.lg, color: Colors.textPrimary, fontWeight: "800" },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: FontSize.xs, fontWeight: "800", letterSpacing: 1 },
  modeRow: { gap: 8, paddingRight: Spacing.md },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  modeLabel: { fontSize: FontSize.xs, fontWeight: "700", letterSpacing: 0.3 },
  chartWrap: { alignItems: "center" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  stat: { flex: 1, gap: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.borderSubtle },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: FontSize.base,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  statSub: { fontSize: 10, color: Colors.textMuted, fontWeight: "600" },
});
