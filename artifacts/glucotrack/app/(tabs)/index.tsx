import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { api, GlucoseReading, GlucoseStats } from "@/hooks/useApi";
import { GlucoseBadge, GlucoseWarning } from "@/components/GlucoseBadge";
import { getGlucoseLevel, formatDateTime, formatTime, getContextLabel } from "@/utils/glucose";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: readings = [], isLoading: loadingReadings } = useQuery({
    queryKey: ["glucose", "day"],
    queryFn: () => api.getGlucose("day"),
  });

  const { data: stats } = useQuery({
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

  const latest = readings[0];
  const latestLevel = latest ? getGlucoseLevel(latest.value, latest.unit) : null;

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  function quickLog() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/log-glucose");
  }

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>GlucoTrack</Text>
            <Text style={styles.subGreeting}>Today's overview</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push("/manage-medications")}
          >
            <MaterialCommunityIcons name="pill" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Latest Reading Card */}
        <View style={styles.latestCard}>
          {loadingReadings ? (
            <ActivityIndicator color={Colors.primary} />
          ) : latest ? (
            <>
              <View style={styles.latestTop}>
                <View>
                  <Text style={styles.latestLabel}>Latest Reading</Text>
                  <Text style={styles.latestTime}>{formatDateTime(latest.recordedAt)}</Text>
                </View>
                <View style={[styles.statusDot, {
                  backgroundColor:
                    latestLevel === "low" ? Colors.danger :
                    latestLevel === "high" ? Colors.warning :
                    Colors.primary
                }]} />
              </View>

              <View style={styles.latestValueRow}>
                <Text style={[styles.latestValue, {
                  color:
                    latestLevel === "low" ? Colors.danger :
                    latestLevel === "high" ? Colors.warning :
                    Colors.primary
                }]}>
                  {latest.unit === "mmol" ? latest.value.toFixed(1) : Math.round(latest.value)}
                </Text>
                <View style={styles.latestUnit}>
                  <Text style={styles.unitText}>{latest.unit === "mmol" ? "mmol/L" : "mg/dL"}</Text>
                  <Text style={styles.contextText}>{getContextLabel(latest.context)}</Text>
                </View>
              </View>

              {latestLevel !== "normal" && (
                <GlucoseWarning level={latestLevel as "low" | "high"} />
              )}
            </>
          ) : (
            <View style={styles.noReading}>
              <Ionicons name="water-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.noReadingText}>No readings today</Text>
              <Text style={styles.noReadingSubtext}>Tap + to log your first reading</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        {stats && stats.totalReadings > 0 && (
          <View style={styles.statsRow}>
            <StatCard label="7-Day Avg" value={`${stats.average ?? "-"}`} unit="mg/dL" color={Colors.primary} />
            <StatCard label="Time in Range" value={`${stats.timeInRange}%`} unit="target" color={Colors.success} />
            <StatCard label="Est. HbA1c" value={stats.hba1cEstimate ? `${stats.hba1cEstimate}%` : "-"} unit="%" color={Colors.warning} />
          </View>
        )}

        {/* Alerts */}
        {stats && (stats.lowCount > 0 || stats.highCount > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alerts (7 Days)</Text>
            {stats.lowCount > 0 && (
              <View style={[styles.alertCard, { borderColor: Colors.danger + "44", backgroundColor: Colors.danger + "11" }]}>
                <Ionicons name="arrow-down-circle" size={18} color={Colors.danger} />
                <Text style={[styles.alertText, { color: Colors.danger }]}>
                  {stats.lowCount} low reading{stats.lowCount > 1 ? "s" : ""} below 70 mg/dL
                </Text>
              </View>
            )}
            {stats.highCount > 0 && (
              <View style={[styles.alertCard, { borderColor: Colors.warning + "44", backgroundColor: Colors.warning + "11" }]}>
                <Ionicons name="arrow-up-circle" size={18} color={Colors.warning} />
                <Text style={[styles.alertText, { color: Colors.warning }]}>
                  {stats.highCount} high reading{stats.highCount > 1 ? "s" : ""} above 180 mg/dL
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Readings */}
        {readings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Readings</Text>
            {readings.slice(0, 5).map(r => (
              <ReadingRow key={r.id} reading={r} />
            ))}
          </View>
        )}

        {/* Last Meal */}
        {mealLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Meals</Text>
            {mealLogs.slice(0, 2).map(meal => (
              <View key={meal.id} style={styles.logRow}>
                <View style={[styles.logIcon, { backgroundColor: Colors.success + "22" }]}>
                  <Ionicons name="restaurant" size={16} color={Colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logTitle}>{meal.description}</Text>
                  <Text style={styles.logTime}>{formatDateTime(meal.eatenAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Meds */}
        {medLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medications Today</Text>
            {medLogs.slice(0, 3).map(log => (
              <View key={log.id} style={styles.logRow}>
                <View style={[styles.logIcon, { backgroundColor: Colors.primary + "22" }]}>
                  <MaterialCommunityIcons name="pill" size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logTitle}>{log.medicationName}{log.dosage ? ` · ${log.dosage}` : ""}</Text>
                  <Text style={styles.logTime}>{formatTime(log.takenAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB Menu */}
      <View style={[styles.fabContainer, { bottom: bottomInset + 80 }]}>
        <TouchableOpacity
          style={[styles.fabSmall, { backgroundColor: Colors.success + "CC" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/log-meal"); }}
        >
          <Ionicons name="restaurant" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fabSmall, { backgroundColor: Colors.primary + "CC" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/log-medication"); }}
        >
          <MaterialCommunityIcons name="pill" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={quickLog}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "33" }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ReadingRow({ reading }: { reading: GlucoseReading }) {
  const level = getGlucoseLevel(reading.value, reading.unit);
  const color = level === "low" ? Colors.danger : level === "high" ? Colors.warning : Colors.primary;
  return (
    <View style={styles.readingRow}>
      <View style={[styles.readingDot, { backgroundColor: color }]} />
      <Text style={styles.readingTime}>{formatTime(reading.recordedAt)}</Text>
      <Text style={[styles.readingValue, { color }]}>
        {reading.unit === "mmol" ? reading.value.toFixed(1) : Math.round(reading.value)}
        <Text style={styles.readingUnit}> {reading.unit === "mmol" ? "mmol/L" : "mg/dL"}</Text>
      </Text>
      <Text style={styles.readingContext}>{getContextLabel(reading.context)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 12,
  },
  greeting: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  subGreeting: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "22",
    justifyContent: "center",
    alignItems: "center",
  },
  latestCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  latestTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  latestLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  latestTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  latestValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  latestValue: {
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    lineHeight: 60,
  },
  latestUnit: { paddingBottom: 8 },
  unitText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  contextText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  noReading: { alignItems: "center", paddingVertical: 20, gap: 8 },
  noReadingText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  noReadingSubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textAlign: "center",
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  alertText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  readingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  readingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  readingTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    width: 50,
  },
  readingValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  readingUnit: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  readingContext: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logTitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  logTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  fabContainer: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
