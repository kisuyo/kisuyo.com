import { Card } from "./cards";

export interface GameState {
  roundId: string;
  gameId: string;
  pot: number;
  currentBet: number;
  currentPlayer: string;
  phase: "preflop" | "flop" | "turn" | "river" | "showdown";
  communityCards: Card[];
  smallBlind: number;
  bigBlind: number;
  players: PlayerState[];
}

export interface PlayerState {
  id: string;
  userId: string;
  seatNumber: number;
  stack: number;
  cards: Card[];
  isFolded: boolean;
  currentBet: number; // amount bet in current phase
  totalBet: number; // total amount bet in this round
  isActive: boolean;
  username: string;
}

export interface BettingAction {
  type: "call" | "raise" | "fold" | "check";
  amount?: number;
}

export const PHASES = ["preflop", "flop", "turn", "river", "showdown"] as const;

export function getNextPhase(currentPhase: string): string {
  const currentIndex = PHASES.indexOf(currentPhase as any);
  return currentIndex < PHASES.length - 1
    ? PHASES[currentIndex + 1]
    : currentPhase;
}

export function getNextPlayer(
  players: PlayerState[],
  currentPlayerId: string
): string | null {
  const activePlayers = players.filter((p) => p.isActive && !p.isFolded);
  if (activePlayers.length <= 1) return null;

  const currentIndex = activePlayers.findIndex(
    (p) => p.userId === currentPlayerId
  );
  const nextIndex = (currentIndex + 1) % activePlayers.length;
  return activePlayers[nextIndex].userId;
}

export function canPlayerAct(
  player: PlayerState,
  gameState: GameState
): boolean {
  return (
    player.isActive &&
    !player.isFolded &&
    player.userId === gameState.currentPlayer
  );
}

export function getValidActions(
  player: PlayerState,
  gameState: GameState
): string[] {
  const actions: string[] = [];

  if (!canPlayerAct(player, gameState)) return actions;

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

export function calculatePot(players: PlayerState[]): number {
  return players.reduce((total, player) => total + player.totalBet, 0);
}

export function isBettingRoundComplete(
  players: PlayerState[],
  gameState: GameState
): boolean {
  const activePlayers = players.filter((p) => p.isActive && !p.isFolded);

  if (activePlayers.length <= 1) return true;

  // Check if all active players have bet the same amount
  const firstPlayerBet = activePlayers[0].currentBet;
  return activePlayers.every((p) => p.currentBet === firstPlayerBet);
}
