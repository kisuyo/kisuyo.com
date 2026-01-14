import {
  pgTable,
  uuid,
  date,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const dailyEntries = pgTable("daily_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull().unique(),

  // Tasks
  macWork1h: boolean("mac_work_1h").default(false).notNull(),
  gameWork2h: boolean("game_work_2h").default(false).notNull(),
  gym: boolean("gym").default(false).notNull(),
  boxing: boolean("boxing").default(false).notNull(),
  meditate: boolean("meditate").default(false).notNull(),
  cleanFoods: boolean("clean_foods").default(false).notNull(),
  proteinGoal: boolean("protein_goal").default(false).notNull(),
  noSugar: boolean("no_sugar").default(false).notNull(),
  potassium: boolean("potassium").default(false).notNull(),
  wakeUpOnTime: boolean("wake_up_on_time").default(false).notNull(),
  sleepOnTime: boolean("sleep_on_time").default(false).notNull(),
  shower: boolean("shower").default(false).notNull(),
  skincare: boolean("skincare").default(false).notNull(),
  takeTrashOut: boolean("take_trash_out").default(false).notNull(),

  // Calculated score (0-14)
  score: integer("score").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
