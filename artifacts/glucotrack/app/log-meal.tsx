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

type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "other";

const MEAL_TYPES: { key: MealType; label: string; icon: string; time: string }[] = [
  { key: "breakfast", label: "Breakfast", icon: "sunny", time: "Morning" },
  { key: "lunch", label: "Lunch", icon: "partly-sunny", time: "Midday" },
  { key: "dinner", label: "Dinner", icon: "moon", time: "Evening" },
  { key: "snack", label: "Snack", icon: "nutrition", time: "Anytime" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal", time: "" },
];

export default function LogMealModal() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState<MealType>("other");
  const [carbs, setCarbs] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.createMeal({
        description: description.trim(),
        mealType,
        carbsGrams: carbs ? parseFloat(carbs) : null,
        notes: notes.trim() || null,
        eatenAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: () => {
      Alert.alert("Error", "Failed to save meal. Please try again.");
    },
  });

  const handleSave = () => {
    if (!description.trim()) {
      Alert.alert("Missing Description", "Please describe what you ate.");
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
          <Text style={styles.title}>Log Meal</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { opacity: mutation.isPending ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={mutation.isPending}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Description */}
          <Text style={styles.label}>What did you eat?</Text>
          <TextInput
            style={styles.mainInput}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Grilled chicken with rice..."
            placeholderTextColor={Colors.textMuted}
            autoFocus
            multiline
          />

          {/* Meal Type */}
          <Text style={styles.label}>Meal type</Text>
          <View style={styles.typeGrid}>
            {MEAL_TYPES.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.typeBtn, mealType === m.key && styles.typeBtnActive]}
                onPress={() => setMealType(m.key)}
              >
                <Ionicons
                  name={m.icon as any}
                  size={20}
                  color={mealType === m.key ? Colors.success : Colors.textMuted}
                />
                <Text style={[styles.typeText, mealType === m.key && styles.typeTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Carbs */}
          <Text style={styles.label}>Carbohydrates (optional)</Text>
          <View style={styles.carbsRow}>
            <TextInput
              style={styles.carbsInput}
              value={carbs}
              onChangeText={setCarbs}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={styles.carbsUnit}>grams</Text>
          </View>

          {/* Notes */}
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={2}
          />
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
    backgroundColor: Colors.success,
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
  mainInput: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  typeBtn: {
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
  typeBtnActive: {
    backgroundColor: Colors.success + "22",
    borderColor: Colors.success + "55",
  },
  typeText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  typeTextActive: { color: Colors.success },
  carbsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  carbsInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    paddingVertical: 12,
  },
  carbsUnit: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
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
    minHeight: 70,
    textAlignVertical: "top",
  },
});
