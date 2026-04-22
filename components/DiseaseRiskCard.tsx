import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import {
  DiseaseResponse,
  RiskLevel,
  riskColorKey,
} from "@/services/diseaseService";
import { BlurView } from "expo-blur";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Shield,
  Sparkles,
  Sprout,
} from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  report: DiseaseResponse;
  delay?: number;
}

const STATUS_COLOR_MAP: Record<"green" | "amber" | "red", string> = {
  green: Colors.green,
  amber: Colors.amber,
  red: Colors.red,
};

function colorFor(level: RiskLevel): string {
  return STATUS_COLOR_MAP[riskColorKey(level)];
}

function formatRange(start: string, end: string): string {
  const toDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  return `${toDate(start)} → ${toDate(end)}`;
}

export function DiseaseRiskCard({ report, delay = 0 }: Props) {
  const { t } = useTranslation();
  const overallColor = colorFor(report.overall_risk);
  const StatusIcon = report.overall_risk === "low" ? CheckCircle2 : AlertTriangle;
  const topRisk = [...report.risks].sort((a, b) => b.score - a.score)[0] ?? null;
  const riskLabelFor = (level: RiskLevel): string =>
    t(`disease.risk_${level}`, {
      defaultValue: level.charAt(0).toUpperCase() + level.slice(1),
    });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay }}
    >
      <BlurView
        intensity={16}
        tint="dark"
        style={[styles.card, { borderColor: overallColor + "44" }]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { backgroundColor: overallColor + "1F" }]}>
              <Sprout size={16} color={overallColor} strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.title}>{report.crop.toUpperCase()}</Text>
              <Text style={styles.subtitle}>
                {formatRange(report.forecast_start, report.forecast_end)}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: overallColor + "22", borderColor: overallColor + "55" },
            ]}
          >
            <StatusIcon size={12} color={overallColor} strokeWidth={2.5} />
            <Text style={[styles.badgeText, { color: overallColor }]}>
              {riskLabelFor(report.overall_risk).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.risks}>
          {report.risks.map((r) => {
            const c = colorFor(r.risk);
            const Icon = r.kind === "pest" ? Bug : Shield;
            const fill = Math.max(4, Math.min(100, r.score));
            return (
              <View key={r.id} style={styles.riskRow}>
                <View style={styles.riskHeader}>
                  <View style={styles.riskTitleRow}>
                    <Icon size={12} color={c} strokeWidth={2.2} />
                    <Text style={styles.riskName}>{r.name_en}</Text>
                  </View>
                  <Text style={[styles.riskLevel, { color: c }]}>
                    {riskLabelFor(r.risk)}
                  </Text>
                </View>
                <View style={styles.riskBarTrack}>
                  <View
                    style={[
                      styles.riskBarFill,
                      { width: `${fill}%`, backgroundColor: c + "cc" },
                    ]}
                  />
                </View>
                <Text style={styles.riskExplain}>{r.explanation}</Text>
              </View>
            );
          })}
        </View>

        {topRisk && topRisk.prevention.length > 0 ? (
          <View style={styles.preventWrap}>
            <View style={styles.preventHeader}>
              <Sparkles size={12} color={Colors.amber} strokeWidth={2.2} />
              <Text style={styles.preventHeaderText}>
                {t("disease.prevention")} · {topRisk.name_en}
              </Text>
            </View>
            {topRisk.prevention.map((p, i) => (
              <Text key={i} style={styles.preventBullet}>
                •  {p}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer}>{report.ai_explanation}</Text>
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
    fontWeight: "800",
    letterSpacing: 0.4,
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
  risks: { gap: Spacing.sm },
  riskRow: { gap: 4 },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riskTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  riskName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  riskLevel: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  riskBarTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderSubtle,
    overflow: "hidden",
  },
  riskBarFill: { height: "100%", borderRadius: 3 },
  riskExplain: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  preventWrap: { gap: 4 },
  preventHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  preventHeaderText: {
    fontSize: FontSize.xs,
    color: Colors.amber,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  preventBullet: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
    lineHeight: 16,
  },
});
