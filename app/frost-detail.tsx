import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useFarmProfile } from "@/hooks/useFarmProfile";
import { useFrostPrediction } from "@/hooks/useFrostPrediction";
import {
  CropPrediction,
  DailyForecast,
  trafficLightColorKey,
  trafficLightLabel,
} from "@/services/agroPredictService";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CloudRain,
  Droplets,
  Leaf,
  Snowflake,
  Sparkles,
  Thermometer,
  X,
} from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CROP_ID_OVERRIDES: Record<string, string> = {
  potatoes: "potato",
  soya: "soybeans",
};
function toAgroPredictCropId(label: string): string {
  const key = label.trim().toLowerCase();
  return CROP_ID_OVERRIDES[key] ?? key;
}

const STATUS_COLOR_MAP: Record<"green" | "amber" | "red", string> = {
  green: Colors.green,
  amber: Colors.amber,
  red: Colors.red,
};

function formatDate(iso: string | null, fallback: string): string {
  if (!iso) return fallback;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatShortDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function forecastRowColor(day: DailyForecast): string {
  if (day.crop_frost_risk) return Colors.red;
  if (day.frost_probability >= 0.3) return Colors.amber;
  return Colors.green;
}

export default function FrostDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ cropId?: string }>();
  const farm = useFarmProfile();
  const farmLat = farm.location?.latitude ?? null;
  const farmLon = farm.location?.longitude ?? null;
  const farmCropIds = React.useMemo(
    () => farm.crops.map(toAgroPredictCropId).filter(Boolean),
    [farm.crops],
  );

  const { data, loading, error } = useFrostPrediction(
    farmLat,
    farmLon,
    farmCropIds,
  );

  const prediction: CropPrediction | null = React.useMemo(() => {
    if (!data) return null;
    if (params.cropId) {
      const match = data.predictions.find((p) => p.crop.id === params.cropId);
      if (match) return match;
    }
    return data.predictions[0] ?? null;
  }, [data, params.cropId]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Sparkles size={14} color={Colors.green} strokeWidth={2.2} />
          <Text style={styles.headerKicker}>
            {t("frost_detail.kicker")}
          </Text>
        </View>
        <Pressable
          onPress={close}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <X size={18} color={Colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>

      {loading || farm.loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.green} size="large" />
        </View>
      ) : error && !prediction ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !prediction ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t("frost_detail.no_data")}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Hero prediction={prediction} />
          <WhyBlock prediction={prediction} />
          <ForecastBlock prediction={prediction} />
          <ReasoningBullets prediction={prediction} usingGpt={Boolean(data?.gpt_enabled && prediction.gpt_explanation?.length)} />
        </ScrollView>
      )}
    </View>
  );
}

function Hero({ prediction }: { prediction: CropPrediction }) {
  const { t } = useTranslation();
  const light = prediction.risk.traffic_light;
  const color = STATUS_COLOR_MAP[trafficLightColorKey(light)];
  const StatusIcon = light === "green" ? CheckCircle2 : AlertTriangle;
  const planted = formatDate(
    prediction.recommended_planting.date,
    t("frost.window_closed"),
  );
  const windowStart = formatShortDate(
    prediction.recommended_planting.window_start,
  );
  const windowEnd = formatShortDate(prediction.recommended_planting.window_end);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600 }}
    >
      <BlurView
        intensity={18}
        tint="dark"
        style={[styles.heroCard, { borderColor: color + "66" }]}
      >
        <View style={styles.heroTitleRow}>
          <View style={[styles.heroIconRing, { backgroundColor: color + "22", borderColor: color + "66" }]}>
            <Leaf size={18} color={color} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroCropName}>{prediction.crop.name_en}</Text>
            <Text style={styles.heroCropSub}>{prediction.crop.name_bs}</Text>
          </View>
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: color + "22", borderColor: color + "55" },
            ]}
          >
            <StatusIcon size={12} color={color} strokeWidth={2.4} />
            <Text style={[styles.heroBadgeText, { color }]}>
              {t(`frost.light_${light}`, {
                defaultValue: trafficLightLabel(light),
              }).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.heroMetric}>
          <Calendar size={14} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.heroMetricLabel}>
            {t("frost_detail.recommended_date")}
          </Text>
        </View>
        <Text style={[styles.heroMetricValue, { color }]}>{planted}</Text>
        <Text style={styles.heroWindow}>
          {t("frost_detail.window_span", {
            start: windowStart,
            end: windowEnd,
          })}
        </Text>
      </BlurView>
    </MotiView>
  );
}

