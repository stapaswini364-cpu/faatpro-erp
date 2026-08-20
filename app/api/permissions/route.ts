import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/connection";
import { getTenantContext } from "@/lib/tenant";
import { permissions } from "@/db/schema/permissions";

// ============================================================
// GET /api/permissions
// Returns all available permissions
// ============================================================

export async function GET() {
  try {
    await getTenantContext();

    const db = getDb();

    const result = await db
      .select({
        id: permissions.id,
        module: permissions.module,
        action: permissions.action,
        code: permissions.code,
        description: permissions.description,
        createdAt: permissions.createdAt,
      })
      .from(permissions)
      .orderBy(
        permissions.module,
        permissions.action,
      );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "GET /api/permissions error:",
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
            : "Failed to fetch permissions",
      },
      {
        status,
      },
    );
  }
}

// ============================================================
// POST /api/permissions
// Create permission
// ============================================================

export async function POST(
  request: NextRequest,
) {
  try {
    await getTenantContext();

    const body = await request.json();

    const {
      module,
      action,
      code,
      description,
    } = body;

    if (!module) {
      return NextResponse.json(
        {
          success: false,
          message: "Module is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          message: "Action is required",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedModule =
      String(module)
        .trim()
        .toLowerCase();

    const normalizedAction =
      String(action)
        .trim()
        .toLowerCase();

    const normalizedCode =
      code
        ? String(code)
            .trim()
            .toLowerCase()
        : `${normalizedModule}.${normalizedAction}`;

    const db = getDb();

    // --------------------------------------------------------
    // Duplicate permission check
    // --------------------------------------------------------

    const existing =
      await db
        .select({
          id: permissions.id,
        })
        .from(permissions)
        .where(
          eq(
            permissions.code,
            normalizedCode,
          ),
        )
        .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Permission code already exists",
        },
        {
          status: 409,
        },
      );
    }

    // --------------------------------------------------------
    // Create permission
    // --------------------------------------------------------

    const inserted =
      await db
        .insert(permissions)
        .values({
          module:
            normalizedModule,

          action:
            normalizedAction,

          code:
            normalizedCode,

          description:
            description
              ? String(description).trim()
              : null,
        })
        .returning({
          id: permissions.id,
          module: permissions.module,
          action: permissions.action,
          code: permissions.code,
          description:
            permissions.description,
          createdAt:
            permissions.createdAt,
        });

    return NextResponse.json(
      {
        success: true,
        message:
          "Permission created successfully",
        data: inserted[0],
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/permissions error:",
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
            : "Failed to create permission",
      },
      {
        status,
      },
    );
  }
}