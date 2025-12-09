import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
} from "drizzle-orm/pg-core";

// ---------------- USERS ----------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------- SESSIONS ----------------
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
});

// ---------------- TABLES ----------------
export const tables = pgTable("tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: varchar("status", { length: 20 }).default("waiting").notNull(), // waiting | active | finished
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------- TABLE PLAYERS ----------------
export const tablePlayers = pgTable("table_players", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableId: uuid("table_id")
    .notNull()
    .references(() => tables.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  seatNumber: integer("seat_number").notNull(), // 1 or 2
  stack: integer("stack").default(1000).notNull(), // chips
  isActive: boolean("is_active").default(true).notNull(), // player left? -> false
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// ---------------- GAMES ----------------
export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableId: uuid("table_id")
    .notNull()
    .references(() => tables.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("ongoing").notNull(), // ongoing | finished
  winnerId: uuid("winner_id").references(() => users.id), // final winner
  createdAt: timestamp("created_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});

// ---------------- ROUNDS ----------------
export const rounds = pgTable("rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  roundNumber: integer("round_number").notNull(),
  pot: integer("pot").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // active | ended
  phase: varchar("phase", { length: 20 }).default("blinds").notNull(), // blinds | preflop | flop | turn | river | showdown
  currentBet: integer("current_bet").default(0).notNull(), // current bet amount in this sub-round
  smallBlind: integer("small_blind").default(10).notNull(),
  bigBlind: integer("big_blind").default(20).notNull(),
  currentPlayer: uuid("current_player").references(() => users.id), // whose turn it is
  createdAt: timestamp("created_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});

// ---------------- HANDS ----------------
export const hands = pgTable("hands", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id")
    .notNull()
    .references(() => rounds.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cards: text("cards").notNull(), // JSON string of player's 2 cards
  isFolded: boolean("is_folded").default(false).notNull(),
});

// ---------------- COMMUNITY CARDS ----------------
export const communityCards = pgTable("community_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id")
    .notNull()
    .references(() => rounds.id, { onDelete: "cascade" }),
  cards: text("cards").notNull(), // JSON string of 5 community cards
  flopRevealed: boolean("flop_revealed").default(false).notNull(), // first 3 cards
  turnRevealed: boolean("turn_revealed").default(false).notNull(), // 4th card
  riverRevealed: boolean("river_revealed").default(false).notNull(), // 5th card
});

// ---------------- ACTIONS ----------------
export const actions = pgTable("actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id")
    .notNull()
    .references(() => rounds.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  actionType: varchar("action_type", { length: 20 }).notNull(), // small_blind | big_blind | fold | call | raise | check
  amount: integer("amount").default(0).notNull(),
  phase: varchar("phase", { length: 20 }).default("preflop").notNull(), // blinds | preflop | flop | turn | river
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------- BETTING SUB-ROUNDS ----------------
export const bettingSubRounds = pgTable("betting_sub_rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id")
    .notNull()
    .references(() => rounds.id, { onDelete: "cascade" }),
  phase: varchar("phase", { length: 20 }).notNull(), // preflop | flop | turn | river
  subRoundNumber: integer("sub_round_number").notNull(), // which sub-round within the phase
  currentBet: integer("current_bet").default(0).notNull(),
  playersActed: text("players_acted").notNull(), // JSON array of player IDs who have acted
  isComplete: boolean("is_complete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
