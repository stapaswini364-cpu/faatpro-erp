import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/connection";
import { getTenantContext } from "@/lib/tenant";
import { permissions } from "@/db/schema/permissions";
import { rolePermissions } from "@/db/schema/role-permissions";
import { roles } from "@/db/schema/roles";
import { requirePermission } from "@/lib/rbac";

// ============================================================
// GET /api/role-permissions?roleId=<role-id>
// Permission: role_permission.view
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
      "role_permission.view",
    );

    const roleId =
      request.nextUrl.searchParams.get(
        "roleId",
      );

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

    const result =
      await db
        .select({
          id: permissions.id,
          module:
            permissions.module,
          action:
            permissions.action,
          code:
            permissions.code,
          description:
            permissions.description,
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(
            rolePermissions.permissionId,
            permissions.id,
          ),
        )
        .where(
          eq(
            rolePermissions.roleId,
            roleId,
          ),
        )
        .orderBy(
          permissions.module,
          permissions.action,
        );

    return NextResponse.json({
      success: true,
      data: {
        role: role[0],
        permissions: result,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/role-permissions error:",
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
            : "Failed to fetch role permissions",
      },
      {
        status,
      },
    );
  }
}

// ============================================================
// POST /api/role-permissions
// Permission: role_permission.create
// Assign permission to role
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
      "role_permission.create",
    );

    const body =
      await request.json();

    const {
      roleId,
      permissionId,
    } = body;

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

    if (!permissionId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "permissionId is required",
        },
        {
          status: 400,
        },
      );
    }

    const db = getDb();

    // --------------------------------------------------------
    // Verify role belongs to tenant
    // --------------------------------------------------------

    const role =
      await db
        .select({
          id: roles.id,
          name: roles.name,
          code: roles.code,
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
    // Verify permission exists
    // --------------------------------------------------------

    const permission =
      await db
        .select({
          id: permissions.id,
          module:
            permissions.module,
          action:
            permissions.action,
          code:
            permissions.code,
        })
        .from(permissions)
        .where(
          eq(
            permissions.id,
            permissionId,
          ),
        )
        .limit(1);

    if (permission.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Permission not found",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------------
    // Duplicate check
    // --------------------------------------------------------

    const existing =
      await db
        .select({
          id: rolePermissions.id,
        })
        .from(rolePermissions)
        .where(
          and(
            eq(
              rolePermissions.roleId,
              roleId,
            ),
            eq(
              rolePermissions.permissionId,
              permissionId,
            ),
          ),
        )
        .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Permission is already assigned to this role",
        },
        {
          status: 409,
        },
      );
    }

    // --------------------------------------------------------
    // Assign permission
    // --------------------------------------------------------

    const inserted =
      await db
        .insert(rolePermissions)
        .values({
          roleId,
          permissionId,
        })
        .returning({
          id: rolePermissions.id,
          roleId:
            rolePermissions.roleId,
          permissionId:
            rolePermissions.permissionId,
          createdAt:
            rolePermissions.createdAt,
        });

    return NextResponse.json(
      {
        success: true,
        message:
          "Permission assigned to role successfully",
        data: {
          role: role[0],
          permission:
            permission[0],
          assignment:
            inserted[0],
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/role-permissions error:",
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
            : "Failed to assign permission",
      },
      {
        status,
      },
    );
  }
}

// ============================================================
// DELETE /api/role-permissions
// Permission: role_permission.delete
// Remove permission from role
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
      "role_permission.delete",
    );

    const body =
      await request.json();

    const {
      roleId,
      permissionId,
    } = body;

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

    if (!permissionId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "permissionId is required",
        },
        {
          status: 400,
        },
      );
    }

    const db = getDb();

    // --------------------------------------------------------
    // Verify role belongs to tenant
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

    const deleted =
      await db
        .delete(rolePermissions)
        .where(
          and(
            eq(
              rolePermissions.roleId,
              roleId,
            ),
            eq(
              rolePermissions.permissionId,
              permissionId,
            ),
          ),
        )
        .returning({
          id: rolePermissions.id,
          roleId:
            rolePermissions.roleId,
          permissionId:
            rolePermissions.permissionId,
        });

    if (deleted.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role permission assignment not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Permission removed from role successfully",
      data: deleted[0],
    });
  } catch (error) {
    console.error(
      "DELETE /api/role-permissions error:",
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
            : "Failed to remove role permission",
      },
      {
        status,
      },
    );
  }
}