function WhyBlock({ prediction }: { prediction: CropPrediction }) {
  const { t } = useTranslation();
  const avgPct = Math.round(prediction.risk.avg_frost_probability_14d * 100);
  const maxPct = Math.round(prediction.risk.max_frost_probability_14d * 100);
  const histPct = Math.round(
    prediction.recommended_planting.historical_frost_rate * 100,
  );
  const confPct = Math.round(prediction.confidence.overall * 100);
  const aucPct = Math.round(prediction.confidence.model_auc * 100);

  const stats = [
    {
      icon: Snowflake,
      label: t("frost_detail.stat_avg_frost"),
      value: `${avgPct}%`,
      color: Colors.blue,
    },
    {
      icon: AlertTriangle,
      label: t("frost_detail.stat_max_frost"),
      value: `${maxPct}%`,
      color: Colors.red,
    },
    {
      icon: Calendar,
      label: t("frost_detail.stat_historical"),
      value: `${histPct}%`,
      color: Colors.amber,
    },
    {
      icon: Sparkles,
      label: t("frost_detail.stat_auc"),
      value: `${aucPct}% / ${confPct}%`,
      color: Colors.green,
    },
  ];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay: 100 }}
    >
      <BlurView intensity={16} tint="dark" style={styles.block}>
        <Text style={styles.blockTitle}>
          {t("frost_detail.why_title")}
        </Text>
        <Text style={styles.blockBody}>{t("frost_detail.why_body")}</Text>
        <View style={styles.statGrid}>
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <View key={s.label} style={styles.statCell}>
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: s.color + "1F" },
                  ]}
                >
                  <Icon size={12} color={s.color} strokeWidth={2.2} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>
                  {s.value}
                </Text>
                <Text style={styles.statLabel} numberOfLines={2}>
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>
      </BlurView>
    </MotiView>
  );
}

function ForecastBlock({ prediction }: { prediction: CropPrediction }) {
  const { t } = useTranslation();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay: 200 }}
    >
      <BlurView intensity={16} tint="dark" style={styles.block}>
        <Text style={styles.blockTitle}>
          {t("frost_detail.forecast_title")}
        </Text>
        <Text style={styles.blockBody}>
          {t("frost_detail.forecast_subtitle")}
        </Text>

        <View style={styles.forecastTable}>
          {prediction.forecast_14d.map((day) => {
            const color = forecastRowColor(day);
            const dateLabel = formatShortDate(day.date);
            const frostPct = Math.round(day.frost_probability * 100);
            return (
              <View key={day.date} style={styles.forecastRow}>
                <Text style={styles.forecastDate}>{dateLabel}</Text>
                <View style={styles.forecastTempCol}>
                  <Thermometer size={11} color={Colors.amber} strokeWidth={2} />
                  <Text style={styles.forecastTempHigh}>
                    {Math.round(day.temp_max_c)}°
                  </Text>
                  <Text style={styles.forecastTempLow}>
                    {Math.round(day.temp_min_c)}°
                  </Text>
                </View>
                <View style={styles.forecastPrecipCol}>
                  <CloudRain size={11} color={Colors.blue} strokeWidth={2} />
                  <Text style={styles.forecastPrecip}>
                    {day.precipitation_mm.toFixed(1)} mm
                  </Text>
                </View>
                <View
                  style={[
                    styles.forecastRiskPill,
                    { backgroundColor: color + "22", borderColor: color + "55" },
                  ]}
                >
                  <Droplets size={10} color={color} strokeWidth={2.2} />
                  <Text style={[styles.forecastRiskText, { color }]}>
                    {frostPct}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </BlurView>
    </MotiView>
  );
}

function ReasoningBullets({
  prediction,
  usingGpt,
}: {
  prediction: CropPrediction;
  usingGpt: boolean;
}) {
  const { t } = useTranslation();
  const bullets =
    prediction.gpt_explanation && prediction.gpt_explanation.length > 0
      ? prediction.gpt_explanation
      : prediction.explanation;
  if (!bullets || bullets.length === 0) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay: 300 }}
    >
      <BlurView intensity={16} tint="dark" style={styles.block}>
        <View style={styles.reasoningHeader}>
          <Text style={styles.blockTitle}>
            {t("frost_detail.reasoning_title")}
          </Text>
          {usingGpt ? (
            <View style={styles.gptPill}>
              <Sparkles size={10} color={Colors.green} strokeWidth={2.4} />
              <Text style={styles.gptPillText}>
                {t("frost.gpt_advisor").toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.bulletList}>
          {bullets.map((line, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </View>
      </BlurView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerKicker: {
    color: Colors.green,
    fontSize: FontSize.xs,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg },
  errorText: { color: Colors.red, fontSize: FontSize.sm, textAlign: "center" },
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  heroCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    gap: Spacing.sm,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  heroIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  heroCropName: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: "700",
  },
  heroCropSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
  },
  heroMetricLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  heroMetricValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
  },
  heroWindow: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  block: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    gap: Spacing.sm,
  },
  blockTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  blockBody: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  statCell: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
  statIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: "800",
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  forecastTable: {
    gap: 6,
    marginTop: Spacing.xs,
  },
  forecastRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  forecastDate: {
    width: 64,
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: "700",
  },
  forecastTempCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 70,
  },
  forecastTempHigh: {
    color: Colors.amber,
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  forecastTempLow: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  forecastPrecipCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  forecastPrecip: {
    color: Colors.blue,
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  forecastRiskPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  forecastRiskText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  reasoningHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gptPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Colors.greenDim,
    borderWidth: 1,
    borderColor: Colors.green + "55",
  },
  gptPillText: {
    color: Colors.green,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  bulletList: { gap: Spacing.sm, marginTop: Spacing.xs },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
    marginTop: 7,
  },
  bulletText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
});
