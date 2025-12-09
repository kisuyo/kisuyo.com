import { Card } from "./cards";

export interface BettingSubRound {
  phase: "preflop" | "flop" | "turn" | "river";
  subRoundNumber: number;
  currentBet: number;
  playersActed: string[];
  isComplete: boolean;
}

export interface PlayerBettingState {
  id: string;
  userId: string;
  seatNumber: number;
  stack: number;
  currentBet: number;
  totalBet: number;
  isFolded: boolean;
  isActive: boolean;
  hasActedThisSubRound: boolean;
  username: string;
}

export interface GameBettingState {
  roundId: string;
  phase: "preflop" | "flop" | "turn" | "river" | "showdown";
  subRoundNumber: number;
  pot: number;
  currentBet: number;
  currentPlayer: string;
  playersActed: string[];
  players: PlayerBettingState[];
  communityCards: Card[];
  smallBlind: number;
  bigBlind: number;
}

export function getNextPhase(currentPhase: string): string {
  const phases = ["preflop", "flop", "turn", "river", "showdown"];
  const currentIndex = phases.indexOf(currentPhase);
  return currentIndex < phases.length - 1
    ? phases[currentIndex + 1]
    : currentPhase;
}

export function getCommunityCardsToShow(phase: string): number {
  switch (phase) {
    case "preflop":
      return 0;
    case "flop":
      return 3;
    case "turn":
      return 4;
    case "river":
      return 5;
    default:
      return 0;
  }
}

export function isSubRoundComplete(gameState: GameBettingState): boolean {
  const activePlayers = gameState.players.filter(
    (p) => p.isActive && !p.isFolded
  );

  if (activePlayers.length <= 1) return true;

  // Check if all active players have acted in this sub-round
  const allPlayersActed = activePlayers.every((player) =>
    gameState.playersActed.includes(player.userId)
  );

  if (!allPlayersActed) return false;

  // Check if all active players have the same bet amount
  const firstPlayerBet = activePlayers[0].currentBet;
  const allBetsEqual = activePlayers.every(
    (player) => player.currentBet === firstPlayerBet
  );

  return allBetsEqual;
}

export function getNextPlayer(gameState: GameBettingState): string | null {
  const activePlayers = gameState.players
    .filter((p) => p.isActive && !p.isFolded)
    .sort((a, b) => a.seatNumber - b.seatNumber);

  if (activePlayers.length <= 1) return null;

  const currentIndex = activePlayers.findIndex(
    (p) => p.userId === gameState.currentPlayer
  );
  const nextIndex = (currentIndex + 1) % activePlayers.length;
  return activePlayers[nextIndex].userId;
}

export function getValidActions(
  player: PlayerBettingState,
  gameState: GameBettingState
): string[] {
  const actions: string[] = [];

  if (!player.isActive || player.isFolded) return actions;
  if (player.userId !== gameState.currentPlayer) return actions;
  if (player.hasActedThisSubRound) return actions;

  const amountToCall = gameState.currentBet - player.currentBet;

  if (amountToCall === 0) {
    actions.push("check");
  } else {
    actions.push("call");
  }

  // Can always fold
  actions.push("fold");

  // Can raise if they have enough chips
  const minRaise = gameState.bigBlind;
  if (player.stack >= amountToCall + minRaise) {
    actions.push("raise");
  }

  return actions;
}

export function shouldProgressToNextPhase(
  gameState: GameBettingState
): boolean {
  if (!isSubRoundComplete(gameState)) return false;

  const activePlayers = gameState.players.filter(
    (p) => p.isActive && !p.isFolded
  );
  return activePlayers.length > 1;
}

export function getWinningPlayer(
  gameState: GameBettingState
): PlayerBettingState | null {
  const activePlayers = gameState.players.filter(
    (p) => p.isActive && !p.isFolded
  );
  return activePlayers.length === 1 ? activePlayers[0] : null;
}

export function calculateNewPot(players: PlayerBettingState[]): number {
  return players.reduce((total, player) => total + player.totalBet, 0);
}

export function resetSubRoundForNewPhase(
  gameState: GameBettingState
): GameBettingState {
  return {
    ...gameState,
    subRoundNumber: 1,
    playersActed: [],
    currentBet: 0,
    players: gameState.players.map((player) => ({
      ...player,
      currentBet: 0,
      hasActedThisSubRound: false,
    })),
  };
}
