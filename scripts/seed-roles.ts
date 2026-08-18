import { config } from "dotenv";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

import { organizations } from "../db/schema/organizations";
import { roles } from "../db/schema/roles";

// ============================================================
// LOAD .env.local
// ============================================================

config({
  path: ".env.local",
});

// ============================================================
// CURRENT CLERK ORGANIZATION
// ============================================================
//
// Do NOT hardcode organization ID.
//
// Windows CMD:
//
// set CLERK_ORGANIZATION_ID=org_xxxxxxxxx
//
// Then:
//
// npx tsx scripts\seed-roles.ts
//
// ============================================================

const clerkOrganizationId: string =
  process.env.CLERK_ORGANIZATION_ID ?? "";

if (!clerkOrganizationId) {
  throw new Error(
    "CLERK_ORGANIZATION_ID is required.",
  );
}

// ============================================================
// ROLE MASTER
// ============================================================

const roleList = [
  {
    name: "Super Admin",
    code: "super_admin",
    description:
      "Full access to all organization modules and permissions.",
    isSystemRole: true,
  },

  {
    name: "Company Admin",
    code: "company_admin",
    description:
      "Administrative access to company and operational modules.",
    isSystemRole: true,
  },

  {
    name: "Finance Manager",
    code: "finance_manager",
    description:
      "Access to finance, ledger, voucher and financial reports.",
    isSystemRole: true,
  },

  {
    name: "Accountant",
    code: "accountant",
    description:
      "Access to accounting operations and voucher processing.",
    isSystemRole: true,
  },

  {
    name: "Auditor",
    code: "auditor",
    description:
      "Read-only access for auditing and reporting.",
    isSystemRole: true,
  },

  {
    name: "Viewer",
    code: "viewer",
    description:
      "Read-only access to permitted modules.",
    isSystemRole: true,
  },
];

// ============================================================
// MAIN
// ============================================================

async function main() {
  const connectionString =
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing from .env.local",
    );
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log(
      "========================================",
    );

    console.log(
      "FAATPRO ERP - Role Seed",
    );

    console.log(
      "========================================",
    );

    console.log(
      "Clerk Organization ID:",
      clerkOrganizationId,
    );

    // --------------------------------------------------------
    // Find FAATPRO organization
    // --------------------------------------------------------

    const organization = await db
      .select()
      .from(organizations)
      .where(
        eq(
          organizations.clerkOrganizationId,
          clerkOrganizationId,
        ),
      )
      .limit(1);

    if (organization.length === 0) {
      throw new Error(
        `Organization not registered in FAATPRO: ${clerkOrganizationId}`,
      );
    }

    const currentOrganization =
      organization[0];

    console.log(
      "FAATPRO Tenant ID:",
      currentOrganization.id,
    );

    console.log(
      "Organization Name:",
      currentOrganization.name,
    );

    console.log(
      "========================================",
    );

    let createdCount = 0;
    let existingCount = 0;

    // --------------------------------------------------------
    // Create roles
    // --------------------------------------------------------

    for (const role of roleList) {
      const existing = await db
        .select()
        .from(roles)
        .where(
          and(
            eq(
              roles.organizationId,
              currentOrganization.id,
            ),
            eq(
              roles.code,
              role.code,
            ),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        console.log(
          `Already exists: ${role.name}`,
        );

        existingCount++;

        continue;
      }

      await db
        .insert(roles)
        .values({
          organizationId:
            currentOrganization.id,

          name: role.name,

          code: role.code,

          description:
            role.description,

          isSystemRole:
            role.isSystemRole,

          isActive: true,
        });

      console.log(
        `Created: ${role.name}`,
      );

      createdCount++;
    }

    // --------------------------------------------------------
    // Summary
    // --------------------------------------------------------

    console.log(
      "========================================",
    );

    console.log(
      "Role seed completed",
    );

    console.log(
      "========================================",
    );

    console.log(
      `Created: ${createdCount}`,
    );

    console.log(
      `Already existed: ${existingCount}`,
    );

    console.log(
      `Total roles: ${roleList.length}`,
    );

    console.log(
      "========================================",
    );
  } catch (error) {
    console.error(
      "Role seed failed:",
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();