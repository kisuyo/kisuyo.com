import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username.trim()))
      .limit(1);

    let userId: string;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      // Create new user
      const newUser = await db
        .insert(users)
        .values({
          username: username.trim(),
        })
        .returning({ id: users.id });

      userId = newUser[0].id;
    }

    // Generate a unique token
    const token = crypto.randomUUID();

    // Create new session
    const newSession = await db
      .insert(sessions)
      .values({
        userId: userId,
        token: token,
      })
      .returning({ id: sessions.id });

    return NextResponse.json({
      sessionId: newSession[0].id,
      userId: userId,
      username: username.trim(),
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const token = searchParams.get("token");

    if (!sessionId && !token) {
      return NextResponse.json(
        { error: "Session ID or token is required" },
        { status: 400 }
      );
    }

    // Get session with user info
    const sessionData = await db
      .select({
        sessionId: sessions.id,
        userId: users.id,
        username: users.username,
        token: sessions.token,
        createdAt: sessions.createdAt,
        lastSeen: sessions.lastSeen,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        sessionId ? eq(sessions.id, sessionId) : eq(sessions.token, token!)
      )
      .limit(1);

    if (sessionData.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Update last seen
    await db
      .update(sessions)
      .set({ lastSeen: new Date() })
      .where(eq(sessions.id, sessionData[0].sessionId));

    return NextResponse.json(sessionData[0]);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
