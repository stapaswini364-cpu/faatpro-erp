import { config } from "dotenv";
import postgres from "postgres";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

import { organizations } from "../db/schema/organizations";
import { permissions } from "../db/schema/permissions";
import { rolePermissions } from "../db/schema/role-permissions";
import { roles } from "../db/schema/roles";

config({
  path: ".env.local",
});

const clerkOrganizationId: string =
  process.env.CLERK_ORGANIZATION_ID ?? "";

if (!clerkOrganizationId) {
  throw new Error(
    "CLERK_ORGANIZATION_ID is required.",
  );
}

const rolePermissionMap: Record<string, string[]> = {
  super_admin: [
    "ledger.view",
    "ledger.create",
    "ledger.edit",
    "ledger.delete",

    "voucher.view",
    "voucher.create",
    "voucher.edit",
    "voucher.post",
    "voucher.cancel",
    "voucher.delete",

    "customer.view",
    "customer.create",
    "customer.edit",
    "customer.delete",

    "company.view",
    "company.create",
    "company.edit",
    "company.delete",

    "branch.view",
    "branch.create",
    "branch.edit",
    "branch.delete",

    "financial_year.view",
    "financial_year.create",
    "financial_year.edit",
    "financial_year.close",

    "report.view",
    "report.export",

    "user.view",
    "user.create",
    "user.edit",
    "user.delete",

    "role.view",
    "role.create",
    "role.edit",
    "role.delete",
  ],

  company_admin: [
    "company.view",
    "company.create",
    "company.edit",
    "company.delete",

    "branch.view",
    "branch.create",
    "branch.edit",
    "branch.delete",

    "customer.view",
    "customer.create",
    "customer.edit",
    "customer.delete",

    "user.view",
    "user.create",
    "user.edit",
    "user.delete",

    "role.view",
    "role.create",
    "role.edit",

    "ledger.view",
    "ledger.create",
    "ledger.edit",

    "voucher.view",
    "voucher.create",
    "voucher.edit",
    "voucher.post",
    "voucher.cancel",

    "financial_year.view",
    "financial_year.create",
    "financial_year.edit",

    "report.view",
    "report.export",
  ],

  finance_manager: [
    "ledger.view",
    "ledger.create",
    "ledger.edit",

    "voucher.view",
    "voucher.create",
    "voucher.edit",
    "voucher.post",
    "voucher.cancel",

    "financial_year.view",
    "financial_year.create",
    "financial_year.edit",
    "financial_year.close",

    "report.view",
    "report.export",

    "customer.view",
  ],

  accountant: [
    "ledger.view",
    "ledger.create",
    "ledger.edit",

    "voucher.view",
    "voucher.create",
    "voucher.edit",

    "customer.view",

    "financial_year.view",

    "report.view",
    "report.export",
  ],

  auditor: [
    "ledger.view",
    "voucher.view",
    "customer.view",
    "company.view",
    "branch.view",
    "financial_year.view",
    "report.view",
    "report.export",
    "user.view",
    "role.view",
  ],

  viewer: [
    "ledger.view",
    "voucher.view",
    "customer.view",
    "company.view",
    "branch.view",
    "financial_year.view",
    "report.view",
  ],
};

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
    console.log("========================================");
    console.log("FAATPRO ERP - Role Permission Seed");
    console.log("========================================");

    console.log(
      "Clerk Organization ID:",
      clerkOrganizationId,
    );

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

    console.log("----------------------------------------");

    const organizationRoles =
      await db
        .select()
        .from(roles)
        .where(
          eq(
            roles.organizationId,
            currentOrganization.id,
          ),
        );

    if (organizationRoles.length === 0) {
      throw new Error(
        "No roles found for this organization. Run seed-roles.ts first.",
      );
    }

    const allPermissions =
      await db.select().from(permissions);

    if (allPermissions.length === 0) {
      throw new Error(
        "No permissions found. Run seed-permissions.ts first.",
      );
    }

    const permissionMap = new Map<
      string,
      (typeof allPermissions)[number]
    >();

    for (const permission of allPermissions) {
      permissionMap.set(
        permission.code,
        permission,
      );
    }

    let createdCount = 0;
    let existingCount = 0;

    for (const role of organizationRoles) {
      const permissionCodes =
        rolePermissionMap[role.code];

      if (!permissionCodes) {
        console.log(
          `No permission mapping found for role: ${role.code}`,
        );
        continue;
      }

      console.log(
        `Role: ${role.name}`,
      );

      console.log(
        `Permissions: ${permissionCodes.length}`,
      );

      const permissionIds: string[] = [];

      for (const code of permissionCodes) {
        const permission =
          permissionMap.get(code);

        if (!permission) {
          throw new Error(
            `Permission not found: ${code}`,
          );
        }

        permissionIds.push(
          permission.id,
        );
      }

      const existingMappings =
        await db
          .select({
            permissionId:
              rolePermissions.permissionId,
          })
          .from(rolePermissions)
          .where(
            and(
              eq(
                rolePermissions.roleId,
                role.id,
              ),
              inArray(
                rolePermissions.permissionId,
                permissionIds,
              ),
            ),
          );

      const existingPermissionIds =
        new Set<string>();

      for (const mapping of existingMappings) {
        existingPermissionIds.add(
          mapping.permissionId,
        );
      }

      for (const permissionId of permissionIds) {
        if (
          existingPermissionIds.has(
            permissionId,
          )
        ) {
          existingCount++;
          continue;
        }

        await db
          .insert(rolePermissions)
          .values({
            roleId: role.id,
            permissionId,
          });

        const permission =
          allPermissions.find(
            (item) =>
              item.id === permissionId,
          );

        console.log(
          `  Created: ${permission?.code ?? permissionId}`,
        );

        createdCount++;
      }

      console.log("----------------------------------------");
    }

    console.log(
      "========================================",
    );

    console.log(
      "Role permission seed completed",
    );

    console.log(
      "========================================",
    );

    console.log(
      `Created mappings: ${createdCount}`,
    );

    console.log(
      `Already existed: ${existingCount}`,
    );

    console.log(
      "========================================",
    );
  } catch (error) {
    console.error(
      "Role permission seed failed:",
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();