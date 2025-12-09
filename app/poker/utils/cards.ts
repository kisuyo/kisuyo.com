export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank:
    | "A"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "10"
    | "J"
    | "Q"
    | "K";
  value: number; // For comparison (A=14, K=13, Q=12, J=11, etc.)
}

export const SUITS: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
export const RANKS: Card["rank"][] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value: number;
      switch (rank) {
        case "A":
          value = 14;
          break;
        case "K":
          value = 13;
          break;
        case "Q":
          value = 12;
          break;
        case "J":
          value = 11;
          break;
        default:
          value = parseInt(rank);
          break;
      }

      deck.push({ suit, rank, value });
    }
  }

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(
  deck: Card[],
  numPlayers: number,
  cardsPerPlayer: number = 2
): Card[][] {
  const hands: Card[][] = [];

  for (let i = 0; i < numPlayers; i++) {
    hands.push([]);
  }

  for (let cardIndex = 0; cardIndex < cardsPerPlayer; cardIndex++) {
    for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
      if (deck.length > 0) {
        hands[playerIndex].push(deck.shift()!);
      }
    }
  }

  return hands;
}

export function getCardString(card: Card): string {
  const suitSymbols = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };

  return `${card.rank}${suitSymbols[card.suit]}`;
}

export function getCardColor(suit: Card["suit"]): "red" | "black" {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}
