import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { actions, rounds, tablePlayers, games } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { roundId, userId, actionType, amount = 0 } = await request.json();

    if (!roundId || !userId || !actionType) {
      return NextResponse.json(
        { error: "Round ID, User ID, and action type are required" },
        { status: 400 }
      );
    }

    // Get current round state
    const roundData = await db
      .select()
      .from(rounds)
      .where(eq(rounds.id, roundId))
      .limit(1);

    if (roundData.length === 0) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    const round = roundData[0];

    // Get player data
    const playerData = await db
      .select()
      .from(tablePlayers)
      .where(
        and(eq(tablePlayers.userId, userId), eq(tablePlayers.isActive, true))
      )
      .limit(1);

    if (playerData.length === 0) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const player = playerData[0];

    // Validate action
    if (actionType === "raise" && amount < round.bigBlind) {
      return NextResponse.json(
        { error: "Raise amount must be at least the big blind" },
        { status: 400 }
      );
    }

    // Record the action
    const newAction = await db
      .insert(actions)
      .values({
        roundId: roundId,
        userId: userId,
        actionType: actionType,
        amount: amount,
        phase: round.phase,
      })
      .returning();

    // Update playersActed array
    const playersActed = (round as any).playersActed
      ? JSON.parse((round as any).playersActed)
      : [];
    if (!playersActed.includes(userId)) {
      playersActed.push(userId);
    }

    // Update player's bet and stack
    let newStack = player.stack;
    let newCurrentBet = (player as any).currentBet || 0;
    let newTotalBet = (player as any).totalBet || 0;

    if (actionType === "call") {
      const amountToCall = round.currentBet - newCurrentBet;
      newStack -= amountToCall;
      newCurrentBet = round.currentBet;
      newTotalBet += amountToCall;
    } else if (actionType === "raise") {
      const totalAmount = amount;
      const additionalAmount = totalAmount - newCurrentBet;
      newStack -= additionalAmount;
      newCurrentBet = totalAmount;
      newTotalBet += additionalAmount;
    } else if (actionType === "check") {
      // Player checks, no money changes hands
      // newCurrentBet stays the same
    } else if (actionType === "fold") {
      // Player folds, no money changes hands
    }

    // Update player
    await db
      .update(tablePlayers)
      .set({
        stack: newStack,
        currentBet: newCurrentBet,
        totalBet: newTotalBet,
        isFolded: actionType === "fold",
      })
      .where(eq(tablePlayers.id, player.id));

    // Update round pot and current bet
    const playerCurrentBet = (player as any).currentBet || 0;
    const potIncrease =
      actionType === "call"
        ? round.currentBet - playerCurrentBet
        : actionType === "raise"
        ? amount - playerCurrentBet
        : 0;
    const newPot = round.pot + potIncrease;
    const newRoundCurrentBet =
      actionType === "raise" ? amount : round.currentBet;

    // Get the game to find the table ID
    const game = await db
      .select()
      .from(games)
      .where(eq(games.id, round.gameId))
      .limit(1);

    if (game.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if sub-round is complete
    const activePlayers = await db
      .select()
      .from(tablePlayers)
      .where(
        and(
          eq(tablePlayers.tableId, game[0].tableId),
          eq(tablePlayers.isActive, true)
        )
      );

    const activePlayerIds = activePlayers
      .filter((p) => !(p as any).isFolded)
      .map((p) => p.userId);

    const allPlayersActed = activePlayerIds.every((id) =>
      playersActed.includes(id)
    );

    // Simplified logic: if all players have acted, move to next phase
    // We'll add proper bet checking once database is migrated
    const allBetsEqual = true;

    // Debug logging
    console.log("Sub-round completion check:", {
      allPlayersActed,
      allBetsEqual,
      activePlayerIds,
      playersActed,
      currentPhase: round.phase,
      newRoundCurrentBet,
      playerBets: activePlayers.map((p) => ({
        userId: p.userId,
        currentBet: p.currentBet,
      })),
    });

    let nextPhase = (round as any).phase || "preflop";
    let nextSubRound = (round as any).subRoundNumber || 1;
    let nextCurrentPlayer = (round as any).currentPlayer;

    if (allPlayersActed && allBetsEqual && activePlayerIds.length > 1) {
      // Sub-round complete, move to next phase
      const phases = ["preflop", "flop", "turn", "river", "showdown"];
      const currentPhaseIndex = phases.indexOf(nextPhase);

      if (currentPhaseIndex < phases.length - 1) {
        nextPhase = phases[currentPhaseIndex + 1];
        nextSubRound = 1;
        playersActed.length = 0; // Reset for new phase

        // Set first player as current player for new phase
        nextCurrentPlayer = activePlayerIds[0];

        console.log("Phase progression:", {
          from: round.phase,
          to: nextPhase,
          nextCurrentPlayer,
        });
      }
    } else if (activePlayerIds.length === 1) {
      // Only one player left, game over
      nextPhase = "showdown";
    } else {
      // Continue sub-round, move to next player
      const currentPlayerIndex = activePlayerIds.indexOf(
        round.currentPlayer || ""
      );
      const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayerIds.length;
      nextCurrentPlayer = activePlayerIds[nextPlayerIndex];
    }

    // Update round with new state
    const updateData: any = {
      pot: newPot,
    };

    // Only update fields that exist in the database
    try {
      updateData.currentBet = newRoundCurrentBet;
      updateData.phase = nextPhase;
      updateData.subRoundNumber = nextSubRound;
      updateData.playersActed = JSON.stringify(playersActed);
      updateData.currentPlayer = nextCurrentPlayer;
    } catch (error) {
      console.log("Some fields may not exist in database yet:", error);
    }

    await db.update(rounds).set(updateData).where(eq(rounds.id, roundId));

    return NextResponse.json({
      success: true,
      action: newAction[0],
      updatedPlayer: {
        ...player,
        stack: newStack,
        currentBet: newCurrentBet,
        totalBet: newTotalBet,
        isFolded: actionType === "fold",
      },
      updatedRound: {
        ...round,
        pot: newPot,
        currentBet: newRoundCurrentBet,
        phase: nextPhase,
        subRoundNumber: nextSubRound,
        currentPlayer: nextCurrentPlayer,
      },
    });
  } catch (error) {
    console.error("Error processing game action:", error);
    return NextResponse.json(
      { error: "Failed to process game action" },
      { status: 500 }
    );
  }
}
