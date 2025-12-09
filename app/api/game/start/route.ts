import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  rounds,
  tablePlayers,
  games,
  hands,
  communityCards,
  bettingSubRounds,
  users,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PokerEngine, GameState } from "../../poker/utils/pokerEngine";
import { createDeck, shuffleDeck, dealCards } from "../../poker/utils/cards";

export async function POST(request: NextRequest) {
  try {
    const { tableId } = await request.json();

    if (!tableId) {
      return NextResponse.json(
        { error: "Table ID is required" },
        { status: 400 }
      );
    }

    // Get all players at the table
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

    if (playersData.length !== 2) {
      return NextResponse.json(
        { error: "Exactly 2 players required to start game" },
        { status: 400 }
      );
    }

    // First, end any existing games for this table
    await db
      .update(games)
      .set({ status: "finished", finishedAt: new Date() })
      .where(and(eq(games.tableId, tableId), eq(games.status, "ongoing")));

    // Create a new game
    const gameData = await db
      .insert(games)
      .values({
        tableId: tableId,
        status: "ongoing",
      })
      .returning();

    const game = gameData[0];

    // Create a new round
    const roundData = await db
      .insert(rounds)
      .values({
        gameId: game.id,
        roundNumber: 1,
        pot: 0,
        phase: "preflop",
        smallBlind: 10,
        bigBlind: 20,
      })
      .returning();

    const round = roundData[0];

    // Create poker engine
    const gameState: GameState = {
      gameId: game.id,
      roundId: round.id,
      tableId: tableId,
      phase: "preflop",
      pot: 0,
      currentBet: 0,
      currentPlayer: "",
      smallBlind: 10,
      bigBlind: 20,
      players: playersData.map((p) => ({
        id: p.id,
        userId: p.userId,
        seatNumber: p.seatNumber,
        stack: p.stack,
        currentBet: 0,
        totalBet: 0,
        isFolded: false,
        isActive: p.isActive,
        username: p.username || "",
        cards: [],
      })),
      communityCards: [],
      deck: [],
      subRoundNumber: 1,
      playersActed: [],
    };

    const engine = new PokerEngine(gameState);

    // Post blinds first
    const { smallBlindPlayer, bigBlindPlayer, pot } = engine.postBlinds();

    // Update players in database
    await db
      .update(tablePlayers)
      .set({
        stack: smallBlindPlayer.stack,
      })
      .where(eq(tablePlayers.id, smallBlindPlayer.id));

    await db
      .update(tablePlayers)
      .set({
        stack: bigBlindPlayer.stack,
      })
      .where(eq(tablePlayers.id, bigBlindPlayer.id));

    // Update round with blinds
    await db
      .update(rounds)
      .set({
        pot: pot,
        currentBet: 20, // Big blind amount
        currentPlayer: smallBlindPlayer.userId, // Small blind acts first
        phase: "preflop",
      })
      .where(eq(rounds.id, round.id));

    // Phase 1: Deal hole cards
    engine.dealHoleCards();
    const updatedGameState = engine.getGameState();

    console.log("Game state after dealing cards:", {
      phase: updatedGameState.phase,
      pot: updatedGameState.pot,
      currentBet: updatedGameState.currentBet,
      currentPlayer: updatedGameState.currentPlayer,
      players: updatedGameState.players.map((p) => ({
        username: p.username,
        cards: p.cards,
        stack: p.stack,
      })),
    });

    // Save player hands to database
    for (const player of updatedGameState.players) {
      if (player.cards && player.cards.length > 0) {
        await db.insert(hands).values({
          roundId: round.id,
          userId: player.userId,
          cards: JSON.stringify(player.cards),
          isFolded: false,
        });
      }
    }

    // Deal community cards
    const communityCards = engine.dealCommunityCards();

    // Save community cards to database
    await db.insert(communityCards).values({
      roundId: round.id,
      cards: JSON.stringify(communityCards),
      flopRevealed: false,
      turnRevealed: false,
      riverRevealed: false,
    });

    // Create initial betting sub-round
    await db.insert(bettingSubRounds).values({
      roundId: round.id,
      phase: "preflop",
      subRoundNumber: 1,
      currentBet: 20,
      playersActed: JSON.stringify([]),
      isComplete: false,
    });

    return NextResponse.json({
      success: true,
      gameId: game.id,
      roundId: round.id,
      gameState: updatedGameState,
    });
  } catch (error) {
    console.error("Error starting game:", error);
    return NextResponse.json(
      { error: "Failed to start game" },
      { status: 500 }
    );
  }
}
