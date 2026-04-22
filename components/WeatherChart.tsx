import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { LineChart } from 'react-native-gifted-charts';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { temperatureHistory } from '@/constants/mockData';

const { width } = Dimensions.get('window');

type ViewMode = 'avgTemp' | 'maxTemp' | 'minTemp' | 'anomaly';

const viewModes: { key: ViewMode; label: string; color: string }[] = [
  { key: 'avgTemp', label: 'Average', color: Colors.green },
  { key: 'maxTemp', label: 'Maximum', color: Colors.amber },
  { key: 'minTemp', label: 'Minimum', color: Colors.blue },
  { key: 'anomaly', label: 'Anomaly', color: '#a855f7' },
];

export function WeatherChart() {
  const [activeMode, setActiveMode] = useState<ViewMode>('avgTemp');

  const currentMode = viewModes.find(m => m.key === activeMode)!;

  const chartData = temperatureHistory.map(d => ({
    value: d[activeMode],
    label: `${d.year}`,
    dataPointText: '',
  }));

  const minVal = Math.min(...chartData.map(d => d.value));
  const maxVal = Math.max(...chartData.map(d => d.value));

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 700, delay: 200 }}
    >
      <BlurView intensity={16} tint="dark" style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Temperature Trends</Text>
            <Text style={styles.subtitle}>20-Year Historical Data (2004–2024)</Text>
          </View>
          <View style={[styles.liveChip, { borderColor: Colors.green + '44' }]}>
            <MotiView
              from={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 800, loop: true }}
              style={[styles.liveDot, { backgroundColor: Colors.green }]}
            />
            <Text style={[styles.liveText, { color: Colors.green }]}>LIVE</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.modeScroll}
          contentContainerStyle={styles.modeContent}
        >
          {viewModes.map(mode => (
            <Pressable key={mode.key} onPress={() => setActiveMode(mode.key)}>
              <MotiView
                animate={{
                  backgroundColor: activeMode === mode.key ? mode.color + '22' : 'transparent',
                  borderColor: activeMode === mode.key ? mode.color + '66' : Colors.borderSubtle,
                }}
                transition={{ type: 'timing', duration: 200 }}
                style={styles.modeChip}
              >
                <Text style={[styles.modeLabel, { color: activeMode === mode.key ? mode.color : Colors.textSecondary }]}>
                  {mode.label}
                </Text>
              </MotiView>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Min</Text>
            <Text style={[styles.statValue, { color: currentMode.color }]}>{minVal.toFixed(1)}°C</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Max</Text>
            <Text style={[styles.statValue, { color: currentMode.color }]}>{maxVal.toFixed(1)}°C</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Range</Text>
            <Text style={[styles.statValue, { color: currentMode.color }]}>{(maxVal - minVal).toFixed(1)}°C</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Trend</Text>
            <Text style={[styles.statValue, { color: Colors.amber }]}>+0.18°C/yr</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={width - 80}
            height={200}
            curved
            areaChart
            color={currentMode.color}
            startFillColor={currentMode.color}
            endFillColor={'transparent'}
            startOpacity={0.3}
            endOpacity={0}
            backgroundColor="transparent"
            xAxisColor={Colors.borderSubtle}
            yAxisColor={'transparent'}
            rulesColor={Colors.borderSubtle}
            rulesType="solid"
            yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: Colors.textMuted, fontSize: 9 }}
            dataPointsColor={currentMode.color}
            dataPointsRadius={3}
            thickness={2.5}
            hideDataPoints={false}
            showStripOnFocus
            stripColor={currentMode.color + '44'}
            focusedDataPointColor={currentMode.color}
            initialSpacing={8}
            spacing={26}
            hideAxesAndRules={false}
            noOfSections={4}
            maxValue={Math.ceil(maxVal + 2)}
            //minValue={Math.floor(minVal - 2)}
            isAnimated
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Source: Open-Meteo API · Regional Climate Station Network · Copernicus</Text>
        </View>
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
    gap: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: Colors.greenDim,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modeScroll: {
    flexGrow: 0,
  },
  modeContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  modeLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: FontSize.base,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  chartContainer: {
    marginHorizontal: -Spacing.sm,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.sm,
  },
  footerText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});