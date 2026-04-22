import { ClimateScoreCard } from "@/components/ClimateScoreCard";
import { DiseaseRiskCard } from "@/components/DiseaseRiskCard";
import { FieldStatsCard } from "@/components/FieldStatsCard";
import { FrostPredictionCard } from "@/components/FrostPredictionCard";
import { LanguageToggle } from "@/components/LanguageToggle";
import { PredictionCard } from "@/components/PredictionCard";
import { SmartIrrigationCard } from "@/components/SmartIrrigationCard";
import { predictions } from "@/constants/mockData";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useDiseaseRisks } from "@/hooks/useDiseaseRisks";
import { useFarmProfile } from "@/hooks/useFarmProfile";
import { useFrostPrediction } from "@/hooks/useFrostPrediction";
import { useIrrigation } from "@/hooks/useIrrigation";
import { useWeather } from "@/hooks/useWeather";
import {
  getWeatherDescription,
  isHailRisk,
  isStormRisk,
} from "@/services/weatherService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import {
  Bell,
  CloudSun,
  Droplets,
  Leaf,
  MapPin,
  RefreshCw,
  Snowflake,
  Sprout,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react-native";
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
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

const alertColor = (type: string) => {
  if (type === "warning") return Colors.amber;
  if (type === "success") return Colors.green;
  return Colors.blue;
};

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

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();


  const [notifCount] = useState(3);
  const {
    data: weather,
    loading,
    refreshing,
    error,
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
  const primaryCrop = (farmCropIds[0] ??
    predictions[0]?.crop.toLowerCase() ??
    "corn") as string;
  const {
    data: irrigation,
    loading: irrigationLoading,
    error: irrigationError,
  } = useIrrigation(farmLat, farmLon, primaryCrop);
  const {
    data: frost,
    loading: frostLoading,
    error: frostError,
  } = useFrostPrediction(farmLat, farmLon, farmCropIds);
  const {
    data: diseases,
    loading: diseasesLoading,
    error: diseasesError,
  } = useDiseaseRisks(farmLat, farmLon, farmCropIds);

  const liveFieldStats = weather
    ? [
        {
          id: "1",
          label: "Temperature",
          value: `${weather.current.temperature}`,
          unit: "°C",
          icon: "thermometer",
          trend: weather.current.temperature > 20 ? "up" : "stable",
          color: Colors.amber,
        },
        {
          id: "2",
          label: "Humidity",
          value: `${weather.current.humidity}%`,
          unit: "",
          icon: "droplets",
          trend: "stable",
          color: Colors.blue,
        },
        {
          id: "3",
          label: "Rainfall",
          value: `${weather.current.precipitation}`,
          unit: "mm",
          icon: "cloud-rain",
          trend: weather.current.precipitation > 0 ? "up" : "down",
          color: "#6366f1",
        },
        {
          id: "4",
          label: "Wind Speed",
          value: `${weather.current.windSpeed}`,
          unit: "km/h",
          icon: "wind",
          trend: "stable",
          color: Colors.green,
        },
        {
          id: "5",
          label: "UV Index",
          value: `${weather.current.uvIndex}`,
          unit: "",
          icon: "sun",
          trend: "stable",
          color: Colors.amber,
        },
        {
          id: "6",
          label: "Soil Temp",
          value: `${weather.current.soilTemperature}`,
          unit: "°C",
          icon: "gauge",
          trend: "stable",
          color: "#8b5cf6",
        },
      ]
    : [];

  const weatherDesc = weather
    ? getWeatherDescription(weather.current.weatherCode)
    : "";
  const hailRisk = weather ? isHailRisk(weather.current.weatherCode) : false;
  const stormRisk = weather ? isStormRisk(weather.current.weatherCode) : false;

  const dynamicAlerts = [
    ...(hailRisk
      ? [
          {
            id: "hail",
            type: "warning",
            text: `⚠️ Hail storm active — HailGuard shields deploying`,
          },
        ]
      : []),
    ...(stormRisk && !hailRisk
      ? [
          {
            id: "storm",
            type: "warning",
            text: `Thunderstorm detected in your area`,
          },
        ]
      : []),
    { id: "1", type: "warning", text: "Frost probability 18% on Apr 16–17" },
    { id: "2", type: "info", text: "Optimal corn window opens in 5 days" },
    {
      id: "3",
      type: "success",
      text: "Soil moisture at ideal germination level",
    },
  ];

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
            <Text style={styles.location}>{locationName} · Field A-7</Text>
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
              Tuesday, April 15 · Spring Planting Season
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
        {weather ? (
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 150 }}
          >
            <BlurView
              intensity={16}
              tint="dark"
              style={[
                styles.liveWeatherCard,
                {
                  borderColor: hailRisk
                    ? Colors.red + "44"
                    : stormRisk
                    ? Colors.amber + "44"
                    : Colors.border,
                },
              ]}
            >
              <View style={styles.lwHeader}>
                <View style={styles.lwTitleRow}>
                  <CloudSun size={14} color={Colors.green} strokeWidth={2} />
                  <Text style={styles.lwTitle}>{t("dashboard.live_weather")}</Text>
                  <View
                    style={[
                      styles.lwLiveDot,
                      { backgroundColor: Colors.green },
                    ]}
                  />
                  <Text style={styles.lwLiveLabel}>LIVE</Text>
                </View>
                {hailRisk ? (
                  <View
                    style={[
                      styles.hailBadge,
                      {
                        backgroundColor: Colors.red + "22",
                        borderColor: Colors.red + "44",
                      },
                    ]}
                  >
                    <Text style={[styles.hailBadgeText, { color: Colors.red }]}>
                      ⚠️ HAIL RISK
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.lwGrid}>
                {[
                  {
                    icon: Thermometer,
                    label: "Temperature",
                    value: `${weather.current.temperature}°C`,
                    color: Colors.amber,
                  },
                  {
                    icon: Droplets,
                    label: "Humidity",
                    value: `${weather.current.humidity}%`,
                    color: Colors.blue,
                  },
                  {
                    icon: Wind,
                    label: "Wind",
                    value: `${weather.current.windSpeed} km/h`,
                    color: Colors.green,
                  },
                  {
                    icon: Sun,
                    label: "UV Index",
                    value: `${weather.current.uvIndex}`,
                    color: Colors.amber,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <View key={item.label} style={styles.lwCell}>
                      <Icon size={14} color={item.color} strokeWidth={2} />
                      <Text style={[styles.lwValue, { color: item.color }]}>
                        {item.value}
                      </Text>
                      <Text style={styles.lwLabel}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>
              {weather.daily.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dailyForecastRow}
                >
                  {weather.daily.slice(0, 7).map((day) => {
                    const dayLabel = new Date(day.date).toLocaleDateString(
                      "en",
                      { weekday: "short" }
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
            </BlurView>
          </MotiView>
        ) : loading ? (
          <BlurView
            intensity={14}
            tint="dark"
            style={[
              styles.liveWeatherCard,
              { alignItems: "center", paddingVertical: 24 },
            ]}
          >
            <ActivityIndicator color={Colors.green} />
            <Text style={[styles.lwLabel, { marginTop: 8 }]}>
              {t("common.loading")}
            </Text>
          </BlurView>
        ) : null}

        <View style={styles.alertsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.alertsScroll}
          >
            {dynamicAlerts.map((alert, i) => (
              <MotiView
                key={alert.id}
                from={{ opacity: 0, translateX: 20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: "timing",
                  duration: 500,
                  delay: 200 + i * 100,
                }}
              >
                <BlurView
                  intensity={14}
                  tint="dark"
                  style={[
                    styles.alertChip,
                    { borderColor: alertColor(alert.type) + "44" },
                  ]}
                >
                  <View
                    style={[
                      styles.alertDot,
                      { backgroundColor: alertColor(alert.type) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.alertText,
                      { color: alertColor(alert.type) },
                    ]}
                  >
                    {alert.text}
                  </Text>
                </BlurView>
              </MotiView>
            ))}
          </ScrollView>
        </View>
        <ClimateScoreCard
          score={82}
          region="Upper Bavaria · Zone 7b"
          season="Spring 2025"
          delay={300}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("dashboard.smart_irrigation")}</Text>
          <Droplets size={16} color={Colors.textSecondary} strokeWidth={1.8} />
        </View>
        <SmartIrrigationCard
          data={irrigation}
          loading={irrigationLoading || farm.loading}
          error={
            irrigationError ??
            (!farm.loading && !farm.location
              ? t("dashboard.empty_irrigation")
              : null)
          }
          delay={350}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("dashboard.frost_prediction")}</Text>
          <View
            style={[
              styles.aiBadge,
              { backgroundColor: Colors.greenDim, borderColor: Colors.border },
            ]}
          >
            <Snowflake size={11} color={Colors.green} strokeWidth={2.2} />
            <Text style={[styles.aiLabel, { color: Colors.green }]}>
              {t("dashboard.badge_agropredict")}
            </Text>
          </View>
        </View>

        {farm.loading || frostLoading ? (
          <BlurView intensity={16} tint="dark" style={styles.frostLoadingCard}>
            <ActivityIndicator color={Colors.green} />
            <Text style={styles.frostLoadingText}>
              {t("dashboard.loading_frost")}
            </Text>
          </BlurView>
        ) : !farm.location || farmCropIds.length === 0 ? (
          <BlurView intensity={16} tint="dark" style={styles.frostLoadingCard}>
            <Text style={styles.frostEmptyText}>
              {t("dashboard.empty_frost")}
            </Text>
          </BlurView>
        ) : frostError && !frost ? (
          <BlurView intensity={16} tint="dark" style={styles.frostLoadingCard}>
            <Text style={styles.frostErrorText}>{frostError}</Text>
          </BlurView>
        ) : frost ? (
          <View style={styles.frostList}>
            {frost.predictions.map((pred, i) => (
              <FrostPredictionCard
                key={pred.crop.id}
                prediction={pred}
                gptEnabled={frost.gpt_enabled}
                delay={400 + i * 120}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("dashboard.disease_pest_risk")}</Text>
          <View
            style={[
              styles.aiBadge,
              { backgroundColor: Colors.greenDim, borderColor: Colors.border },
            ]}
          >
            <Sprout size={11} color={Colors.green} strokeWidth={2.2} />
            <Text style={[styles.aiLabel, { color: Colors.green }]}>
              {t("dashboard.badge_agromind_ai")}
            </Text>
          </View>
        </View>

        {farm.loading || diseasesLoading ? (
          <BlurView intensity={16} tint="dark" style={styles.frostLoadingCard}>
            <ActivityIndicator color={Colors.green} />
            <Text style={styles.frostLoadingText}>
              {t("dashboard.loading_disease")}
            </Text>
          </BlurView>
        ) : !farm.location || farmCropIds.length === 0 ? (
          <BlurView intensity={16} tint="dark" style={styles.frostLoadingCard}>
            <Text style={styles.frostEmptyText}>
              {t("dashboard.empty_disease")}
            </Text>
          </BlurView>
        ) : diseasesError && !diseases ? (
          <BlurView intensity={16} tint="dark" style={styles.frostLoadingCard}>
            <Text style={styles.frostErrorText}>{diseasesError}</Text>
          </BlurView>
        ) : diseases && diseases.length > 0 ? (
          <View style={styles.frostList}>
            {diseases.map((report, i) => (
              <DiseaseRiskCard
                key={report.crop}
                report={report}
                delay={400 + i * 120}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("dashboard.field_statistics")}</Text>
          <CloudSun size={16} color={Colors.textSecondary} strokeWidth={1.8} />
        </View>

        <View style={styles.statsOuter}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScroll}
          >
            {liveFieldStats.map((stat, i) => (
              <FieldStatsCard key={stat.id} stat={stat} delay={400 + i * 80} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top AI Recommendation</Text>
          <View
            style={[
              styles.aiBadge,
              { backgroundColor: Colors.greenDim, borderColor: Colors.border },
            ]}
          >
            <Text style={[styles.aiLabel, { color: Colors.green }]}>
              GPT-4o
            </Text>
          </View>
        </View>

        <View style={styles.predictionWrap}>
          <PredictionCard data={predictions[0]} delay={500} />
        </View>

        <View style={styles.secondaryGrid}>
          {predictions.slice(1).map((pred, i) => (
            <MotiView
              key={pred.id}
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "timing",
                duration: 600,
                delay: 700 + i * 150,
              }}
              style={styles.secondaryCard}
            >
              <PredictionCard data={pred} delay={700 + i * 150} compact />
            </MotiView>
          ))}
        </View>
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
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  location: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  topRight: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
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
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  notifCount: { fontSize: 9, color: "#fff", fontWeight: "800" },
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
  liveWeatherCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: "hidden",
  },
  lwHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lwTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  lwTitle: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  lwLiveDot: { width: 6, height: 6, borderRadius: 3 },
  lwLiveLabel: {
    fontSize: 9,
    color: Colors.green,
    fontWeight: "800",
    letterSpacing: 1,
  },
  hailBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  hailBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  lwGrid: { flexDirection: "row", justifyContent: "space-between" },
  lwCell: { flex: 1, alignItems: "center", gap: 4 },
  lwValue: { fontSize: FontSize.base, fontWeight: "700" },
  lwLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
    textAlign: "center",
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
  alertsSection: { marginHorizontal: -Spacing.md },
  alertsScroll: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  alertChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  alertDot: { width: 6, height: 6, borderRadius: 3 },
  alertText: { fontSize: FontSize.xs, fontWeight: "600", maxWidth: 220 },
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
  statsOuter: { marginHorizontal: -Spacing.md, minHeight: 140 },
  statsScroll: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  aiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  aiLabel: { fontSize: FontSize.xs, fontWeight: "700", letterSpacing: 0.5 },
  frostList: { gap: Spacing.md },
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
  predictionWrap: {
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  secondaryGrid: { gap: Spacing.md },
  secondaryCard: {
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
