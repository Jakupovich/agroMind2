import { AIModelsCard } from "@/components/AIModelsCard";
import { AIRiskGrid } from "@/components/AIRiskGrid";
import {
  buildFieldAdvisorTips,
  FieldAdvisorCard,
} from "@/components/FieldAdvisorCard";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SubsidyMatchCard } from "@/components/SubsidyMatchCard";
import { matchSubsidies } from "@/constants/ipard";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useClimateScore } from "@/hooks/useClimateScore";
import { countryFromLocation } from "@/hooks/useCountryFromLocation";
import { useDiseaseRisks } from "@/hooks/useDiseaseRisks";
import { useFarmProfile } from "@/hooks/useFarmProfile";
import { useFrostPrediction } from "@/hooks/useFrostPrediction";
import { useIrrigation } from "@/hooks/useIrrigation";
import { useNdvi } from "@/hooks/useNdvi";
import { useSeasonLabel } from "@/hooks/useSeasonLabel";
import { useWeather } from "@/hooks/useWeather";
import { getWeatherDescription } from "@/services/weatherService";
import { BlurView } from "expo-blur";
import {
  Bell,
  Droplets,
  Leaf,
  MapPin,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WMO_ICON: Record<string, string> = {
  Clear: "☀️",
  Mainly: "🌤",
  Partly: "⛅",
  Overcast: "☁️",
  Fog: "🌫",
  Drizzle: "🌦",
  Rain: "🌧",
  Snow: "❄️",
  Shower: "🌦",
  Thunder: "⛈",
  Hail: "🌨",
  Unknown: "🌡",
};

function weatherIcon(desc: string): string {
  const key = Object.keys(WMO_ICON).find((k) => desc.includes(k));
  return key ? WMO_ICON[key] : "🌡";
}

// Maps the crop labels the user picks during onboarding to the ids the
// Agro-Predict API accepts (see GET /crops). Unknown entries fall through.
const CROP_ID_OVERRIDES: Record<string, string> = {
  potatoes: "potato",
  soya: "soybeans",
};
function toAgroPredictCropId(label: string): string {
  const key = label.trim().toLowerCase();
  return CROP_ID_OVERRIDES[key] ?? key;
}

function formatToday(locale: string): string {
  try {
    return new Date().toLocaleDateString(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return new Date().toDateString();
  }
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();


  const {
    data: weather,
    loading,
    refreshing,
    locationName,
    refresh,
  } = useWeather();

  const farm = useFarmProfile();
  const farmLat = farm.location?.latitude ?? null;
  const farmLon = farm.location?.longitude ?? null;
  const farmCropIds = React.useMemo(
    () => farm.crops.map(toAgroPredictCropId).filter(Boolean),
    [farm.crops],
  );
  const primaryCrop = (farmCropIds[0] ?? "corn") as string;
  const { data: irrigation, loading: irrigationLoading } = useIrrigation(
    farmLat,
    farmLon,
    primaryCrop,
  );
  const {
    data: frost,
    loading: frostLoading,
    error: frostError,
  } = useFrostPrediction(farmLat, farmLon, farmCropIds);
  const { data: diseases, loading: diseasesLoading } = useDiseaseRisks(
    farmLat,
    farmLon,
    farmCropIds,
  );
  const { data: ndvi, loading: ndviLoading } = useNdvi(farmLat, farmLon);

  const climate = useClimateScore(weather, frost, diseases, irrigation);
  const seasonLabel = useSeasonLabel();
  const todayLabel = React.useMemo(
    () => formatToday(i18n.language === "bs" ? "bs-BA" : "en-GB"),
    [i18n.language],
  );
  const country = React.useMemo(
    () => countryFromLocation(farm.location),
    [farm.location],
  );
  const subsidies = React.useMemo(
    () => (country ? matchSubsidies(country, farmCropIds) : []),
    [country, farmCropIds],
  );
  const farmSizeHaSafe = farm.sizeHa > 0 ? farm.sizeHa : 2;
  const regionLabel = React.useMemo(() => {
    const countryName =
      country === "ME"
        ? "Montenegro"
        : country === "BA"
          ? "Bosnia & Herzegovina"
          : country === "RS"
            ? "Serbia"
            : null;
    const loc = farm.location;
    const coords = loc
      ? `${loc.latitude.toFixed(2)}°N · ${loc.longitude.toFixed(2)}°E`
      : locationName;
    return countryName ? `${countryName} · ${coords}` : coords;
  }, [country, farm.location, locationName]);

  const weatherDesc = weather
    ? getWeatherDescription(weather.current.weatherCode)
    : "";

  const frostDays14 = React.useMemo(() => {
    if (!frost?.predictions) return 0;
    return frost.predictions.reduce(
      (s, p) => s + (p.risk.crop_frost_risk_days_14d ?? 0),
      0,
    );
  }, [frost]);

  const worstDisease = React.useMemo(() => {
    if (!diseases) return null;
    for (const report of diseases) {
      const high = report.risks.find((r) => r.risk === "high");
      if (high)
        return { name: high.name_en, crop: report.crop };
    }
    return null;
  }, [diseases]);

  const dynamicAlerts: { id: string; type: "warning" | "info" | "success"; text: string }[] =
    React.useMemo(() => {
      const out: { id: string; type: "warning" | "info" | "success"; text: string }[] = [];
      if (irrigation?.status === "urgent") {
        out.push({
          id: "irrigation-urgent",
          type: "warning",
          text: t("alerts.irrigation_urgent", {
            mm: Math.round(irrigation.recommended_mm),
          }),
        });
      } else if (irrigation?.status === "moderate") {
        out.push({
          id: "irrigation-moderate",
          type: "info",
          text: t("alerts.irrigation_moderate", {
            mm: Math.round(irrigation.recommended_mm),
          }),
        });
      }
      if (frostDays14 > 0) {
        out.push({
          id: "frost-14d",
          type: "warning",
          text: t("alerts.frost_risk_days", { count: frostDays14 }),
        });
      }
      if (worstDisease) {
        out.push({
          id: `disease-${worstDisease.crop}`,
          type: "warning",
          text: t("alerts.disease_high", { name: worstDisease.name }),
        });
      }
      return out;
    }, [irrigation, frostDays14, worstDisease, t]);

  const notifCount = dynamicAlerts.filter((a) => a.type === "warning").length;

  const fieldTips = React.useMemo(
    () =>
      buildFieldAdvisorTips({
        t,
        crops: farmCropIds,
        irrigation,
        diseases: diseases ?? null,
        ndvi,
        weather,
      }),
    [t, farmCropIds, irrigation, diseases, ndvi, weather],
  );

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.green}
            colors={[Colors.green]}
          />
        }
      >
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          style={styles.topBar}
        >
          <View style={styles.locationRow}>
            <MapPin size={14} color={Colors.green} strokeWidth={2} />
            <Text style={styles.location} numberOfLines={1}>
              {regionLabel}
            </Text>
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: loading ? Colors.amber : Colors.green },
              ]}
            />
          </View>
          <View style={styles.topRight}>
            <Pressable onPress={refresh} style={styles.refreshBtn}>
              <MotiView
                animate={{ rotate: refreshing ? "360deg" : "0deg" }}
                transition={{ type: "timing", duration: 600, loop: refreshing }}
              >
                <RefreshCw
                  size={16}
                  color={Colors.textSecondary}
                  strokeWidth={1.8}
                />
              </MotiView>
            </Pressable>
            <Pressable style={styles.notifBtn}>
              <Bell size={20} color={Colors.textPrimary} strokeWidth={1.8} />
              {notifCount > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifCount}>{notifCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <LanguageToggle />
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 100 }}
          style={styles.greetingBlock}
        >
          <View style={styles.greetingRow}>
            <Leaf size={18} color={Colors.green} strokeWidth={2} />
            <Text style={styles.greetingTag}>{t("dashboard.greeting_tag")}</Text>
          </View>
          <Text style={styles.greeting}>{t("dashboard.greeting")}</Text>
          <View style={styles.greetingMetaRow}>
            <Text style={styles.greetingSub}>
              {todayLabel} · {seasonLabel}
            </Text>
            {weather ? (
              <BlurView intensity={12} tint="dark" style={styles.weatherPill}>
                <Text style={styles.weatherPillEmoji}>
                  {weatherIcon(weatherDesc)}
                </Text>
                <Text style={styles.weatherPillTemp}>
                  {weather.current.temperature}°C
                </Text>
                <Text style={styles.weatherPillDesc}>{weatherDesc}</Text>
              </BlurView>
            ) : null}
          </View>
        </MotiView>
        {weather || loading ? (
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 150 }}
          >
            <BlurView
              intensity={18}
              tint="dark"
              style={[
                styles.heroCard,
                {
                  borderColor:
                    climate.score >= 75
                      ? Colors.green + "44"
                      : climate.score >= 50
                      ? Colors.amber + "44"
                      : Colors.red + "44",
                },
              ]}
            >
              <View style={styles.heroTopRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.heroKicker}>
                    {t("dashboard.climate_resilience")}
                  </Text>
                  <View style={styles.heroScoreRow}>
                    <Text
                      style={[
                        styles.heroScore,
                        {
                          color:
                            climate.score >= 75
                              ? Colors.green
                              : climate.score >= 50
                              ? Colors.amber
                              : Colors.red,
                        },
                      ]}
                    >
                      {climate.score}
                    </Text>
                    <Text style={styles.heroScoreMax}>/100</Text>
                  </View>
                  <Text style={styles.heroRegion} numberOfLines={1}>
                    {regionLabel}
                  </Text>
                </View>
                {weather ? (
                  <View style={styles.heroWeatherCol}>
                    <Text style={styles.heroWeatherEmoji}>
                      {weatherIcon(weatherDesc)}
                    </Text>
                    <Text style={styles.heroWeatherTemp}>
                      {weather.current.temperature}°C
                    </Text>
                    <Text
                      style={styles.heroWeatherDesc}
                      numberOfLines={1}
                    >
                      {weatherDesc}
                    </Text>
                  </View>
                ) : (
                  <ActivityIndicator color={Colors.green} />
                )}
              </View>

              {weather ? (
                <View style={styles.heroMiniGrid}>
                  {[
                    {
                      icon: Droplets,
                      value: `${weather.current.humidity}%`,
                      color: Colors.blue,
                    },
                    {
                      icon: Wind,
                      value: `${weather.current.windSpeed} km/h`,
                      color: Colors.green,
                    },
                    {
                      icon: Sun,
                      value: `UV ${weather.current.uvIndex}`,
                      color: Colors.amber,
                    },
                    {
                      icon: Thermometer,
                      value: `${weather.current.soilTemperature}°C`,
                      color: "#8b5cf6",
                    },
                  ].map((m, i) => {
                    const Icon = m.icon;
                    return (
                      <View key={i} style={styles.heroMiniCell}>
                        <Icon size={12} color={m.color} strokeWidth={2} />
                        <Text style={styles.heroMiniValue}>{m.value}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {weather && weather.daily.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dailyForecastRow}
                >
                  {weather.daily.slice(0, 7).map((day) => {
                    const dayLabel = new Date(day.date).toLocaleDateString(
                      "en",
                      { weekday: "short" },
                    );
                    const dayDesc = getWeatherDescription(day.weatherCode);
                    return (
                      <View key={day.date} style={styles.dailyCell}>
                        <Text style={styles.dailyDay}>{dayLabel}</Text>
                        <Text style={styles.dailyIcon}>
                          {weatherIcon(dayDesc)}
                        </Text>
                        <Text style={styles.dailyMax}>{day.maxTemp}°</Text>
                        <Text style={styles.dailyMin}>{day.minTemp}°</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              ) : null}

              {notifCount > 0 ? (
                <View style={styles.heroAlertPill}>
                  <Bell size={12} color={Colors.red} strokeWidth={2.4} />
                  <Text style={styles.heroAlertText}>
                    {t("dashboard.open_alerts", { count: notifCount })}
                  </Text>
                </View>
              ) : null}
            </BlurView>
          </MotiView>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t("dashboard.ai_overview")}
          </Text>
          <Text style={styles.sectionTapHint}>
            {t("dashboard.tap_for_details")}
          </Text>
        </View>

        <AIRiskGrid
          frost={{
            data: frost?.predictions ?? null,
            loading: frostLoading || farm.loading,
          }}
          irrigation={{
            data: irrigation,
            loading: irrigationLoading || farm.loading,
          }}
          disease={{ data: diseases, loading: diseasesLoading || farm.loading }}
          ndvi={{ data: ndvi, loading: ndviLoading || farm.loading }}
          delay={260}
        />

        {!farm.loading && (!farm.location || farmCropIds.length === 0) ? (
          <BlurView intensity={16} tint="dark" style={styles.frostLoadingCard}>
            <Text style={styles.frostEmptyText}>
              {t("dashboard.empty_frost")}
            </Text>
          </BlurView>
        ) : frostError && !frost ? (
          <BlurView intensity={16} tint="dark" style={styles.frostLoadingCard}>
            <Text style={styles.frostErrorText}>{frostError}</Text>
          </BlurView>
        ) : null}

        {fieldTips.length > 0 ? (
          <FieldAdvisorCard tips={fieldTips.slice(0, 3)} delay={380} />
        ) : null}

        {subsidies.length > 0 ? (
          <SubsidyMatchCard
            opportunities={subsidies}
            farmSizeHa={farmSizeHaSafe}
            delay={420}
          />
        ) : null}

        <AIModelsCard delay={500} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { gap: Spacing.lg, paddingHorizontal: Spacing.md },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  location: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
    flexShrink: 1,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexShrink: 0,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBtn: {
    position: "relative",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.bg,
  },
  notifCount: { fontSize: 10, color: "#fff", fontWeight: "800", lineHeight: 12 },
  greetingBlock: { gap: 4 },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  greetingTag: {
    fontSize: FontSize.xs,
    color: Colors.green,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  greeting: {
    fontSize: FontSize.xxl,
    color: Colors.textPrimary,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  greetingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  greetingSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  weatherPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  weatherPillEmoji: { fontSize: 14 },
  weatherPillTemp: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  weatherPillDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  heroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: "hidden",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  heroKicker: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroScoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 2,
  },
  heroScore: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 46,
  },
  heroScoreMax: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "600",
    marginBottom: 6,
  },
  heroRegion: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
    marginTop: 4,
  },
  heroWeatherCol: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  heroWeatherEmoji: { fontSize: 30 },
  heroWeatherTemp: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  heroWeatherDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
    maxWidth: 100,
    textAlign: "right",
  },
  heroMiniGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  heroMiniCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroMiniValue: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  heroAlertPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.red + "1A",
    borderWidth: 1,
    borderColor: Colors.red + "55",
  },
  heroAlertText: {
    fontSize: FontSize.xs,
    color: Colors.red,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  sectionTapHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  dailyForecastRow: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  dailyCell: { alignItems: "center", gap: 3, minWidth: 44 },
  dailyDay: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  dailyIcon: { fontSize: 18 },
  dailyMax: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  dailyMin: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  frostLoadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    overflow: "hidden",
  },
  frostLoadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  frostEmptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  frostErrorText: {
    fontSize: FontSize.sm,
    color: Colors.red,
    fontWeight: "600",
  },
});
