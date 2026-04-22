import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import {
  CropPrediction,
  trafficLightColorKey,
  trafficLightLabel,
} from "@/services/agroPredictService";
import { BlurView } from "expo-blur";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Leaf,
  Sparkles,
} from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  prediction: CropPrediction;
  gptEnabled: boolean;
  delay?: number;
}

const STATUS_COLOR_MAP: Record<"green" | "amber" | "red", string> = {
  green: Colors.green,
  amber: Colors.amber,
  red: Colors.red,
};

function formatDate(iso: string | null, closedLabel: string): string {
  if (!iso) return closedLabel;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FrostPredictionCard({
  prediction,
  gptEnabled,
  delay = 0,
}: Props) {
  const { t } = useTranslation();
  const windowClosed = t("frost.window_closed");
  const light = prediction.risk.traffic_light;
  const color = STATUS_COLOR_MAP[trafficLightColorKey(light)];
  const StatusIcon = light === "green" ? CheckCircle2 : AlertTriangle;
  const avgPct = Math.round(prediction.risk.avg_frost_probability_14d * 100);
  const maxPct = Math.round(prediction.risk.max_frost_probability_14d * 100);
  const confidencePct = Math.round(prediction.confidence.overall * 100);
  const bullets =
    prediction.gpt_explanation && prediction.gpt_explanation.length > 0
      ? prediction.gpt_explanation
      : prediction.explanation;
  const usingGpt =
    gptEnabled &&
    prediction.gpt_explanation !== undefined &&
    prediction.gpt_explanation.length > 0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay }}
    >
      <BlurView
        intensity={16}
        tint="dark"
        style={[styles.card, { borderColor: color + "44" }]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { backgroundColor: color + "1F" }]}>
              <Leaf size={16} color={color} strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.title}>{prediction.crop.name_en}</Text>
              <Text style={styles.subtitle}>{prediction.crop.name_bs}</Text>
            </View>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: color + "22", borderColor: color + "55" },
            ]}
          >
            <StatusIcon size={12} color={color} strokeWidth={2.5} />
            <Text style={[styles.badgeText, { color }]}>
              {t(`common.${trafficLightLabel(light).toLowerCase()}`, {
                defaultValue: trafficLightLabel(light),
              }).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <View style={styles.metricLabelRow}>
              <Calendar size={11} color={Colors.textMuted} strokeWidth={2} />
              <Text style={styles.metricLabel}>{t("frost.recommended")}</Text>
            </View>
            <Text style={styles.metricValue}>
              {formatDate(prediction.recommended_planting.date, windowClosed)}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{t("frost.avg_max_14d")}</Text>
            <Text style={[styles.metricValue, { color }]}>
              {avgPct}% / {maxPct}%
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{t("frost.risk_days")}</Text>
            <Text style={styles.metricValue}>
              {prediction.risk.crop_frost_risk_days_14d} / 14
            </Text>
          </View>
        </View>

        <View style={styles.forecastRow}>
          {prediction.forecast_14d.map((day) => {
            const pct = Math.max(0.05, Math.min(1, day.frost_probability));
            const dayColor = day.crop_frost_risk ? Colors.red : color;
            return (
              <View key={day.date} style={styles.forecastCell}>
                <View style={styles.forecastBarTrack}>
                  <View
                    style={[
                      styles.forecastBarFill,
                      { height: `${pct * 100}%`, backgroundColor: dayColor + "cc" },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.bulletsWrap}>
          {usingGpt ? (
            <View style={styles.bulletsHeader}>
              <Sparkles size={12} color={Colors.amber} strokeWidth={2.2} />
              <Text style={styles.bulletsHeaderText}>
                {t("frost.gpt_advisor")}{prediction.gpt_model ? ` · ${prediction.gpt_model}` : ""}
              </Text>
            </View>
          ) : null}
          {bullets.map((b, i) => (
            <Text key={i} style={styles.bulletText}>
              •  {b}
            </Text>
          ))}
        </View>

        <Text style={styles.footer}>
          {t("frost.confidence")} {confidencePct}% · {t("frost.model_auc")}{" "}
          {prediction.confidence.model_auc.toFixed(3)} · {t("frost.window")}{" "}
          {formatDate(prediction.recommended_planting.window_start, windowClosed)} →{" "}
          {formatDate(prediction.recommended_planting.window_end, windowClosed)}
        </Text>
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
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  metric: { flex: 1, gap: 4 },
  metricLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
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
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  forecastRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 36,
  },
  forecastCell: { flex: 1, height: "100%", justifyContent: "flex-end" },
  forecastBarTrack: {
    width: "100%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.borderSubtle,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  forecastBarFill: { width: "100%", borderRadius: 3 },
  bulletsWrap: { gap: 6 },
  bulletsHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  bulletsHeaderText: {
    fontSize: FontSize.xs,
    color: Colors.amber,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  bulletText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
  },
});
