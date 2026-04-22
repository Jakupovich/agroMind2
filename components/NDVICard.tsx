import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { NdviLight, NdviResponse } from "@/services/ndviService";
import { BlurView } from "expo-blur";
import { AlertTriangle, CheckCircle2, Satellite } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Props {
  data: NdviResponse | null;
  loading?: boolean;
  error?: string | null;
  delay?: number;
}

const STATUS_COLOR_MAP: Record<NdviLight, string> = {
  green: Colors.green,
  amber: Colors.amber,
  red: Colors.red,
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function NDVICard({ data, loading = false, error = null, delay = 0 }: Props) {
  const { t } = useTranslation();
  const color = data ? STATUS_COLOR_MAP[data.traffic_light] : Colors.green;
  const StatusIcon = data && data.traffic_light === "green" ? CheckCircle2 : AlertTriangle;

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
              <Satellite size={16} color={color} strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.title}>{t("ndvi.title")}</Text>
              <Text style={styles.subtitle}>
                {data?.acquisition_date
                  ? `${t("ndvi.scene_date")} · ${formatDate(data.acquisition_date)}`
                  : t("ndvi.subtitle")}
              </Text>
            </View>
          </View>
          {data ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: color + "22",
                  borderColor: color + "55",
                },
              ]}
            >
              <StatusIcon size={12} color={color} strokeWidth={2.5} />
              <Text style={[styles.badgeText, { color }]}>
                {data.score_label.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>

        {loading && !data ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.green} />
            <Text style={styles.loadingText}>{t("ndvi.loading")}</Text>
          </View>
        ) : error && !data ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : data ? (
          <>
            <View style={styles.previewRow}>
              <Image
                source={{ uri: `data:image/png;base64,${data.image_png_base64}` }}
                style={styles.preview}
                resizeMode="cover"
              />
              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>{t("ndvi.mean")}</Text>
                  <Text style={[styles.metricValue, { color }]}>
                    {data.stats.mean.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>{t("ndvi.range")}</Text>
                  <Text style={styles.metricValue}>
                    {data.stats.min.toFixed(2)} – {data.stats.max.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>{t("ndvi.valid_pixels")}</Text>
                  <Text style={styles.metricValue}>
                    {Math.round(data.stats.valid_pixel_ratio * 100)}%
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bullets}>
              {data.explanation.map((line, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: color }]} />
                  <Text style={styles.bulletText}>{line}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.footer}>
              {t("ndvi.patch_label")} {data.box_meters} m ·{" "}
              {t("ndvi.provider")}
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
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
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
    fontWeight: "500",
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
  previewRow: { flexDirection: "row", gap: Spacing.md },
  preview: {
    width: 120,
    height: 120,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgCardAlt,
  },
  metrics: { flex: 1, justifyContent: "space-between", gap: 8 },
  metric: {},
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  bullets: { gap: 6 },
  bulletRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  footer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});
