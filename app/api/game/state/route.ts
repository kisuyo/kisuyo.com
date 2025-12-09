import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { games, rounds, tablePlayers, users, actions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

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
        joinedAt: tablePlayers.joinedAt,
        currentBet: tablePlayers.currentBet,
        totalBet: tablePlayers.totalBet,
        isFolded: tablePlayers.isFolded,
        username: users.username,
      })
      .from(tablePlayers)
      .leftJoin(users, eq(tablePlayers.userId, users.id))
      .where(
        and(eq(tablePlayers.tableId, tableId), eq(tablePlayers.isActive, true))
      )
      .orderBy(tablePlayers.seatNumber);

    // Get player hands (cards)
    const handsData = await db
      .select()
      .from(actions)
      .where(eq(actions.roundId, round.id))
      .orderBy(actions.createdAt);

    // Parse community cards
    let communityCards = [];
    if (round.communityCards) {
      try {
        communityCards = JSON.parse(round.communityCards);
      } catch (error) {
        console.error("Error parsing community cards:", error);
      }
    }

    const gameState = {
      gameId: game.id,
      roundId: round.id,
      tableId: tableId,
      pot: round.pot,
      currentBet: round.currentBet,
      currentPlayer: round.currentPlayer,
      phase: round.phase,
      communityCards: communityCards,
      smallBlind: round.smallBlind,
      bigBlind: round.bigBlind,
      players: playersData.map((player) => ({
        ...player,
        cards: [], // Cards will be loaded separately for security
      })),
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

export async function POST(request: NextRequest) {
  try {
    const {
      tableId,
      gameId,
      roundId,
      pot,
      currentBet,
      currentPlayer,
      phase,
      communityCards,
      smallBlind,
      bigBlind,
      players,
    } = await request.json();

    if (!tableId || !gameId || !roundId) {
      return NextResponse.json(
        { error: "Table ID, Game ID, and Round ID are required" },
        { status: 400 }
      );
    }

    // Update the round with game state
    await db
      .update(rounds)
      .set({
        pot: pot || 0,
        currentBet: currentBet || 0,
        currentPlayer: currentPlayer,
        phase: phase || "preflop",
        communityCards: communityCards ? JSON.stringify(communityCards) : null,
        smallBlind: smallBlind || 10,
        bigBlind: bigBlind || 20,
      })
      .where(eq(rounds.id, roundId));

    // Update players
    if (players && players.length > 0) {
      for (const player of players) {
        await db
          .update(tablePlayers)
          .set({
            stack: player.stack,
            currentBet: player.currentBet || 0,
            totalBet: player.totalBet || 0,
            isFolded: player.isFolded || false,
          })
          .where(eq(tablePlayers.id, player.id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving game state:", error);
    return NextResponse.json(
      { error: "Failed to save game state" },
      { status: 500 }
    );
  }
}
