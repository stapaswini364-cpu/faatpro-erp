import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
    ssl: {
      rejectUnauthorized: true,
    },
  });

  dbInstance = drizzle(client);

  return dbInstance;
}