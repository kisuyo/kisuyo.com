import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyEntries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const TASKS = [
  "macWork1h",
  "gameWork2h",
  "gym",
  "boxing",
  "meditate",
  "cleanFoods",
  "proteinGoal",
  "noSugar",
  "potassium",
  "wakeUpOnTime",
  "sleepOnTime",
  "shower",
  "skincare",
  "takeTrashOut",
] as const;

function calculateScore(entry: Record<string, boolean | unknown>): number {
  return TASKS.reduce((acc, task) => acc + (entry[task] === true ? 1 : 0), 0);
}

// GET - Fetch all entries or specific date
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");

  try {
    if (date) {
      const entry = await db
        .select()
        .from(dailyEntries)
        .where(eq(dailyEntries.date, date));
      return NextResponse.json(entry[0] || null);
    }

    const entries = await db
      .select()
      .from(dailyEntries)
      .orderBy(desc(dailyEntries.date));
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching entries:", error);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

// POST - Create or update entry for a date
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, ...tasks } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const score = calculateScore(tasks);

    // Check if entry exists
    const existing = await db
      .select()
      .from(dailyEntries)
      .where(eq(dailyEntries.date, date));

    if (existing.length > 0) {
      // Update existing
      const updated = await db
        .update(dailyEntries)
        .set({
          ...tasks,
          score,
          updatedAt: new Date(),
        })
        .where(eq(dailyEntries.date, date))
        .returning();
      return NextResponse.json(updated[0]);
    }

    // Create new
    const created = await db
      .insert(dailyEntries)
      .values({
        date,
        ...tasks,
        score,
      })
      .returning();

    return NextResponse.json(created[0]);
  } catch (error) {
    console.error("Error saving entry:", error);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}
