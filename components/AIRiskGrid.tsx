import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { CropPrediction, trafficLightColorKey } from "@/services/agroPredictService";
import { DiseaseResponse } from "@/services/diseaseService";
import { IrrigationResponse, statusColorKey } from "@/services/irrigationService";
import { NdviResponse } from "@/services/ndviService";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import {
  Droplets,
  LucideIcon,
  Satellite,
  Snowflake,
  Sprout,
} from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

const COLOR_MAP: Record<"green" | "amber" | "red" | "muted", string> = {
  green: Colors.green,
  amber: Colors.amber,
  red: Colors.red,
  muted: Colors.textMuted,
};

interface TileState {
  color: "green" | "amber" | "red" | "muted";
  statusKey: string;
  value: string;
  caption: string;
}

interface Tile {
  id: string;
  icon: LucideIcon;
  label: string;
  loading: boolean;
  state: TileState;
  onPress?: () => void;
}

interface Props {
  frost: { data: CropPrediction[] | null; loading: boolean };
  irrigation: { data: IrrigationResponse | null; loading: boolean };
  disease: { data: DiseaseResponse[] | null; loading: boolean };
  ndvi: { data: NdviResponse | null; loading: boolean };
  delay?: number;
}

function worstOf<T>(
  items: T[] | null,
  rank: (item: T) => number,
): T | null {
  if (!items || items.length === 0) return null;
  return items.reduce((acc, cur) => (rank(cur) > rank(acc) ? cur : acc));
}

function frostState(data: CropPrediction[] | null): TileState {
  if (!data || data.length === 0) {
    return { color: "muted", statusKey: "tiles.status_no_data", value: "—", caption: "tiles.frost_no_data" };
  }
  const worst = worstOf(data, (p) => {
    if (p.risk.traffic_light === "red") return 3;
    if (p.risk.traffic_light === "yellow") return 2;
    return 1;
  })!;
  const color = trafficLightColorKey(worst.risk.traffic_light);
  const maxPct = Math.round(worst.risk.max_frost_probability_14d * 100);
  const date = worst.recommended_planting.date;
  const caption = date
    ? "tiles.frost_plant_on"
    : "tiles.frost_window_closed";
  return {
    color,
    statusKey: `frost.light_${worst.risk.traffic_light}`,
    value: `${maxPct}%`,
    caption,
  };
}

function irrigationState(data: IrrigationResponse | null): TileState {
  if (!data) {
    return { color: "muted", statusKey: "tiles.status_no_data", value: "—", caption: "tiles.irrigation_no_data" };
  }
  const color = statusColorKey(data.status);
  const mm = Math.round(data.recommended_mm);
  return {
    color,
    statusKey: `tiles.irrigation_status_${data.status}`,
    value: `${mm} mm`,
    caption: "tiles.irrigation_recommended",
  };
}

function diseaseState(data: DiseaseResponse[] | null): TileState {
  if (!data || data.length === 0) {
    return { color: "muted", statusKey: "tiles.status_no_data", value: "—", caption: "tiles.disease_no_data" };
  }
  const worst = worstOf(data, (r) => {
    if (r.overall_risk === "high") return 3;
    if (r.overall_risk === "moderate") return 2;
    return 1;
  })!;
  const color: "green" | "amber" | "red" =
    worst.overall_risk === "high"
      ? "red"
      : worst.overall_risk === "moderate"
      ? "amber"
      : "green";
  const topRisk = worst.risks.reduce(
    (acc, r) => (r.score > (acc?.score ?? -1) ? r : acc),
    null as (typeof worst.risks)[number] | null,
  );
  return {
    color,
    statusKey: `disease.risk_${worst.overall_risk}`,
    value: topRisk ? topRisk.name_en : worst.crop,
    caption: "tiles.disease_top_risk",
  };
}

function ndviState(data: NdviResponse | null): TileState {
  if (!data) {
    return { color: "muted", statusKey: "tiles.status_no_data", value: "—", caption: "tiles.ndvi_no_data" };
  }
  const color: "green" | "amber" | "red" = data.traffic_light;
  return {
    color,
    statusKey: `tiles.ndvi_${data.traffic_light}`,
    value: data.stats.mean.toFixed(2),
    caption: "tiles.ndvi_mean_label",
  };
}

