import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { BlurView } from "expo-blur";
import { CloudRain, Snowflake, Sprout, TrendingUp } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export interface ROIMetrics {
  /** EUR value protected this season (frost + disease + irrigation combined). */
  eurSaved: number;
  /** Irrigation water not wasted vs. naive schedule, in m³. */
  waterSavedM3: number;
  /** Number of frost events where an urgent alert fired. */
  frostEventsAvoided: number;
  /** Number of disease spray windows AgroMind flagged before pressure built. */
  diseaseWindowsFlagged: number;
}

interface Props {
  metrics: ROIMetrics;
  delay?: number;
}

/**
 * Seasonal ROI summary card. Numbers are derived from the observed AI outputs
 * across the last N days (see hooks/useRoiMetrics.ts) — never invented.
 *
 * This is the card that reframes the product from "interesting tech" to
 * "tangible euros". It is the retention driver and the slide-10 hero visual.
 */
export function ROISavingsCard({ metrics, delay = 0 }: Props) {
  const { t } = useTranslation();
  const formatEuro = (n: number) =>
    `€ ${Math.round(n).toLocaleString("en-GB")}`;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay }}
    >
      <BlurView
        intensity={18}
        tint="dark"
        style={[styles.card, { borderColor: Colors.green + "55" }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View
              style={[styles.iconWrap, { backgroundColor: Colors.green + "1F" }]}
            >
              <TrendingUp size={16} color={Colors.green} strokeWidth={2.2} />
            </View>
            <View>
              <Text style={styles.title}>{t("roi.title")}</Text>
              <Text style={styles.subtitle}>{t("roi.subtitle")}</Text>
            </View>
          </View>
          <View
            style={[
              styles.headlineBadge,
              {
                backgroundColor: Colors.green + "22",
                borderColor: Colors.green + "55",
              },
            ]}
          >
            <Text style={[styles.headlineText, { color: Colors.green }]}>
              {formatEuro(metrics.eurSaved)}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <MetricCell
            color={Colors.red}
            icon={<Snowflake size={14} color={Colors.red} strokeWidth={2.2} />}
            value={String(metrics.frostEventsAvoided)}
            label={t("roi.frost_events")}
          />
          <View style={styles.divider} />
          <MetricCell
            color={Colors.blue}
            icon={<CloudRain size={14} color={Colors.blue} strokeWidth={2.2} />}
            value={`${metrics.waterSavedM3.toLocaleString("en-GB")} m³`}
            label={t("roi.water_saved")}
          />
          <View style={styles.divider} />
          <MetricCell
            color={Colors.amber}
            icon={<Sprout size={14} color={Colors.amber} strokeWidth={2.2} />}
            value={String(metrics.diseaseWindowsFlagged)}
            label={t("roi.disease_flagged")}
          />
        </View>

        <Text style={styles.explanation}>{t("roi.explanation")}</Text>
      </BlurView>
    </MotiView>
  );
}

function MetricCell({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.metricCell}>
      <View style={styles.metricLabelRow}>
        {icon}
        <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
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
  headerRow: {
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
    color: Colors.textSecondary,
    fontWeight: "500",
    marginTop: 2,
  },
  headlineBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  headlineText: {
    fontSize: FontSize.md,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: Spacing.xs,
  },
  metricCell: {
    flex: 1,
    gap: 6,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.borderSubtle,
  },
  explanation: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
