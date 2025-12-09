"use client";

import { useState, useEffect } from "react";
import CreateSession from "./components/CreateSession";
import PokerTableV2 from "./components/PokerTableV2";

interface SessionData {
  sessionId: string;
  userId: string;
  username: string;
  token: string;
}

export default function Poker() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSessionCreated = (data: SessionData) => {
    setSessionData(data);
  };

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const storedSessionId = localStorage.getItem("pokerSessionId");
      const storedToken = localStorage.getItem("pokerToken");

      if (storedSessionId && storedToken) {
        try {
          const response = await fetch(
            `/api/sessions?sessionId=${storedSessionId}&token=${storedToken}`
          );
          if (response.ok) {
            const sessionData = await response.json();
            setSessionData(sessionData);
          } else {
            // Session is invalid, remove from localStorage
            localStorage.removeItem("pokerSessionId");
            localStorage.removeItem("pokerToken");
          }
        } catch (error) {
          console.error("Error checking existing session:", error);
          localStorage.removeItem("pokerSessionId");
          localStorage.removeItem("pokerToken");
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-green-700">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return <CreateSession onSessionCreated={handleSessionCreated} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Poker Game</h1>
            <div className="text-green-100">
              Welcome,{" "}
              <span className="font-semibold text-white">
                {sessionData.username}
              </span>
            </div>
          </div>

          <PokerTableV2 sessionData={sessionData} />
        </div>
      </div>
    </div>
  );
}
