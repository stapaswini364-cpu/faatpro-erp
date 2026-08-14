import { config } from "dotenv";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

import { organizations } from "../db/schema/organizations";

// Use the same environment file as Next.js
config({
  path: ".env.local",
});

// ============================================================
// ORGANIZATION B
// ============================================================

const clerkOrganizationId =
  "org_3Hu26cO8GoDkAQD3nj2bJDuG2Gx";

const organizationName =
  "FAATPRO Test Organization B";

const organizationSlug =
  "faatpro-test-organization-b";

// ============================================================
// MAIN
// ============================================================

async function main() {
  const connectionString =
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured in .env.local",
    );
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log(
      "========================================",
    );

    console.log(
      "FAATPRO Organization Registration",
    );

    console.log(
      "========================================",
    );

    console.log(
      "Clerk Organization ID:",
      clerkOrganizationId,
    );

    console.log(
      "Organization Name:",
      organizationName,
    );

    console.log(
      "Organization Slug:",
      organizationSlug,
    );

    console.log(
      "Checking existing organization...",
    );

    // --------------------------------------------------------
    // Check Clerk Organization ID
    // --------------------------------------------------------

    const existingByClerkId = await db
      .select()
      .from(organizations)
      .where(
        eq(
          organizations.clerkOrganizationId,
          clerkOrganizationId,
        ),
      )
      .limit(1);

    if (existingByClerkId.length > 0) {
      console.log(
        "Organization already registered:",
      );

      console.log(existingByClerkId[0]);

      return;
    }

    // --------------------------------------------------------
    // Check slug
    // --------------------------------------------------------

    const existingBySlug = await db
      .select()
      .from(organizations)
      .where(
        eq(
          organizations.slug,
          organizationSlug,
        ),
      )
      .limit(1);

    if (existingBySlug.length > 0) {
      console.error(
        "Organization slug already exists:",
      );

      console.error(existingBySlug[0]);

      console.error(
        "Please use a different organizationSlug.",
      );

      process.exitCode = 1;

      return;
    }

    // --------------------------------------------------------
    // Insert Organization B
    // --------------------------------------------------------

    const inserted = await db
      .insert(organizations)
      .values({
        clerkOrganizationId,
        name: organizationName,
        slug: organizationSlug,
        legalName: organizationName,
        isActive: true,
      })
      .returning();

    console.log(
      "========================================",
    );

    console.log(
      "Organization registered successfully:",
    );

    console.log(inserted[0]);

    console.log(
      "========================================",
    );
  } catch (error) {
    console.error(
      "Failed to register organization:",
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();