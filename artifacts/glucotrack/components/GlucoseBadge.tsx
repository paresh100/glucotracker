import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import { getGlucoseLevel, formatGlucose } from "@/utils/glucose";

interface Props {
  value: number;
  unit: "mgdl" | "mmol";
  size?: "sm" | "md" | "lg";
}

export function GlucoseBadge({ value, unit, size = "md" }: Props) {
  const level = getGlucoseLevel(value, unit);

  const color =
    level === "low" ? Colors.chartLow :
    level === "high" ? Colors.chartHigh :
    Colors.chartInRange;

  const bg =
    level === "low" ? Colors.dangerLight :
    level === "high" ? Colors.warningLight :
    Colors.primaryLight;

  const sizes = {
    sm: { text: 13, padding: 4, radius: 6 },
    md: { text: 16, padding: 6, radius: 8 },
    lg: { text: 20, padding: 8, radius: 10 },
  };

  const s = sizes[size];

  return (
    <View style={[styles.badge, { backgroundColor: bg + "33", borderColor: color + "55", paddingHorizontal: s.padding + 4, paddingVertical: s.padding, borderRadius: s.radius }]}>
      <Text style={[styles.value, { color, fontSize: s.text, fontFamily: "Inter_700Bold" }]}>
        {formatGlucose(value, unit)}
      </Text>
    </View>
  );
}

export function GlucoseWarning({ level }: { level: "low" | "high" }) {
  const isLow = level === "low";
  return (
    <View style={[styles.warning, { backgroundColor: isLow ? "#FF4D4D22" : "#FF9F0A22", borderColor: isLow ? "#FF4D4D44" : "#FF9F0A44" }]}>
      <Text style={[styles.warningText, { color: isLow ? Colors.danger : Colors.warning }]}>
        {isLow ? "LOW GLUCOSE" : "HIGH GLUCOSE"}
      </Text>
      <Text style={[styles.warningDesc, { color: isLow ? Colors.danger : Colors.warning }]}>
        {isLow
          ? "Blood sugar below 70 mg/dL — take action"
          : "Blood sugar above 180 mg/dL — monitor closely"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  value: {
    fontFamily: "Inter_700Bold",
  },
  warning: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  warningText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  warningDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});
