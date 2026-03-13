import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { api } from "@/hooks/useApi";
import { getGlucoseLevel } from "@/utils/glucose";

type Context = "fasting" | "before_meal" | "after_meal" | "bedtime" | "random";
type Unit = "mgdl" | "mmol";

const CONTEXTS: { key: Context; label: string; icon: string }[] = [
  { key: "fasting", label: "Fasting", icon: "moon" },
  { key: "before_meal", label: "Before Meal", icon: "time" },
  { key: "after_meal", label: "After Meal", icon: "restaurant" },
  { key: "bedtime", label: "Bedtime", icon: "bed" },
  { key: "random", label: "Random", icon: "radio-button-on" },
];

export default function LogGlucoseModal() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<Unit>("mgdl");
  const [context, setContext] = useState<Context>("random");
  const [notes, setNotes] = useState("");

  const numVal = parseFloat(value);
  const level = !isNaN(numVal) && numVal > 0 ? getGlucoseLevel(numVal, unit) : null;

  const mutation = useMutation({
    mutationFn: () =>
      api.createGlucose({
        value: numVal,
        unit,
        context,
        notes: notes.trim() || null,
        recordedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glucose"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: () => {
      Alert.alert("Error", "Failed to save reading. Please try again.");
    },
  });

  const handleSave = () => {
    if (!value || isNaN(numVal) || numVal <= 0) {
      Alert.alert("Invalid Value", "Please enter a valid blood glucose level.");
      return;
    }
    mutation.mutate();
  };

  const levelColor =
    level === "low" ? Colors.danger :
    level === "high" ? Colors.warning :
    level === "normal" ? Colors.primary :
    Colors.textMuted;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Log Glucose</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { opacity: mutation.isPending ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={mutation.isPending}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Value Input */}
          <View style={styles.valueCard}>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.valueInput, { color: levelColor }]}
                value={value}
                onChangeText={setValue}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                autoFocus
              />
              {/* Unit Toggle */}
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitBtn, unit === "mgdl" && styles.unitBtnActive]}
                  onPress={() => setUnit("mgdl")}
                >
                  <Text style={[styles.unitText, unit === "mgdl" && styles.unitTextActive]}>mg/dL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitBtn, unit === "mmol" && styles.unitBtnActive]}
                  onPress={() => setUnit("mmol")}
                >
                  <Text style={[styles.unitText, unit === "mmol" && styles.unitTextActive]}>mmol/L</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Level indicator */}
            {level && (
              <View style={[styles.levelBadge, { backgroundColor: levelColor + "22", borderColor: levelColor + "44" }]}>
                <View style={[styles.levelDot, { backgroundColor: levelColor }]} />
                <Text style={[styles.levelText, { color: levelColor }]}>
                  {level === "low" ? "LOW — Below 70 mg/dL" :
                   level === "high" ? "HIGH — Above 180 mg/dL" :
                   "IN RANGE"}
                </Text>
              </View>
            )}

            {/* Reference ranges */}
            <View style={styles.rangeRow}>
              <RangeLabel color={Colors.danger} label="Low" value={unit === "mgdl" ? "<70" : "<3.9"} />
              <RangeLabel color={Colors.primary} label="Target" value={unit === "mgdl" ? "70-180" : "3.9-10"} />
              <RangeLabel color={Colors.warning} label="High" value={unit === "mgdl" ? ">180" : ">10"} />
            </View>
          </View>

          {/* Context */}
          <Text style={styles.label}>When was this taken?</Text>
          <View style={styles.contextGrid}>
            {CONTEXTS.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[styles.contextBtn, context === c.key && styles.contextBtnActive]}
                onPress={() => setContext(c.key)}
              >
                <Ionicons
                  name={c.icon as any}
                  size={18}
                  color={context === c.key ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.contextText, context === c.key && styles.contextTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes about this reading..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function RangeLabel({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 10, color, fontFamily: "Inter_600SemiBold" }}>{label}</Text>
      <Text style={{ fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  cancelBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  saveBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  valueCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  valueInput: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  unitToggle: {
    gap: 6,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  unitBtnActive: {
    backgroundColor: Colors.primary + "22",
    borderColor: Colors.primary + "66",
  },
  unitText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  unitTextActive: {
    color: Colors.primary,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  contextGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  contextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contextBtnActive: {
    backgroundColor: Colors.primary + "22",
    borderColor: Colors.primary + "55",
  },
  contextText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  contextTextActive: {
    color: Colors.primary,
  },
  notesInput: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    minHeight: 90,
    textAlignVertical: "top",
  },
});
