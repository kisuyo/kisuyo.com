import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle>;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Database operations will fail.");
  // Create a placeholder that will error on use
  db = null as unknown as ReturnType<typeof drizzle>;
} else {
  const client = postgres(process.env.DATABASE_URL, {
    connect_timeout: 30,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });
  db = drizzle(client, { schema });
}

export { db };
