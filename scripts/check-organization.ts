import { config } from "dotenv";
import postgres from "postgres";

// Use the same environment file that Next.js uses
config({
  path: ".env.local",
});

// CURRENT CLERK ORGANIZATION ID
const organizationId =
  "org_3HtToE6FoIqfZmFCENLXhCnEUNX";

async function main() {
  const connectionString =
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured in .env.local",
    );
  }

  const client = postgres(
    connectionString,
  );

  try {
    console.log(
      "========================================",
    );

    console.log(
      "FAATPRO Organization Database Check",
    );

    console.log(
      "========================================",
    );

    console.log(
      "Checking Clerk Organization ID:",
    );

    console.log(organizationId);

    const result = await client`
      SELECT
        id,
        clerk_organization_id,
        name,
        slug,
        is_active
      FROM organizations
      WHERE clerk_organization_id = ${organizationId}
      LIMIT 1
    `;

    if (result.length === 0) {
      console.log(
        "Organization NOT FOUND in FAATPRO database.",
      );

      console.log(
        "Result:",
        result,
      );
    } else {
      console.log(
        "Organization FOUND in FAATPRO database:",
      );

      console.log(result);
    }
  } catch (error) {
    console.error(
      "Database check failed:",
    );

    console.error(error);

    process.exit(1);
  } finally {
    await client.end();
  }
}

main();