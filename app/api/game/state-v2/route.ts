import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  games,
  rounds,
  tablePlayers,
  hands,
  communityCards,
  bettingSubRounds,
  users,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { GameState } from "../../poker/utils/pokerEngine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");
    const userId = searchParams.get("userId");

    if (!tableId || !userId) {
      return NextResponse.json(
        { error: "Table ID and User ID are required" },
        { status: 400 }
      );
    }

    // Get the current game for this table
    const gameData = await db
      .select()
      .from(games)
      .where(and(eq(games.tableId, tableId), eq(games.status, "ongoing")))
      .orderBy(desc(games.createdAt))
      .limit(1);

    if (gameData.length === 0) {
      return NextResponse.json({ gameState: null });
    }

    const game = gameData[0];

    // Get the current round for this game
    const roundData = await db
      .select()
      .from(rounds)
      .where(eq(rounds.gameId, game.id))
      .orderBy(desc(rounds.createdAt))
      .limit(1);

    if (roundData.length === 0) {
      return NextResponse.json({ gameState: null });
    }

    const round = roundData[0];

    // Get all players at this table
    const playersData = await db
      .select({
        id: tablePlayers.id,
        userId: tablePlayers.userId,
        seatNumber: tablePlayers.seatNumber,
        stack: tablePlayers.stack,
        isActive: tablePlayers.isActive,
        username: users.username,
      })
      .from(tablePlayers)
      .leftJoin(users, eq(tablePlayers.userId, users.id))
      .where(
        and(eq(tablePlayers.tableId, tableId), eq(tablePlayers.isActive, true))
      )
      .orderBy(tablePlayers.seatNumber);

    // Get player hands
    const handsData = await db
      .select()
      .from(hands)
      .where(eq(hands.roundId, round.id));

    // Get community cards
    const communityCardsData = await db
      .select()
      .from(communityCards)
      .where(eq(communityCards.roundId, round.id))
      .limit(1);

    // Get current betting sub-round
    const subRoundData = await db
      .select()
      .from(bettingSubRounds)
      .where(
        and(
          eq(bettingSubRounds.roundId, round.id),
          eq(bettingSubRounds.isComplete, false)
        )
      )
      .orderBy(bettingSubRounds.createdAt)
      .limit(1);

    // Build players with their cards and betting info
    const players = playersData.map((p) => {
      const hand = handsData.find((h) => h.userId === p.userId);
      return {
        id: p.id,
        userId: p.userId,
        seatNumber: p.seatNumber,
        stack: p.stack,
        currentBet: 0, // Will be calculated from actions
        totalBet: 0, // Will be calculated from actions
        isFolded: hand?.isFolded || false,
        isActive: p.isActive,
        username: p.username || "",
        cards: hand ? JSON.parse(hand.cards) : [],
      };
    });

    // Build game state
    const gameState: GameState = {
      gameId: game.id,
      roundId: round.id,
      tableId: tableId,
      phase: round.phase as any,
      pot: round.pot,
      currentBet: round.currentBet,
      currentPlayer: round.currentPlayer || "",
      smallBlind: round.smallBlind,
      bigBlind: round.bigBlind,
      players: players,
      communityCards:
        communityCardsData.length > 0
          ? JSON.parse(communityCardsData[0].cards)
          : [],
      deck: [], // Not needed for client
      subRoundNumber:
        subRoundData.length > 0 ? subRoundData[0].subRoundNumber : 1,
      playersActed:
        subRoundData.length > 0 ? JSON.parse(subRoundData[0].playersActed) : [],
    };

    return NextResponse.json({ gameState });
  } catch (error) {
    console.error("Error loading game state:", error);
    return NextResponse.json(
      { error: "Failed to load game state" },
      { status: 500 }
    );
  }
}
