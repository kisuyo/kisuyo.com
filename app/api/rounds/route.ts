import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rounds } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const {
      gameId,
      roundNumber,
      pot = 0,
      currentBet = 0,
      currentPlayer,
      phase = "preflop",
      communityCards,
      smallBlind = 10,
      bigBlind = 20,
    } = await request.json();

    if (!gameId || !roundNumber) {
      return NextResponse.json(
        { error: "Game ID and round number are required" },
        { status: 400 }
      );
    }

    // Create a new round
    const newRound = await db
      .insert(rounds)
      .values({
        gameId: gameId,
        roundNumber: roundNumber,
        pot: pot,
        currentBet: currentBet,
        currentPlayer: currentPlayer,
        phase: phase,
        communityCards: communityCards,
        smallBlind: smallBlind,
        bigBlind: bigBlind,
      })
      .returning();

    return NextResponse.json({
      success: true,
      round: newRound[0],
    });
  } catch (error) {
    console.error("Error creating round:", error);
    return NextResponse.json(
      { error: "Failed to create round" },
      { status: 500 }
    );
  }
}







