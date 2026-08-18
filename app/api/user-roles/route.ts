import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/connection";
import { getTenantContext } from "@/lib/tenant";
import { roles } from "@/db/schema/roles";
import { userRoles } from "@/db/schema/user-roles";
import { requirePermission } from "@/lib/rbac";

// ============================================================
// GET /api/user-roles?userId=<clerk-user-id>
// Permission: user_role.view
// Get roles assigned to a user inside current organization
// ============================================================

export async function GET(
  request: NextRequest,
) {
  try {
    const tenant =
      await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "user_role.view",
    );

    const userId =
      request.nextUrl.searchParams.get(
        "userId",
      );

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "userId is required",
        },
        {
          status: 400,
        },
      );
    }

    const db = getDb();

    const result =
      await db
        .select({
          id: userRoles.id,
          organizationId:
            userRoles.organizationId,
          userId:
            userRoles.userId,
          roleId:
            userRoles.roleId,
          roleName:
            roles.name,
          roleCode:
            roles.code,
          isSystemRole:
            roles.isSystemRole,
          createdAt:
            userRoles.createdAt,
        })
        .from(userRoles)
        .innerJoin(
          roles,
          eq(
            userRoles.roleId,
            roles.id,
          ),
        )
        .where(
          and(
            eq(
              userRoles.organizationId,
              tenant.organizationId,
            ),
            eq(
              userRoles.userId,
              userId,
            ),
            eq(
              roles.organizationId,
              tenant.organizationId,
            ),
            eq(
              roles.isActive,
              true,
            ),
          ),
        );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "GET /api/user-roles error:",
      error,
    );

    const status =
      error instanceof Error &&
      "status" in error &&
      typeof (
        error as { status?: unknown }
      ).status === "number"
        ? (
            error as {
              status: number;
            }
          ).status
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch user roles",
      },
      {
        status,
      },
    );
  }
}

// ============================================================
// POST /api/user-roles
// Permission: user_role.create
// Assign role to user
// ============================================================

export async function POST(
  request: NextRequest,
) {
  try {
    const tenant =
      await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "user_role.create",
    );

    const body =
      await request.json();

    const {
      userId,
      roleId,
    } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "userId is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          message: "roleId is required",
        },
        {
          status: 400,
        },
      );
    }

    const db = getDb();

    // --------------------------------------------------------
    // Verify role belongs to current organization
    // --------------------------------------------------------

    const role =
      await db
        .select({
          id: roles.id,
          name: roles.name,
          code: roles.code,
          isSystemRole:
            roles.isSystemRole,
          isActive:
            roles.isActive,
        })
        .from(roles)
        .where(
          and(
            eq(
              roles.id,
              roleId,
            ),
            eq(
              roles.organizationId,
              tenant.organizationId,
            ),
            eq(
              roles.isActive,
              true,
            ),
          ),
        )
        .limit(1);

    if (role.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role not found in this organization",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------------
    // Prevent duplicate assignment
    // --------------------------------------------------------

    const existing =
      await db
        .select({
          id: userRoles.id,
        })
        .from(userRoles)
        .where(
          and(
            eq(
              userRoles.organizationId,
              tenant.organizationId,
            ),
            eq(
              userRoles.userId,
              String(userId),
            ),
            eq(
              userRoles.roleId,
              roleId,
            ),
          ),
        )
        .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role is already assigned to this user",
        },
        {
          status: 409,
        },
      );
    }

    // --------------------------------------------------------
    // Assign role
    // --------------------------------------------------------

    const inserted =
      await db
        .insert(userRoles)
        .values({
          organizationId:
            tenant.organizationId,

          userId:
            String(userId),

          roleId,
        })
        .returning({
          id: userRoles.id,
          organizationId:
            userRoles.organizationId,
          userId:
            userRoles.userId,
          roleId:
            userRoles.roleId,
          createdAt:
            userRoles.createdAt,
        });

    return NextResponse.json(
      {
        success: true,
        message:
          "Role assigned to user successfully",
        data: {
          assignment:
            inserted[0],
          role:
            role[0],
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/user-roles error:",
      error,
    );

    const status =
      error instanceof Error &&
      "status" in error &&
      typeof (
        error as { status?: unknown }
      ).status === "number"
        ? (
            error as {
              status: number;
            }
          ).status
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to assign user role",
      },
      {
        status,
      },
    );
  }
}

// ============================================================
// DELETE /api/user-roles
// Permission: user_role.delete
// Remove role from user
// ============================================================

export async function DELETE(
  request: NextRequest,
) {
  try {
    const tenant =
      await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "user_role.delete",
    );

    const body =
      await request.json();

    const {
      userId,
      roleId,
    } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "userId is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          message: "roleId is required",
        },
        {
          status: 400,
        },
      );
    }

    const db = getDb();

    // --------------------------------------------------------
    // Verify role belongs to organization
    // --------------------------------------------------------

    const role =
      await db
        .select({
          id: roles.id,
          name: roles.name,
          code: roles.code,
          isSystemRole:
            roles.isSystemRole,
        })
        .from(roles)
        .where(
          and(
            eq(
              roles.id,
              roleId,
            ),
            eq(
              roles.organizationId,
              tenant.organizationId,
            ),
          ),
        )
        .limit(1);

    if (role.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Role not found",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------------
    // Remove role assignment
    // --------------------------------------------------------

    const deleted =
      await db
        .delete(userRoles)
        .where(
          and(
            eq(
              userRoles.organizationId,
              tenant.organizationId,
            ),
            eq(
              userRoles.userId,
              String(userId),
            ),
            eq(
              userRoles.roleId,
              roleId,
            ),
          ),
        )
        .returning({
          id: userRoles.id,
          organizationId:
            userRoles.organizationId,
          userId:
            userRoles.userId,
          roleId:
            userRoles.roleId,
        });

    if (deleted.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User role assignment not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Role removed from user successfully",
      data: deleted[0],
    });
  } catch (error) {
    console.error(
      "DELETE /api/user-roles error:",
      error,
    );

    const status =
      error instanceof Error &&
      "status" in error &&
      typeof (
        error as { status?: unknown }
      ).status === "number"
        ? (
            error as {
              status: number;
            }
          ).status
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove user role",
      },
      {
        status,
      },
    );
  }
}