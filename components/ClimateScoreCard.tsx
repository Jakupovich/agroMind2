import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

interface Props {
  score: number;
  region: string;
  season: string;
  delay?: number;
}

export function ClimateScoreCard({ score, region, season, delay = 0 }: Props) {
  const getScoreColor = (s: number) => {
    if (s >= 75) return Colors.green;
    if (s >= 50) return Colors.amber;
    return Colors.red;
  };

  const getScoreLabel = (s: number) => {
    if (s >= 75) return 'Excellent';
    if (s >= 50) return 'Moderate';
    return 'High Risk';
  };

  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const progress = ((100 - score) / 100) * circumference;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 700, delay }}
      style={styles.wrapper}
    >
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/images/hero-farm.jpg')}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.imageOverlay} />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.regionLabel}>Field Region</Text>
              <Text style={styles.region}>{region}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
              <Text style={[styles.badgeText, { color }]}>{getScoreLabel(score)}</Text>
            </View>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBlock}>
              <Text style={[styles.scoreValue, { color }]}>{score}</Text>
              <Text style={styles.scoreUnit}>/100</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreTitle}>Climate Resilience</Text>
              <Text style={styles.scoreSeason}>{season}</Text>
              <View style={styles.progressBar}>
                <MotiView
                  from={{ width: '0%' }}
                  animate={{ width: `${score}%` }}
                  transition={{ type: 'timing', duration: 1200, delay: delay + 300 }}
                  style={[styles.progressFill, { backgroundColor: color }]}
                />
              </View>
            </View>
          </View>
        </View>
      </BlurView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.md,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 17, 23, 0.55)',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  regionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: 2,
  },
  region: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  scoreValue: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 56,
  },
  scoreUnit: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreInfo: {
    flex: 1,
    gap: 4,
  },
  scoreTitle: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  scoreSeason: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});