import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/connection";
import { getTenantContext } from "@/lib/tenant";
import { requirePermission } from "@/lib/rbac";
import { roles } from "@/db/schema/roles";

export async function GET() {
  try {
    const tenant = await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "role.view",
    );

    const db = getDb();

    const result = await db
      .select({
        id: roles.id,
        organizationId: roles.organizationId,
        name: roles.name,
        code: roles.code,
        description: roles.description,
        isSystemRole: roles.isSystemRole,
        isActive: roles.isActive,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
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

    const status =
      error instanceof Error &&
      "status" in error &&
      typeof (error as { status?: unknown }).status ===
        "number"
        ? (error as { status: number }).status
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch roles",
      },
      {
        status,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const tenant = await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "role.create",
    );

    const db = getDb();

    const body = await request.json();

    const {
      name,
      code,
      description,
    } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Role name is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Role code is required",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedCode =
      String(code)
        .trim()
        .toLowerCase();

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
        {
          status: 409,
        },
      );
    }

    const inserted =
      await db
        .insert(roles)
        .values({
          organizationId:
            tenant.organizationId,

          name: String(name).trim(),

          code: normalizedCode,

          description:
            description
              ? String(description).trim()
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
        message: "Role created successfully",
        data: inserted[0],
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/roles error:",
      error,
    );

    const status =
      error instanceof Error &&
      "status" in error &&
      typeof (error as { status?: unknown }).status ===
        "number"
        ? (error as { status: number }).status
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create role",
      },
      {
        status,
      },
    );
  }
}