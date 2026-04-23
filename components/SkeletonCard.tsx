import { Colors, Radius, Spacing } from "@/constants/theme";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

/**
 * Shimmering skeleton placeholder card matching the visual rhythm of the
 * Smart Irrigation / Frost / Disease cards on the dashboard. Used in place of
 * the spinner+label pattern to make the first render feel instant.
 */
export function SkeletonCard({
  height = 140,
  style,
  delay = 0,
}: {
  height?: number;
  style?: ViewStyle;
  delay?: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        type: "timing",
        duration: 900,
        loop: true,
        repeatReverse: true,
        delay,
      }}
      style={[styles.card, { height }, style]}
    >
      <View style={styles.rowA} />
      <View style={styles.rowB} />
      <View style={styles.rowC} />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCardAlt,
    padding: Spacing.lg,
    gap: Spacing.sm,
    overflow: "hidden",
  },
  rowA: {
    height: 16,
    width: "40%",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  rowB: {
    height: 12,
    width: "82%",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  rowC: {
    height: 12,
    width: "64%",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
});
