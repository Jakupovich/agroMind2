/**
 * PlantingDateCard — prominent "Best Day to Plant" dashboard section.
 *
 * One of the two flagship AgroMind features (alongside frost detection).
 * Shows optimal sowing date per crop with:
 *  - Big bold date (DD MMM)
 *  - "X days from now" subtext or "Planted already" if in the past
 *  - Traffic-light per-crop frost-risk chip
 *  - Tap → /frost-detail modal with full reasoning
 */
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { CropPrediction } from "@/services/agroPredictService";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { CalendarDays, ChevronRight, Sprout } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Props {
  predictions: CropPrediction[] | null;
  loading: boolean;
  delay?: number;
}

interface RowModel {
  cropId: string;
  cropName: string;
  dateLabel: string;
  subtitle: string;
  color: "green" | "amber" | "red" | "muted";
  statusKey: string;
}

function colorFor(c: RowModel["color"]): string {
  if (c === "green") return Colors.green;
  if (c === "amber") return Colors.amber;
  if (c === "red") return Colors.red;
  return Colors.textMuted;
}

function buildRow(
  p: CropPrediction,
  t: (k: string, opts?: Record<string, unknown>) => string,
  lang: string,
): RowModel {
  const cropName = lang === "bs" ? p.crop.name_bs : p.crop.name_en;
  const light = p.risk.traffic_light;
  const color: RowModel["color"] =
    light === "green" ? "green" : light === "yellow" ? "amber" : "red";

  const dateStr = p.recommended_planting.date;
  if (!dateStr) {
    return {
      cropId: p.crop.id,
      cropName,
      dateLabel: t("planting.window_closed"),
      subtitle: t("planting.try_another_crop"),
      color: "red",
      statusKey: t("planting.window_closed"),
    };
  }

  const d = new Date(dateStr);
  const dateLabel = d.toLocaleDateString(lang === "bs" ? "bs-BA" : "en-GB", {
    day: "2-digit",
    month: "short",
  });

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysDiff = Math.round(
    (target.getTime() - startOfToday.getTime()) / 86400000,
  );

  let subtitle: string;
  if (daysDiff < 0) {
    subtitle = t("planting.planted_already");
  } else if (daysDiff === 0) {
    subtitle = t("planting.plant_today");
  } else if (daysDiff === 1) {
    subtitle = t("planting.in_one_day");
  } else {
    subtitle = t("planting.in_n_days", { count: daysDiff });
  }

  const statusKey =
    color === "green"
      ? t("planting.status_safe")
      : color === "amber"
        ? t("planting.status_monitor")
        : t("planting.status_delay");

  return {
    cropId: p.crop.id,
    cropName,
    dateLabel,
    subtitle,
    color,
    statusKey,
  };
}

export function PlantingDateCard({ predictions, loading, delay = 0 }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";

  const rows = React.useMemo<RowModel[]>(() => {
    if (!predictions || predictions.length === 0) return [];
    return predictions.slice(0, 3).map((p) => buildRow(p, t, lang));
  }, [predictions, lang, t]);

  const headline = rows[0];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500, delay }}
    >
      <BlurView intensity={18} tint="dark" style={styles.card}>
        <View style={styles.kickerRow}>
          <View style={styles.kickerBadge}>
            <Sprout size={11} color={Colors.green} />
            <Text style={styles.kicker}>{t("planting.kicker")}</Text>
          </View>
          {headline && !loading ? (
            <Text style={styles.subtitle}>{t("planting.tap_for_reason")}</Text>
          ) : null}
        </View>

        {loading && !headline ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.green} />
            <Text style={styles.loadingText}>{t("planting.computing")}</Text>
          </View>
        ) : !headline ? (
          <View style={styles.empty}>
            <CalendarDays size={18} color={Colors.textMuted} />
            <Text style={styles.emptyText}>{t("planting.empty")}</Text>
          </View>
        ) : (
          <>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/frost-detail",
                  params: { cropId: headline.cropId },
                })
              }
              style={({ pressed }) => [
                styles.headlineRow,
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.headlineCrop} numberOfLines={1}>
                  {headline.cropName}
                </Text>
                <View style={styles.dateRow}>
                  <Text
                    style={[
                      styles.date,
                      { color: colorFor(headline.color) },
                    ]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {headline.dateLabel}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: colorFor(headline.color) + "1A",
                        borderColor: colorFor(headline.color) + "55",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: colorFor(headline.color) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: colorFor(headline.color) },
                      ]}
                      numberOfLines={1}
                    >
                      {headline.statusKey}
                    </Text>
                  </View>
                </View>
                <Text style={styles.subtitleText} numberOfLines={1}>
                  {headline.subtitle}
                </Text>
              </View>
              <ChevronRight size={20} color={Colors.textMuted} />
            </Pressable>

            {rows.length > 1 ? (
              <View style={styles.otherCrops}>
                {rows.slice(1).map((row) => (
                  <Pressable
                    key={row.cropId}
                    onPress={() =>
                      router.push({
                        pathname: "/frost-detail",
                        params: { cropId: row.cropId },
                      })
                    }
                    style={({ pressed }) => [
                      styles.miniRow,
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <View
                      style={[
                        styles.miniDot,
                        { backgroundColor: colorFor(row.color) },
                      ]}
                    />
                    <Text style={styles.miniCrop} numberOfLines={1}>
                      {row.cropName}
                    </Text>
                    <Text
                      style={[
                        styles.miniDate,
                        { color: colorFor(row.color) },
                      ]}
                      numberOfLines={1}
                    >
                      {row.dateLabel}
                    </Text>
                    <ChevronRight size={14} color={Colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        )}
      </BlurView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.green + "33",
    padding: Spacing.lg,
    gap: Spacing.sm,
    overflow: "hidden",
  },
  kickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  kickerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.green + "1A",
    borderWidth: 1,
    borderColor: Colors.green + "44",
  },
  kicker: {
    fontSize: 10,
    color: Colors.green,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
    flexShrink: 1,
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingTop: 4,
  },
  headlineCrop: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 4,
    flexWrap: "wrap",
  },
  date: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 36,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 150,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
    marginTop: 4,
  },
  otherCrops: {
    gap: 6,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  miniRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  miniDot: { width: 7, height: 7, borderRadius: 3.5 },
  miniCrop: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  miniDate: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: Spacing.md,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: Spacing.md,
  },
  emptyText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});
