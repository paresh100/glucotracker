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
  const topInset = Platform.OS === "web" ? 20 : insets.top;

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
          <Text style={styles.lastUpdatedText}>Last updated: March 2026</Text>
        </View>

        <Section title="1. Introduction">
          <Paragraph text={'GlucoTrack ("we", "our", or "the App") is a personal diabetes management application designed to help you track blood glucose levels, medications, and meals. We are committed to protecting your privacy and handling your personal health information with the highest level of care and security.'} />
          <Paragraph text="This Privacy Policy explains what information we collect, how we use it, how we protect it, and your rights regarding your data." />
        </Section>

        <Section title="2. Information We Collect">
          <Paragraph text="GlucoTrack collects only the data you voluntarily provide:" />
          <BulletPoint text="Blood glucose readings (values, units, timestamps, context such as fasting or after meal)" />
          <BulletPoint text="Medication records (names, dosages, frequencies, and dose log timestamps)" />
          <BulletPoint text="Meal logs (descriptions, meal types, carbohydrate estimates, timestamps)" />
          <BulletPoint text="App preferences (unit preference, threshold values, display settings, reminder times)" />
          <Paragraph text="We do NOT collect:" />
          <BulletPoint text="Personal identification information (name, email, phone number)" />
          <BulletPoint text="Location data" />
          <BulletPoint text="Device identifiers for tracking purposes" />
          <BulletPoint text="Usage analytics or behavioral data" />
          <BulletPoint text="Any data from other apps on your device" />
        </Section>

        <Section title="3. How Your Data Is Stored">
          <Paragraph text="Your health data is stored securely using the following methods:" />
          <BulletPoint text="On iOS: App preferences are stored in the Secure Enclave via iOS Keychain Services (expo-secure-store)" />
          <BulletPoint text="On Android: App preferences are stored using Android Keystore backed encryption" />
          <BulletPoint text="Health records (glucose, medications, meals) are stored in a secure database" />
          <BulletPoint text="All network communication uses HTTPS/TLS encryption" />
          <BulletPoint text="Optional biometric authentication (Face ID / Touch ID / fingerprint) adds an additional layer of protection" />
        </Section>

        <Section title="4. Data Sharing">
          <Paragraph text="GlucoTrack does NOT share your data with anyone:" />
          <BulletPoint text="No third-party analytics services" />
          <BulletPoint text="No advertising networks" />
          <BulletPoint text="No data brokers or resellers" />
          <BulletPoint text="No social media platforms" />
          <BulletPoint text="No other users or organizations" />
          <Paragraph text="Your health data remains entirely under your control. We will never sell, rent, or otherwise distribute your personal health information." />
        </Section>

        <Section title="5. Third-Party Services">
          <Paragraph text="GlucoTrack does not integrate with any third-party tracking, analytics, or advertising services. The app contains:" />
          <BulletPoint text="No advertisements" />
          <BulletPoint text="No third-party SDKs that collect user data" />
          <BulletPoint text="No cross-app tracking" />
          <BulletPoint text="No App Tracking Transparency requests (because we do not track you)" />
        </Section>

        <Section title="6. Data Export & Deletion">
          <Paragraph text="You have full control over your data:" />
          <BulletPoint text="Export: You can export all your data at any time from Settings > Export Data. This creates a JSON file containing all your readings, medications, meals, and settings." />
          <BulletPoint text="Delete: You can permanently delete all your data at any time from Settings > Clear All Data. This action is irreversible." />
          <BulletPoint text="Uninstall: Removing the app from your device will also remove all locally stored data." />
        </Section>

        <Section title="7. Data Security">
          <Paragraph text="We implement multiple layers of security to protect your data:" />
          <BulletPoint text="Encrypted storage using platform-native secure storage (iOS Keychain / Android Keystore)" />
          <BulletPoint text="Optional biometric app lock (Face ID, Touch ID, fingerprint)" />
          <BulletPoint text="Privacy screen protection when app is in background/app switcher" />
          <BulletPoint text="Auto-lock timeout with configurable duration" />
          <BulletPoint text="HTTPS/TLS encrypted network communication" />
        </Section>

        <Section title="8. Children's Privacy">
          <Paragraph text="GlucoTrack is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal data, please contact us so we can take appropriate action." />
        </Section>

        <Section title="9. Changes to This Policy">
          <Paragraph text="We may update this Privacy Policy from time to time. Any changes will be reflected in the 'Last Updated' date at the top of this page. We encourage you to review this policy periodically." />
        </Section>

        <Section title="10. Your Rights">
          <Paragraph text="Depending on your jurisdiction, you may have the following rights:" />
          <BulletPoint text="Right to access your data (use Export Data)" />
          <BulletPoint text="Right to delete your data (use Clear All Data)" />
          <BulletPoint text="Right to data portability (JSON export)" />
          <BulletPoint text="Right to withdraw consent (disable features in Settings)" />
        </Section>

        <Section title="11. Contact Us">
          <Paragraph text="If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact us at:" />
          <Paragraph text="Email: privacy@glucotrack.app" />
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
