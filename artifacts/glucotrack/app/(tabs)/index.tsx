import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Dimensions,
  Animated,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { api, GlucoseReading } from "@/hooks/useApi";
import { useSettings } from "@/contexts/SettingsContext";
import { GaugeRing } from "@/components/GaugeRing";
import { toMgdl } from "@/contexts/SettingsContext";
import { formatTime, formatDate } from "@/utils/glucose";

const { width: W } = Dimensions.get("window");
const GAUGE_SIZE = W * 0.72;

function glucoseToFill(mgdl: number, hypo: number, hyper: number): number {
  const fullLow = hypo;
  const fullHigh = hyper + (hyper - hypo);
  return Math.min(Math.max((mgdl - fullLow) / (fullHigh - fullLow), 0), 1);
}

function getLevel(mgdl: number, hypo: number, hyper: number): "low" | "normal" | "high" {
  if (mgdl < hypo) return "low";
  if (mgdl > hyper) return "high";
  return "normal";
}

function timeSince(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function computeStreak(readings: GlucoseReading[]): number {
  if (readings.length === 0) return 0;
  const daySet = new Set(
    readings.map(r => new Date(r.recordedAt).toISOString().split("T")[0])
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (daySet.has(key)) streak++;
    else break;
  }
  return streak;
}

function computeInsights(readings: GlucoseReading[], hypo: number, hyper: number): string[] {
  if (readings.length < 7) return [];
  const withMeta = readings.map(r => ({
    mgdl: r.unit === "mmol" ? r.value * 18.0182 : r.value,
    hour: new Date(r.recordedAt).getHours(),
    context: r.context,
  }));
  const periods = [
    { name: "mornings (6–10am)", hours: [6, 7, 8, 9] },
    { name: "midday (10am–2pm)", hours: [10, 11, 12, 13] },
    { name: "afternoons (2–6pm)", hours: [14, 15, 16, 17] },
    { name: "evenings (6–10pm)", hours: [18, 19, 20, 21] },
    { name: "nights (10pm–6am)", hours: [22, 23, 0, 1, 2, 3, 4, 5] },
  ];
  const periodAvgs = periods.map(p => {
    const pr = withMeta.filter(r => p.hours.includes(r.hour));
    if (pr.length < 2) return null;
    return { name: p.name, avg: pr.reduce((s, r) => s + r.mgdl, 0) / pr.length };
  }).filter(Boolean) as { name: string; avg: number }[];
  if (periodAvgs.length < 2) return [];
  const sorted = [...periodAvgs].sort((a, b) => b.avg - a.avg);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const insights: string[] = [];
  if (highest.avg > hyper) {
    insights.push(`Your glucose runs highest in the ${highest.name}, averaging ${Math.round(highest.avg)} mg/dL — above your target.`);
  } else {
    insights.push(`Your glucose tends to peak in the ${highest.name}, averaging ${Math.round(highest.avg)} mg/dL.`);
  }
  if (lowest.avg < hypo) {
    insights.push(`Watch your ${lowest.name} — readings dip to an average of ${Math.round(lowest.avg)} mg/dL, below your target.`);
  } else {
    insights.push(`Your best readings are in the ${lowest.name}, averaging ${Math.round(lowest.avg)} mg/dL.`);
  }
  const fasting = withMeta.filter(r => r.context === "fasting");
  if (fasting.length >= 3) {
    const fastAvg = fasting.reduce((s, r) => s + r.mgdl, 0) / fasting.length;
    if (fastAvg > hyper * 0.9) {
      insights.push(`Fasting readings average ${Math.round(fastAvg)} mg/dL — may indicate dawn phenomenon worth discussing with your doctor.`);
    }
  }
  return insights;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { settings, displayValue, displayUnit, hypoThreshold, hyperThreshold } = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: readings = [], isLoading } = useQuery({
    queryKey: ["glucose", "day"],
    queryFn: () => api.getGlucose("day"),
  });
  const { data: weekStats } = useQuery({
    queryKey: ["stats", "week"],
    queryFn: () => api.getStats("week"),
  });
  const { data: mealLogs = [] } = useQuery({
    queryKey: ["meals", "day"],
    queryFn: () => api.getMeals("day"),
  });
  const { data: medLogs = [] } = useQuery({
    queryKey: ["med-logs", "day"],
    queryFn: () => api.getMedLogs("day"),
  });
  const { data: allReadings = [] } = useQuery({
    queryKey: ["glucose", "all"],
    queryFn: () => api.getGlucose(),
  });
  const { data: monthReadings = [] } = useQuery({
    queryKey: ["glucose", "month"],
    queryFn: () => api.getGlucose("month"),
  });

  const streak = computeStreak(allReadings);
  const insights = computeInsights(monthReadings, settings.hypoThresholdMgdl, settings.hyperThresholdMgdl);

  const latest = readings[0];
  const latestMgdl = latest ? toMgdl(latest.value, latest.unit) : 0;
  const level = latest ? getLevel(latestMgdl, settings.hypoThresholdMgdl, settings.hyperThresholdMgdl) : null;
  const fill = latest ? glucoseToFill(latestMgdl, settings.hypoThresholdMgdl, settings.hyperThresholdMgdl) : 0.5;

  const bgColors: [string, string, string] = level === "low"
    ? ["#1A0A0A", "#1F0D0D", "#0A0F1E"]
    : level === "high"
    ? ["#1A0F00", "#1F1400", "#0A0F1E"]
    : ["#001A14", "#001A14", "#0A0F1E"];

  const levelColor = level === "low" ? Colors.danger : level === "high" ? Colors.warning : Colors.primary;

  const onRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setRefreshing(false);
  };

  const todayReadings = readings.slice().reverse();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <LinearGradient
        colors={bgColors}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: topInset + 8, paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>GlucoTrack</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</Text>
          </View>
          <View style={styles.headerRight}>
            {streak >= 1 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={styles.streakCount}>{streak}</Text>
                <Text style={styles.streakLabel}>{streak === 1 ? "day" : "days"}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/settings"); }}
            >
              <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Gauge Card */}
        <View style={styles.gaugeCard}>
          {/* Glow behind gauge */}
          {latest && (
            <View style={[styles.glowCircle, { backgroundColor: levelColor + "18" }]} />
          )}

          <GaugeRing
            value={fill}
            size={GAUGE_SIZE}
            strokeWidth={18}
            lowColor={Colors.danger}
            midColor={Colors.primary}
            highColor={Colors.warning}
            bgColor="rgba(255,255,255,0.06)"
            level={level ?? "normal"}
          />

          {/* Center content */}
          <View style={styles.gaugeCenter}>
            {!latest ? (
              <View style={{ alignItems: "center" }}>
                <Ionicons name="water-outline" size={36} color={Colors.textMuted} />
                <Text style={styles.noDataText}>No reading yet</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.glucoseValue, { color: levelColor }]}>
                  {displayValue(latestMgdl)}
                </Text>
                <Text style={styles.glucoseUnit}>{displayUnit}</Text>
                <View style={[styles.levelPill, { backgroundColor: levelColor + "22", borderColor: levelColor + "44" }]}>
                  <View style={[styles.levelDot, { backgroundColor: levelColor }]} />
                  <Text style={[styles.levelLabel, { color: levelColor }]}>
                    {level === "low" ? "HYPOGLYCEMIC" : level === "high" ? "HYPERGLYCEMIC" : "IN RANGE"}
                  </Text>
                </View>
                <Text style={styles.timeSince}>{timeSince(latest.recordedAt)}</Text>
              </>
            )}
          </View>

          {/* Threshold labels */}
          <View style={styles.gaugeLabels}>
            <View style={styles.gaugeLabelItem}>
              <Text style={[styles.gaugeLabelValue, { color: Colors.danger }]}>{hypoThreshold}</Text>
              <Text style={styles.gaugeLabelTitle}>Hypo</Text>
            </View>
            <View style={styles.gaugeLabelItem}>
              <Text style={[styles.gaugeLabelValue, { color: Colors.warning }]}>{hyperThreshold}</Text>
              <Text style={styles.gaugeLabelTitle}>Hyper</Text>
            </View>
          </View>
        </View>

        {/* Alert Banner */}
        {level && level !== "normal" && (
          <View style={[styles.alertBanner, { backgroundColor: levelColor + "18", borderColor: levelColor + "44" }]}>
            <Ionicons
              name={level === "low" ? "arrow-down-circle" : "arrow-up-circle"}
              size={20}
              color={levelColor}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: levelColor }]}>
                {level === "low" ? "Low Blood Sugar" : "High Blood Sugar"}
              </Text>
              <Text style={styles.alertDesc}>
                {level === "low"
                  ? "Consider taking fast-acting carbohydrates"
                  : "Monitor closely and consider corrective action"}
              </Text>
            </View>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <MiniStatCard
            label="7d Avg"
            value={weekStats?.average ? `${displayValue(weekStats.average)}` : "—"}
            unit={displayUnit.split("/")[0]}
            color={Colors.primary}
            icon="trending-up"
          />
          <MiniStatCard
            label="Time in Range"
            value={weekStats?.timeInRange !== undefined ? `${weekStats.timeInRange}%` : "—"}
            unit="target"
            color={Colors.success}
            icon="checkmark-circle"
          />
          <MiniStatCard
            label="HbA1c Est."
            value={weekStats?.hba1cEstimate ? `${weekStats.hba1cEstimate}%` : "—"}
            unit="est."
            color={Colors.warning}
            icon="pulse"
          />
        </View>

        {/* Insights Card */}
        {insights.length > 0 && (
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <Ionicons name="bulb-outline" size={14} color={Colors.warning} />
              <Text style={styles.insightsTitle}>Insights</Text>
              <Text style={styles.insightsSub}>based on 30-day data</Text>
            </View>
            {insights.map((insight, i) => (
              <View key={i} style={styles.insightRow}>
                <View style={styles.insightDot} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Today's Readings Timeline */}
        {todayReadings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Readings</Text>
              <Text style={styles.sectionCount}>{readings.length} checks</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeline}>
              {todayReadings.map((r, i) => {
                const mgdl = toMgdl(r.value, r.unit);
                const lv = getLevel(mgdl, settings.hypoThresholdMgdl, settings.hyperThresholdMgdl);
                const c = lv === "low" ? Colors.danger : lv === "high" ? Colors.warning : Colors.primary;
                return (
                  <View key={r.id} style={styles.timelineDot}>
                    <View style={[styles.dotCircle, { backgroundColor: c + "22", borderColor: c + "66" }]}>
                      <Text style={[styles.dotValue, { color: c }]}>{displayValue(mgdl)}</Text>
                    </View>
                    <Text style={styles.dotTime}>{formatTime(r.recordedAt)}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Quick Summary */}
        {weekStats && weekStats.totalReadings > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>This Week's Range</Text>
            <View style={styles.rangeBar}>
              <View style={styles.rangeTrack}>
                <View style={[styles.rangeFill, {
                  left: `${Math.max(0, ((weekStats.min ?? 0) - 40) / (350 - 40) * 100)}%`,
                  width: `${Math.min(100, ((weekStats.max ?? 350) - (weekStats.min ?? 40)) / (350 - 40) * 100)}%`,
                  backgroundColor: Colors.primary,
                }]} />
                <View style={[styles.rangeHypo, { left: `${((settings.hypoThresholdMgdl - 40) / (350 - 40) * 100)}%` }]} />
                <View style={[styles.rangeHyper, { left: `${((settings.hyperThresholdMgdl - 40) / (350 - 40) * 100)}%` }]} />
              </View>
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabel}>40</Text>
                <Text style={styles.rangeLabel}>180</Text>
                <Text style={styles.rangeLabel}>350+</Text>
              </View>
            </View>
            <View style={styles.rangeStats}>
              <View style={{ alignItems: "center" }}>
                <Text style={[styles.rangeStat, { color: Colors.danger }]}>{displayValue(weekStats.min ?? 0)}</Text>
                <Text style={styles.rangeStatLabel}>Min</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={[styles.rangeStat, { color: Colors.primary }]}>{displayValue(weekStats.average ?? 0)}</Text>
                <Text style={styles.rangeStatLabel}>Avg</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={[styles.rangeStat, { color: Colors.warning }]}>{displayValue(weekStats.max ?? 0)}</Text>
                <Text style={styles.rangeStatLabel}>Max</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Meals & Meds */}
        {(mealLogs.length > 0 || medLogs.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <View style={styles.activityList}>
              {mealLogs.slice(0, 2).map(meal => (
                <View key={meal.id} style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: Colors.success + "22" }]}>
                    <Ionicons name="restaurant" size={14} color={Colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{meal.description}</Text>
                    <Text style={styles.activityTime}>{formatTime(meal.eatenAt)}</Text>
                  </View>
                </View>
              ))}
              {settings.showMedications && medLogs.slice(0, 2).map(log => (
                <View key={log.id} style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: Colors.primary + "22" }]}>
                    <MaterialCommunityIcons name="pill" size={14} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{log.medicationName}{log.dosage ? ` · ${log.dosage}` : ""}</Text>
                    <Text style={styles.activityTime}>{formatTime(log.takenAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* FAB cluster */}
      <View style={[styles.fabCluster, { bottom: bottomInset + 80 }]}>
        <FabBtn
          icon="restaurant"
          color={Colors.success}
          iconLib="ionicons"
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/log-meal"); }}
        />
        <FabBtn
          icon="pill"
          color="#8B5CF6"
          iconLib="material"
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/log-medication"); }}
        />
        <TouchableOpacity style={styles.mainFab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/log-glucose"); }}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MiniStatCard({ label, value, unit, color, icon }: { label: string; value: string; unit: string; color: string; icon: string }) {
  return (
    <View style={[styles.miniCard, { borderColor: color + "22" }]}>
      <Ionicons name={icon as any} size={14} color={color} style={{ marginBottom: 4 }} />
      <Text style={[styles.miniValue, { color }]}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function FabBtn({ icon, color, iconLib, onPress }: { icon: string; color: string; iconLib: "ionicons" | "material"; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.smallFab, { backgroundColor: color + "DD" }]} onPress={onPress}>
      {iconLib === "ionicons"
        ? <Ionicons name={icon as any} size={18} color="#fff" />
        : <MaterialCommunityIcons name={icon as any} size={18} color="#fff" />
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,160,0,0.12)",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,160,0,0.25)",
  },
  streakFire: { fontSize: 13 },
  streakCount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.warning,
  },
  streakLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.warning,
    opacity: 0.8,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  insightsCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.warning,
    flex: 1,
  },
  insightsSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  insightDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.warning,
    marginTop: 6,
    flexShrink: 0,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  gaugeCard: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  glowCircle: {
    position: "absolute",
    width: GAUGE_SIZE * 0.7,
    height: GAUGE_SIZE * 0.7,
    borderRadius: GAUGE_SIZE * 0.35,
    top: GAUGE_SIZE * 0.15,
    alignSelf: "center",
  },
  gaugeCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
  },
  glucoseValue: {
    fontSize: 64,
    fontFamily: "Inter_700Bold",
    lineHeight: 70,
    letterSpacing: -2,
  },
  glucoseUnit: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  levelDot: { width: 6, height: 6, borderRadius: 3 },
  levelLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  timeSince: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  noDataText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  gaugeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: GAUGE_SIZE,
    paddingHorizontal: 12,
    marginTop: -16,
  },
  gaugeLabelItem: { alignItems: "center" },
  gaugeLabelValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  gaugeLabelTitle: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
  alertBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  alertTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
  alertDesc: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 16 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  miniCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    backdropFilter: "blur(10px)",
  },
  miniValue: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  miniLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  sectionCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  timeline: { marginHorizontal: -4 },
  timelineDot: {
    alignItems: "center",
    marginHorizontal: 6,
    width: 52,
  },
  dotCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    marginBottom: 4,
  },
  dotValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  dotTime: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  rangeBar: { marginBottom: 12 },
  rangeTrack: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 5,
    marginBottom: 4,
    position: "relative",
    overflow: "hidden",
  },
  rangeFill: {
    position: "absolute",
    height: "100%",
    borderRadius: 5,
    opacity: 0.6,
  },
  rangeHypo: {
    position: "absolute",
    width: 1.5,
    height: "100%",
    backgroundColor: Colors.danger,
    opacity: 0.7,
  },
  rangeHyper: {
    position: "absolute",
    width: 1.5,
    height: "100%",
    backgroundColor: Colors.warning,
    opacity: 0.7,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  rangeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  rangeStat: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  rangeStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  activityList: { gap: 2 },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  activityTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  activityTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  fabCluster: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mainFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  smallFab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
