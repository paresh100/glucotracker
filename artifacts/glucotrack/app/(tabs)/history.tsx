import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { api, Period } from "@/hooks/useApi";
import { GlucoseLineChart, GlucoseHistogram } from "@/components/GlucoseChart";
import { Ionicons } from "@expo/vector-icons";

const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "24h" },
  { key: "week", label: "7d" },
  { key: "month", label: "30d" },
  { key: "year", label: "1y" },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [period, setPeriod] = useState<Period>("week");
  const [chartType, setChartType] = useState<"line" | "histogram">("line");

  const { data: readings = [], isLoading } = useQuery({
    queryKey: ["glucose", period],
    queryFn: () => api.getGlucose(period),
  });

  const { data: stats } = useQuery({
    queryKey: ["stats", period],
    queryFn: () => api.getStats(period),
  });

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Charts</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Type Toggle */}
        <View style={styles.chartToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, chartType === "line" && styles.toggleBtnActive]}
            onPress={() => setChartType("line")}
          >
            <Ionicons name="trending-up" size={14} color={chartType === "line" ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.toggleText, chartType === "line" && styles.toggleTextActive]}>Trend</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, chartType === "histogram" && styles.toggleBtnActive]}
            onPress={() => setChartType("histogram")}
          >
            <Ionicons name="bar-chart" size={14} color={chartType === "histogram" ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.toggleText, chartType === "histogram" && styles.toggleTextActive]}>Distribution</Text>
          </TouchableOpacity>
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartLegend}>
            <LegendDot color={Colors.danger} label="Low (<70)" />
            <LegendDot color={Colors.primary} label="In Range" />
            <LegendDot color={Colors.warning} label="High (>180)" />
          </View>

          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ padding: 40 }} />
          ) : chartType === "line" ? (
            <GlucoseLineChart readings={readings} period={period} />
          ) : (
            <GlucoseHistogram readings={readings} period={period} />
          )}
        </View>

        {/* Stats Cards */}
        {stats && stats.totalReadings > 0 && (
          <>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <StatsCard label="Average" value={`${stats.average ?? "-"}`} unit="mg/dL" color={Colors.primary} />
              <StatsCard label="Minimum" value={`${stats.min ?? "-"}`} unit="mg/dL" color={Colors.success} />
              <StatsCard label="Maximum" value={`${stats.max ?? "-"}`} unit="mg/dL" color={Colors.warning} />
              <StatsCard label="Total" value={`${stats.totalReadings}`} unit="readings" color={Colors.textSecondary} />
            </View>

            <Text style={styles.sectionTitle}>Time in Range</Text>
            <View style={styles.tirCard}>
              <TirBar
                inRange={stats.inRangeCount}
                low={stats.lowCount}
                high={stats.highCount}
                total={stats.totalReadings}
              />
              <View style={styles.tirLabels}>
                <TirLabel color={Colors.danger} label="Low" count={stats.lowCount} total={stats.totalReadings} />
                <TirLabel color={Colors.primary} label="In Range" count={stats.inRangeCount} total={stats.totalReadings} />
                <TirLabel color={Colors.warning} label="High" count={stats.highCount} total={stats.totalReadings} />
              </View>
            </View>

            {stats.hba1cEstimate && (
              <View style={styles.hba1cCard}>
                <View>
                  <Text style={styles.hba1cLabel}>Estimated HbA1c</Text>
                  <Text style={styles.hba1cSub}>Based on {PERIODS.find(p => p.key === period)?.label} average</Text>
                </View>
                <Text style={[styles.hba1cValue, {
                  color: stats.hba1cEstimate < 5.7 ? Colors.primary :
                         stats.hba1cEstimate < 6.5 ? Colors.warning : Colors.danger,
                }]}>
                  {stats.hba1cEstimate}%
                </Text>
              </View>
            )}
          </>
        )}

        {stats?.totalReadings === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyText}>Log your glucose readings to see charts and statistics here.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_400Regular" }}>{label}</Text>
    </View>
  );
}

function StatsCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={styles.statsCard}>
      <Text style={[styles.statsValue, { color }]}>{value}</Text>
      <Text style={styles.statsUnit}>{unit}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </View>
  );
}

function TirBar({ inRange, low, high, total }: { inRange: number; low: number; high: number; total: number }) {
  const lowPct = total > 0 ? (low / total) * 100 : 0;
  const inRangePct = total > 0 ? (inRange / total) * 100 : 0;
  const highPct = total > 0 ? (high / total) * 100 : 0;

  return (
    <View style={styles.tirBar}>
      {lowPct > 0 && <View style={[styles.tirSegment, { width: `${lowPct}%`, backgroundColor: Colors.danger }]} />}
      {inRangePct > 0 && <View style={[styles.tirSegment, { width: `${inRangePct}%`, backgroundColor: Colors.primary }]} />}
      {highPct > 0 && <View style={[styles.tirSegment, { width: `${highPct}%`, backgroundColor: Colors.warning }]} />}
    </View>
  );
}

function TirLabel({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color }}>{pct}%</Text>
      <Text style={{ fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular" }}>{label}</Text>
      <Text style={{ fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_400Regular" }}>{count} readings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20 },
  header: { paddingTop: 12, marginBottom: 20 },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  periodBtnActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  periodTextActive: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  chartToggle: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
  },
  toggleBtnActive: {
    borderColor: Colors.primary + "66",
    backgroundColor: Colors.primary + "22",
  },
  toggleText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: Colors.primary,
  },
  chartCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartLegend: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statsCard: {
    width: "47%",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statsUnit: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  statsLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
  tirCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tirBar: {
    height: 14,
    borderRadius: 7,
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: Colors.backgroundElevated,
    marginBottom: 14,
  },
  tirSegment: {
    height: "100%",
  },
  tirLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  hba1cCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  hba1cLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  hba1cSub: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  hba1cValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 30,
  },
});
