import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { api, GlucoseReading, Meal, MedicationLog, Period } from "@/hooks/useApi";
import {
  getGlucoseLevel,
  formatTime,
  formatDate,
  getContextLabel,
  getMealTypeLabel,
} from "@/utils/glucose";

type LogItem =
  | { type: "glucose"; data: GlucoseReading; dateKey: string }
  | { type: "meal"; data: Meal; dateKey: string }
  | { type: "medlog"; data: MedicationLog; dateKey: string };

const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export default function HistoryLogScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>("day");
  const [filter, setFilter] = useState<"all" | "glucose" | "meal" | "med">("all");

  const { data: glucose = [], isLoading: l1 } = useQuery({
    queryKey: ["glucose", period],
    queryFn: () => api.getGlucose(period),
  });
  const { data: meals = [], isLoading: l2 } = useQuery({
    queryKey: ["meals", period],
    queryFn: () => api.getMeals(period),
  });
  const { data: medlogs = [], isLoading: l3 } = useQuery({
    queryKey: ["med-logs", period],
    queryFn: () => api.getMedLogs(period),
  });

  const deleteGlucose = useMutation({
    mutationFn: (id: number) => api.deleteGlucose(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["glucose"] }),
  });
  const deleteMeal = useMutation({
    mutationFn: (id: number) => api.deleteMeal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meals"] }),
  });

  const isLoading = l1 || l2 || l3;

  // Merge all logs
  let allItems: LogItem[] = [];
  if (filter === "all" || filter === "glucose") {
    allItems = allItems.concat(glucose.map(g => ({
      type: "glucose" as const,
      data: g,
      dateKey: formatDate(g.recordedAt),
    })));
  }
  if (filter === "all" || filter === "meal") {
    allItems = allItems.concat(meals.map(m => ({
      type: "meal" as const,
      data: m,
      dateKey: formatDate(m.eatenAt),
    })));
  }
  if (filter === "all" || filter === "med") {
    allItems = allItems.concat(medlogs.map(ml => ({
      type: "medlog" as const,
      data: ml,
      dateKey: formatDate(ml.takenAt),
    })));
  }

  // Sort by time descending
  allItems.sort((a, b) => {
    const timeA = a.type === "glucose" ? a.data.recordedAt :
                  a.type === "meal" ? a.data.eatenAt : a.data.takenAt;
    const timeB = b.type === "glucose" ? b.data.recordedAt :
                  b.type === "meal" ? b.data.eatenAt : b.data.takenAt;
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });

  // Group by date
  const grouped: Record<string, LogItem[]> = {};
  allItems.forEach(item => {
    if (!grouped[item.dateKey]) grouped[item.dateKey] = [];
    grouped[item.dateKey].push(item);
  });

  const sections = Object.entries(grouped).map(([title, data]) => ({ title, data }));

  function handleDelete(item: LogItem) {
    if (item.type === "glucose") {
      Alert.alert("Delete Reading", "Remove this glucose reading?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); deleteGlucose.mutate(item.data.id); } },
      ]);
    } else if (item.type === "meal") {
      Alert.alert("Delete Meal", "Remove this meal entry?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); deleteMeal.mutate(item.data.id); } },
      ]);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Log</Text>
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

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {[
          { key: "all", label: "All" },
          { key: "glucose", label: "Glucose" },
          { key: "meal", label: "Meals" },
          { key: "med", label: "Meds" },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key as typeof filter)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No entries</Text>
          <Text style={styles.emptyText}>Your logged readings, meals, and meds will appear here.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.type}-${item.data.id}-${index}`}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <LogRow item={item} onDelete={() => handleDelete(item)} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function LogRow({ item, onDelete }: { item: LogItem; onDelete: () => void }) {
  if (item.type === "glucose") {
    const level = getGlucoseLevel(item.data.value, item.data.unit);
    const color = level === "low" ? Colors.danger : level === "high" ? Colors.warning : Colors.primary;
    return (
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: color + "22" }]}>
          <Ionicons name="water" size={16} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowValue, { color }]}>
            {item.data.unit === "mmol" ? item.data.value.toFixed(1) : Math.round(item.data.value)}{" "}
            <Text style={styles.rowUnit}>{item.data.unit === "mmol" ? "mmol/L" : "mg/dL"}</Text>
          </Text>
          <Text style={styles.rowMeta}>
            {formatTime(item.data.recordedAt)} · {getContextLabel(item.data.context)}
            {level !== "normal" && ` · ${level.toUpperCase()}`}
          </Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  if (item.type === "meal") {
    return (
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: Colors.success + "22" }]}>
          <Ionicons name="restaurant" size={16} color={Colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{item.data.description}</Text>
          <Text style={styles.rowMeta}>
            {formatTime(item.data.eatenAt)} · {getMealTypeLabel(item.data.mealType)}
            {item.data.carbsGrams ? ` · ${item.data.carbsGrams}g carbs` : ""}
          </Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  if (item.type === "medlog") {
    return (
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: Colors.primary + "22" }]}>
          <MaterialCommunityIcons name="pill" size={16} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{item.data.medicationName}</Text>
          <Text style={styles.rowMeta}>
            {formatTime(item.data.takenAt)}{item.data.dosage ? ` · ${item.data.dosage}` : ""}
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.text },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  periodTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary + "22",
    borderColor: Colors.primary + "44",
  },
  filterText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  filterTextActive: { color: Colors.primary },
  list: { paddingHorizontal: 20 },
  sectionHeader: {
    paddingVertical: 8,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rowValue: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  rowUnit: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  rowMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  deleteBtn: { padding: 6 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
