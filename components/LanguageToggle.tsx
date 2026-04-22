import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { BlurView } from "expo-blur";
import { Languages } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

/**
 * Compact EN / BS segmented toggle. Renders in the dashboard top-right so
 * the user can switch languages without leaving the screen. Preference is
 * persisted by `setAppLanguage` on each press.
 */
export function LanguageToggle() {
  const { language, setLanguage } = useAppLanguage();
  const { t } = useTranslation();

  return (
    <BlurView intensity={12} tint="dark" style={styles.wrap}>
      <Languages size={12} color={Colors.textMuted} strokeWidth={2} />
      <View style={styles.seg}>
        <Pressable
          onPress={() => setLanguage("en")}
          style={[styles.pill, language === "en" && styles.pillActive]}
        >
          <Text
            style={[
              styles.label,
              language === "en" && styles.labelActive,
            ]}
          >
            {t("language.short_en")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setLanguage("bs")}
          style={[styles.pill, language === "bs" && styles.pillActive]}
        >
          <Text
            style={[
              styles.label,
              language === "bs" && styles.labelActive,
            ]}
          >
            {t("language.short_bs")}
          </Text>
        </Pressable>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  seg: { flexDirection: "row", gap: 2 },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillActive: { backgroundColor: Colors.green + "22" },
  label: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  labelActive: { color: Colors.green },
});
