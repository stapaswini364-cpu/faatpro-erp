import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";

import { getDb } from "@/db/connection";
import { getTenantContext } from "@/lib/tenant";
import { permissions } from "@/db/schema/permissions";

export async function GET() {
  try {
    const tenant = await getTenantContext();
    const db = getDb();

    const result = await db
      .select({
        id: permissions.id,
        module: permissions.module,
        action: permissions.action,
        code: permissions.code,
        description: permissions.description,
      })
      .from(permissions)
      .where(
        inArray(permissions.module, [
          "role",
          "permission",
          "role_permission",
          "user_role",
        ]),
      );

    return NextResponse.json({
      success: true,
      organizationId: tenant.organizationId,
      permissions: result,
    });
  } catch (error) {
    console.error("RBAC check error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to check RBAC permissions",
      },
      { status: 500 },
    );
  }
}