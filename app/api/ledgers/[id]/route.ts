import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getTenantContext } from "@/lib/tenant";
import { getDb } from "@/db/connection";
import { requirePermission } from "@/lib/rbac";
import { ledgers } from "@/db/schema/ledgers";

type RouteContext = {
  params: {
    id: string;
  };
};

// ============================================================
// GET /api/ledgers/[id]
// Permission: ledger.view
// ============================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const tenant = await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "ledger.view",
    );

    const db = getDb();

    const result = await db
      .select({
        id: ledgers.id,
        organizationId: ledgers.organizationId,
        ledgerCode: ledgers.ledgerCode,
        ledgerName: ledgers.ledgerName,
        description: ledgers.description,
        isActive: ledgers.isActive,
        createdAt: ledgers.createdAt,
        updatedAt: ledgers.updatedAt,
      })
      .from(ledgers)
      .where(
        and(
          eq(ledgers.id, params.id),
          eq(
            ledgers.organizationId,
            tenant.organizationId,
          ),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Ledger not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error(
      "GET /api/ledgers/[id] error:",
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
            : "Failed to fetch ledger",
      },
      { status },
    );
  }
}

// ============================================================
// PUT /api/ledgers/[id]
// Permission: ledger.edit
// ============================================================

export async function PUT(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const tenant = await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "ledger.edit",
    );

    const body = await request.json();

    const {
      ledgerCode,
      ledgerName,
      description,
      isActive,
    } = body;

    if (!ledgerName) {
      return NextResponse.json(
        {
          success: false,
          message: "Ledger name is required",
        },
        { status: 400 },
      );
    }

    const db = getDb();

    // --------------------------------------------------------
    // Check current tenant ledger
    // --------------------------------------------------------

    const existingLedger = await db
      .select({
        id: ledgers.id,
        ledgerCode: ledgers.ledgerCode,
      })
      .from(ledgers)
      .where(
        and(
          eq(ledgers.id, params.id),
          eq(
            ledgers.organizationId,
            tenant.organizationId,
          ),
        ),
      )
      .limit(1);

    if (existingLedger.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Ledger not found",
        },
        { status: 404 },
      );
    }

    // --------------------------------------------------------
    // Duplicate ledger code check
    // --------------------------------------------------------

    if (
      ledgerCode &&
      ledgerCode !== existingLedger[0].ledgerCode
    ) {
      const duplicate = await db
        .select({
          id: ledgers.id,
        })
        .from(ledgers)
        .where(
          and(
            eq(
              ledgers.organizationId,
              tenant.organizationId,
            ),
            eq(
              ledgers.ledgerCode,
              ledgerCode,
            ),
          ),
        )
        .limit(1);

      if (duplicate.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Ledger code already exists in this organization",
          },
          { status: 409 },
        );
      }
    }

    // --------------------------------------------------------
    // Update ledger
    // --------------------------------------------------------

    const updated = await db
      .update(ledgers)
      .set({
        ...(ledgerCode !== undefined && {
          ledgerCode,
        }),

        ledgerName,

        ...(description !== undefined && {
          description: description || null,
        }),

        ...(isActive !== undefined && {
          isActive: Boolean(isActive),
        }),

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(ledgers.id, params.id),
          eq(
            ledgers.organizationId,
            tenant.organizationId,
          ),
        ),
      )
      .returning({
        id: ledgers.id,
        organizationId: ledgers.organizationId,
        ledgerCode: ledgers.ledgerCode,
        ledgerName: ledgers.ledgerName,
        description: ledgers.description,
        isActive: ledgers.isActive,
        createdAt: ledgers.createdAt,
        updatedAt: ledgers.updatedAt,
      });

    if (updated.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Ledger not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ledger updated successfully",
      data: updated[0],
    });
  } catch (error) {
    console.error(
      "PUT /api/ledgers/[id] error:",
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
            : "Failed to update ledger",
      },
      { status },
    );
  }
}

// ============================================================
// DELETE /api/ledgers/[id]
// Permission: ledger.delete
// ============================================================

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const tenant = await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "ledger.delete",
    );

    const db = getDb();

    const deleted = await db
      .delete(ledgers)
      .where(
        and(
          eq(ledgers.id, params.id),
          eq(
            ledgers.organizationId,
            tenant.organizationId,
          ),
        ),
      )
      .returning({
        id: ledgers.id,
        ledgerCode: ledgers.ledgerCode,
        ledgerName: ledgers.ledgerName,
      });

    if (deleted.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Ledger not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ledger deleted successfully",
      data: deleted[0],
    });
  } catch (error) {
    console.error(
      "DELETE /api/ledgers/[id] error:",
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
            : "Failed to delete ledger",
      },
      { status },
    );
  }
}