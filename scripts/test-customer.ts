import { config } from "dotenv";
import postgres from "postgres";

config({
  path: ".env.local",
});

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const db = postgres(connectionString);

  try {
    const result = await db`
      SELECT
        id,
        clerk_organization_id,
        name
      FROM organizations
      WHERE clerk_organization_id =
        'org_3HtToE6FoIqfZmFCENLXhCnEUNX'
      LIMIT 1
    `;

    console.log("Current FAATPRO organization:");
    console.log(result);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});