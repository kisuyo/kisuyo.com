import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { tableId, status = "ongoing" } = await request.json();

    if (!tableId) {
      return NextResponse.json(
        { error: "Table ID is required" },
        { status: 400 }
      );
    }

    // Create a new game
    const newGame = await db
      .insert(games)
      .values({
        tableId: tableId,
        status: status,
      })
      .returning();

    return NextResponse.json({
      success: true,
      game: newGame[0],
    });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}







