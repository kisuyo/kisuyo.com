import { Card, createDeck, shuffleDeck, dealCards } from "./cards";

export interface Player {
  id: string;
  userId: string;
  seatNumber: number;
  stack: number;
  currentBet: number;
  totalBet: number;
  isFolded: boolean;
  isActive: boolean;
  username: string;
  cards?: Card[];
}

export interface GameState {
  gameId: string;
  roundId: string;
  tableId: string;
  phase: "blinds" | "preflop" | "flop" | "turn" | "river" | "showdown";
  pot: number;
  currentBet: number;
  currentPlayer: string;
  smallBlind: number;
  bigBlind: number;
  players: Player[];
  communityCards: Card[];
  deck: Card[];
  subRoundNumber: number;
  playersActed: string[];
}

export class PokerEngine {
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  // Phase 0: Post Blinds
  postBlinds(): {
    smallBlindPlayer: Player;
    bigBlindPlayer: Player;
    pot: number;
  } {
    const players = this.gameState.players.sort(
      (a, b) => a.seatNumber - b.seatNumber
    );
    const smallBlindPlayer = players[0];
    const bigBlindPlayer = players[1];

    // Deduct blinds from stacks
    smallBlindPlayer.stack -= this.gameState.smallBlind;
    smallBlindPlayer.currentBet = this.gameState.smallBlind;
    smallBlindPlayer.totalBet = this.gameState.smallBlind;

    bigBlindPlayer.stack -= this.gameState.bigBlind;
    bigBlindPlayer.currentBet = this.gameState.bigBlind;
    bigBlindPlayer.totalBet = this.gameState.bigBlind;

    const pot = this.gameState.smallBlind + this.gameState.bigBlind;

    // Update game state
    this.gameState.pot = pot;
    this.gameState.currentBet = this.gameState.bigBlind;
    this.gameState.currentPlayer = smallBlindPlayer.userId; // Small blind acts first

    return { smallBlindPlayer, bigBlindPlayer, pot };
  }

  // Phase 1: Deal Hole Cards
  dealHoleCards(): void {
    const deck = shuffleDeck(createDeck());
    this.gameState.deck = deck;

    // Deal 2 cards to each player
    let cardIndex = 0;
    for (const player of this.gameState.players) {
      if (player.isActive && !player.isFolded) {
        player.cards = deck.slice(cardIndex, cardIndex + 2);
        cardIndex += 2;
      }
    }

    // Remove dealt cards from deck (2 cards per player)
    const cardsDealt =
      this.gameState.players.filter((p) => p.isActive && !p.isFolded).length *
      2;
    this.gameState.deck = deck.slice(cardsDealt);
  }

  // Deal Community Cards
  dealCommunityCards(): Card[] {
    const communityCards = this.gameState.deck.slice(0, 5);
    this.gameState.communityCards = communityCards;
    this.gameState.deck = this.gameState.deck.slice(5);
    return communityCards;
  }

  // Get cards to show based on phase
  getVisibleCommunityCards(): Card[] {
    switch (this.gameState.phase) {
      case "blinds":
      case "preflop":
        return [];
      case "flop":
        return this.gameState.communityCards.slice(0, 3);
      case "turn":
        return this.gameState.communityCards.slice(0, 4);
      case "river":
      case "showdown":
        return this.gameState.communityCards;
      default:
        return [];
    }
  }

  // Get next player in betting order
  getNextPlayer(): Player | null {
    const activePlayers = this.gameState.players
      .filter((p) => p.isActive && !p.isFolded)
      .sort((a, b) => a.seatNumber - b.seatNumber);

    if (activePlayers.length <= 1) return null;

    const currentIndex = activePlayers.findIndex(
      (p) => p.userId === this.gameState.currentPlayer
    );
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    return activePlayers[nextIndex];
  }

  // Check if sub-round is complete
  isSubRoundComplete(): boolean {
    const activePlayers = this.gameState.players.filter(
      (p) => p.isActive && !p.isFolded
    );

    if (activePlayers.length <= 1) return true;

    // Check if all active players have acted
    const allPlayersActed = activePlayers.every((player) =>
      this.gameState.playersActed.includes(player.userId)
    );

    if (!allPlayersActed) return false;

    // Check if all active players have the same bet amount
    const firstPlayerBet = activePlayers[0].currentBet;
    const allBetsEqual = activePlayers.every(
      (player) => player.currentBet === firstPlayerBet
    );

    return allBetsEqual;
  }

