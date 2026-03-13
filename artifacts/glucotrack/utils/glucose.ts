export const LOW_THRESHOLD = 70;
export const HIGH_THRESHOLD = 180;

export type GlucoseLevel = "low" | "normal" | "high";

export function getGlucoseLevel(value: number, unit: "mgdl" | "mmol"): GlucoseLevel {
  const mgdl = unit === "mmol" ? value * 18.0182 : value;
  if (mgdl < LOW_THRESHOLD) return "low";
  if (mgdl > HIGH_THRESHOLD) return "high";
  return "normal";
}

export function formatGlucose(value: number, unit: "mgdl" | "mmol"): string {
  if (unit === "mmol") return `${value.toFixed(1)} mmol/L`;
  return `${Math.round(value)} mg/dL`;
}

export function toMgdl(value: number, unit: "mgdl" | "mmol"): number {
  return unit === "mmol" ? value * 18.0182 : value;
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
}

export function getContextLabel(context: string | null | undefined): string {
  switch (context) {
    case "fasting": return "Fasting";
    case "before_meal": return "Before meal";
    case "after_meal": return "After meal";
    case "bedtime": return "Bedtime";
    case "random": return "Random";
    default: return "General";
  }
}

export function getMealTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "breakfast": return "Breakfast";
    case "lunch": return "Lunch";
    case "dinner": return "Dinner";
    case "snack": return "Snack";
    default: return "Meal";
  }
}
