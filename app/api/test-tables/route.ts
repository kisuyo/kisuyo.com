import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tables, tablePlayers, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Get all tables
    const allTables = await db.select().from(tables);

    // Get all table players
    const allPlayers = await db
      .select({
        tableId: tablePlayers.tableId,
        userId: tablePlayers.userId,
        seatNumber: tablePlayers.seatNumber,
        isActive: tablePlayers.isActive,
        username: users.username,
      })
      .from(tablePlayers)
      .leftJoin(users, eq(tablePlayers.userId, users.id));

    return NextResponse.json({
      tables: allTables,
      players: allPlayers,
      message: "Raw database data",
    });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch test data" },
      { status: 500 }
    );
  }
}
