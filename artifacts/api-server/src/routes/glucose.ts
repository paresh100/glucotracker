import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  glucoseReadingsTable,
  insertGlucoseReadingSchema,
  medicationsTable,
  insertMedicationSchema,
  medicationLogsTable,
  insertMedicationLogSchema,
  mealsTable,
  insertMealSchema,
} from "@workspace/db/schema";
import { eq, gte, desc, sql } from "drizzle-orm";
import { z } from "zod/v4";

const router: IRouter = Router();

function getPeriodDate(period?: string): Date | null {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "year":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

// Glucose readings
router.get("/glucose", async (req, res) => {
  try {
    const period = req.query.period as string | undefined;
    const since = getPeriodDate(period);
    let query = db.select().from(glucoseReadingsTable).orderBy(desc(glucoseReadingsTable.recordedAt));
    const results = since
      ? await db.select().from(glucoseReadingsTable).where(gte(glucoseReadingsTable.recordedAt, since)).orderBy(desc(glucoseReadingsTable.recordedAt))
      : await db.select().from(glucoseReadingsTable).orderBy(desc(glucoseReadingsTable.recordedAt));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch glucose readings" });
  }
});

router.post("/glucose", async (req, res) => {
  try {
    const data = insertGlucoseReadingSchema.parse({
      ...req.body,
      recordedAt: new Date(req.body.recordedAt),
    });
    const [result] = await db.insert(glucoseReadingsTable).values(data).returning();
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/glucose/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(glucoseReadingsTable).where(eq(glucoseReadingsTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

// Stats
router.get("/stats", async (req, res) => {
  try {
    const period = req.query.period as string | undefined;
    const since = getPeriodDate(period);
    const readings = since
      ? await db.select().from(glucoseReadingsTable).where(gte(glucoseReadingsTable.recordedAt, since))
      : await db.select().from(glucoseReadingsTable);

    const LOW_THRESHOLD = 70;
    const HIGH_THRESHOLD = 180;

    if (readings.length === 0) {
      res.json({
        average: null, min: null, max: null,
        lowCount: 0, highCount: 0, inRangeCount: 0,
        totalReadings: 0, timeInRange: 0, hba1cEstimate: null,
      });
      return;
    }

    // Convert mmol readings to mgdl for stats
    const values = readings.map(r => r.unit === "mmol" ? r.value * 18.0182 : r.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const lowCount = values.filter(v => v < LOW_THRESHOLD).length;
    const highCount = values.filter(v => v > HIGH_THRESHOLD).length;
    const inRangeCount = values.filter(v => v >= LOW_THRESHOLD && v <= HIGH_THRESHOLD).length;
    const timeInRange = (inRangeCount / values.length) * 100;
    // Estimated HbA1c = (average glucose + 46.7) / 28.7
    const hba1cEstimate = (average + 46.7) / 28.7;

    res.json({
      average: Math.round(average),
      min: Math.round(min),
      max: Math.round(max),
      lowCount,
      highCount,
      inRangeCount,
      totalReadings: readings.length,
      timeInRange: Math.round(timeInRange),
      hba1cEstimate: Math.round(hba1cEstimate * 10) / 10,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Medications
router.get("/medications", async (req, res) => {
  try {
    const results = await db.select().from(medicationsTable).orderBy(desc(medicationsTable.createdAt));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
});

router.post("/medications", async (req, res) => {
  try {
    const data = insertMedicationSchema.parse(req.body);
    const [result] = await db.insert(medicationsTable).values(data).returning();
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/medications/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(medicationsTable).where(eq(medicationsTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

// Medication logs
router.get("/medication-logs", async (req, res) => {
  try {
    const period = req.query.period as string | undefined;
    const since = getPeriodDate(period);
    const logs = since
      ? await db.select({
          id: medicationLogsTable.id,
          medicationId: medicationLogsTable.medicationId,
          medicationName: medicationsTable.name,
          dosage: medicationsTable.dosage,
          notes: medicationLogsTable.notes,
          takenAt: medicationLogsTable.takenAt,
          createdAt: medicationLogsTable.createdAt,
        })
          .from(medicationLogsTable)
          .leftJoin(medicationsTable, eq(medicationLogsTable.medicationId, medicationsTable.id))
          .where(gte(medicationLogsTable.takenAt, since))
          .orderBy(desc(medicationLogsTable.takenAt))
      : await db.select({
          id: medicationLogsTable.id,
          medicationId: medicationLogsTable.medicationId,
          medicationName: medicationsTable.name,
          dosage: medicationsTable.dosage,
          notes: medicationLogsTable.notes,
          takenAt: medicationLogsTable.takenAt,
          createdAt: medicationLogsTable.createdAt,
        })
          .from(medicationLogsTable)
          .leftJoin(medicationsTable, eq(medicationLogsTable.medicationId, medicationsTable.id))
          .orderBy(desc(medicationLogsTable.takenAt));
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch medication logs" });
  }
});

router.post("/medication-logs", async (req, res) => {
  try {
    const data = insertMedicationLogSchema.parse({
      ...req.body,
      takenAt: new Date(req.body.takenAt),
    });
    const [log] = await db.insert(medicationLogsTable).values(data).returning();
    const [med] = await db.select().from(medicationsTable).where(eq(medicationsTable.id, data.medicationId));
    res.status(201).json({
      ...log,
      medicationName: med?.name ?? "Unknown",
      dosage: med?.dosage ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

// Meals
router.get("/meals", async (req, res) => {
  try {
    const period = req.query.period as string | undefined;
    const since = getPeriodDate(period);
    const results = since
      ? await db.select().from(mealsTable).where(gte(mealsTable.eatenAt, since)).orderBy(desc(mealsTable.eatenAt))
      : await db.select().from(mealsTable).orderBy(desc(mealsTable.eatenAt));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch meals" });
  }
});

router.post("/meals", async (req, res) => {
  try {
    const data = insertMealSchema.parse({
      ...req.body,
      eatenAt: new Date(req.body.eatenAt),
    });
    const [result] = await db.insert(mealsTable).values(data).returning();
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/meals/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(mealsTable).where(eq(mealsTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
