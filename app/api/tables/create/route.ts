import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tables, tablePlayers, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create a new table
    const newTable = await db
      .insert(tables)
      .values({
        status: "waiting",
      })
      .returning();

    const createdTable = newTable[0];

    // Auto-join creator as the first player (seat 1)
    await db.insert(tablePlayers).values({
      tableId: createdTable.id,
      userId,
      seatNumber: 1,
      stack: 1000,
      isActive: true,
    });

    // Load players for the created table (active only)
    const players = await db
      .select({
        id: tablePlayers.id,
        userId: tablePlayers.userId,
        seatNumber: tablePlayers.seatNumber,
        stack: tablePlayers.stack,
        isActive: tablePlayers.isActive,
        joinedAt: tablePlayers.joinedAt,
        username: users.username,
      })
      .from(tablePlayers)
      .leftJoin(users, eq(tablePlayers.userId, users.id))
      .where(eq(tablePlayers.tableId, createdTable.id));

    const response = {
      success: true,
      table: {
        id: createdTable.id,
        status: createdTable.status,
        createdAt: createdTable.createdAt,
        players,
      },
    };

    console.log("Created table response:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 }
    );
  }
}