  // Process player action
  processAction(
    playerId: string,
    action: "fold" | "call" | "raise" | "check",
    amount?: number
  ): {
    success: boolean;
    newGameState: GameState;
    subRoundComplete: boolean;
    phaseComplete: boolean;
  } {
    const player = this.gameState.players.find((p) => p.userId === playerId);
    if (!player || !player.isActive || player.isFolded) {
      return {
        success: false,
        newGameState: this.gameState,
        subRoundComplete: false,
        phaseComplete: false,
      };
    }

    // Add player to acted list
    if (!this.gameState.playersActed.includes(playerId)) {
      this.gameState.playersActed.push(playerId);
    }

    let potIncrease = 0;

    switch (action) {
      case "fold":
        player.isFolded = true;
        break;

      case "call":
        const amountToCall = this.gameState.currentBet - player.currentBet;
        player.stack -= amountToCall;
        player.currentBet = this.gameState.currentBet;
        player.totalBet += amountToCall;
        potIncrease = amountToCall;
        break;

      case "raise":
        if (!amount || amount <= this.gameState.currentBet) {
          return {
            success: false,
            newGameState: this.gameState,
            subRoundComplete: false,
            phaseComplete: false,
          };
        }
        const additionalAmount = amount - player.currentBet;
        player.stack -= additionalAmount;
        player.currentBet = amount;
        player.totalBet += additionalAmount;
        this.gameState.currentBet = amount;
        potIncrease = additionalAmount;

        // Reset playersActed for all players except the raiser
        this.gameState.playersActed = [playerId];
        break;

      case "check":
        // No money changes hands
        break;
    }

    this.gameState.pot += potIncrease;

    const subRoundComplete = this.isSubRoundComplete();
    const phaseComplete = this.shouldProgressToNextPhase();

    if (phaseComplete) {
      this.progressToNextPhase();
    } else if (subRoundComplete) {
      // Move to next player for next sub-round
      const nextPlayer = this.getNextPlayer();
      if (nextPlayer) {
        this.gameState.currentPlayer = nextPlayer.userId;
      }
    } else {
      // Continue sub-round
      const nextPlayer = this.getNextPlayer();
      if (nextPlayer) {
        this.gameState.currentPlayer = nextPlayer.userId;
      }
    }

    return {
      success: true,
      newGameState: this.gameState,
      subRoundComplete,
      phaseComplete,
    };
  }

  // Check if should progress to next phase
  shouldProgressToNextPhase(): boolean {
    if (!this.isSubRoundComplete()) return false;

    const activePlayers = this.gameState.players.filter(
      (p) => p.isActive && !p.isFolded
    );
    return activePlayers.length > 1;
  }

  // Progress to next phase
  progressToNextPhase(): void {
    const phases = ["blinds", "preflop", "flop", "turn", "river", "showdown"];
    const currentIndex = phases.indexOf(this.gameState.phase);

    if (currentIndex < phases.length - 1) {
      this.gameState.phase = phases[currentIndex + 1] as any;
      this.gameState.currentBet = 0;
      this.gameState.playersActed = [];
      this.gameState.subRoundNumber = 1;

      // Reset current bets for new phase
      for (const player of this.gameState.players) {
        player.currentBet = 0;
      }

      // Set first active player as current player
      const activePlayers = this.gameState.players
        .filter((p) => p.isActive && !p.isFolded)
        .sort((a, b) => a.seatNumber - b.seatNumber);

      if (activePlayers.length > 0) {
        this.gameState.currentPlayer = activePlayers[0].userId;
      }
    }
  }

  // Get valid actions for a player
  getValidActions(playerId: string): string[] {
    const player = this.gameState.players.find((p) => p.userId === playerId);
    if (
      !player ||
      !player.isActive ||
      player.isFolded ||
      player.userId !== this.gameState.currentPlayer
    ) {
      return [];
    }

    const actions: string[] = [];
    const amountToCall = this.gameState.currentBet - player.currentBet;

    if (amountToCall === 0) {
      actions.push("check");
    } else {
      actions.push("call");
    }

    actions.push("fold");

    // Can raise if they have enough chips
    const minRaise = this.gameState.bigBlind;
    if (player.stack >= amountToCall + minRaise) {
      actions.push("raise");
    }

    return actions;
  }

  // Get winner (simplified - just return last remaining player)
  getWinner(): Player | null {
    const activePlayers = this.gameState.players.filter(
      (p) => p.isActive && !p.isFolded
    );
    return activePlayers.length === 1 ? activePlayers[0] : null;
  }

  // Get current game state
  getGameState(): GameState {
    return { ...this.gameState };
  }
}
