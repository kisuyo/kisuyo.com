import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rounds } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { roundId, currentPlayer } = await request.json();

    if (!roundId || !currentPlayer) {
      return NextResponse.json(
        { error: "Round ID and current player are required" },
        { status: 400 }
      );
    }

    // Update the round with the new current player
    await db
      .update(rounds)
      .set({
        currentPlayer: currentPlayer,
      })
      .where(eq(rounds.id, roundId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating current player:", error);
    return NextResponse.json(
      { error: "Failed to update current player" },
      { status: 500 }
    );
  }
}







