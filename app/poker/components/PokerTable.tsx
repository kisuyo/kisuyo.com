"use client";

import { useState, useEffect } from "react";
import Card from "./Card";
import {
  createDeck,
  shuffleDeck,
  dealCards,
  Card as CardType,
} from "../utils/cards";
import { GameState, PlayerState, BettingAction } from "../utils/gameState";
import {
  getCommunityCardsToShow,
  isSubRoundComplete,
} from "../utils/bettingLogic";

interface Player {
  id: string;
  userId: string;
  seatNumber: number;
  stack: number;
  isActive: boolean;
  joinedAt: string;
  username: string;
  cards?: CardType[];
  currentBet?: number;
  totalBet?: number;
  isFolded?: boolean;
}

interface Table {
  id: string;
  status: string;
  createdAt: string;
  players: Player[];
}

interface PokerTableProps {
  sessionData: {
    sessionId: string;
    userId: string;
    username: string;
  };
}

export default function PokerTable({ sessionData }: PokerTableProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [waitTimer, setWaitTimer] = useState<number | null>(null);
  const [deck, setDeck] = useState<CardType[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [communityCards, setCommunityCards] = useState<CardType[]>([]);
  const [currentPhase, setCurrentPhase] = useState<
    "preflop" | "flop" | "turn" | "river" | "showdown"
  >("preflop");
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);

  // Fetch available tables
  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables");
      if (response.ok) {
        const tablesData = await response.json();
        setTables(tablesData);
      } else {
        setError("Failed to fetch tables");
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      setError("Failed to fetch tables");
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new table if none exist
  const createTable = async () => {
    try {
      const response = await fetch("/api/tables/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sessionData.userId }),
      });
      if (response.ok) {
        const result = await response.json();
        setCurrentTable(result.table);
        await fetchTables(); // Refresh tables list
      } else {
        setError("Failed to create table");
      }
    } catch (error) {
      console.error("Error creating table:", error);
      setError("Failed to create table");
    }
  };

  // Join a table
  const joinTable = async (tableId: string) => {
    setIsJoining(tableId);
    setError("");

    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: sessionData.userId,
          tableId: tableId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentTable(result.table);
        await fetchTables(); // Refresh tables list
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to join table");
      }
    } catch (error) {
      console.error("Error joining table:", error);
      setError("Failed to join table");
    } finally {
      setIsJoining(null);
    }
  };

  // Handle game completion when only one player is left
  const handleGameCompletion = async (winnerId: string) => {
    if (!currentTable || !currentRoundId) return;

    try {
      // Update round status to completed
      const response = await fetch("/api/rounds/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: currentRoundId,
          winnerId: winnerId,
        }),
      });

      if (response.ok) {
        // Reset game state for next round
        setGameStarted(false);
        setCurrentPhase("preflop");
        setPot(0);
        setCurrentBet(0);
        setIsYourTurn(false);
        setCurrentRoundId(null);

        // Clear player cards
        const updatedPlayers = currentTable.players.map((p) => ({
          ...p,
          cards: [],
          currentBet: 0,
          totalBet: 0,
          isFolded: false,
        }));
        setCurrentTable({ ...currentTable, players: updatedPlayers });

        // Start new round after 3 seconds
        setTimeout(() => {
          if (currentTable.players.length >= 2) {
            startGame();
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error handling game completion:", error);
    }
  };

  // Move to next player's turn
  const moveToNextPlayer = async () => {
    if (!currentTable || !currentRoundId) return;

    try {
      // Get active players (not folded)
      const activePlayers = currentTable.players.filter(
        (p) => p.isActive && !p.isFolded
      );

      if (activePlayers.length <= 1) {
        // Game over - only one player left
        const winner = activePlayers[0];
        if (winner) {
          await handleGameCompletion(winner.userId);
        }
        setIsYourTurn(false);
        return;
      }

      // Find current player index
      const currentPlayerIndex = activePlayers.findIndex(
        (p) => p.userId === sessionData.userId
      );
      const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
      const nextPlayer = activePlayers[nextPlayerIndex];

      // Update round with next player
      const response = await fetch("/api/rounds/update-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: currentRoundId,
          currentPlayer: nextPlayer.userId,
        }),
      });

      if (response.ok) {
        // Update local state
        setIsYourTurn(nextPlayer.userId === sessionData.userId);
      }
    } catch (error) {
      console.error("Error moving to next player:", error);
    }
  };

  // Handle betting actions
  const handleBettingAction = async (
    action: "call" | "raise" | "fold" | "check",
    amount?: number
  ) => {
    if (!currentTable || !isYourTurn || !currentRoundId) return;

    try {
      const response = await fetch("/api/game/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roundId: currentRoundId,
          userId: sessionData.userId,
          actionType: action,
          amount: amount || 0,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update local state
        if (action === "fold") {
          // Remove player from active players
          const updatedPlayers = currentTable.players.map((p) =>
            p.userId === sessionData.userId ? { ...p, isFolded: true } : p
          );
          setCurrentTable({ ...currentTable, players: updatedPlayers });
        } else {
          // Update pot and current bet
          setPot(result.updatedRound.pot);
          setCurrentBet(result.updatedRound.currentBet);
        }

        // Update player data
        const updatedPlayers = currentTable.players.map((p) =>
          p.userId === sessionData.userId ? result.updatedPlayer : p
        );
        setCurrentTable({ ...currentTable, players: updatedPlayers });

        // Check if phase changed
        if (
          result.updatedRound.phase &&
          result.updatedRound.phase !== currentPhase
        ) {
          setCurrentPhase(result.updatedRound.phase);
          console.log("Phase changed to:", result.updatedRound.phase);
        }

        // Move to next player
        await moveToNextPlayer();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to process action");
      }
    } catch (error) {
      console.error("Error processing betting action:", error);
      setError("Failed to process action");
    }
  };

  // Start game when we have 2+ players and timer expires
  const startGame = async () => {
    if (!currentTable || currentTable.players.length < 2) return;

    // Create and shuffle deck
    const newDeck = shuffleDeck(createDeck());
    setDeck(newDeck);

    // Deal cards to players
    const playerHands = dealCards([...newDeck], currentTable.players.length, 2);

    // Deal community cards (5 cards, but only show 2 initially)
    const communityCardsDealt = newDeck.slice(0, 5);
    setCommunityCards(communityCardsDealt);

    // Set up initial game state
    const smallBlind = 10;
    const bigBlind = 20;
    const initialPot = smallBlind + bigBlind;

    setPot(initialPot);
    setCurrentBet(bigBlind);
    setCurrentPhase("preflop");

    // Update current table with cards and betting info
    const updatedTable = {
      ...currentTable,
      players: currentTable.players.map((player, index) => ({
        ...player,
        cards: playerHands[index] || [],
        currentBet: 0,
        totalBet: 0,
        isFolded: false,
      })),
    };

    // Set blinds
    if (updatedTable.players.length >= 2) {
      updatedTable.players[0].currentBet = smallBlind;
      updatedTable.players[0].totalBet = smallBlind;
      updatedTable.players[0].stack -= smallBlind;

      updatedTable.players[1].currentBet = bigBlind;
      updatedTable.players[1].totalBet = bigBlind;
      updatedTable.players[1].stack -= bigBlind;
    }

    // Set first player's turn (player after big blind)
    const firstPlayer =
      updatedTable.players.length >= 2
        ? updatedTable.players[2] || updatedTable.players[0]
        : updatedTable.players[0];

    // Create game and round in database
    try {
      const gameResponse = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: currentTable.id,
          status: "ongoing",
        }),
      });

      if (gameResponse.ok) {
        const gameData = await gameResponse.json();

        // Create round
        const roundResponse = await fetch("/api/rounds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId: gameData.game.id,
            roundNumber: 1,
            pot: initialPot,
            currentBet: bigBlind,
            currentPlayer: firstPlayer.userId,
            phase: "preflop",
            communityCards: JSON.stringify(communityCardsDealt),
            smallBlind: smallBlind,
            bigBlind: bigBlind,
          }),
        });

        if (roundResponse.ok) {
          const roundData = await roundResponse.json();
          setCurrentRoundId(roundData.round.id);

          // Save game state
          await fetch("/api/game/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tableId: currentTable.id,
              gameId: gameData.game.id,
              roundId: roundData.round.id,
              pot: initialPot,
              currentBet: bigBlind,
              currentPlayer: firstPlayer.userId,
              phase: "preflop",
              communityCards: communityCardsDealt,
              smallBlind: smallBlind,
              bigBlind: bigBlind,
              players: updatedTable.players,
            }),
          });
        }
      }
    } catch (error) {
      console.error("Error saving game state:", error);
    }

    setCurrentTable(updatedTable);
    setGameStarted(true);
    setWaitTimer(null);
    setIsYourTurn(firstPlayer.userId === sessionData.userId);
  };

  // Load game state if user is at a table
  const loadGameState = async (tableId: string) => {
    try {
      console.log("Loading game state for table:", tableId);
      const response = await fetch(
        `/api/game/state?tableId=${tableId}&userId=${sessionData.userId}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Game state response:", data);
        if (data.gameState) {
          const gameState = data.gameState;
          console.log("Restoring game state:", gameState);

          // Restore game state
          setGameStarted(true);
          setPot(gameState.pot);
          setCurrentBet(gameState.currentBet);
          setCurrentPhase(gameState.phase);
          setCommunityCards(gameState.communityCards || []);
          setIsYourTurn(gameState.currentPlayer === sessionData.userId);
          setCurrentRoundId(gameState.roundId);
          setWaitTimer(null); // Clear any existing timer

          // Update current table with restored players
          if (currentTable) {
            const updatedTable = {
              ...currentTable,
              players: gameState.players.map((player: any) => ({
                ...player,
                cards: player.cards || [], // Cards will be loaded from database
              })),
            };
            setCurrentTable(updatedTable);
          }
        } else {
          console.log("No game state found, game not started yet");
        }
      } else {
        console.log("Failed to load game state:", response.status);
      }
    } catch (error) {
      console.error("Error loading game state:", error);
    }
  };

  // Check if user is already at a table
  useEffect(() => {
    const checkCurrentTable = () => {
      const userTable = tables.find((table) =>
        table.players.some((player) => player.userId === sessionData.userId)
      );
      if (userTable) {
        setCurrentTable(userTable);
      }
    };

    if (tables.length > 0) {
      checkCurrentTable();
    }
  }, [tables, sessionData.userId]);

  // Load game state when currentTable changes
  useEffect(() => {
    if (currentTable && !gameStarted) {
      loadGameState(currentTable.id);
    }
  }, [currentTable, gameStarted]);

  // Check for turn updates periodically
  useEffect(() => {
    if (!gameStarted || !currentRoundId) return;

    const checkTurn = async () => {
      try {
        const response = await fetch(
          `/api/game/state?tableId=${currentTable?.id}&userId=${sessionData.userId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.gameState) {
            const gameState = data.gameState;
            setIsYourTurn(gameState.currentPlayer === sessionData.userId);
            setPot(gameState.pot);
            setCurrentBet(gameState.currentBet);
          }
        }
      } catch (error) {
        console.error("Error checking turn:", error);
      }
    };

    // Check every 2 seconds
    const interval = setInterval(checkTurn, 2000);
    return () => clearInterval(interval);
  }, [gameStarted, currentRoundId, currentTable?.id, sessionData.userId]);

  // Handle wait timer for 2 players (only after checking for existing game state)
  useEffect(() => {
    if (!currentTable || gameStarted) return;

    // Add a small delay to ensure game state is loaded first
    const timer = setTimeout(() => {
      // Only start timer if game hasn't been loaded from database
      if (currentTable.players.length === 2 && !waitTimer && !gameStarted) {
        setWaitTimer(10); // 10 seconds wait time
      } else if (currentTable.players.length === 3 && !gameStarted) {
        // Start immediately if 3 players
        startGame();
      } else if (currentTable.players.length < 2) {
        // Reset timer if less than 2 players
        setWaitTimer(null);
      }
    }, 1000); // Increased delay to let game state load first

    return () => clearTimeout(timer);
  }, [currentTable, gameStarted, waitTimer]);

  // Countdown timer
  useEffect(() => {
    if (!waitTimer || waitTimer <= 0) return;

    const timer = setTimeout(() => {
      setWaitTimer(waitTimer - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [waitTimer]);

  // Start game when timer reaches 0
  useEffect(() => {
    if (waitTimer === 0) {
      startGame();
    }
  }, [waitTimer]);

  useEffect(() => {
    fetchTables();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span className="ml-3 text-white">Loading tables...</span>
      </div>
    );
  }

  if (currentTable) {
    return (
      <div className="space-y-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              Table {currentTable.id.slice(0, 8)}
            </h2>
            {waitTimer !== null && (
              <div className="bg-yellow-600/20 border border-yellow-400 rounded-lg px-4 py-2">
                <p className="text-yellow-200 text-sm">
                  Game starts in {waitTimer}s
                </p>
              </div>
            )}
          </div>

          {/* Community Cards */}
          {gameStarted && communityCards.length > 0 && (
            <div className="mb-6">
              <div className="text-center mb-3">
                <h3 className="text-lg font-semibold text-white">
                  Community Cards
                </h3>
                <p className="text-sm text-green-200">
                  Pot: ${pot} | Current Bet: ${currentBet} | Phase:{" "}
                  {currentPhase.toUpperCase()}
                </p>
              </div>
              <div className="flex justify-center gap-2">
                {communityCards.map((card, index) => {
                  // Show cards based on current phase
                  const cardsToShow = getCommunityCardsToShow(currentPhase);
                  const shouldShow = index < cardsToShow;
                  return (
                    <Card
                      key={index}
                      card={card}
                      isVisible={shouldShow}
                      className="scale-90"
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((seatNumber) => {
              const player = currentTable.players.find(
                (p) => p.seatNumber === seatNumber
              );
              const isCurrentUser = player?.userId === sessionData.userId;
              const isPlayersTurn = isYourTurn && isCurrentUser;

              return (
                <div
                  key={seatNumber}
                  className={`p-4 rounded-lg border-2 ${
                    player
                      ? "bg-green-600/20 border-green-400"
                      : "bg-gray-600/20 border-gray-400"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm text-gray-300 mb-2">
                      Seat {seatNumber}
                    </div>
                    {player ? (
                      <div>
                        <div className="font-semibold text-white">
                          {player.username}
                        </div>
                        <div className="text-sm text-green-200">
                          ${player.stack}
                        </div>
                        {isCurrentUser && (
                          <div className="text-xs text-yellow-300 mt-1">
                            You
                          </div>
                        )}
                        {isPlayersTurn && (
                          <div className="text-xs text-green-300 mt-1 font-bold">
                            YOUR TURN
                          </div>
                        )}

                        {/* Cards Display */}
                        {gameStarted &&
                          player.cards &&
                          player.cards.length > 0 && (
                            <div className="flex justify-center gap-1 mt-3">
                              {player.cards.map((card, cardIndex) => (
                                <Card
                                  key={cardIndex}
                                  card={card}
                                  isVisible={isCurrentUser}
                                  className="scale-75"
                                />
                              ))}
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="text-gray-400">Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Betting Interface */}
          {gameStarted && isYourTurn && (
            <div className="mt-6 bg-blue-600/20 border border-blue-400 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3 text-center">
                Your Turn
              </h4>
              <div className="flex justify-center gap-3">
                {currentBet === 0 ? (
                  <button
                    onClick={() => handleBettingAction("check")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Check
                  </button>
                ) : (
                  <button
                    onClick={() => handleBettingAction("call")}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Call ${currentBet}
                  </button>
                )}
                <button
                  onClick={() => handleBettingAction("fold")}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Fold
                </button>
                <button
                  onClick={() => handleBettingAction("raise", currentBet + 20)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Raise ${currentBet + 20}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 text-center">
            {!gameStarted ? (
              <p className="text-green-200">
                {currentTable.players.length === 2 && waitTimer !== null
                  ? `Game starting in ${waitTimer} seconds...`
                  : `Waiting for ${
                      3 - currentTable.players.length
                    } more player(s)...`}
              </p>
            ) : (
              <div className="text-green-200">
                <p>Game in progress! Cards have been dealt.</p>
                {isYourTurn ? (
                  <p className="text-yellow-300 font-semibold">
                    It's your turn!
                  </p>
                ) : (
                  <p className="text-blue-300">Waiting for other players...</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Available Tables</h2>
        <button
          onClick={createTable}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Create New Table
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {tables.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-green-200 text-lg mb-4">No tables available</p>
          <p className="text-green-300">Create a new table to start playing!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tables.map((table) => {
            const isFull = table.players.length >= 3;
            const canJoin = !isFull && table.status === "waiting";
            const isJoiningThisTable = isJoining === table.id;

            return (
              <div
                key={table.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    Table {table.id.slice(0, 8)}
                  </h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-green-200">
                      {table.players.length}/3 players
                    </span>
                    <button
                      onClick={() => joinTable(table.id)}
                      disabled={!canJoin || isJoiningThisTable}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        canJoin
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-600 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {isJoiningThisTable ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Joining...
                        </div>
                      ) : isFull ? (
                        "Full"
                      ) : (
                        "Join"
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((seatNumber) => {
                    const player = table.players.find(
                      (p) => p.seatNumber === seatNumber
                    );
                    return (
                      <div
                        key={seatNumber}
                        className={`p-3 rounded-lg border ${
                          player
                            ? "bg-green-600/20 border-green-400"
                            : "bg-gray-600/20 border-gray-400"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-xs text-gray-300 mb-1">
                            Seat {seatNumber}
                          </div>
                          {player ? (
                            <div>
                              <div className="font-medium text-white text-sm">
                                {player.username}
                              </div>
                              <div className="text-xs text-green-200">
                                ${player.stack}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm">Empty</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
