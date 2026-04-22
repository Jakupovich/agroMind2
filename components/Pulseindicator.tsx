import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Colors, FontSize, Spacing } from '@/constants/theme';

interface Props {
  label: string;
  date: string;
  color?: string;
}

export function PulseIndicator({ label, date, color = Colors.green }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.pulseWrapper}>
        <MotiView
          from={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 2.4 }}
          transition={{ type: 'timing', duration: 1800, loop: true }}
          style={[styles.pulse, { backgroundColor: color }]}
        />
        <MotiView
          from={{ opacity: 0.4, scale: 1 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ type: 'timing', duration: 1800, loop: true, delay: 400 }}
          style={[styles.pulse, { backgroundColor: color }]}
        />
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.date, { color }]}>{date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pulseWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  textBlock: {
    gap: 2,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  date: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});