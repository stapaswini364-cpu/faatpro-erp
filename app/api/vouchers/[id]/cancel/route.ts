import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/connection";
import { getTenantContext } from "@/lib/tenant";
import { requirePermission } from "@/lib/rbac";

import { vouchers } from "@/db/schema";

type RouteContext = {
  params: {
    id: string;
  };
};

// ============================================================
// POST /api/vouchers/[id]/cancel
// Permission: voucher.cancel
//
// Posted → Cancelled
//
// Draft      → blocked
// Cancelled  → blocked
// ============================================================

export async function POST(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    // --------------------------------------------------------
    // Tenant
    // --------------------------------------------------------

    const tenant = await getTenantContext();

    // --------------------------------------------------------
    // RBAC
    // --------------------------------------------------------

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "voucher.cancel",
    );

    const db = getDb();

    // --------------------------------------------------------
    // Find voucher
    // --------------------------------------------------------

    const voucherResult = await db
      .select({
        id: vouchers.id,
        organizationId: vouchers.organizationId,
        voucherNumber: vouchers.voucherNumber,
        voucherType: vouchers.voucherType,
        voucherDate: vouchers.voucherDate,
        narration: vouchers.narration,
        status: vouchers.status,
        totalAmount: vouchers.totalAmount,
        createdAt: vouchers.createdAt,
        updatedAt: vouchers.updatedAt,
      })
      .from(vouchers)
      .where(
        and(
          eq(vouchers.id, params.id),
          eq(
            vouchers.organizationId,
            tenant.organizationId,
          ),
        ),
      )
      .limit(1);

    if (voucherResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Voucher not found",
        },
        {
          status: 404,
        },
      );
    }

    const voucher = voucherResult[0];

    // --------------------------------------------------------
    // Only POSTED voucher can be cancelled
    // --------------------------------------------------------

    if (voucher.status !== "posted") {
      return NextResponse.json(
        {
          success: false,
          message:
            `Voucher cannot be cancelled because its status is '${voucher.status}'`,
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // Cancel voucher
    // --------------------------------------------------------

    const updated = await db
      .update(vouchers)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(vouchers.id, params.id),
          eq(
            vouchers.organizationId,
            tenant.organizationId,
          ),
          eq(vouchers.status, "posted"),
        ),
      )
      .returning({
        id: vouchers.id,
        organizationId: vouchers.organizationId,
        voucherNumber: vouchers.voucherNumber,
        voucherType: vouchers.voucherType,
        voucherDate: vouchers.voucherDate,
        narration: vouchers.narration,
        status: vouchers.status,
        totalAmount: vouchers.totalAmount,
        createdAt: vouchers.createdAt,
        updatedAt: vouchers.updatedAt,
      });

    if (updated.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Voucher could not be cancelled",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Voucher cancelled successfully",
      data: updated[0],
    });
  } catch (error) {
    console.error(
      "POST /api/vouchers/[id]/cancel error:",
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
            : "Failed to cancel voucher",
      },
      {
        status,
      },
    );
  }
}