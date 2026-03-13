import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export type Unit = "mgdl" | "mmol";

export type AutoLockTimeout = "immediate" | "1min" | "5min" | "15min" | "never";

export interface Settings {
  unit: Unit;
  hypoThresholdMgdl: number;
  hyperThresholdMgdl: number;
  showBolus: boolean;
  showBasal: boolean;
  showMedications: boolean;
  fingerTracker: boolean;
  backupEnabled: boolean;
  reminderEnabled: boolean;
  reminderTimes: string[];
  darkMode: boolean;
  appLockEnabled: boolean;
  autoLockTimeout: AutoLockTimeout;
  privacyAccepted: boolean;
  privacyAcceptedAt: string | null;
}

const DEFAULT: Settings = {
  unit: "mgdl",
  hypoThresholdMgdl: 70,
  hyperThresholdMgdl: 180,
  showBolus: false,
  showBasal: false,
  showMedications: true,
  fingerTracker: true,
  backupEnabled: false,
  reminderEnabled: false,
  reminderTimes: ["08:00", "12:00", "18:00", "22:00"],
  darkMode: true,
  appLockEnabled: false,
  autoLockTimeout: "immediate",
  privacyAccepted: false,
  privacyAcceptedAt: null,
};

const STORAGE_KEY = "@glucotrack_settings";
const SECURE_KEY = "glucotrack_settings_secure";

async function loadSettings(): Promise<Partial<Settings>> {
  if (Platform.OS === "web") {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return {};
  }

  try {
    const raw = await SecureStore.getItemAsync(SECURE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  try {
    const fallback = await AsyncStorage.getItem(STORAGE_KEY);
    if (fallback) {
      const parsed = JSON.parse(fallback);
      await SecureStore.setItemAsync(SECURE_KEY, fallback);
      await AsyncStorage.removeItem(STORAGE_KEY);
      return parsed;
    }
  } catch {}

  return {};
}

async function saveSettings(data: Settings): Promise<void> {
  const json = JSON.stringify(data);
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(STORAGE_KEY, json);
  } else {
    await SecureStore.setItemAsync(SECURE_KEY, json);
  }
}

interface SettingsContextValue {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  displayValue: (mgdl: number) => number;
  displayUnit: string;
  hypoThreshold: number;
  hyperThreshold: number;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((loaded) => {
      if (Object.keys(loaded).length > 0) {
        setSettings((prev) => ({ ...prev, ...loaded }));
      }
      setIsLoaded(true);
    });
  }, []);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  };

  const value = useMemo(() => {
    const isMmol = settings.unit === "mmol";
    const displayValue = (mgdl: number) =>
      isMmol ? Math.round((mgdl / 18.0182) * 10) / 10 : Math.round(mgdl);
    const displayUnit = isMmol ? "mmol/L" : "mg/dL";
    const hypoThreshold = isMmol
      ? Math.round((settings.hypoThresholdMgdl / 18.0182) * 10) / 10
      : settings.hypoThresholdMgdl;
    const hyperThreshold = isMmol
      ? Math.round((settings.hyperThresholdMgdl / 18.0182) * 10) / 10
      : settings.hyperThresholdMgdl;

    return {
      settings,
      updateSetting,
      displayValue,
      displayUnit,
      hypoThreshold,
      hyperThreshold,
      isLoaded,
    };
  }, [settings, isLoaded]);

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export function toMgdl(value: number, unit: Unit): number {
  return unit === "mmol" ? value * 18.0182 : value;
}
