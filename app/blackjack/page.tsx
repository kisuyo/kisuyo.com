"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ---- Timing constants (tweak here) ---- */
const SLIDE_DUR = 0.5; // seconds
const FLIP_DUR = 0.28; // seconds
const STAGGER = 0.22; // seconds between deals
const SMALL = 0.06; // tiny delay used for late reveals

type Card = { rank: string; suit: string };

const suits = ["♠", "♥", "♦", "♣"];
const ranks = [
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

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

/* ---------- Animated Card ---------- */
function AnimatedCard({
  card,
  reveal,
  slideDelay = 0,
  initialFlipDelay, // optional: custom flip delay for the first time this card should reveal
}: {
  card: Card;
  reveal: boolean; // whether the card should currently be face-up
  slideDelay?: number; // when to start sliding in
  initialFlipDelay?: number; // when to flip after first mount (defaults to slideDelay + SLIDE_DUR)
}) {
  const revealedBefore = useRef<boolean>(reveal);
  // detect reveal toggles
  const hasRevealed = revealedBefore.current;
  useEffect(() => {
    revealedBefore.current = reveal;
  }, [reveal]);

  // Flip delay:
  // - On initial mount (if reveal=true): flip after slide completes.
  // - On later reveal (false -> true): flip shortly after (no re-slide).
  const flipDelay = useMemo(() => {
    if (reveal) {
      return hasRevealed
        ? SMALL // late reveal (e.g., dealer second card)
        : initialFlipDelay ?? slideDelay + SLIDE_DUR; // initial reveal after slide
    }
    return 0;
  }, [reveal, hasRevealed, slideDelay, initialFlipDelay]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 160, opacity: 0 }} // slide in from right
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: SLIDE_DUR, ease: "linear", delay: slideDelay }}
        style={{ perspective: 800 }}
      >
        <motion.div
          animate={{ rotateY: reveal ? 0 : 180 }} // face-up vs face-down
          transition={{ duration: FLIP_DUR, ease: "linear", delay: flipDelay }}
          style={{
            transformStyle: "preserve-3d",
            width: 64,
            height: 96,
            position: "relative",
          }}
        >
          {/* Front */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              background: "white",
              border: "1px solid #cbd5e1",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
            }}
          >
            {card.rank} {card.suit}
          </div>

          {/* Back */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              background: "#1e3a8a",
              border: "1px solid #cbd5e1",
              borderRadius: 12,
              transform: "rotateY(180deg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 12,
            }}
          >
            🂠
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------- Game --------------- */
export default function Blackjack() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [dealersHand, setDealersHand] = useState<Card[]>([]);
  const [playersHand, setPlayersHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<
    "playing" | "won" | "lost" | "tie"
  >("playing");
  const [isDealersTurn, setIsDealersTurn] = useState(false);
  const [showDealersFullHand, setShowDealersFullHand] = useState(false);

  /* ---- Deck ---- */
  const shuffleDeck = () => {
    const newDeck = suits.flatMap((suit) =>
      ranks.map((rank) => ({ rank, suit }))
    );
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    setDeck(newDeck);
  };

  /* ---- Hand value ---- */
  const calculateHandValue = (hand: Card[]) => {
    let value = 0;
    let aces = 0;
    for (const c of hand) {
      if (c.rank === "A") {
        value += 11;
        aces++;
      } else if (["K", "Q", "J"].includes(c.rank)) value += 10;
      else value += parseInt(c.rank);
    }
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  };

  /* ---- Dealing (sequenced) ---- */
  const dealInitialCards = async () => {
    const newDeck = [...deck];
    setDealersHand([]);
    setPlayersHand([]);
    setShowDealersFullHand(false);
    setGameState("playing");

    // Dealer 1 (face-up, flip after slide)
    const d1 = newDeck.pop()!;
    setDealersHand((h) => [...h, d1]);
    await wait((SLIDE_DUR + STAGGER) * 1000);

    // Dealer 2 (face-down; reveal later on Stand)
    const d2 = newDeck.pop()!;
    setDealersHand((h) => [...h, d2]);
    await wait((SLIDE_DUR + STAGGER) * 1000);

    // Player 1
    const p1 = newDeck.pop()!;
    setPlayersHand((h) => [...h, p1]);
    await wait((SLIDE_DUR + STAGGER) * 1000);

    // Player 2
    const p2 = newDeck.pop()!;
    setPlayersHand((h) => [...h, p2]);
    await wait((SLIDE_DUR + FLIP_DUR) * 1000); // let last flip finish

    setDeck(newDeck);
  };

  /* ---- Player Hit ---- */
  const hit = async () => {
    if (gameState !== "playing" || isDealersTurn) return;
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    setDeck(newDeck);

    const nextHand = [...playersHand, card];
    setPlayersHand(nextHand);

    // wait for slide+flip of this new card
    await wait((SLIDE_DUR + FLIP_DUR + SMALL) * 1000);

    if (calculateHandValue(nextHand) > 21) {
      setGameState("lost");
    }
  };

  /* ---- Stand (reveal, then dealer hits) ---- */
  const stand = async () => {
    if (gameState !== "playing" || isDealersTurn) return;
    setIsDealersTurn(true);

    // Reveal dealer's hidden card (no re-slide)
    setShowDealersFullHand(true);
    await wait((FLIP_DUR + SMALL) * 1000);

    await playDealerTurn();
  };

  const playDealerTurn = async () => {
    let currentHand = [...dealersHand];
    let currentDeck = [...deck];

    // Dealer draws to 17+
    while (calculateHandValue(currentHand) < 17) {
      const newCard = currentDeck.pop()!;
      currentHand = [...currentHand, newCard];

      // render + let it animate (slide+flip)
      setDealersHand(currentHand);
      setDeck(currentDeck);

      await wait((SLIDE_DUR + FLIP_DUR + SMALL) * 1000);
    }

    // ensure final flip completes before outcome text
    await wait((SMALL + 0.05) * 1000);

    const playerValue = calculateHandValue(playersHand);
    const dealerValue = calculateHandValue(currentHand);

    if (dealerValue > 21) setGameState("won");
    else if (dealerValue > playerValue) setGameState("lost");
    else if (dealerValue < playerValue) setGameState("won");
    else setGameState("tie");
  };

  const newGame = () => {
    shuffleDeck();
    setDealersHand([]);
    setPlayersHand([]);
    setGameState("playing");
    setIsDealersTurn(false);
    setShowDealersFullHand(false);
  };

  useEffect(() => {
    shuffleDeck();
  }, []);
  useEffect(() => {
    if (
      deck.length === 52 &&
      dealersHand.length === 0 &&
      playersHand.length === 0
    ) {
      // start the animated deal
      dealInitialCards();
    }
  }, [deck]); // eslint-disable-line

  /* ---- UI helpers ---- */
  const getGameMessage = () => {
    switch (gameState) {
      case "won":
        return "You Win! 🎉";
      case "lost":
        return "Dealer Wins! 😔";
      case "tie":
        return "It's a Tie! 🤝";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-2 max-w-[800px] mx-auto h-screen">
      <div className="h-full flex flex-col gap-6 pt-4">
        {/* Dealer */}
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-lg">
            Dealer's Hand (
            {showDealersFullHand
              ? calculateHandValue(dealersHand)
              : calculateHandValue(dealersHand.slice(0, 1))}
            )
          </h2>
          <div className="flex gap-3">
            {dealersHand.map((card, index) => {
              const slideDelay = index * STAGGER; // deal order
              const revealNow = index === 0 || showDealersFullHand; // card 2 stays hidden until Stand
              const initialFlipDelay = slideDelay + SLIDE_DUR; // flip after slide on first reveal
              return (
                <AnimatedCard
                  key={`dealer-${card.rank}-${card.suit}-${index}`}
                  card={card}
                  reveal={revealNow}
                  slideDelay={slideDelay}
                  initialFlipDelay={initialFlipDelay}
                />
              );
            })}
          </div>
        </div>

        {/* Player */}
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-lg">
            Your Hand ({calculateHandValue(playersHand)})
          </h2>
          <div className="flex gap-3">
            {playersHand.map((card, index) => {
              const slideDelay = index * STAGGER;
              const initialFlipDelay = slideDelay + SLIDE_DUR;
              return (
                <AnimatedCard
                  key={`player-${card.rank}-${card.suit}-${index}`}
                  card={card}
                  reveal={true}
                  slideDelay={slideDelay}
                  initialFlipDelay={initialFlipDelay}
                />
              );
            })}
          </div>
        </div>

        {/* Outcome */}
        {gameState !== "playing" && (
          <div className="text-center py-4">
            <h3 className="text-2xl font-bold text-white mb-4">
              {getGameMessage()}
            </h3>
            <button
              onClick={newGame}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Shuffle & Play Again
            </button>
          </div>
        )}

        {/* Remaining */}
        <div className="text-white text-sm mt-auto">
          Cards remaining: {deck.length}
        </div>
      </div>

      {/* Controls */}
      {gameState === "playing" && (
        <div className="flex gap-2 p-2 w-full">
          <div className="w-full border-2 rounded-lg border-neutral-500/20">
            <button
              onClick={hit}
              disabled={isDealersTurn}
              className="border-neutral-300/20 bg-gradient-to-b from-transparent to-neutral-400/10 text-white w-full p-4 rounded-lg hover:shadow-[0_0_25px_0_rgba(255,255,255,0.15)] transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hit
            </button>
          </div>
          <div className="w-full border-2 rounded-lg border-neutral-500/20">
            <button
              onClick={stand}
              disabled={isDealersTurn}
              className="border-neutral-300/20 bg-gradient-to-b from-transparent to-neutral-400/10 text-white w-full p-4 rounded-lg hover:shadow-[0_0_25px_0_rgba(255,255,255,0.15)] transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
