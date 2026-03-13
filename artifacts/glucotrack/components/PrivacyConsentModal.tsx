import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  onAccept: () => void;
  onViewPolicy: () => void;
}

function DataItem({ icon, title, desc }: { icon: IoniconsName; title: string; desc: string }) {
  return (
    <View style={styles.dataItem}>
      <View style={styles.dataIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.dataTitle}>{title}</Text>
        <Text style={styles.dataDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function ProtectionItem({ icon, text }: { icon: IoniconsName; text: string }) {
  return (
    <View style={styles.protectionItem}>
      <Ionicons name={icon} size={16} color={Colors.success} />
      <Text style={styles.protectionText}>{text}</Text>
    </View>
  );
}

export function PrivacyConsentModal({ onAccept, onViewPolicy }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 40 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Your Privacy Matters</Text>
        <Text style={styles.subtitle}>
          Before you start, here's how GlucoTrack handles your health data.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Store</Text>
          <View style={styles.dataList}>
            <DataItem
              icon="water"
              title="Blood Glucose Readings"
              desc="Your glucose values, timestamps, and measurement context"
            />
            <DataItem
              icon="medical"
              title="Medication Records"
              desc="Medications you add and dose timestamps"
            />
            <DataItem
              icon="restaurant"
              title="Meal Logs"
              desc="Meal descriptions, types, and carb estimates"
            />
            <DataItem
              icon="settings"
              title="App Preferences"
              desc="Your unit preferences, thresholds, and display settings"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Protect You</Text>
          <View style={styles.protectionList}>
            <ProtectionItem icon="lock-closed" text="Data is stored securely on your device" />
            <ProtectionItem icon="eye-off" text="No third-party tracking or analytics" />
            <ProtectionItem icon="megaphone-outline" text="No advertisements, ever" />
            <ProtectionItem icon="people-outline" text="Data is never sold or shared" />
            <ProtectionItem icon="finger-print" text="Optional biometric app lock available" />
            <ProtectionItem icon="trash-outline" text="Delete all data at any time from Settings" />
          </View>
        </View>

        <TouchableOpacity onPress={onViewPolicy} style={styles.policyLink}>
          <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
          <Text style={styles.policyLinkText}>Read Full Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerNote}>
          By tapping "I Agree & Continue", you acknowledge that you have read and
          agree to our Privacy Policy and Terms of Service.
        </Text>
        <TouchableOpacity onPress={onAccept} style={styles.acceptBtn}>
          <Ionicons name="shield-checkmark" size={18} color="#fff" />
          <Text style={styles.acceptText}>I Agree & Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  dataList: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  dataItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dataIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  dataTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 2,
  },
  dataDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 16,
  },
  protectionList: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  protectionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  protectionText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  policyLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginBottom: 8,
  },
  policyLinkText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 14,
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  acceptText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
