import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export function PasswordModal({ visible, title, message, onSubmit, onCancel }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setError(null);
    onSubmit(password);
    setPassword("");
  };

  const handleCancel = () => {
    setPassword("");
    setError(null);
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Enter password"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    width: "100%",
    height: 48,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    marginBottom: 8,
  },
  error: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.danger,
    marginBottom: 8,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  submitText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
