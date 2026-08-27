import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

config({
  path: ".env.local",
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing from .env.local",
  );
}

const sqlPath = path.resolve(
  "db/manual/day11_company_master.sql",
);

const sql = readFileSync(
  sqlPath,
  "utf8",
);

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log(
      "Connecting to database...",
    );

    await client.connect();

    console.log(
      "Executing Day 11 company master SQL...",
    );

    await client.query(sql);

    console.log(
      "Day 11 database changes applied successfully.",
    );
  } catch (error) {
    console.error(
      "Failed to apply Day 11 database changes:",
      error,
    );

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

void main();