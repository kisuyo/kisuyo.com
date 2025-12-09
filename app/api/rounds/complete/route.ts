import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rounds, tablePlayers, games } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { roundId, winnerId } = await request.json();

    if (!roundId || !winnerId) {
      return NextResponse.json(
        { error: "Round ID and winner ID are required" },
        { status: 400 }
      );
    }

    // Get the round to find the table
    const round = await db
      .select()
      .from(rounds)
      .where(eq(rounds.id, roundId))
      .limit(1);

    if (round.length === 0) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    // Get the game to find the table ID
    const game = await db
      .select()
      .from(games)
      .where(eq(games.id, round[0].gameId))
      .limit(1);

    if (game.length === 0) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    const tableId = game[0].tableId;

    // Update round status
    await db
      .update(rounds)
      .set({
        status: "ended",
        finishedAt: new Date(),
      })
      .where(eq(rounds.id, roundId));

    // Award pot to winner
    const winner = await db
      .select()
      .from(tablePlayers)
      .where(
        and(
          eq(tablePlayers.tableId, tableId),
          eq(tablePlayers.userId, winnerId)
        )
      )
      .limit(1);

    if (winner.length > 0) {
      const newStack = winner[0].stack + round[0].pot;
      await db
        .update(tablePlayers)
        .set({ stack: newStack })
        .where(eq(tablePlayers.id, winner[0].id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing round:", error);
    return NextResponse.json(
      { error: "Failed to complete round" },
      { status: 500 }
    );
  }
}
