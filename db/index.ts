import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Define a type for the database interface
type Database =
  | ReturnType<typeof drizzle>
  | {
      select: () => {
        from: () => {
          where: () => Promise<never[]>;
        };
      };
      insert: () => {
        values: () => {
          returning: () => Promise<never[]>;
        };
      };
      update: () => {
        set: () => {
          where: () => Promise<never[]>;
        };
      };
    };

// Check for required environment variables
let db: Database;

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL environment variable is not set. Using mock database for development."
  );

  // Create a mock database for development
  db = {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([]),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve([]),
      }),
    }),
  };
} else {
  // Create the connection
  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString, {
    connect_timeout: 30,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });
  db = drizzle(client, { schema });
}

export { db };
