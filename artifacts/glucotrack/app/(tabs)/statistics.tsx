import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { api } from "@/hooks/useApi";
import { useSettings } from "@/contexts/SettingsContext";
import Svg, { Circle } from "react-native-svg";
import { toMgdl } from "@/contexts/SettingsContext";

function StatRing({ value, label, sub, color, maxValue = 100 }: {
  value: string;
  label: string;
  sub?: string;
  color: string;
  maxValue?: number;
}) {
  const SIZE = 80;
  const STROKE = 5;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const numericVal = parseFloat(value);
  const fillPct = isNaN(numericVal) ? 0 : Math.min(numericVal / maxValue, 1);
  const dashOffset = CIRC * (1 - fillPct);

  return (
    <View style={styles.ringContainer}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={`${CIRC}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${SIZE / 2},${SIZE / 2}`}
          />
        </Svg>
        <View style={styles.ringInner}>
          <Text style={[styles.ringValue, { color }]} numberOfLines={1}>{value}</Text>
          {sub && <Text style={styles.ringSub}>{sub}</Text>}
        </View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
}

function PeriodSection({ title, period, unit, displayValue, hypo, hyper }: {
  title: string;
  period: "week" | "month";
  unit: string;
  displayValue: (mgdl: number) => number;
  hypo: number;
  hyper: number;
}) {
  const { data: stats } = useQuery({
    queryKey: ["stats", period],
    queryFn: () => api.getStats(period),
  });
  const { data: readings = [] } = useQuery({
    queryKey: ["glucose", period],
    queryFn: () => api.getGlucose(period),
  });

  const daysInPeriod = period === "week" ? 7 : 30;
  const fingerChecksPerDay = stats && stats.totalReadings > 0
    ? (stats.totalReadings / daysInPeriod).toFixed(1)
    : "0";

  const avgDisplay = stats?.average ? `${displayValue(stats.average)}` : "—";
  const highDisplay = stats?.max ? `${displayValue(stats.max)}` : "—";
  const lowDisplay = stats?.min ? `${displayValue(stats.min)}` : "—";
  const hyperPct = stats && stats.totalReadings > 0
    ? `${Math.round((stats.highCount / stats.totalReadings) * 100)}%`
    : "0%";
  const hypoPct = stats && stats.totalReadings > 0
    ? `${Math.round((stats.lowCount / stats.totalReadings) * 100)}%`
    : "0%";

  return (
    <View style={styles.periodSection}>
      <Text style={styles.periodTitle}>{title}</Text>
      <View style={styles.periodRow}>
        <StatRing
          value={fingerChecksPerDay}
          label="Finger Checks"
          color="#8B5CF6"
          maxValue={10}
        />
        <StatRing
          value={avgDisplay === "—" ? "—" : avgDisplay}
          label="Blood Glucose"
          color={Colors.primary}
          maxValue={stats?.average ? Math.max(stats.average / 0.8, 300) : 300}
        />
        <StatRing
          value={highDisplay}
          sub={lowDisplay}
          label="Highest/Lowest"
          color={Colors.warning}
          maxValue={stats?.max ? stats.max * 1.2 : 400}
        />
        <StatRing
          value={hyperPct}
          sub={hypoPct}
          label="Hyper/Hypo"
          color={Colors.danger}
          maxValue={100}
        />
      </View>
    </View>
  );
}

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const { displayValue, displayUnit, settings } = useSettings();

  const { data: stats90 } = useQuery({
    queryKey: ["stats", "quarter"],
    queryFn: () => api.getStats("quarter"),
  });

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Statistics</Text>

        {/* 7-day */}
        <PeriodSection
          title="7-Day Daily Average"
          period="week"
          unit={displayUnit}
          displayValue={displayValue}
          hypo={settings.hypoThresholdMgdl}
          hyper={settings.hyperThresholdMgdl}
        />

        {/* 30-day */}
        <PeriodSection
          title="30-Day Daily Average"
          period="month"
          unit={displayUnit}
          displayValue={displayValue}
          hypo={settings.hypoThresholdMgdl}
          hyper={settings.hyperThresholdMgdl}
        />

        {/* 90-day / Year */}
        <View style={styles.periodSection}>
          <Text style={styles.periodTitle}>90-Day Overview</Text>
          {stats90 && stats90.totalReadings > 0 ? (
            <>
              <View style={styles.ninetyGrid}>
                <BigStatCard
                  value={`${displayValue(stats90.average ?? 0)}`}
                  label="Average Glucose"
                  unit={displayUnit}
                  color={Colors.primary}
                />
                <BigStatCard
                  value={stats90.hba1cEstimate ? `${stats90.hba1cEstimate}%` : "—"}
                  label="Est. HbA1c"
                  unit="estimated"
                  color={Colors.warning}
                />
              </View>
              <View style={styles.ninetyGrid}>
                <BigStatCard
                  value={`${stats90.timeInRange}%`}
                  label="Time in Range"
                  unit="target 70-180"
                  color={Colors.success}
                />
                <BigStatCard
                  value={`${stats90.totalReadings}`}
                  label="Total Readings"
                  unit="90 days"
                  color="#8B5CF6"
                />
              </View>

              {/* TIR Visual */}
              <View style={styles.tirCard}>
                <Text style={styles.tirTitle}>Time in Range Breakdown</Text>
                <View style={styles.tirBarLarge}>
                  {stats90.lowCount > 0 && (
                    <View style={[styles.tirSeg, {
                      flex: stats90.lowCount,
                      backgroundColor: Colors.danger,
                    }]} />
                  )}
                  {stats90.inRangeCount > 0 && (
                    <View style={[styles.tirSeg, {
                      flex: stats90.inRangeCount,
                      backgroundColor: Colors.primary,
                    }]} />
                  )}
                  {stats90.highCount > 0 && (
                    <View style={[styles.tirSeg, {
                      flex: stats90.highCount,
                      backgroundColor: Colors.warning,
                    }]} />
                  )}
                </View>
                <View style={styles.tirLegend}>
                  <TirLegendItem color={Colors.danger} label="Low" pct={stats90.totalReadings > 0 ? Math.round(stats90.lowCount / stats90.totalReadings * 100) : 0} />
                  <TirLegendItem color={Colors.primary} label="In Range" pct={stats90.timeInRange} />
                  <TirLegendItem color={Colors.warning} label="High" pct={stats90.totalReadings > 0 ? Math.round(stats90.highCount / stats90.totalReadings * 100) : 0} />
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Log more readings to see 90-day statistics</Text>
            </View>
          )}
        </View>

        {/* Daily/Monthly Averages links */}
        <View style={styles.linksCard}>
          <View style={styles.linkRow}>
            <View style={[styles.linkIcon, { backgroundColor: Colors.primary + "22" }]}>
              <Text style={{ fontSize: 18 }}>📅</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Daily Averages</Text>
              <Text style={styles.linkSub}>View glucose average by time of day</Text>
            </View>
          </View>
          <View style={[styles.linkRow, { borderTopWidth: 1, borderTopColor: Colors.border }]}>
            <View style={[styles.linkIcon, { backgroundColor: Colors.warning + "22" }]}>
              <Text style={{ fontSize: 18 }}>📊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Monthly Averages</Text>
              <Text style={styles.linkSub}>View trends across the past months</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function BigStatCard({ value, label, unit, color }: { value: string; label: string; unit: string; color: string }) {
  return (
    <View style={[styles.bigCard, { borderColor: color + "33" }]}>
      <Text style={[styles.bigValue, { color }]}>{value}</Text>
      <Text style={styles.bigLabel}>{label}</Text>
      <Text style={styles.bigUnit}>{unit}</Text>
    </View>
  );
}

function TirLegendItem({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular" }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color, marginTop: 2 }}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20 },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    paddingTop: 12,
    marginBottom: 24,
  },
  periodSection: {
    marginBottom: 24,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  periodRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  ringContainer: {
    alignItems: "center",
    gap: 6,
  },
  ringInner: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  ringValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  ringSub: {
    fontSize: 8,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  ringLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 70,
  },
  ninetyGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  bigCard: {
    flex: 1,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  bigValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  bigLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
    textAlign: "center",
  },
  bigUnit: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  tirCard: {
    marginTop: 8,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 14,
    padding: 14,
  },
  tirTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  tirBarLarge: {
    height: 18,
    borderRadius: 9,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 12,
  },
  tirSeg: { height: "100%" },
  tirLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  linksCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 20,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  linkTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  linkSub: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
});
