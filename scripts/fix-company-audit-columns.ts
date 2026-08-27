import { config } from "dotenv";
import pg from "pg";

config({
  path: ".env.local",
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing from .env.local",
  );
}

async function main() {
  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    await client.query(`
      BEGIN;

      ALTER TABLE companies
        ALTER COLUMN created_by TYPE varchar(255)
        USING created_by::text;

      ALTER TABLE companies
        ALTER COLUMN updated_by TYPE varchar(255)
        USING updated_by::text;

      COMMIT;
    `);

    console.log(
      "Company audit columns updated successfully.",
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback error.
    }

    console.error(
      "Failed to update company audit columns:",
      error,
    );

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

void main();