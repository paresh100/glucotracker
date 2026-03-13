import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Unit = "mgdl" | "mmol";

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
};

const STORAGE_KEY = "@glucotrack_settings";

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
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }
      setIsLoaded(true);
    });
  }, []);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
