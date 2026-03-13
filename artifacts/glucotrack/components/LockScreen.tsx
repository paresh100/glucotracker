import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Colors } from "@/constants/colors";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState<string>("Biometrics");

  useEffect(() => {
    checkBiometricType();
    authenticate();
  }, []);

  const checkBiometricType = async () => {
    if (Platform.OS === "web") {
      setBiometricType("Passcode");
      return;
    }
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("Face ID");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("Touch ID");
      } else {
        setBiometricType("Passcode");
      }
    } catch {
      setBiometricType("Passcode");
    }
  };

  const authenticate = async () => {
    if (Platform.OS === "web") {
      onUnlock();
      return;
    }

    setError(null);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setError("No biometric or passcode set up on this device. Please configure Face ID, Touch ID, or a passcode in your device settings to unlock.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock GlucoTrack",
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (result.success) {
        onUnlock();
      } else {
        setError("Authentication failed. Tap to try again.");
      }
    } catch (err) {
      setError("Authentication error. Tap to try again.");
    }
  };

  const iconName: IoniconsName =
    biometricType === "Face ID" ? "scan" :
    biometricType === "Touch ID" ? "finger-print" :
    "lock-closed";

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name={iconName} size={48} color={Colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>GlucoTrack</Text>
      <Text style={styles.subtitle}>Your health data is protected</Text>

      {error ? (
        <TouchableOpacity onPress={authenticate} style={styles.retryBtn}>
          <Text style={styles.errorText}>{error}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.hint}>Authenticating with {biometricType}...</Text>
      )}

      <TouchableOpacity onPress={authenticate} style={styles.unlockBtn}>
        <Ionicons name={iconName} size={20} color="#fff" />
        <Text style={styles.unlockText}>Unlock with {biometricType}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
        <Text style={styles.footerText}>
          Protected by on-device authentication
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + "15",
    borderWidth: 2,
    borderColor: Colors.primary + "33",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  hint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.danger,
    textAlign: "center",
  },
  retryBtn: {
    padding: 12,
    marginBottom: 16,
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 40,
  },
  unlockText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  footer: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
});
