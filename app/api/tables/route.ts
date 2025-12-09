import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tables, tablePlayers, users } from "@/db/schema";
import { eq, and, count, isNull } from "drizzle-orm";

export async function GET() {
  try {
    // Get all tables with nested active players (including tables with 0 players)
    const rows = await db
      .select({
        tableId: tables.id,
        status: tables.status,
        createdAt: tables.createdAt,
        playerId: tablePlayers.id,
        playerUserId: tablePlayers.userId,
        seatNumber: tablePlayers.seatNumber,
        stack: tablePlayers.stack,
        isActive: tablePlayers.isActive,
        joinedAt: tablePlayers.joinedAt,
        username: users.username,
      })
      .from(tables)
      .leftJoin(tablePlayers, eq(tables.id, tablePlayers.tableId))
      .leftJoin(users, eq(tablePlayers.userId, users.id));

    // Group rows by table
    const tableMap = new Map<string, any>();
    for (const r of rows) {
      if (!tableMap.has(r.tableId)) {
        tableMap.set(r.tableId, {
          id: r.tableId,
          status: r.status,
          createdAt: r.createdAt,
          players: [] as any[],
        });
      }
      if (r.playerId && r.isActive) {
        tableMap.get(r.tableId).players.push({
          id: r.playerId,
          userId: r.playerUserId,
          seatNumber: r.seatNumber,
          stack: r.stack,
          isActive: r.isActive,
          joinedAt: r.joinedAt,
          username: r.username,
        });
      }
    }

    const tablesWithPlayers = Array.from(tableMap.values());
    console.log("Fetched tables:", tablesWithPlayers);
    return NextResponse.json({ tables: tablesWithPlayers });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, tableId } = await request.json();

    if (!userId || !tableId) {
      return NextResponse.json(
        { error: "User ID and Table ID are required" },
        { status: 400 }
      );
    }

    // Check if user is already at a table
    const existingPlayer = await db
      .select()
      .from(tablePlayers)
      .where(
        and(eq(tablePlayers.userId, userId), eq(tablePlayers.isActive, true))
      )
      .limit(1);

    if (existingPlayer.length > 0) {
      return NextResponse.json(
        { error: "User is already at a table" },
        { status: 400 }
      );
    }

    // Check if table exists and get current player count
    const tableData = await db
      .select({
        id: tables.id,
        status: tables.status,
        playerCount: count(tablePlayers.id),
      })
      .from(tables)
      .leftJoin(tablePlayers, eq(tables.id, tablePlayers.tableId))
      .where(and(eq(tables.id, tableId), eq(tablePlayers.isActive, true)))
      .groupBy(tables.id, tables.status);

    if (tableData.length === 0) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const table = tableData[0];

    // Check if table is full (max 3 players)
    if (table.playerCount >= 3) {
      return NextResponse.json({ error: "Table is full" }, { status: 400 });
    }

    // Check if table is in waiting status
    if (table.status !== "waiting") {
      return NextResponse.json(
        { error: "Table is not accepting new players" },
        { status: 400 }
      );
    }

    // Get the next available seat number
    const occupiedSeats = await db
      .select({ seatNumber: tablePlayers.seatNumber })
      .from(tablePlayers)
      .where(
        and(eq(tablePlayers.tableId, tableId), eq(tablePlayers.isActive, true))
      );

    const occupiedSeatNumbers = occupiedSeats.map((p) => p.seatNumber);
    let seatNumber = 1;
    while (occupiedSeatNumbers.includes(seatNumber)) {
      seatNumber++;
    }

    // Add player to table
    const newPlayer = await db
      .insert(tablePlayers)
      .values({
        tableId: tableId,
        userId: userId,
        seatNumber: seatNumber,
        stack: 1000, // Starting chips
        isActive: true,
      })
      .returning();

    // Get updated table info with all players (aggregate rows into players array)
    const rows = await db
      .select({
        tableId: tables.id,
        status: tables.status,
        createdAt: tables.createdAt,
        playerId: tablePlayers.id,
        playerUserId: tablePlayers.userId,
        seatNumber: tablePlayers.seatNumber,
        stack: tablePlayers.stack,
        isActive: tablePlayers.isActive,
        joinedAt: tablePlayers.joinedAt,
        username: users.username,
      })
      .from(tables)
      .leftJoin(tablePlayers, eq(tables.id, tablePlayers.tableId))
      .leftJoin(users, eq(tablePlayers.userId, users.id))
      .where(eq(tables.id, tableId))
      .orderBy(tablePlayers.seatNumber);

    const aggregated = {
      id: rows[0]?.tableId ?? tableId,
      status: rows[0]?.status ?? "waiting",
      createdAt: rows[0]?.createdAt ?? new Date().toISOString(),
      players: [] as any[],
    };
    for (const r of rows) {
      if (r.playerId && r.isActive) {
        aggregated.players.push({
          id: r.playerId,
          userId: r.playerUserId,
          seatNumber: r.seatNumber,
          stack: r.stack,
          isActive: r.isActive,
          joinedAt: r.joinedAt,
          username: r.username,
        });
      }
    }

    return NextResponse.json({
      success: true,
      player: newPlayer[0],
      table: aggregated,
    });
  } catch (error) {
    console.error("Error joining table:", error);
    return NextResponse.json(
      { error: "Failed to join table" },
      { status: 500 }
    );
  }
}
