import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Share,
  Linking,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Colors } from "@/constants/colors";
import { useSettings, Unit } from "@/contexts/SettingsContext";
import { PasswordModal } from "@/components/PasswordModal";
import { encryptData } from "@/utils/encryption";
import { api } from "@/hooks/useApi";

function SettingRow({
  label,
  desc,
  right,
}: {
  label: string;
  desc?: string;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      {right}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsModal() {
  const insets = useSafeAreaInsets();
  const { settings, updateSetting } = useSettings();
  const [exporting, setExporting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const hypoMmol = Math.round((settings.hypoThresholdMgdl / 18.0182) * 10) / 10;
  const hyperMmol = Math.round((settings.hyperThresholdMgdl / 18.0182) * 10) / 10;

  const handleBoolToggle = (key: 'showBolus' | 'showBasal' | 'showMedications' | 'fingerTracker' | 'backupEnabled' | 'reminderEnabled' | 'darkMode') => (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSetting(key, value);
  };

  const handleExport = () => {
    setShowPasswordModal(true);
  };

  const performExport = async (password: string) => {
    setShowPasswordModal(false);
    setExporting(true);
    try {
      const [glucose, meds, meals, medLogs] = await Promise.all([
        api.getGlucose(),
        api.getMedications(),
        api.getMeals(),
        api.getMedLogs(),
      ]);

      const data = {
        exportedAt: new Date().toISOString(),
        appVersion: "1.0.0",
        settings: {
          unit: settings.unit,
          hypoThresholdMgdl: settings.hypoThresholdMgdl,
          hyperThresholdMgdl: settings.hyperThresholdMgdl,
        },
        glucose,
        medications: meds,
        medicationLogs: medLogs,
        meals,
      };

      const json = JSON.stringify(data);
      const encrypted = await encryptData(json, password);

      const path = `${FileSystem.documentDirectory}glucotrack-backup-${Date.now()}.gtbak`;
      await FileSystem.writeAsStringAsync(path, encrypted, { encoding: FileSystem.EncodingType.UTF8 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: "application/octet-stream",
          dialogTitle: "Share Encrypted GlucoTrack Backup",
        });
      } else {
        Alert.alert("Export Complete", "Your encrypted backup has been saved.");
      }
    } catch (err) {
      Alert.alert("Export Failed", "Could not export your data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    Alert.alert(
      "Import Data",
      "Import from a GlucoTrack backup JSON file. This will add all readings from the backup to your existing data.",
      [{ text: "OK" }]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your glucose readings, meals, and medication logs. This action cannot be undone.\n\nWe recommend exporting your data first.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: () => Alert.alert("Confirmation", "Use the export feature to backup first, then proceed."),
        },
      ]
    );
  };

  const hypoDisplayLabel = settings.unit === "mmol"
    ? `< ${hypoMmol} mmol/L`
    : `< ${settings.hypoThresholdMgdl} mg/dL`;

  const hyperDisplayLabel = settings.unit === "mmol"
    ? `> ${hyperMmol} mmol/L`
    : `> ${settings.hyperThresholdMgdl} mg/dL`;

  const currentAutoLock = AUTO_LOCK_OPTIONS.find(o => o.value === settings.autoLockTimeout)?.label || "Immediately";

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.handleBar} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.doneBtn}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ABOUT & SUPPORT */}
        <SectionHeader title="About & Support" />
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => Linking.openURL("https://rapidpaceai.cc/glucotrack-privacy")}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + "22" }]}>
              <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => Linking.openURL("https://rapidpaceai.cc/glucotrack-support")}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + "22" }]}>
              <Ionicons name="help-circle-outline" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Support</Text>
            <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* UNITS */}
        <SectionHeader title="Units & Thresholds" />
        <View style={styles.card}>
          <SettingRow
            label="Units"
            right={
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitBtn, settings.unit === "mgdl" && styles.unitBtnActive]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateSetting("unit", "mgdl"); }}
                >
                  <Text style={[styles.unitText, settings.unit === "mgdl" && styles.unitTextActive]}>mg/dL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitBtn, settings.unit === "mmol" && styles.unitBtnActive]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateSetting("unit", "mmol"); }}
                >
                  <Text style={[styles.unitText, settings.unit === "mmol" && styles.unitTextActive]}>mmol/L</Text>
                </TouchableOpacity>
              </View>
            }
          />

          <View style={styles.divider} />
          <View style={styles.sliderRow}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.rowLabel}>Hypoglycemic</Text>
              <Text style={[styles.thresholdValue, { color: Colors.danger }]}>{hypoDisplayLabel}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={40}
              maximumValue={90}
              step={settings.unit === "mmol" ? 0.1 : 1}
              value={settings.unit === "mmol" ? hypoMmol : settings.hypoThresholdMgdl}
              minimumTrackTintColor={Colors.danger}
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor={Colors.danger}
              onValueChange={(v) => {
                const mgdl = settings.unit === "mmol" ? Math.round(v * 18.0182) : Math.round(v);
                updateSetting("hypoThresholdMgdl", mgdl);
              }}
            />
          </View>

          <View style={styles.divider} />
          <View style={styles.sliderRow}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.rowLabel}>Hyperglycemic</Text>
              <Text style={[styles.thresholdValue, { color: Colors.warning }]}>{hyperDisplayLabel}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={140}
              maximumValue={300}
              step={settings.unit === "mmol" ? 0.1 : 1}
              value={settings.unit === "mmol" ? hyperMmol : settings.hyperThresholdMgdl}
              minimumTrackTintColor={Colors.warning}
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor={Colors.warning}
              onValueChange={(v) => {
                const mgdl = settings.unit === "mmol" ? Math.round(v * 18.0182) : Math.round(v);
                updateSetting("hyperThresholdMgdl", mgdl);
              }}
            />
          </View>
        </View>

        {/* DISPLAY */}
        <SectionHeader title="Display" />
        <View style={styles.card}>
          <SettingRow
            label="Show Bolus Insulin"
            right={<Switch value={settings.showBolus} onValueChange={handleBoolToggle("showBolus")} trackColor={{ true: Colors.primary }} />}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Show Basal Insulin"
            right={<Switch value={settings.showBasal} onValueChange={handleBoolToggle("showBasal")} trackColor={{ true: Colors.primary }} />}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Show Medications"
            right={<Switch value={settings.showMedications} onValueChange={handleBoolToggle("showMedications")} trackColor={{ true: Colors.primary }} />}
          />
        </View>

        {/* TRACKING */}
        <SectionHeader title="Tracking" />
        <View style={styles.card}>
          <SettingRow
            label="Finger Tracker"
            desc="Count daily finger-stick checks"
            right={<Switch value={settings.fingerTracker} onValueChange={handleBoolToggle("fingerTracker")} trackColor={{ true: Colors.primary }} />}
          />
        </View>

        {/* REMINDERS */}
        <SectionHeader title="Reminders" />
        <View style={styles.card}>
          <SettingRow
            label="Glucose Reminders"
            desc="Get reminded to check your glucose"
            right={<Switch value={settings.reminderEnabled} onValueChange={handleBoolToggle("reminderEnabled")} trackColor={{ true: Colors.primary }} />}
          />
          {settings.reminderEnabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.reminderTimes}>
                <Text style={styles.subLabel}>Reminder Times</Text>
                {settings.reminderTimes.map((t, i) => (
                  <View key={i} style={styles.reminderTimeRow}>
                    <Ionicons name="alarm" size={14} color={Colors.primary} />
                    <Text style={styles.reminderTimeText}>{t}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newTimes = settings.reminderTimes.filter((_, idx) => idx !== i);
                        updateSetting("reminderTimes", newTimes);
                      }}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="close" size={14} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addReminderBtn}
                  onPress={() => {
                    const suggestions = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "23:00"];
                    const unused = suggestions.filter(s => !settings.reminderTimes.includes(s));
                    if (unused.length > 0) {
                      updateSetting("reminderTimes", [...settings.reminderTimes, unused[0]]);
                    }
                  }}
                >
                  <Ionicons name="add" size={14} color={Colors.primary} />
                  <Text style={styles.addReminderText}>Add reminder time</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* BACKUP & SYNC */}
        <SectionHeader title="Backup & Sync" />
        <View style={styles.card}>
          <SettingRow
            label="Backup / Sync to iCloud"
            desc="Sync data across all your Apple devices"
            right={<Switch value={settings.backupEnabled} onValueChange={handleBoolToggle("backupEnabled")} trackColor={{ true: Colors.primary }} />}
          />
          {settings.backupEnabled && (
            <View style={styles.backupNote}>
              <Ionicons name="information-circle" size={14} color={Colors.textMuted} />
              <Text style={styles.backupNoteText}>
                This will backup and sync your data across all devices signed into the same iCloud account.
              </Text>
            </View>
          )}
          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleExport} disabled={exporting}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + "22" }]}>
              <Ionicons name="download-outline" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>{exporting ? "Exporting..." : "Export Data"}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={handleImport}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.success + "22" }]}>
              <Ionicons name="cloud-upload-outline" size={16} color={Colors.success} />
            </View>
            <Text style={styles.actionText}>Import / Restore</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* MEDICATIONS */}
        <SectionHeader title="Management" />
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => { router.back(); setTimeout(() => router.push("/manage-medications"), 300); }}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + "22" }]}>
              <MaterialCommunityIcons name="pill" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Medications</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* DANGER ZONE */}
        <SectionHeader title="Data" />
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleClearData}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.danger + "22" }]}>
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            </View>
            <Text style={[styles.actionText, { color: Colors.danger }]}>Clear All Data</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
          <Text style={styles.securityBadgeText}>
            Your health data is encrypted and stored securely
          </Text>
        </View>

        <Text style={styles.version}>GlucoTrack v1.0.0</Text>
      </ScrollView>

      <PasswordModal
        visible={showPasswordModal}
        title="Encrypt Export"
        message="Enter a password to encrypt your health data backup. You will need this password to restore."
        onSubmit={performExport}
        onCancel={() => setShowPasswordModal(false)}
      />
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
  backBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  backText: { fontSize: 15, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  title: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.text },
  doneBtn: { paddingHorizontal: 4 },
  doneText: { fontSize: 15, color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  rowDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 16,
  },
  unitToggle: { flexDirection: "row", gap: 4 },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
  unitBtnActive: {
    backgroundColor: Colors.primary + "22",
    borderColor: Colors.primary + "66",
  },
  unitText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  unitTextActive: { color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  sliderRow: { paddingHorizontal: 16, paddingVertical: 12 },
  sliderLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  thresholdValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  slider: { width: "100%", height: 36 },
  subLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  autoLockSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  autoLockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  autoLockText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  autoLockTextActive: {
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  reminderTimes: { paddingHorizontal: 16, paddingBottom: 12 },
  reminderTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  reminderTimeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  addReminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  addReminderText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  backupNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backupNoteText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  actionIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
    padding: 12,
    backgroundColor: Colors.primary + "10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "22",
  },
  securityBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.primary,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 12,
  },
});
