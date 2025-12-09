import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  rounds,
  tablePlayers,
  actions,
  games,
  hands,
  communityCards,
  bettingSubRounds,
  users,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PokerEngine, GameState, Player } from "../../poker/utils/pokerEngine";

export async function POST(request: NextRequest) {
  try {
    const { roundId, userId, action, amount } = await request.json();

    if (!roundId || !userId || !action) {
      return NextResponse.json(
        { error: "Round ID, User ID, and action are required" },
        { status: 400 }
      );
    }

    // Get the round
    const roundData = await db
      .select()
      .from(rounds)
      .where(eq(rounds.id, roundId))
      .limit(1);

    if (roundData.length === 0) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    const round = roundData[0];

    // Get the game
    const gameData = await db
      .select()
      .from(games)
      .where(eq(games.id, round.gameId))
      .limit(1);

    if (gameData.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const game = gameData[0];

    // Get all players
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
        and(
          eq(tablePlayers.tableId, game.tableId),
          eq(tablePlayers.isActive, true)
        )
      )
      .orderBy(tablePlayers.seatNumber);

    // Get player hands
    const handsData = await db
      .select()
      .from(hands)
      .where(eq(hands.roundId, roundId));

    // Get community cards
    const communityCardsData = await db
      .select()
      .from(communityCards)
      .where(eq(communityCards.roundId, roundId))
      .limit(1);

    // Get current betting sub-round
    const subRoundData = await db
      .select()
      .from(bettingSubRounds)
      .where(
        and(
          eq(bettingSubRounds.roundId, roundId),
          eq(bettingSubRounds.isComplete, false)
        )
      )
      .orderBy(bettingSubRounds.createdAt)
      .limit(1);

    // Build game state
    const gameState: GameState = {
      gameId: game.id,
      roundId: round.id,
      tableId: game.tableId,
      phase: round.phase as any,
      pot: round.pot,
      currentBet: round.currentBet,
      currentPlayer: round.currentPlayer || "",
      smallBlind: round.smallBlind,
      bigBlind: round.bigBlind,
      players: playersData.map((p) => ({
        id: p.id,
        userId: p.userId,
        seatNumber: p.seatNumber,
        stack: p.stack,
        currentBet: 0, // Will be updated from actions
        totalBet: 0, // Will be updated from actions
        isFolded: false, // Will be updated from hands
        isActive: p.isActive,
        username: p.username || "",
        cards: [], // Will be loaded from hands
      })),
      communityCards:
        communityCardsData.length > 0
          ? JSON.parse(communityCardsData[0].cards)
          : [],
      deck: [], // Will be reconstructed
      subRoundNumber:
        subRoundData.length > 0 ? subRoundData[0].subRoundNumber : 1,
      playersActed:
        subRoundData.length > 0 ? JSON.parse(subRoundData[0].playersActed) : [],
    };

    // Load player hands
    for (const hand of handsData) {
      const player = gameState.players.find((p) => p.userId === hand.userId);
      if (player) {
        player.cards = JSON.parse(hand.cards);
        player.isFolded = hand.isFolded;
      }
    }

    // Create poker engine
    const engine = new PokerEngine(gameState);

    // Process the action
    const result = engine.processAction(userId, action as any, amount);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Record the action
    await db.insert(actions).values({
      roundId: roundId,
      userId: userId,
      actionType: action,
      amount: amount || 0,
      phase: round.phase,
    });

    // Update player in database
    const player = result.newGameState.players.find((p) => p.userId === userId);
    if (player) {
      await db
        .update(tablePlayers)
        .set({
          stack: player.stack,
        })
        .where(eq(tablePlayers.userId, userId));

      // Update hand if folded
      if (action === "fold") {
        await db
          .update(hands)
          .set({ isFolded: true })
          .where(and(eq(hands.roundId, roundId), eq(hands.userId, userId)));
      }
    }

    // Update round
    await db
      .update(rounds)
      .set({
        pot: result.newGameState.pot,
        currentBet: result.newGameState.currentBet,
        currentPlayer: result.newGameState.currentPlayer,
        phase: result.newGameState.phase,
      })
      .where(eq(rounds.id, roundId));

    // Update or create betting sub-round
    if (subRoundData.length > 0) {
      await db
        .update(bettingSubRounds)
        .set({
          currentBet: result.newGameState.currentBet,
          playersActed: JSON.stringify(result.newGameState.playersActed),
          isComplete: result.subRoundComplete,
        })
        .where(eq(bettingSubRounds.id, subRoundData[0].id));
    } else {
      await db.insert(bettingSubRounds).values({
        roundId: roundId,
        phase: result.newGameState.phase,
        subRoundNumber: result.newGameState.subRoundNumber,
        currentBet: result.newGameState.currentBet,
        playersActed: JSON.stringify(result.newGameState.playersActed),
        isComplete: result.subRoundComplete,
      });
    }

    return NextResponse.json({
      success: true,
      gameState: result.newGameState,
      subRoundComplete: result.subRoundComplete,
      phaseComplete: result.phaseComplete,
    });
  } catch (error) {
    console.error("Error processing game action:", error);
    return NextResponse.json(
      { error: "Failed to process game action" },
      { status: 500 }
    );
  }
}
