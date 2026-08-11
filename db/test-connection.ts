import fs from "fs";
import path from "path";
import postgres from "postgres";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local file not found");
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.substring(0, separator);
    const value = trimmed.substring(separator + 1);

    process.env[key] = value;
  }
}

async function testConnection() {
  loadEnvLocal();

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const sql = postgres(connectionString);

  try {
    const result =
      await sql`SELECT current_database() AS database, current_user AS user`;

    console.log("PostgreSQL connection successful!");
    console.log(result);
  } catch (error) {
    console.error("PostgreSQL connection failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

testConnection();
