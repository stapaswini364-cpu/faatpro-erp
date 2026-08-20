import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/connection";
import { getTenantContext } from "@/lib/tenant";
import {
  PermissionError,
  requirePermission,
} from "@/lib/rbac";
import { roles } from "@/db/schema/roles";

// ============================================================
// GET /api/roles
// Permission: role.view
// ============================================================

export async function GET() {
  try {
    const tenant =
      await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "role.view",
    );

    const db = getDb();

    const result = await db
      .select({
        id: roles.id,
        organizationId:
          roles.organizationId,
        name: roles.name,
        code: roles.code,
        description:
          roles.description,
        isSystemRole:
          roles.isSystemRole,
        isActive:
          roles.isActive,
        createdAt:
          roles.createdAt,
        updatedAt:
          roles.updatedAt,
      })
      .from(roles)
      .where(
        and(
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
      "GET /api/roles error:",
      error,
    );

    if (
      error instanceof PermissionError
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch roles",
      },
      { status: 500 },
    );
  }
}

// ============================================================
// POST /api/roles
// Permission: role.create
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
      "role.create",
    );

    const db = getDb();

    const body =
      await request.json();

    const {
      name,
      code,
      description,
    } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role name is required",
        },
        { status: 400 },
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role code is required",
        },
        { status: 400 },
      );
    }

    const normalizedName =
      String(name)
        .trim();

    const normalizedCode =
      String(code)
        .trim()
        .toLowerCase();

    if (
      !normalizedName ||
      !normalizedCode
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role name and code are required",
        },
        { status: 400 },
      );
    }

    const existing =
      await db
        .select({
          id: roles.id,
        })
        .from(roles)
        .where(
          and(
            eq(
              roles.organizationId,
              tenant.organizationId,
            ),
            eq(
              roles.code,
              normalizedCode,
            ),
          ),
        )
        .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role code already exists in this organization",
        },
        { status: 409 },
      );
    }

    const inserted =
      await db
        .insert(roles)
        .values({
          organizationId:
            tenant.organizationId,

          name:
            normalizedName,

          code:
            normalizedCode,

          description:
            description
              ? String(
                  description,
                ).trim()
              : null,

          isSystemRole: false,
          isActive: true,
        })
        .returning({
          id: roles.id,
          organizationId:
            roles.organizationId,
          name: roles.name,
          code: roles.code,
          description:
            roles.description,
          isSystemRole:
            roles.isSystemRole,
          isActive:
            roles.isActive,
          createdAt:
            roles.createdAt,
          updatedAt:
            roles.updatedAt,
        });

    return NextResponse.json(
      {
        success: true,
        message:
          "Role created successfully",
        data: inserted[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/roles error:",
      error,
    );

    if (
      error instanceof PermissionError
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create role",
      },
      { status: 500 },
    );
  }
}

// ============================================================
// PUT /api/roles
// Permission: role.edit
// ============================================================

export async function PUT(
  request: NextRequest,
) {
  try {
    const tenant =
      await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "role.edit",
    );

    const body =
      await request.json();

    const {
      id,
      name,
      code,
      description,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role id is required",
        },
        { status: 400 },
      );
    }

    const db = getDb();

    const existingRole =
      await db
        .select({
          id: roles.id,
          organizationId:
            roles.organizationId,
          name: roles.name,
          code: roles.code,
          description:
            roles.description,
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
              String(id),
            ),
            eq(
              roles.organizationId,
              tenant.organizationId,
            ),
          ),
        )
        .limit(1);

    if (
      existingRole.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role not found",
        },
        { status: 404 },
      );
    }

    const role =
      existingRole[0];

    if (
      role.isSystemRole
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "System roles cannot be edited",
        },
        { status: 403 },
      );
    }

    let normalizedCode:
      | string
      | undefined;

    if (
      code !== undefined &&
      code !== null
    ) {
      normalizedCode =
        String(code)
          .trim()
          .toLowerCase();

      if (!normalizedCode) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Role code cannot be empty",
          },
          { status: 400 },
        );
      }
    }

    if (
      normalizedCode &&
      normalizedCode !==
        role.code
    ) {
      const duplicate =
        await db
          .select({
            id: roles.id,
          })
          .from(roles)
          .where(
            and(
              eq(
                roles.organizationId,
                tenant.organizationId,
              ),
              eq(
                roles.code,
                normalizedCode,
              ),
            ),
          )
          .limit(1);

      if (
        duplicate.length > 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Role code already exists in this organization",
          },
          { status: 409 },
        );
      }
    }

    const updated =
      await db
        .update(roles)
        .set({
          ...(name !==
            undefined && {
            name:
              String(
                name,
              ).trim(),
          }),

          ...(normalizedCode !==
            undefined && {
            code:
              normalizedCode,
          }),

          ...(description !==
            undefined && {
            description:
              description ===
              null
                ? null
                : String(
                    description,
                  ).trim(),
          }),

          ...(isActive !==
            undefined && {
            isActive:
              Boolean(
                isActive,
              ),
          }),

          updatedAt:
            new Date(),
        })
        .where(
          and(
            eq(
              roles.id,
              String(id),
            ),
            eq(
              roles.organizationId,
              tenant.organizationId,
            ),
          ),
        )
        .returning({
          id: roles.id,
          organizationId:
            roles.organizationId,
          name: roles.name,
          code: roles.code,
          description:
            roles.description,
          isSystemRole:
            roles.isSystemRole,
          isActive:
            roles.isActive,
          createdAt:
            roles.createdAt,
          updatedAt:
            roles.updatedAt,
        });

    return NextResponse.json({
      success: true,
      message:
        "Role updated successfully",
      data: updated[0],
    });
  } catch (error) {
    console.error(
      "PUT /api/roles error:",
      error,
    );

    if (
      error instanceof PermissionError
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update role",
      },
      { status: 500 },
    );
  }
}

// ============================================================
// DELETE /api/roles
// Permission: role.delete
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
      "role.delete",
    );

    const body =
      await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role id is required",
        },
        { status: 400 },
      );
    }

    const db = getDb();

    const existingRole =
      await db
        .select({
          id: roles.id,
          name: roles.name,
          code: roles.code,
          isSystemRole:
            roles.isSystemRole,
          organizationId:
            roles.organizationId,
        })
        .from(roles)
        .where(
          and(
            eq(
              roles.id,
              String(id),
            ),
            eq(
              roles.organizationId,
              tenant.organizationId,
            ),
          ),
        )
        .limit(1);

    if (
      existingRole.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role not found",
        },
        { status: 404 },
      );
    }

    const role =
      existingRole[0];

    if (
      role.isSystemRole
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "System roles cannot be deleted",
        },
        { status: 403 },
      );
    }

    const deleted =
      await db
        .delete(roles)
        .where(
          and(
            eq(
              roles.id,
              String(id),
            ),
            eq(
              roles.organizationId,
              tenant.organizationId,
            ),
          ),
        )
        .returning({
          id: roles.id,
          organizationId:
            roles.organizationId,
          name: roles.name,
          code: roles.code,
        });

    if (
      deleted.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role could not be deleted",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Role deleted successfully",
      data: deleted[0],
    });
  } catch (error) {
    console.error(
      "DELETE /api/roles error:",
      error,
    );

    if (
      error instanceof PermissionError
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete role",
      },
      { status: 500 },
    );
  }
}