export function AIRiskGrid({
  frost,
  irrigation,
  disease,
  ndvi,
  delay = 0,
}: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const tiles: Tile[] = [
    {
      id: "frost",
      icon: Snowflake,
      label: t("tiles.frost_title"),
      loading: frost.loading,
      state: frostState(frost.data),
      onPress: () => {
        const first = frost.data?.[0];
        router.push({
          pathname: "/frost-detail",
          params: first ? { cropId: first.crop.id } : {},
        });
      },
    },
    {
      id: "irrigation",
      icon: Droplets,
      label: t("tiles.irrigation_title"),
      loading: irrigation.loading,
      state: irrigationState(irrigation.data),
    },
    {
      id: "disease",
      icon: Sprout,
      label: t("tiles.disease_title"),
      loading: disease.loading,
      state: diseaseState(disease.data),
    },
    {
      id: "ndvi",
      icon: Satellite,
      label: t("tiles.ndvi_title"),
      loading: ndvi.loading,
      state: ndviState(ndvi.data),
    },
  ];

  const expandedTile = tiles.find((t) => t.id === expanded) ?? null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay }}
      style={styles.wrapper}
    >
      <View style={styles.grid}>
        {tiles.map((tile) => {
          const color = COLOR_MAP[tile.state.color];
          const Icon = tile.icon;
          const isActive = expanded === tile.id;
          return (
            <Pressable
              key={tile.id}
              onPress={() => {
                if (tile.onPress) {
                  tile.onPress();
                } else {
                  setExpanded(isActive ? null : tile.id);
                }
              }}
              style={({ pressed }) => [styles.tileWrap, { opacity: pressed ? 0.9 : 1 }]}
            >
              <BlurView
                intensity={16}
                tint="dark"
                style={[
                  styles.tile,
                  {
                    borderColor: isActive ? color + "99" : color + "33",
                  },
                ]}
              >
                <View style={styles.tileHeader}>
                  <View
                    style={[
                      styles.tileIconWrap,
                      { backgroundColor: color + "1F" },
                    ]}
                  >
                    <Icon size={14} color={color} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.tileLabel}>{tile.label}</Text>
                </View>

                <Text
                  style={[styles.tileValue, { color }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {tile.state.value}
                </Text>
                <Text style={styles.tileCaption} numberOfLines={2}>
                  {t(tile.state.caption)}
                </Text>

                <View
                  style={[
                    styles.tilePill,
                    { backgroundColor: color + "22", borderColor: color + "55" },
                  ]}
                >
                  <Text
                    style={[styles.tilePillText, { color }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {t(tile.state.statusKey).toUpperCase()}
                  </Text>
                </View>
              </BlurView>
            </Pressable>
          );
        })}
      </View>

      {expandedTile ? <ExpandedDetail tile={expandedTile} /> : null}
    </MotiView>
  );
}

function ExpandedDetail({ tile }: { tile: Tile }) {
  const { t } = useTranslation();
  const color = COLOR_MAP[tile.state.color];
  const Icon = tile.icon;
  return (
    <MotiView
      key={tile.id}
      from={{ opacity: 0, translateY: -8, scaleY: 0.98 }}
      animate={{ opacity: 1, translateY: 0, scaleY: 1 }}
      transition={{ type: "timing", duration: 220 }}
    >
      <BlurView
        intensity={16}
        tint="dark"
        style={[styles.detailCard, { borderColor: color + "44" }]}
      >
        <View style={styles.detailHeader}>
          <View style={[styles.tileIconWrap, { backgroundColor: color + "1F" }]}>
            <Icon size={14} color={color} strokeWidth={2.2} />
          </View>
          <Text style={styles.detailTitle}>{tile.label}</Text>
        </View>

        <Text style={styles.detailBody}>
          {t(`tiles.expanded_${tile.id}`, { defaultValue: t(tile.state.caption) })}
        </Text>
      </BlurView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.md },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tileWrap: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  tile: {
    minHeight: 132,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    overflow: "hidden",
    gap: 4,
  },
  tileHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  tileIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontWeight: "700",
    flex: 1,
  },
  tileValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 2,
  },
  tileCaption: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 15,
    flex: 1,
  },
  tilePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
    maxWidth: "100%",
  },
  tilePillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  detailCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    overflow: "hidden",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  detailBody: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
