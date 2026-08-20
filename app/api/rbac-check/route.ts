import { NextResponse } from "next/server";

import { getTenantContext } from "@/lib/tenant";
import { getUserPermissions } from "@/lib/rbac";

// ============================================================
// GET /api/rbac-check
// Returns permissions assigned to the current signed-in user
// inside the current organization.
// ============================================================

export async function GET() {
  try {
    const tenant =
      await getTenantContext();

    const userPermissions =
      await getUserPermissions(
        tenant.userId,
        tenant.organizationId,
      );

    return NextResponse.json({
      success: true,
      userId: tenant.userId,
      organizationId:
        tenant.organizationId,
      permissions: userPermissions,
    });
  } catch (error) {
    console.error(
      "GET /api/rbac-check error:",
      error,
    );

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