import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { TrendingUp, Calendar, DollarSign, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react-native';
import { PulseIndicator } from './Pulseindicator';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

interface Risk {
  label: string;
  level: string;
  value: number;
}

interface PredictionData {
  id: string;
  crop: string;
  variety: string;
  status: string;
  statusLabel: string;
  probability: number;
  sowingDate: string;
  harvestDate: string;
  lossAvoidance: string;
  yieldBoost: string;
  risks: Risk[];
  insights: string[];
}

interface Props {
  data: PredictionData;
  delay?: number;
  compact?: boolean;
}

const riskColor = (level: string) => {
  if (level === 'high') return Colors.red;
  if (level === 'medium') return Colors.amber;
  return Colors.green;
};

export function PredictionCard({ data, delay = 0, compact = false }: Props) {
  const probAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(probAnim, {
      toValue: data.probability,
      duration: 1600,
      delay: delay + 400,
      useNativeDriver: false,
    }).start();
  }, []);

  const isOptimal = data.status === 'optimal';
  const statusColor = isOptimal ? Colors.green : Colors.red;
  const StatusIcon = isOptimal ? CheckCircle : AlertTriangle;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 40 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 700, delay }}
    >
      <BlurView intensity={20} tint="dark" style={[styles.card, compact && styles.cardCompact]}>
        <View style={styles.header}>
          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>{data.crop}</Text>
            <Text style={styles.variety}>{data.variety}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '1A', borderColor: statusColor + '44' }]}>
            <StatusIcon size={12} color={statusColor} strokeWidth={2.5} />
            <Text style={[styles.statusText, { color: statusColor }]}>{data.statusLabel}</Text>
          </View>
        </View>

        <View style={styles.probabilitySection}>
          <View style={styles.probHeader}>
            <Text style={styles.probLabel}>Success Probability</Text>
            <Animated.Text style={[styles.probValue, { color: statusColor }]}>
              {probAnim.interpolate({
                inputRange: [0, data.probability],
                outputRange: ['0%', `${data.probability}%`],
              })}
            </Animated.Text>
          </View>
          <View style={styles.probBar}>
            <MotiView
              from={{ width: '0%' }}
              animate={{ width: `${data.probability}%` }}
              transition={{ type: 'timing', duration: 1400, delay: delay + 300 }}
              style={[styles.probFill, { backgroundColor: statusColor }]}
            />
            <View style={[styles.probGlow, { backgroundColor: statusColor, left: `${data.probability}%` }]} />
          </View>
        </View>

        {!compact && (
          <>
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Calendar size={14} color={Colors.textSecondary} strokeWidth={1.8} />
                <Text style={styles.metricLabel}>Sow Window</Text>
                <Text style={styles.metricValue}>{data.sowingDate}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metric}>
                <TrendingUp size={14} color={Colors.textSecondary} strokeWidth={1.8} />
                <Text style={styles.metricLabel}>Yield Change</Text>
                <Text style={[styles.metricValue, { color: isOptimal ? Colors.green : Colors.red }]}>{data.yieldBoost}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metric}>
                <DollarSign size={14} color={Colors.textSecondary} strokeWidth={1.8} />
                <Text style={styles.metricLabel}>Loss Avoided</Text>
                <Text style={[styles.metricValue, { color: Colors.amber }]}>{data.lossAvoidance}</Text>
              </View>
            </View>

            <View style={styles.pulseSection}>
              <PulseIndicator
                label="Optimal Sowing Day"
                date={data.sowingDate}
                color={isOptimal ? Colors.green : Colors.amber}
              />
            </View>

            <View style={styles.risksSection}>
              <Text style={styles.sectionTitle}>Risk Assessment</Text>
              <View style={styles.riskList}>
                {data.risks.map((risk, i) => (
                  <MotiView
                    key={risk.label}
                    from={{ opacity: 0, translateX: -16 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: delay + 600 + i * 100 }}
                    style={styles.riskItem}
                  >
                    <Text style={styles.riskLabel}>{risk.label}</Text>
                    <View style={styles.riskBarWrap}>
                      <MotiView
                        from={{ width: '0%' }}
                        animate={{ width: `${risk.value}%` }}
                        transition={{ type: 'timing', duration: 800, delay: delay + 700 + i * 100 }}
                        style={[styles.riskBarFill, { backgroundColor: riskColor(risk.level) }]}
                      />
                    </View>
                    <Text style={[styles.riskValue, { color: riskColor(risk.level) }]}>{risk.value}%</Text>
                  </MotiView>
                ))}
              </View>
            </View>

            <View style={styles.insightsSection}>
              <Text style={styles.sectionTitle}>AI Insights</Text>
              {data.insights.map((insight, i) => (
                <MotiView
                  key={i}
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 500, delay: delay + 1000 + i * 150 }}
                  style={styles.insightItem}
                >
                  <View style={styles.insightDot} />
                  <Text style={styles.insightText}>{insight}</Text>
                </MotiView>
              ))}
            </View>
          </>
        )}
      </BlurView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.lg,
    overflow: 'hidden',
  },
  cardCompact: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cropInfo: {
    gap: 2,
  },
  cropName: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  variety: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  probabilitySection: {
    gap: Spacing.sm,
  },
  probHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  probLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  probValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  probBar: {
    height: 8,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  probFill: {
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  probGlow: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.6,
    transform: [{ translateX: -6 }],
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 4,
  },
  pulseSection: {
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  risksSection: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  riskList: {
    gap: 10,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  riskLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    width: 100,
  },
  riskBarWrap: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: 2,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  riskValue: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    width: 32,
    textAlign: 'right',
  },
  insightsSection: {
    gap: Spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
    marginTop: 6,
    flexShrink: 0,
  },
  insightText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
});