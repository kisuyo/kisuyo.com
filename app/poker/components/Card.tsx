"use client";

import { Card as CardType, getCardString, getCardColor } from "../utils/cards";

interface CardProps {
  card: CardType;
  isVisible: boolean;
  className?: string;
}

export default function Card({ card, isVisible, className = "" }: CardProps) {
  if (!isVisible) {
    return (
      <div
        className={`w-16 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-blue-400 shadow-lg flex items-center justify-center ${className}`}
      >
        <div className="text-white text-xs font-bold">
          <div className="text-center">
            <div className="text-blue-200">♠</div>
            <div className="text-blue-200">♣</div>
            <div className="text-blue-200">♦</div>
            <div className="text-blue-200">♥</div>
          </div>
        </div>
      </div>
    );
  }

  const color = getCardColor(card.suit);
  const cardString = getCardString(card);

  return (
    <div
      className={`w-16 h-24 bg-white rounded-lg border-2 border-gray-300 shadow-lg flex flex-col justify-between p-2 ${className}`}
    >
      <div
        className={`text-sm font-bold ${
          color === "red" ? "text-red-600" : "text-black"
        }`}
      >
        {card.rank}
      </div>
      <div
        className={`text-2xl ${
          color === "red" ? "text-red-600" : "text-black"
        }`}
      >
        {card.suit === "hearts" && "♥"}
        {card.suit === "diamonds" && "♦"}
        {card.suit === "clubs" && "♣"}
        {card.suit === "spades" && "♠"}
      </div>
      <div
        className={`text-sm font-bold ${
          color === "red" ? "text-red-600" : "text-black"
        } transform rotate-180`}
      >
        {card.rank}
      </div>
    </div>
  );
}
