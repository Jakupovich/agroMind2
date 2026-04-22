import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { Droplets, Thermometer, CloudRain, Wind, Sun, Gauge } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

interface StatItem {
  id: string;
  label: string;
  value: string;
  unit: string;
  icon: string;
  trend: string;
  color: string;
}

interface Props {
  stat: StatItem;
  delay?: number;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  droplets: Droplets,
  thermometer: Thermometer,
  'cloud-rain': CloudRain,
  wind: Wind,
  sun: Sun,
  gauge: Gauge,
};

const trendArrow = (trend: string) => {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
};

const trendColor = (trend: string) => {
  if (trend === 'up') return Colors.green;
  if (trend === 'down') return Colors.red;
  return Colors.textSecondary;
};

export function FieldStatsCard({ stat, delay = 0 }: Props) {
  const IconComponent = iconMap[stat.icon] || Gauge;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600, delay }}
    >
      <Pressable>
        {({ pressed }) => (
          <MotiView
            animate={{ scale: pressed ? 0.95 : 1 }}
            transition={{ type: 'timing', duration: 120 }}
          >
            <BlurView intensity={16} tint="dark" style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: stat.color + '18' }]}>
                <IconComponent size={20} color={stat.color} strokeWidth={1.8} />
              </View>
              <Text style={styles.label}>{stat.label}</Text>
              <View style={styles.valueRow}>
                <Text style={styles.value}>{stat.value}</Text>
                {stat.unit ? <Text style={styles.unit}>{stat.unit}</Text> : null}
              </View>
              <Text style={[styles.trend, { color: trendColor(stat.trend) }]}>
                {trendArrow(stat.trend)} {stat.trend}
              </Text>
            </BlurView>
          </MotiView>
        )}
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 6,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  value: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  unit: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 3,
  },
  trend: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.4,
  },
});