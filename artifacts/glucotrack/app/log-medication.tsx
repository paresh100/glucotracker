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

export default function LogMedicationModal() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [notes, setNotes] = useState("");

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ["medications"],
    queryFn: () => api.getMedications(),
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.logMedication({
        medicationId: selectedMed!.id,
        notes: notes.trim() || undefined,
        takenAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["med-logs"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: () => {
      Alert.alert("Error", "Failed to log medication. Please try again.");
    },
  });

  const handleSave = () => {
    if (!selectedMed) {
      Alert.alert("Select Medication", "Please select a medication to log.");
      return;
    }
    mutation.mutate();
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
          <Text style={styles.title}>Log Medication</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { opacity: (mutation.isPending || !selectedMed) ? 0.5 : 1 }]}
            onPress={handleSave}
            disabled={mutation.isPending || !selectedMed}
          >
            <Text style={styles.saveBtnText}>Log</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.label}>Select medication</Text>

          {isLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : medications.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="pill-off" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No medications added yet</Text>
              <TouchableOpacity
                style={styles.addMedBtn}
                onPress={() => { router.back(); setTimeout(() => router.push("/manage-medications"), 300); }}
              >
                <Text style={styles.addMedBtnText}>Add medications first</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.medList}>
              {medications.map(med => {
                const color = med.color ?? Colors.primary;
                const isSelected = selectedMed?.id === med.id;
                return (
                  <TouchableOpacity
                    key={med.id}
                    style={[styles.medCard, isSelected && { borderColor: color + "88", backgroundColor: color + "11" }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedMed(med); }}
                  >
                    <View style={[styles.medDot, { backgroundColor: color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{med.name}</Text>
                      {(med.dosage || med.frequency) && (
                        <Text style={styles.medMeta}>
                          {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {medications.length > 0 && (
            <>
              <Text style={[styles.label, { marginTop: 20 }]}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any notes about this dose..."
                placeholderTextColor={Colors.textMuted}
                multiline
              />
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
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  medList: { gap: 8 },
  medCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medDot: { width: 12, height: 12, borderRadius: 6 },
  medName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  medMeta: { fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    gap: 12,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
  addMedBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
  },
  addMedBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  notesInput: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: "top",
  },
});
