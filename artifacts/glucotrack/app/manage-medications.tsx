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
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { api, Medication } from "@/hooks/useApi";

const MED_COLORS = [
  "#00C896", "#3B82F6", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#10B981",
];

const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "With meals", "As needed"];

export default function ManageMedicationsModal() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [color, setColor] = useState(MED_COLORS[0]);

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ["medications"],
    queryFn: () => api.getMedications(),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      api.createMedication({
        name: name.trim(),
        dosage: dosage.trim() || null,
        frequency: frequency.trim() || null,
        color,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setName(""); setDosage(""); setFrequency(""); setColor(MED_COLORS[0]);
      setShowForm(false);
    },
    onError: () => {
      Alert.alert("Error", "Failed to add medication.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteMedication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter a medication name.");
      return;
    }
    addMutation.mutate();
  };

  const handleDelete = (med: Medication) => {
    Alert.alert(
      `Delete ${med.name}`,
      "This will also delete all dose logs for this medication.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(med.id) },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.handleBar} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Manage Medications</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm(!showForm)}
          >
            <Ionicons name={showForm ? "remove" : "add"} size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Add Form */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>New Medication</Text>

              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Medication name (e.g. Metformin)"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />

              <TextInput
                style={styles.input}
                value={dosage}
                onChangeText={setDosage}
                placeholder="Dosage (e.g. 500mg)"
                placeholderTextColor={Colors.textMuted}
              />

              {/* Frequency options */}
              <Text style={styles.subLabel}>Frequency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {FREQUENCIES.map(f => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
                      onPress={() => setFrequency(f === frequency ? "" : f)}
                    >
                      <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Custom frequency */}
              <TextInput
                style={styles.input}
                value={frequency}
                onChangeText={setFrequency}
                placeholder="Or type custom frequency..."
                placeholderTextColor={Colors.textMuted}
              />

              {/* Color picker */}
              <Text style={styles.subLabel}>Color</Text>
              <View style={styles.colorPicker}>
                {MED_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
                    onPress={() => setColor(c)}
                  >
                    {color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { opacity: addMutation.isPending ? 0.6 : 1 }]}
                onPress={handleAdd}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Add Medication</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Medication List */}
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 32 }} />
          ) : medications.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="pill" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No medications yet</Text>
              <Text style={styles.emptyText}>Tap + to add your first medication</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>My Medications ({medications.length})</Text>
              {medications.map(med => (
                <View key={med.id} style={styles.medCard}>
                  <View style={[styles.medColorBar, { backgroundColor: med.color ?? Colors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{med.name}</Text>
                    {(med.dosage || med.frequency) && (
                      <Text style={styles.medMeta}>
                        {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(med)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  title: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.text },
  cancelBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + "22",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  formCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 14,
  },
  input: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  freqBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
  freqBtnActive: {
    backgroundColor: Colors.primary + "22",
    borderColor: Colors.primary + "55",
  },
  freqText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  freqTextActive: { color: Colors.primary },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  colorDotSelected: {
    borderWidth: 2.5,
    borderColor: "#fff",
    transform: [{ scale: 1.1 }],
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
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
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medColorBar: {
    width: 4,
    alignSelf: "stretch",
    marginRight: 12,
  },
  medName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, paddingVertical: 14 },
  medMeta: { fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2, marginBottom: 14 },
  deleteBtn: { padding: 16 },
  emptyState: {
    alignItems: "center",
    paddingTop: 48,
    gap: 10,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  emptyText: { fontSize: 13, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
});
