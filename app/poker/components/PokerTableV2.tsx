"use client";

import { useState, useEffect } from "react";
import { Card } from "../utils/cards";
import { GameState, Player } from "../utils/pokerEngine";

interface Table {
  id: string;
  status: string;
  createdAt: string;
  players: Player[];
}

interface SessionData {
  userId: string;
  username: string;
  sessionId: string;
  token: string;
}

interface PokerTableV2Props {
  sessionData: SessionData;
}

export default function PokerTableV2({ sessionData }: PokerTableV2Props) {
  const [tables, setTables] = useState<Table[]>([]);
  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState<string | null>(null);

  // Fetch all tables
  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched tables data:", data);
        setTables(data.tables || []);
      } else {
        console.error("Failed to fetch tables:", response.status);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  // Create new table
  const createTable = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/tables/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sessionData.userId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Created table data:", data);
        setCurrentTable(data.table);
        await fetchTables();
      } else {
        const errorData = await response.json();
        console.error("Failed to create table:", errorData);
        setError(errorData.error || "Failed to create table");
      }
    } catch (error) {
      console.error("Error creating table:", error);
      setError("Failed to create table");
    } finally {
      setIsLoading(false);
    }
  };

  // Join existing table
  const joinTable = async (tableId: string) => {
    try {
      setIsJoining(tableId);
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          userId: sessionData.userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTable(data.table);
        await fetchTables();
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

  // Start game
  const startGame = async () => {
    if (!currentTable) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: currentTable.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data.gameState);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to start game");
      }
    } catch (error) {
      console.error("Error starting game:", error);
      setError("Failed to start game");
    } finally {
      setIsLoading(false);
    }
  };

  // Load game state
  const loadGameState = async () => {
    if (!currentTable) return;

    try {
      const response = await fetch(
        `/api/game/state-v2?tableId=${currentTable.id}&userId=${sessionData.userId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.gameState) {
          console.log("Loaded game state:", data.gameState);
          setGameState(data.gameState);
        }
      }
    } catch (error) {
      console.error("Error loading game state:", error);
    }
  };

  // Handle betting action
  const handleBettingAction = async (
    action: "fold" | "call" | "raise" | "check",
    amount?: number
  ) => {
    if (
      !gameState ||
      !gameState.currentPlayer ||
      gameState.currentPlayer !== sessionData.userId
    ) {
      return;
    }

    try {
      const response = await fetch("/api/game/action-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: gameState.roundId,
          userId: sessionData.userId,
          action: action,
          amount: amount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data.gameState);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to process action");
      }
    } catch (error) {
      console.error("Error processing betting action:", error);
      setError("Failed to process action");
    }
  };

  // Get visible community cards based on phase
  const getVisibleCommunityCards = (): Card[] => {
    if (!gameState) return [];

    switch (gameState.phase) {
      case "blinds":
      case "preflop":
        return [];
      case "flop":
        return gameState.communityCards.slice(0, 3);
      case "turn":
        return gameState.communityCards.slice(0, 4);
      case "river":
      case "showdown":
        return gameState.communityCards;
      default:
        return [];
    }
  };

  // Get valid actions for current player
  const getValidActions = (): string[] => {
    if (!gameState || gameState.currentPlayer !== sessionData.userId) return [];

    const actions: string[] = [];
    const player = gameState.players.find(
      (p) => p.userId === sessionData.userId
    );
    if (!player || player.isFolded) return actions;

    const amountToCall = gameState.currentBet - player.currentBet;

    if (amountToCall === 0) {
      actions.push("check");
    } else {
      actions.push("call");
    }

    actions.push("fold");

    // Can raise if they have enough chips
    const minRaise = gameState.bigBlind;
    if (player.stack >= amountToCall + minRaise) {
      actions.push("raise");
    }

    return actions;
  };

  // Check if it's current player's turn
  const isMyTurn = gameState?.currentPlayer === sessionData.userId;

  // Fetch tables on mount and set up polling
  useEffect(() => {
    fetchTables();

    // Poll for new tables every 2 seconds
    const interval = setInterval(fetchTables, 2000);

    return () => clearInterval(interval);
  }, []);

  // Load game state when currentTable changes
  useEffect(() => {
    if (currentTable) {
      loadGameState();
    }
  }, [currentTable]);

  // Check for current table
  useEffect(() => {
    const checkCurrentTable = () => {
      const myTable = tables.find((table) =>
        table.players.some((p) => p.userId === sessionData.userId)
      );
      if (myTable && myTable.id !== currentTable?.id) {
        setCurrentTable(myTable);
      }
    };

    if (tables.length > 0) {
      checkCurrentTable();
    }
  }, [tables, sessionData.userId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center">
        <div className="bg-red-600/20 border border-red-400 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (!currentTable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full mx-4">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            Poker Tables
          </h1>

          <div className="space-y-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className="bg-white/10 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-white font-semibold">
                    Table {table.id.slice(0, 8)}
                  </h3>
                  <p className="text-green-200 text-sm">
                    {table.players.length}/2 players
                  </p>
                </div>
                <button
                  onClick={() => joinTable(table.id)}
                  disabled={isJoining === table.id || table.players.length >= 2}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isJoining === table.id ? "Joining..." : "Join"}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center space-y-4">
            <button
              onClick={createTable}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? "Creating..." : "Create New Table"}
            </button>
            <div>
              <button
                onClick={fetchTables}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Refresh Tables
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Poker Table</h1>
          <p className="text-green-200">Welcome, {sessionData.username}</p>
        </div>

        {/* Game Status */}
        {gameState ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Game in Progress
              </h2>
              <div className="text-green-200 space-y-1">
                <p>Phase: {gameState.phase.toUpperCase()}</p>
                <p>Pot: ${gameState.pot}</p>
                <p>Current Bet: ${gameState.currentBet}</p>
                {isMyTurn && (
                  <p className="text-yellow-300 font-semibold">
                    It's your turn!
                  </p>
                )}
              </div>
            </div>

            {/* Community Cards */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white text-center mb-3">
                Community Cards
              </h3>
              <div className="flex justify-center gap-2">
                {getVisibleCommunityCards().map((card, index) => (
                  <div
                    key={index}
                    className="w-12 h-16 bg-white rounded border-2 border-gray-300 flex items-center justify-center text-sm font-semibold"
                  >
                    {card.rank}
                    {card.suit}
                  </div>
                ))}
              </div>
            </div>

            {/* Players */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {gameState.players.map((player) => {
                const isCurrentUser = player.userId === sessionData.userId;
                const isPlayersTurn = isMyTurn && isCurrentUser;

                return (
                  <div
                    key={player.userId}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentUser
                        ? "border-yellow-400 bg-yellow-400/20"
                        : "border-white/20 bg-white/10"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-white font-semibold">
                        {player.username}
                      </div>
                      <div className="text-green-200 text-sm">
                        ${player.stack}
                      </div>
                      {isCurrentUser && (
                        <div className="text-xs text-yellow-300 mt-1">You</div>
                      )}
                      {isPlayersTurn && (
                        <div className="text-xs text-green-300 mt-1 font-bold">
                          YOUR TURN
                        </div>
                      )}

                      {/* Player Cards */}
                      {player.cards && player.cards.length > 0 && (
                        <div className="flex justify-center gap-1 mt-2">
                          {player.cards.map((card, index) => (
                            <div
                              key={index}
                              className="w-8 h-12 bg-white rounded border border-gray-300 flex items-center justify-center text-xs font-semibold"
                            >
                              {isCurrentUser
                                ? `${card.rank}${card.suit}`
                                : "??"}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Betting Actions */}
            {isMyTurn && (
              <div className="bg-blue-600/20 border border-blue-400 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 text-center">
                  Your Turn
                </h4>
                <div className="flex justify-center gap-3">
                  {getValidActions().map((action) => (
                    <button
                      key={action}
                      onClick={() => {
                        if (action === "raise") {
                          const amount =
                            gameState.currentBet + gameState.bigBlind;
                          handleBettingAction(action as any, amount);
                        } else {
                          handleBettingAction(action as any);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        action === "fold"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : action === "call" || action === "check"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-yellow-600 hover:bg-yellow-700 text-white"
                      }`}
                    >
                      {action === "call" && gameState.currentBet > 0
                        ? `Call $${gameState.currentBet}`
                        : action.charAt(0).toUpperCase() + action.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Waiting for Game to Start
            </h2>
            <p className="text-green-200 mb-6">
              {currentTable.players.length === 2
                ? "Both players ready! Game will start automatically."
                : `Waiting for ${
                    2 - currentTable.players.length
                  } more player(s)...`}
            </p>
            {currentTable.players.length === 2 && (
              <button
                onClick={startGame}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? "Starting..." : "Start Game"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
