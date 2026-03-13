import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ text }: { text: string }) {
  return <Text style={styles.paragraph}>{text}</Text>;
}

function BulletPoint({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.handleBar} />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <TouchableOpacity onPress={handleBack} style={styles.doneBtn}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.lastUpdated}>
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.lastUpdatedText}>Last Updated: 13 March 2026</Text>
        </View>

        <Section title="1. Introduction">
          <Paragraph text={'GlucoTrack ("we," "our," or "the App") is a personal glucose tracking app designed to help users record blood glucose readings, medications, meals, and related preferences for personal record-keeping.'} />
          <Paragraph text="We are committed to protecting your privacy and handling your data with care." />
          <Paragraph text="This Privacy Policy explains what information GlucoTrack collects, how it is used, how it is stored, how it is protected, and what rights you may have regarding your data." />
        </Section>

        <Section title="2. Information We Collect">
          <Paragraph text="GlucoTrack collects only the information that you choose to enter into the app, including:" />
          <BulletPoint text="Blood glucose readings, including values, units, timestamps, and optional context such as fasting or after meals" />
          <BulletPoint text="Medication records, including names, dosages, frequencies, and dose log timestamps" />
          <BulletPoint text="Meal logs, including descriptions, meal types, carbohydrate estimates, and timestamps" />
          <BulletPoint text="App preferences, including unit preferences, threshold values, display settings, and reminder times" />
          <Paragraph text="GlucoTrack does not collect:" />
          <BulletPoint text="Your name, email address, or phone number through the app" />
          <BulletPoint text="Location data" />
          <BulletPoint text="Device identifiers for advertising or tracking" />
          <BulletPoint text="Behavioral analytics data" />
          <BulletPoint text="Data from other apps on your device" />
        </Section>

        <Section title="3. How Your Data Is Stored">
          <Paragraph text="Your data may be stored:" />
          <BulletPoint text="Locally on your device" />
          <BulletPoint text="In your personal iCloud storage, where iCloud syncing or backup is enabled" />
          <BulletPoint text="In exported files created by you when you use the app's export feature" />
          <Paragraph text="App preferences and saved records may use security features provided by your device and operating system." />
          <Paragraph text="If certain app features use network communication, that communication is protected using HTTPS/TLS encryption." />
        </Section>

        <Section title="4. How Your Data Is Used">
          <Paragraph text="Your data is used only to provide the app's main features, including:" />
          <BulletPoint text="Saving your readings, medications, meals, and settings" />
          <BulletPoint text="Showing your history and trends" />
          <BulletPoint text="Syncing or backing up data through iCloud, where enabled" />
          <BulletPoint text="Allowing you to export your data when you choose to do so" />
          <BulletPoint text="Protecting app access through supported device security features" />
        </Section>

        <Section title="5. Data Sharing">
          <Paragraph text="GlucoTrack does not sell, rent, or trade your data." />
          <Paragraph text="We do not share your health data with advertising networks, data brokers, social media platforms, or other users." />
          <Paragraph text="Your data may be processed through Apple services where needed to support iCloud storage, syncing, backup, or device-level security features." />
        </Section>

        <Section title="6. Third-Party Services">
          <Paragraph text="GlucoTrack is not designed to use third-party advertising or tracking services." />
          <Paragraph text="The app does not use cross-app tracking for advertising purposes." />
          <Paragraph text="The app may rely on Apple-provided services and device features, including iCloud, local device storage, and supported biometric security options." />
          <Paragraph text="If other third-party services are added later to support app functions, this Privacy Policy will be updated." />
        </Section>

        <Section title="7. Data Export and Deletion">
          <Paragraph text="You can manage your data within the app. Where these features are available, you may:" />
          <BulletPoint text="Export your data from the app" />
          <BulletPoint text="Permanently delete your saved data from the app" />
          <BulletPoint text="Remove locally stored app data by uninstalling the app from your device" />
          <Paragraph text="Please note:" />
          <BulletPoint text="Exported files are controlled by you after export" />
          <BulletPoint text="If your data has been synced to iCloud, copies may remain in iCloud until removed under your Apple account settings or backup system" />
          <BulletPoint text="Uninstalling the app may remove local app data from your device, but may not automatically remove data stored in iCloud or in exported files" />
        </Section>

        <Section title="8. Data Security">
          <Paragraph text="We take reasonable steps to protect your data from unauthorized access, loss, misuse, or disclosure. Security measures may include:" />
          <BulletPoint text="Device-based secure storage" />
          <BulletPoint text="Optional biometric app lock" />
          <BulletPoint text="Privacy protection when the app is moved to the background" />
          <BulletPoint text="Automatic app lock after a period of inactivity" />
          <BulletPoint text="Encrypted network communication where used" />
          <Paragraph text="No method of electronic storage or transmission is completely secure, but we work to protect the data handled by the app." />
        </Section>

        <Section title="9. Children's Privacy">
          <Paragraph text="GlucoTrack is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided data through the app, please contact us." />
        </Section>

        <Section title="10. Changes to This Policy">
          <Paragraph text={'We may update this Privacy Policy from time to time. Any changes will be posted on this page, and the "Last Updated" date will be revised.'} />
        </Section>

        <Section title="11. Your Rights">
          <Paragraph text="Depending on your location and the laws that apply to you, you may have rights relating to your data, which may include:" />
          <BulletPoint text="The right to access your data" />
          <BulletPoint text="The right to delete your data" />
          <BulletPoint text="The right to export your data" />
          <BulletPoint text="The right to contact us with privacy questions" />
        </Section>

        <Section title="12. Contact Us">
          <Paragraph text="If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact us at:" />
          <Paragraph text="Email: hellorapidpaceai@gmail.com" />
        </Section>

        <View style={styles.footerBadge}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
          <Text style={styles.footerBadgeText}>
            GlucoTrack is committed to protecting your health data privacy
          </Text>
        </View>
      </ScrollView>
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
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  doneBtn: { paddingHorizontal: 4 },
  doneText: { fontSize: 15, color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  lastUpdatedText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 8,
  },
  bullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 21,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  footerBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.primary + "10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "22",
  },
  footerBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    flex: 1,
  },
});
