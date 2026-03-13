import { pgTable, serial, real, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const glucoseReadingsTable = pgTable("glucose_readings", {
  id: serial("id").primaryKey(),
  value: real("value").notNull(),
  unit: text("unit", { enum: ["mgdl", "mmol"] }).notNull().default("mgdl"),
  context: text("context", { enum: ["fasting", "before_meal", "after_meal", "bedtime", "random"] }),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const medicationsTable = pgTable("medications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dosage: text("dosage"),
  frequency: text("frequency"),
  color: text("color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const medicationLogsTable = pgTable("medication_logs", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull().references(() => medicationsTable.id, { onDelete: "cascade" }),
  notes: text("notes"),
  takenAt: timestamp("taken_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mealsTable = pgTable("meals", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  mealType: text("meal_type", { enum: ["breakfast", "lunch", "dinner", "snack", "other"] }),
  carbsGrams: real("carbs_grams"),
  notes: text("notes"),
  eatenAt: timestamp("eaten_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGlucoseReadingSchema = createInsertSchema(glucoseReadingsTable).omit({ id: true, createdAt: true });
export const insertMedicationSchema = createInsertSchema(medicationsTable).omit({ id: true, createdAt: true });
export const insertMedicationLogSchema = createInsertSchema(medicationLogsTable).omit({ id: true, createdAt: true });
export const insertMealSchema = createInsertSchema(mealsTable).omit({ id: true, createdAt: true });

export type GlucoseReading = typeof glucoseReadingsTable.$inferSelect;
export type InsertGlucoseReading = z.infer<typeof insertGlucoseReadingSchema>;
export type Medication = typeof medicationsTable.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type MedicationLog = typeof medicationLogsTable.$inferSelect;
export type InsertMedicationLog = z.infer<typeof insertMedicationLogSchema>;
export type Meal = typeof mealsTable.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
