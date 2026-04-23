import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { SubsidyOpportunity } from "@/constants/ipard";
import { BlurView } from "expo-blur";
import { Award, ExternalLink } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  opportunities: SubsidyOpportunity[];
  /** Farm size in hectares (from onboarding) — used to render € amounts. */
  farmSizeHa?: number;
  delay?: number;
}

/**
 * IPARD III / national subsidy match card. Takes a list of matched
 * opportunities (see constants/ipard.ts + hooks/useCountryFromLocation.ts)
 * and renders up to two of them with computed grant values for this farm.
 *
 * Why this card matters to the pitch: it is the ONLY direct-€ card in the
 * app that hands the farmer real government money, not saved money. It is
 * the primary acquisition hook and the reason IPARD advisory integrations
 * will be signed with Ministries of Agriculture.
 */
export function SubsidyMatchCard({
  opportunities,
  farmSizeHa = 2,
  delay = 0,
}: Props) {
  const { t } = useTranslation();

  if (opportunities.length === 0) {
    return null;
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay }}
    >
      <BlurView
        intensity={18}
        tint="dark"
        style={[styles.card, { borderColor: Colors.amber + "55" }]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View
              style={[styles.iconWrap, { backgroundColor: Colors.amber + "1F" }]}
            >
              <Award size={16} color={Colors.amber} strokeWidth={2.2} />
            </View>
            <View>
              <Text style={styles.title}>{t("ipard.card_title")}</Text>
              <Text style={styles.subtitle}>{t("ipard.card_subtitle")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.list}>
          {opportunities.map((opp, i) => {
            const farmClampedHa = Math.max(
              opp.minHa ?? 0.1,
              Math.min(opp.maxHa ?? 200, farmSizeHa),
            );
            const baseGrant = opp.grantPerHa * farmClampedHa;
            const bonusGrant = (opp.bonusPerHa ?? 0) * farmClampedHa;
            const totalGrant = baseGrant + bonusGrant;

            return (
              <Pressable
                key={opp.id}
                style={({ pressed }) => [
                  styles.row,
                  i < opportunities.length - 1 ? styles.rowDivider : null,
                  pressed ? { opacity: 0.7 } : null,
                ]}
                onPress={() => Linking.openURL(opp.url)}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.measure}>{t(opp.measureKey)}</Text>
                  <Text style={styles.desc}>{t(opp.descriptionKey)}</Text>
                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.pill,
                        {
                          backgroundColor: Colors.green + "1F",
                          borderColor: Colors.green + "55",
                        },
                      ]}
                    >
                      <Text style={[styles.pillText, { color: Colors.green }]}>
                        {t("ipard.open_call")}
                      </Text>
                    </View>
                    <Text style={styles.muted}>
                      {t("ipard.per_ha", {
                        amount: opp.grantPerHa.toLocaleString("en-GB"),
                      })}
                    </Text>
                    {opp.bonusPerHa && opp.bonusKey ? (
                      <Text style={styles.muted}>
                        · +€{opp.bonusPerHa} {t(opp.bonusKey)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.amountBlock}>
                  <Text style={styles.amount}>
                    €{Math.round(totalGrant).toLocaleString("en-GB")}
                  </Text>
                  <View style={styles.linkRow}>
                    <Text style={styles.linkText}>{t("ipard.apply")}</Text>
                    <ExternalLink size={11} color={Colors.amber} strokeWidth={2.2} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.footnote}>{t("ipard.footnote")}</Text>
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
  header: { flexDirection: "row", alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
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
    color: Colors.textSecondary,
    fontWeight: "500",
    marginTop: 2,
  },
  list: { gap: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  measure: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  desc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  muted: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  amountBlock: { alignItems: "flex-end", gap: 4 },
  amount: {
    fontSize: FontSize.lg,
    color: Colors.amber,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  linkText: {
    fontSize: FontSize.xs,
    color: Colors.amber,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  footnote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
});
