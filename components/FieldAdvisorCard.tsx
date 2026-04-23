import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { IrrigationResponse } from "@/services/irrigationService";
import { DiseaseResponse } from "@/services/diseaseService";
import { NdviResponse } from "@/services/ndviService";
import { WeatherData } from "@/services/weatherService";
import { BlurView } from "expo-blur";
import {
  Leaf,
  Recycle,
  Shovel,
  Sprout,
  Sun,
  TreeDeciduous,
  Waves,
} from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export interface FieldAdvisorTip {
  id: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  title: string;
  body: string;
  /** Optional quantitative anchor (e.g. "+0.04 NDVI in 14 days"). */
  impact?: string;
}

interface BuildArgs {
  t: (key: string, opts?: Record<string, unknown>) => string;
  crops: string[];
  irrigation: IrrigationResponse | null;
  diseases: DiseaseResponse[] | null;
  ndvi: NdviResponse | null;
  weather: WeatherData | null;
}

/**
 * Builds a short, prioritised list of actionable field-improvement tips using
 * the live AI outputs already rendered on the dashboard. Every tip is tied to
 * an observed signal so we never show generic filler advice.
 */
export function buildFieldAdvisorTips({
  t,
  crops,
  irrigation,
  diseases,
  ndvi,
  weather,
}: BuildArgs): FieldAdvisorTip[] {
  const tips: FieldAdvisorTip[] = [];

  if (ndvi && ndvi.stats.stdev > 0.12) {
    tips.push({
      id: "ndvi-variability",
      icon: Waves,
      color: Colors.amber,
      title: t("field_advisor.tip_variability_title"),
      body: t("field_advisor.tip_variability_body", {
        stdev: ndvi.stats.stdev.toFixed(2),
      }),
      impact: t("field_advisor.tip_variability_impact"),
    });
  }

  if (ndvi && ndvi.traffic_light !== "green") {
    tips.push({
      id: "ndvi-canopy",
      icon: Leaf,
      color: Colors.green,
      title: t("field_advisor.tip_canopy_title"),
      body: t("field_advisor.tip_canopy_body", {
        mean: ndvi.stats.mean.toFixed(2),
      }),
      impact: t("field_advisor.tip_canopy_impact"),
    });
  }

  if (irrigation && irrigation.status !== "good") {
    tips.push({
      id: "soil-moisture",
      icon: Shovel,
      color: Colors.blue,
      title: t("field_advisor.tip_mulch_title"),
      body: t("field_advisor.tip_mulch_body"),
      impact: t("field_advisor.tip_mulch_impact"),
    });
  }

  if (diseases && diseases.some((d) => d.overall_risk !== "low")) {
    tips.push({
      id: "rotation",
      icon: Recycle,
      color: Colors.green,
      title: t("field_advisor.tip_rotation_title"),
      body: t("field_advisor.tip_rotation_body"),
      impact: t("field_advisor.tip_rotation_impact"),
    });
  }

  // Always-on structural improvements, added last so urgent signal-driven tips
  // bubble to the top. These are classic low-cost interventions recognised by
  // FAO Save & Grow guidance and EU IPARD agronomy briefs.
  tips.push({
    id: "cover-crop",
    icon: Sprout,
    color: Colors.green,
    title: t("field_advisor.tip_cover_title"),
    body: t("field_advisor.tip_cover_body"),
    impact: t("field_advisor.tip_cover_impact"),
  });

  tips.push({
    id: "organic-matter",
    icon: TreeDeciduous,
    color: Colors.amber,
    title: t("field_advisor.tip_organic_title"),
    body: t("field_advisor.tip_organic_body"),
    impact: t("field_advisor.tip_organic_impact"),
  });

  if (weather && weather.current.uvIndex >= 7) {
    tips.push({
      id: "shade",
      icon: Sun,
      color: Colors.amber,
      title: t("field_advisor.tip_shade_title"),
      body: t("field_advisor.tip_shade_body"),
      impact: t("field_advisor.tip_shade_impact"),
    });
  }

  // Cap list at 5 so the card never overwhelms the dashboard.
  return tips.slice(0, 5);
}

interface Props {
  tips: FieldAdvisorTip[];
  delay?: number;
}

export function FieldAdvisorCard({ tips, delay = 0 }: Props) {
  const { t } = useTranslation();
  if (tips.length === 0) return null;
  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay }}
    >
      <BlurView
        intensity={16}
        tint="dark"
        style={[styles.card, { borderColor: Colors.green + "44" }]}
      >
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <View style={styles.iconRing}>
              <Leaf size={14} color={Colors.green} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t("field_advisor.title")}</Text>
              <Text style={styles.subtitle}>{t("field_advisor.subtitle")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tipList}>
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <View key={tip.id} style={styles.tipRow}>
                <View
                  style={[
                    styles.tipIconWrap,
                    { backgroundColor: tip.color + "1F" },
                  ]}
                >
                  <Icon size={14} color={tip.color} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipBody}>{tip.body}</Text>
                  {tip.impact ? (
                    <Text style={[styles.tipImpact, { color: tip.color }]}>
                      {tip.impact}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </BlurView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    gap: Spacing.md,
  },
  header: { gap: Spacing.xs },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.greenDim,
    borderWidth: 1,
    borderColor: Colors.green + "55",
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  tipList: { gap: Spacing.md },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  tipIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tipTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  tipBody: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginTop: 3,
  },
  tipImpact: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginTop: 4,
    textTransform: "uppercase",
  },
});
