import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import {
  Shield,
  Wifi,
  Battery,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  CloudLightning,
  Activity,
  ChevronRight,
  ToggleLeft,
  Layers,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

type ZoneStatus = 'deployed' | 'retracted' | 'deploying' | 'error';

interface Zone {
  id: string;
  name: string;
  crop: string;
  area: string;
  status: ZoneStatus;
  battery: number;
  coverage: number;
  lastTriggered: string;
}

const INITIAL_ZONES: Zone[] = [
  { id: 'A', name: 'Zone A-7', crop: 'Corn', area: '4.2 ha', status: 'deployed', battery: 92, coverage: 96, lastTriggered: '2h ago' },
  { id: 'B', name: 'Zone B-3', crop: 'Wheat', area: '6.1 ha', status: 'retracted', battery: 78, coverage: 94, lastTriggered: '8h ago' },
  { id: 'C', name: 'Zone C-1', crop: 'Soybeans', area: '3.8 ha', status: 'deploying', battery: 85, coverage: 91, lastTriggered: 'Active now' },
  { id: 'D', name: 'Zone D-5', crop: 'Barley', area: '5.5 ha', status: 'error', battery: 14, coverage: 0, lastTriggered: 'Error' },
];

const EVENT_LOG = [
  { time: '09:42', event: 'Hail storm detected — Zone A auto-deployed', type: 'alert' },
  { time: '09:38', event: 'Radar cell approaching from NW at 65 km/h', type: 'warning' },
  { time: '08:15', event: 'Zone B retracted after clear signal', type: 'success' },
  { time: '06:00', event: 'Morning diagnostics passed — all nodes OK', type: 'success' },
  { time: 'Yesterday', event: 'Zone C deployed during heavy showers', type: 'alert' },
];

const statusConfig: Record<ZoneStatus, { label: string; color: string; bg: string }> = {
  deployed: { label: 'DEPLOYED', color: Colors.green, bg: Colors.green + '1A' },
  retracted: { label: 'RETRACTED', color: Colors.textSecondary, bg: Colors.bgCardAlt },
  deploying: { label: 'DEPLOYING…', color: Colors.amber, bg: Colors.amber + '1A' },
  error: { label: 'ERROR', color: Colors.red, bg: Colors.red + '1A' },
};

function BatteryBar({ level }: { level: number }) {
  const color = level > 50 ? Colors.green : level > 20 ? Colors.amber : Colors.red;
  return (
    <View style={batteryStyles.wrap}>
      <Battery size={12} color={color} strokeWidth={2} />
      <View style={batteryStyles.bar}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${level}%` }}
          transition={{ type: 'timing', duration: 800 }}
          style={[batteryStyles.fill, { backgroundColor: color }]}
        />
      </View>
      <Text style={[batteryStyles.label, { color }]}>{level}%</Text>
    </View>
  );
}

const batteryStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bar: { flex: 1, height: 4, backgroundColor: Colors.bgCardAlt, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  label: { fontSize: 10, fontWeight: '700', minWidth: 28 },
});

export default function HardwareScreen() {
  const insets = useSafeAreaInsets();
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [autoMode, setAutoMode] = useState(true);
  const [globalDeployed, setGlobalDeployed] = useState(false);

  const deployedCount = zones.filter(z => z.status === 'deployed').length;
  const totalBattery = Math.round(zones.reduce((acc, z) => acc + z.battery, 0) / zones.length);

  const toggleZone = (id: string) => {
    setZones(prev => prev.map(z => {
      if (z.id !== id) return z;
      if (z.status === 'error') return z;
      return {
        ...z,
        status: z.status === 'deployed' ? 'retracted' : 'deployed',
      };
    }));
  };

  const deployAll = () => {
    setGlobalDeployed(true);
    setZones(prev => prev.map(z => z.status === 'error' ? z : { ...z, status: 'deployed' }));
  };

  const retractAll = () => {
    setGlobalDeployed(false);
    setZones(prev => prev.map(z => z.status === 'error' ? z : { ...z, status: 'retracted' }));
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.header}
        >
          <View style={styles.titleRow}>
            <Shield size={18} color={Colors.green} strokeWidth={2} />
            <Text style={styles.pageTag}>HAILGUARD PRO</Text>
          </View>
          <Text style={styles.pageTitle}>Shield Control</Text>
          <Text style={styles.pageSubtitle}>Automated hail protection · 4 field zones</Text>
        </MotiView>

        <View style={styles.kpiRow}>
          {[
            { icon: Shield, label: 'Zones Active', value: `${deployedCount}/4`, color: deployedCount > 0 ? Colors.green : Colors.textSecondary },
            { icon: Battery, label: 'Avg Battery', value: `${totalBattery}%`, color: totalBattery > 50 ? Colors.green : Colors.amber },
            { icon: Wifi, label: 'Signal', value: '4/4', color: Colors.green },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <MotiView
                key={item.label}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 600, delay: 100 + i * 100 }}
                style={styles.kpiCard}
              >
                <BlurView intensity={14} tint="dark" style={styles.kpiInner}>
                  <Icon size={16} color={item.color} strokeWidth={2} />
                  <Text style={[styles.kpiValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.kpiLabel}>{item.label}</Text>
                </BlurView>
              </MotiView>
            );
          })}
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 300 }}
        >
          <BlurView intensity={16} tint="dark" style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <View style={styles.controlTitleBlock}>
                <Zap size={16} color={Colors.amber} strokeWidth={2} />
                <Text style={styles.controlTitle}>Global Controls</Text>
              </View>
              <View style={styles.autoRow}>
                <Text style={styles.autoLabel}>Auto Mode</Text>
                <Switch
                  value={autoMode}
                  onValueChange={setAutoMode}
                  trackColor={{ false: Colors.bgCardAlt, true: Colors.green + '66' }}
                  thumbColor={autoMode ? Colors.green : Colors.textMuted}
                />
              </View>
            </View>

            {autoMode ? (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 400 }}
                style={styles.autoActiveBanner}
              >
                <MotiView
                  from={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  transition={{ type: 'timing', duration: 1600, loop: true }}
                  style={styles.autoPulse}
                />
                <View style={styles.autoActiveDot} />
                <Text style={styles.autoActiveText}>
                  Auto mode active — shields deploy automatically when hail probability exceeds 60%
                </Text>
              </MotiView>
            ) : null}

            <View style={styles.globalBtnRow}>
              <Pressable onPress={deployAll} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1 }]}>
                <View style={[styles.globalBtn, { backgroundColor: Colors.green + '1A', borderColor: Colors.green + '44' }]}>
                  <Shield size={16} color={Colors.green} strokeWidth={2} />
                  <Text style={[styles.globalBtnLabel, { color: Colors.green }]}>Deploy All</Text>
                </View>
              </Pressable>
              <Pressable onPress={retractAll} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1 }]}>
                <View style={[styles.globalBtn, { backgroundColor: Colors.red + '1A', borderColor: Colors.red + '44' }]}>
                  <ToggleLeft size={16} color={Colors.red} strokeWidth={2} />
                  <Text style={[styles.globalBtnLabel, { color: Colors.red }]}>Retract All</Text>
                </View>
              </Pressable>
            </View>
          </BlurView>
        </MotiView>

        <Text style={styles.sectionLabel}>Field Zones</Text>

        <View style={styles.zonesList}>
          {zones.map((zone, i) => {
            const cfg = statusConfig[zone.status];
            return (
              <MotiView
                key={zone.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 400 + i * 100 }}
              >
                <BlurView intensity={14} tint="dark" style={[styles.zoneCard, { borderColor: cfg.color + '2A' }]}>
                  <View style={styles.zoneTop}>
                    <View style={styles.zoneIdentity}>
                      <View style={[styles.zoneIdBadge, { backgroundColor: cfg.color + '1A', borderColor: cfg.color + '33' }]}>
                        <Text style={[styles.zoneIdText, { color: cfg.color }]}>{zone.id}</Text>
                      </View>
                      <View style={styles.zoneNameBlock}>
                        <Text style={styles.zoneName}>{zone.name}</Text>
                        <Text style={styles.zoneCrop}>{zone.crop} · {zone.area}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      {zone.status === 'deploying' ? (
                        <MotiView
                          from={{ opacity: 1 }}
                          animate={{ opacity: 0.3 }}
                          transition={{ type: 'timing', duration: 700, loop: true }}
                          style={[styles.statusDot, { backgroundColor: cfg.color }]}
                        />
                      ) : (
                        <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                      )}
                      <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>

                  <View style={styles.zoneMeta}>
                    <BatteryBar level={zone.battery} />
                    <View style={styles.coveragePill}>
                      <Layers size={11} color={Colors.textMuted} strokeWidth={2} />
                      <Text style={styles.coverageText}>{zone.coverage}% covered</Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Clock size={11} color={Colors.textMuted} strokeWidth={2} />
                      <Text style={styles.timeText}>{zone.lastTriggered}</Text>
                    </View>
                  </View>

                  {zone.status !== 'error' ? (
                    <Pressable onPress={() => toggleZone(zone.id)} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
                      <MotiView
                        animate={{
                          backgroundColor: zone.status === 'deployed' ? Colors.red + '1A' : Colors.green + '1A',
                          borderColor: zone.status === 'deployed' ? Colors.red + '33' : Colors.green + '33',
                        }}
                        transition={{ type: 'timing', duration: 200 }}
                        style={styles.zoneToggleBtn}
                      >
                        <Text style={{
                          fontSize: FontSize.xs,
                          fontWeight: '700',
                          color: zone.status === 'deployed' ? Colors.red : Colors.green,
                        }}>
                          {zone.status === 'deployed' ? 'Retract Shield' : 'Deploy Shield'}
                        </Text>
                        <ChevronRight size={13} color={zone.status === 'deployed' ? Colors.red : Colors.green} strokeWidth={2.5} />
                      </MotiView>
                    </Pressable>
                  ) : (
                    <View style={[styles.zoneToggleBtn, { backgroundColor: Colors.red + '1A', borderColor: Colors.red + '33' }]}>
                      <AlertTriangle size={13} color={Colors.red} strokeWidth={2} />
                      <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: Colors.red }}>
                        Node offline — Check battery & connection
                      </Text>
                    </View>
                  )}
                </BlurView>
              </MotiView>
            );
          })}
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 800 }}
        >
          <BlurView intensity={16} tint="dark" style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Activity size={16} color={Colors.green} strokeWidth={2} />
              <Text style={styles.eventTitle}>Event Log</Text>
            </View>
            <View style={styles.eventList}>
              {EVENT_LOG.map((ev, i) => {
                const icon = ev.type === 'alert'
                  ? <CloudLightning size={13} color={Colors.amber} strokeWidth={2} />
                  : ev.type === 'warning'
                  ? <AlertTriangle size={13} color={Colors.amber} strokeWidth={2} />
                  : <CheckCircle size={13} color={Colors.green} strokeWidth={2} />;
                return (
                  <View key={i} style={styles.eventRow}>
                    <Text style={styles.eventTime}>{ev.time}</Text>
                    {icon}
                    <Text style={styles.eventText} numberOfLines={2}>{ev.event}</Text>
                  </View>
                );
              })}
            </View>
          </BlurView>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 900 }}
        >
          <BlurView intensity={16} tint="dark" style={styles.specCard}>
            <Text style={styles.specTitle}>System Specifications</Text>
            <View style={styles.specGrid}>
              {[
                { label: 'Shield Material', value: 'UV-Resistant HDPE Net' },
                { label: 'Deploy Time', value: '< 90 seconds' },
                { label: 'Wind Resistance', value: 'Up to 120 km/h' },
                { label: 'Hail Size Rated', value: 'Up to 35mm diameter' },
                { label: 'Node Comm Range', value: '500m LoRaWAN' },
                { label: 'Lifespan', value: '15+ seasons' },
              ].map((spec) => (
                <View key={spec.label} style={styles.specRow}>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { gap: Spacing.lg, paddingHorizontal: Spacing.md },
  header: { gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  pageTag: { fontSize: FontSize.xs, color: Colors.green, fontWeight: '800', letterSpacing: 1.5 },
  pageTitle: { fontSize: FontSize.xxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.8 },
  pageSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm },
  kpiCard: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden', elevation: 4 },
  kpiInner: {
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, gap: 5, overflow: 'hidden', alignItems: 'center',
  },
  kpiValue: { fontSize: FontSize.xl, fontWeight: '800', letterSpacing: -0.5 },
  kpiLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  controlCard: {
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, gap: Spacing.md, overflow: 'hidden',
  },
  controlHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controlTitleBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  controlTitle: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '700' },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  autoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  autoActiveBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.green + '0D', borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.green + '22', padding: Spacing.sm,
  },
  autoPulse: {
    position: 'absolute', left: 7, width: 18, height: 18,
    borderRadius: 9, backgroundColor: Colors.green,
  },
  autoActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green },
  autoActiveText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500', lineHeight: 16 },
  globalBtnRow: { flexDirection: 'row', gap: Spacing.sm },
  globalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: Radius.md, borderWidth: 1, paddingVertical: 12,
  },
  globalBtnLabel: { fontSize: FontSize.sm, fontWeight: '700' },
  sectionLabel: {
    fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  zonesList: { gap: Spacing.md },
  zoneCard: {
    borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.lg,
    gap: Spacing.md, overflow: 'hidden',
  },
  zoneTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneIdentity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  zoneIdBadge: {
    width: 36, height: 36, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  zoneIdText: { fontSize: FontSize.base, fontWeight: '800' },
  zoneNameBlock: { gap: 2 },
  zoneName: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '700' },
  zoneCrop: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  zoneMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  coveragePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coverageText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  zoneToggleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: Radius.sm, borderWidth: 1, paddingVertical: 10,
  },
  eventCard: {
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, gap: Spacing.md, overflow: 'hidden',
  },
  eventHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventTitle: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '700' },
  eventList: { gap: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  eventTime: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', minWidth: 56 },
  eventText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500', lineHeight: 18 },
  specCard: {
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, gap: Spacing.md, overflow: 'hidden',
  },
  specTitle: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '700' },
  specGrid: { gap: 10 },
  specRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  specLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  specValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
});