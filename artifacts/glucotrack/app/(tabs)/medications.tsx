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
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { api, Medication, MedicationLog } from "@/hooks/useApi";
import { formatDateTime, formatTime } from "@/utils/glucose";

const MED_COLORS = [
  "#00C896", "#3B82F6", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#10B981",
];

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: medications = [], isLoading: loadingMeds } = useQuery({
    queryKey: ["medications"],
    queryFn: () => api.getMedications(),
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["med-logs", "day"],
    queryFn: () => api.getMedLogs("day"),
  });

  const logMutation = useMutation({
    mutationFn: (med: Medication) =>
      api.logMedication({
        medicationId: med.id,
        takenAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["med-logs"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  const handleLogMed = (med: Medication) => {
    Alert.alert(
      `Log ${med.name}`,
      `Record that you took ${med.dosage ?? "a dose"} now?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Taken",
          onPress: () => logMutation.mutate(med),
        },
      ]
    );
  };

  // Group today's logs by medication
  const todayLogsByMed: Record<number, number> = {};
  logs.forEach(l => {
    todayLogsByMed[l.medicationId] = (todayLogsByMed[l.medicationId] ?? 0) + 1;
  });

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Medications</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/manage-medications"); }}
          >
            <Ionicons name="add" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* My Medications */}
        {loadingMeds ? (
          <ActivityIndicator color={Colors.primary} />
        ) : medications.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="pill-off" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No medications added</Text>
            <Text style={styles.emptyText}>Add your medications to track and log doses</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/manage-medications")}>
              <Text style={styles.emptyBtnText}>Add Medication</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>My Medications</Text>
            {medications.map(med => {
              const todayCount = todayLogsByMed[med.id] ?? 0;
              const color = med.color ?? Colors.primary;
              return (
                <View key={med.id} style={styles.medCard}>
                  <View style={[styles.medDot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <View style={styles.medMeta}>
                      {med.dosage && <Text style={styles.medDetail}>{med.dosage}</Text>}
                      {med.frequency && <Text style={styles.medDetail}>· {med.frequency}</Text>}
                    </View>
                    {todayCount > 0 && (
                      <View style={styles.takenBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
                        <Text style={styles.takenText}>Taken {todayCount}x today</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.logBtn, { backgroundColor: color + "22", borderColor: color + "44" }]}
                    onPress={() => handleLogMed(med)}
                    disabled={logMutation.isPending}
                  >
                    <Text style={[styles.logBtnText, { color }]}>Log</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* Today's Dose Log */}
        {logs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Today's Doses</Text>
            {logs.map(log => {
              const med = medications.find(m => m.id === log.medicationId);
              const color = med?.color ?? Colors.primary;
              return (
                <View key={log.id} style={styles.logRow}>
                  <View style={[styles.logDot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logName}>{log.medicationName}</Text>
                    {log.dosage && <Text style={styles.logDosage}>{log.dosage}</Text>}
                  </View>
                  <Text style={styles.logTime}>{formatTime(log.takenAt)}</Text>
                </View>
              );
            })}
          </>
        )}

        {/* Log Medication FAB area */}
        <TouchableOpacity
          style={styles.logManualBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/log-medication"); }}
        >
          <MaterialCommunityIcons name="pill" size={18} color={Colors.primary} />
          <Text style={styles.logManualText}>Log a dose now</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "22",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  medCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  medName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  medMeta: {
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
  },
  medDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  takenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  takenText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  logBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  logBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  logDosage: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  logTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  emptyCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  emptyBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  logManualBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "44",
    borderStyle: "dashed",
  },
  logManualText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
});
