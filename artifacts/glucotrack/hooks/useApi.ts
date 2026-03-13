const BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export type GlucoseReading = {
  id: number;
  value: number;
  unit: "mgdl" | "mmol";
  context?: "fasting" | "before_meal" | "after_meal" | "bedtime" | "random" | null;
  notes?: string | null;
  recordedAt: string;
  createdAt: string;
};

export type Medication = {
  id: number;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  color?: string | null;
  createdAt: string;
};

export type MedicationLog = {
  id: number;
  medicationId: number;
  medicationName: string;
  dosage?: string | null;
  notes?: string | null;
  takenAt: string;
  createdAt: string;
};

export type Meal = {
  id: number;
  description: string;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack" | "other" | null;
  carbsGrams?: number | null;
  notes?: string | null;
  eatenAt: string;
  createdAt: string;
};

export type GlucoseStats = {
  average: number | null;
  min: number | null;
  max: number | null;
  lowCount: number;
  highCount: number;
  inRangeCount: number;
  totalReadings: number;
  timeInRange: number;
  hba1cEstimate: number | null;
};

export type Period = "day" | "week" | "month" | "year";

export const api = {
  // Glucose
  getGlucose: (period?: Period) =>
    apiFetch<GlucoseReading[]>(`/glucose${period ? `?period=${period}` : ""}`),
  createGlucose: (data: Omit<GlucoseReading, "id" | "createdAt">) =>
    apiFetch<GlucoseReading>("/glucose", { method: "POST", body: JSON.stringify(data) }),
  deleteGlucose: (id: number) =>
    apiFetch<void>(`/glucose/${id}`, { method: "DELETE" }),

  // Stats
  getStats: (period?: Period) =>
    apiFetch<GlucoseStats>(`/stats${period ? `?period=${period}` : ""}`),

  // Medications
  getMedications: () => apiFetch<Medication[]>("/medications"),
  createMedication: (data: Omit<Medication, "id" | "createdAt">) =>
    apiFetch<Medication>("/medications", { method: "POST", body: JSON.stringify(data) }),
  deleteMedication: (id: number) =>
    apiFetch<void>(`/medications/${id}`, { method: "DELETE" }),

  // Med logs
  getMedLogs: (period?: Period) =>
    apiFetch<MedicationLog[]>(`/medication-logs${period ? `?period=${period}` : ""}`),
  logMedication: (data: { medicationId: number; notes?: string; takenAt: string }) =>
    apiFetch<MedicationLog>("/medication-logs", { method: "POST", body: JSON.stringify(data) }),

  // Meals
  getMeals: (period?: Period) =>
    apiFetch<Meal[]>(`/meals${period ? `?period=${period}` : ""}`),
  createMeal: (data: Omit<Meal, "id" | "createdAt">) =>
    apiFetch<Meal>("/meals", { method: "POST", body: JSON.stringify(data) }),
  deleteMeal: (id: number) =>
    apiFetch<void>(`/meals/${id}`, { method: "DELETE" }),
};
