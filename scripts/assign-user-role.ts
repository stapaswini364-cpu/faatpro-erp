import { config } from "dotenv";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

import { organizations } from "../db/schema/organizations";
import { roles } from "../db/schema/roles";
import { userRoles } from "../db/schema/user-roles";

// ============================================================
// LOAD .env.local
// ============================================================

config({
  path: ".env.local",
});

// ============================================================
// CURRENT CLERK USER
// ============================================================
//
// Windows CMD:
//
// set CLERK_USER_ID=user_xxxxxxxxx
//
// ============================================================

const clerkUserId: string =
  process.env.CLERK_USER_ID ?? "";

if (!clerkUserId) {
  throw new Error(
    "CLERK_USER_ID is required.",
  );
}

// ============================================================
// CURRENT CLERK ORGANIZATION
// ============================================================
//
// Windows CMD:
//
// set CLERK_ORGANIZATION_ID=org_xxxxxxxxx
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
// ROLE TO ASSIGN
// ============================================================
//
// Default role:
//
// super_admin
//
// You can change it using:
//
// set ROLE_CODE=viewer
//
// ============================================================

const roleCode: string =
  process.env.ROLE_CODE ??
  "super_admin";

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
      "FAATPRO ERP - User Role Assignment",
    );

    console.log(
      "========================================",
    );

    console.log(
      "Clerk User ID:",
      clerkUserId,
    );

    console.log(
      "Clerk Organization ID:",
      clerkOrganizationId,
    );

    console.log(
      "Role Code:",
      roleCode,
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
      "Organization:",
      currentOrganization.name,
    );

    // --------------------------------------------------------
    // Find role inside current organization
    // --------------------------------------------------------

    const role = await db
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
            roleCode,
          ),

          eq(
            roles.isActive,
            true,
          ),
        ),
      )
      .limit(1);

    if (role.length === 0) {
      throw new Error(
        `Role '${roleCode}' not found for this organization. Run seed-roles.ts first.`,
      );
    }

    const currentRole =
      role[0];

    console.log(
      "Role:",
      currentRole.name,
    );

    // --------------------------------------------------------
    // Check existing assignment
    // --------------------------------------------------------

    const existing = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(
            userRoles.organizationId,
            currentOrganization.id,
          ),

          eq(
            userRoles.userId,
            clerkUserId,
          ),

          eq(
            userRoles.roleId,
            currentRole.id,
          ),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(
        "========================================",
      );

      console.log(
        "User already has this role.",
      );

      console.log(
        "UserRole ID:",
        existing[0].id,
      );

      console.log(
        "User ID:",
        clerkUserId,
      );

      console.log(
        "Tenant ID:",
        currentOrganization.id,
      );

      console.log(
        "Role:",
        currentRole.name,
      );

      console.log(
        "========================================",
      );

      return;
    }

    // --------------------------------------------------------
    // Assign role
    // --------------------------------------------------------

    const inserted = await db
      .insert(userRoles)
      .values({
        organizationId:
          currentOrganization.id,

        userId:
          clerkUserId,

        roleId:
          currentRole.id,
      })
      .returning();

    console.log(
      "========================================",
    );

    console.log(
      "User role assigned successfully",
    );

    console.log(
      "========================================",
    );

    console.log(
      "User ID:",
      clerkUserId,
    );

    console.log(
      "Clerk Organization ID:",
      clerkOrganizationId,
    );

    console.log(
      "Tenant ID:",
      currentOrganization.id,
    );

    console.log(
      "Organization:",
      currentOrganization.name,
    );

    console.log(
      "Role:",
      currentRole.name,
    );

    console.log(
      "Role Code:",
      currentRole.code,
    );

    console.log(
      "UserRole ID:",
      inserted[0].id,
    );

    console.log(
      "========================================",
    );
  } catch (error) {
    console.error(
      "User role assignment failed:",
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();