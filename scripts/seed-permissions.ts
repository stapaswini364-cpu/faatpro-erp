import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";

import { permissions } from "../db/schema/permissions";

// Load .env.local
config({
  path: ".env.local",
});

// ============================================================
// PERMISSION MASTER
// ============================================================

const permissionList = [
  // Ledger
  {
    module: "ledger",
    action: "view",
    code: "ledger.view",
    description: "View ledger",
  },
  {
    module: "ledger",
    action: "create",
    code: "ledger.create",
    description: "Create ledger",
  },
  {
    module: "ledger",
    action: "edit",
    code: "ledger.edit",
    description: "Edit ledger",
  },
  {
    module: "ledger",
    action: "delete",
    code: "ledger.delete",
    description: "Delete ledger",
  },

  // Voucher
  {
    module: "voucher",
    action: "view",
    code: "voucher.view",
    description: "View vouchers",
  },
  {
    module: "voucher",
    action: "create",
    code: "voucher.create",
    description: "Create voucher",
  },
  {
    module: "voucher",
    action: "edit",
    code: "voucher.edit",
    description: "Edit voucher",
  },
  {
    module: "voucher",
    action: "post",
    code: "voucher.post",
    description: "Post voucher",
  },
  {
    module: "voucher",
    action: "cancel",
    code: "voucher.cancel",
    description: "Cancel voucher",
  },
  {
    module: "voucher",
    action: "delete",
    code: "voucher.delete",
    description: "Delete voucher",
  },

  // Customer
  {
    module: "customer",
    action: "view",
    code: "customer.view",
    description: "View customers",
  },
  {
    module: "customer",
    action: "create",
    code: "customer.create",
    description: "Create customer",
  },
  {
    module: "customer",
    action: "edit",
    code: "customer.edit",
    description: "Edit customer",
  },
  {
    module: "customer",
    action: "delete",
    code: "customer.delete",
    description: "Delete customer",
  },

  // Company
  {
    module: "company",
    action: "view",
    code: "company.view",
    description: "View companies",
  },
  {
    module: "company",
    action: "create",
    code: "company.create",
    description: "Create company",
  },
  {
    module: "company",
    action: "edit",
    code: "company.edit",
    description: "Edit company",
  },
  {
    module: "company",
    action: "delete",
    code: "company.delete",
    description: "Delete company",
  },

  // Branch
  {
    module: "branch",
    action: "view",
    code: "branch.view",
    description: "View branches",
  },
  {
    module: "branch",
    action: "create",
    code: "branch.create",
    description: "Create branch",
  },
  {
    module: "branch",
    action: "edit",
    code: "branch.edit",
    description: "Edit branch",
  },
  {
    module: "branch",
    action: "delete",
    code: "branch.delete",
    description: "Delete branch",
  },

  // Financial Year
  {
    module: "financial_year",
    action: "view",
    code: "financial_year.view",
    description: "View financial years",
  },
  {
    module: "financial_year",
    action: "create",
    code: "financial_year.create",
    description: "Create financial year",
  },
  {
    module: "financial_year",
    action: "edit",
    code: "financial_year.edit",
    description: "Edit financial year",
  },
  {
    module: "financial_year",
    action: "close",
    code: "financial_year.close",
    description: "Close financial year",
  },

  // Reports
  {
    module: "report",
    action: "view",
    code: "report.view",
    description: "View reports",
  },
  {
    module: "report",
    action: "export",
    code: "report.export",
    description: "Export reports",
  },

  // User
  {
    module: "user",
    action: "view",
    code: "user.view",
    description: "View users",
  },
  {
    module: "user",
    action: "create",
    code: "user.create",
    description: "Create users",
  },
  {
    module: "user",
    action: "edit",
    code: "user.edit",
    description: "Edit users",
  },
  {
    module: "user",
    action: "delete",
    code: "user.delete",
    description: "Delete users",
  },

  // Role
  {
    module: "role",
    action: "view",
    code: "role.view",
    description: "View roles",
  },
  {
    module: "role",
    action: "create",
    code: "role.create",
    description: "Create roles",
  },
  {
    module: "role",
    action: "edit",
    code: "role.edit",
    description: "Edit roles",
  },
  {
    module: "role",
    action: "delete",
    code: "role.delete",
    description: "Delete roles",
  },
];

// ============================================================
// MAIN
// ============================================================

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing from .env.local",
    );
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log("========================================");
    console.log("FAATPRO ERP - Permission Seed");
    console.log("========================================");

    let insertedCount = 0;
    let existingCount = 0;

    for (const permission of permissionList) {
      const existing = await db
        .select()
        .from(permissions)
        .where(
          eq(
            permissions.code,
            permission.code,
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        console.log(
          `Already exists: ${permission.code}`,
        );

        existingCount++;
        continue;
      }

      await db
        .insert(permissions)
        .values(permission);

      console.log(
        `Created: ${permission.code}`,
      );

      insertedCount++;
    }

    console.log("========================================");
    console.log("Permission seed completed");
    console.log("========================================");
    console.log(
      `Created: ${insertedCount}`,
    );
    console.log(
      `Already existed: ${existingCount}`,
    );
    console.log(
      `Total permissions: ${permissionList.length}`,
    );
    console.log("========================================");
  } catch (error) {
    console.error(
      "Permission seed failed:",
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();