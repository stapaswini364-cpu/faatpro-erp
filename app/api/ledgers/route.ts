import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { getTenantContext } from "@/lib/tenant";
import { requirePermission } from "@/lib/rbac";
import { getDb } from "@/db/connection";
import { ledgers } from "@/db/schema/ledgers";

// ============================================================
// GET /api/ledgers
// Permission: ledger.view
// ============================================================

export async function GET() {
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
        eq(
          ledgers.organizationId,
          tenant.organizationId,
        ),
      )
      .orderBy(desc(ledgers.createdAt));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Ledger GET error:", error);

    const status =
      error instanceof Error &&
      "status" in error
        ? Number(
            (error as Error & {
              status?: number;
            }).status,
          )
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch ledgers",
      },
      { status },
    );
  }
}

// ============================================================
// POST /api/ledgers
// Permission: ledger.create
// ============================================================

export async function POST(
  request: NextRequest,
) {
  try {
    const tenant = await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "ledger.create",
    );

    const body = await request.json();

    const {
      ledgerCode,
      ledgerName,
      description,
    } = body;

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (!ledgerCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Ledger code is required",
        },
        { status: 400 },
      );
    }

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
    // Duplicate check
    // Tenant specific
    // --------------------------------------------------------

    const existing = await db
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

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ledger code already exists in this organization",
        },
        { status: 409 },
      );
    }

    // --------------------------------------------------------
    // Create ledger
    // organizationId ALWAYS comes from tenant context
    // --------------------------------------------------------

    const inserted = await db
      .insert(ledgers)
      .values({
        organizationId:
          tenant.organizationId,

        ledgerCode,

        ledgerName,

        description:
          description || null,

        isActive: true,
      })
      .returning({
        id: ledgers.id,
        organizationId:
          ledgers.organizationId,
        ledgerCode:
          ledgers.ledgerCode,
        ledgerName:
          ledgers.ledgerName,
        description:
          ledgers.description,
        isActive:
          ledgers.isActive,
        createdAt:
          ledgers.createdAt,
        updatedAt:
          ledgers.updatedAt,
      });

    return NextResponse.json(
      {
        success: true,
        message: "Ledger created successfully",
        data: inserted[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Ledger POST error:", error);

    const status =
      error instanceof Error &&
      "status" in error
        ? Number(
            (error as Error & {
              status?: number;
            }).status,
          )
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create ledger",
      },
      { status },
    );
  }
}