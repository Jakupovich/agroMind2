import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import {
  IrrigationResponse,
  statusColorKey,
  statusLabel,
} from "@/services/irrigationService";
import { BlurView } from "expo-blur";
import { Droplets } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface Props {
  data: IrrigationResponse | null;
  loading?: boolean;
  error?: string | null;
  delay?: number;
}

const STATUS_COLOR_MAP: Record<"green" | "amber" | "red", string> = {
  green: Colors.green,
  amber: Colors.amber,
  red: Colors.red,
};

export function SmartIrrigationCard({
  data,
  loading = false,
  error = null,
  delay = 0,
}: Props) {
  const statusColor = data ? STATUS_COLOR_MAP[statusColorKey(data.status)] : Colors.green;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay }}
    >
      <BlurView
        intensity={16}
        tint="dark"
        style={[styles.card, { borderColor: statusColor + "44" }]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { backgroundColor: statusColor + "1F" }]}>
              <Droplets size={16} color={statusColor} strokeWidth={2} />
            </View>
            <Text style={styles.title}>Smart Irrigation</Text>
          </View>
          {data ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: statusColor + "22", borderColor: statusColor + "55" },
              ]}
            >
              <Text style={[styles.badgeText, { color: statusColor }]}>
                {statusLabel(data.status).toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>

        {loading && !data ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.green} />
            <Text style={styles.loadingText}>Calculating water balance…</Text>
          </View>
        ) : error && !data ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : data ? (
          <>
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Status</Text>
                <Text style={[styles.metricValue, { color: statusColor }]}>
                  {statusLabel(data.status)}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>
                  {data.irrigation_needed ? "Recommended Water" : "Status"}
                </Text>
                <Text style={styles.metricValue}>
                  {data.irrigation_needed
                    ? `${data.recommended_mm} mm`
                    : "No irrigation needed"}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>7-Day Deficit</Text>
                <Text style={styles.metricValue}>
                  {data.cumulative_deficit} mm
                </Text>
              </View>
            </View>

            <Text style={styles.explanation}>{data.ai_explanation}</Text>

            <Text style={styles.cropFootnote}>
              Crop: {data.crop.toUpperCase()}
            </Text>
          </>
        ) : null}
      </BlurView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.red,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  metric: { flex: 1, gap: 4 },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderSubtle,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  explanation: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cropFootnote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
