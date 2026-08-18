import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/connection";
import { getTenantContext } from "@/lib/tenant";
import { requirePermission } from "@/lib/rbac";

import {
  vouchers,
  voucherEntries,
} from "@/db/schema";

type RouteContext = {
  params: {
    id: string;
  };
};

// ============================================================
// POST /api/vouchers/[id]/post
// Permission: voucher.post
//
// Draft → Posted
//
// Posted     → blocked
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

    const tenant =
      await getTenantContext();

    // --------------------------------------------------------
    // RBAC
    // --------------------------------------------------------

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "voucher.post",
    );

    const db = getDb();

    // --------------------------------------------------------
    // Find voucher
    // --------------------------------------------------------

    const voucherResult =
      await db
        .select({
          id: vouchers.id,
          organizationId:
            vouchers.organizationId,
          voucherNumber:
            vouchers.voucherNumber,
          voucherType:
            vouchers.voucherType,
          voucherDate:
            vouchers.voucherDate,
          narration:
            vouchers.narration,
          status:
            vouchers.status,
          totalAmount:
            vouchers.totalAmount,
          createdAt:
            vouchers.createdAt,
          updatedAt:
            vouchers.updatedAt,
        })
        .from(vouchers)
        .where(
          and(
            eq(
              vouchers.id,
              params.id,
            ),
            eq(
              vouchers.organizationId,
              tenant.organizationId,
            ),
          ),
        )
        .limit(1);

    if (
      voucherResult.length === 0
    ) {
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

    const voucher =
      voucherResult[0];

    // --------------------------------------------------------
    // Status validation
    // --------------------------------------------------------

    if (
      voucher.status !== "draft"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Voucher cannot be posted because its status is '${voucher.status}'`,
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // Get entries
    // --------------------------------------------------------

    const entries =
      await db
        .select({
          id: voucherEntries.id,
          ledgerId:
            voucherEntries.ledgerId,
          debitAmount:
            voucherEntries.debitAmount,
          creditAmount:
            voucherEntries.creditAmount,
        })
        .from(voucherEntries)
        .where(
          and(
            eq(
              voucherEntries.voucherId,
              voucher.id,
            ),
            eq(
              voucherEntries.organizationId,
              tenant.organizationId,
            ),
          ),
        );

    // --------------------------------------------------------
    // Entry validation
    // --------------------------------------------------------

    if (entries.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Voucher must contain at least two entries before posting",
        },
        {
          status: 400,
        },
      );
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      const debit = Number(
        entry.debitAmount,
      );

      const credit = Number(
        entry.creditAmount,
      );

      if (
        !Number.isFinite(debit) ||
        !Number.isFinite(credit)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Voucher contains an invalid entry amount",
          },
          {
            status: 400,
          },
        );
      }

      totalDebit += debit;
      totalCredit += credit;
    }

    const roundedDebit = Number(
      totalDebit.toFixed(2),
    );

    const roundedCredit = Number(
      totalCredit.toFixed(2),
    );

    // --------------------------------------------------------
    // Accounting validation
    // --------------------------------------------------------

    if (
      roundedDebit !==
      roundedCredit
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Voucher cannot be posted because total debit does not equal total credit",
          data: {
            totalDebit:
              roundedDebit.toFixed(2),
            totalCredit:
              roundedCredit.toFixed(2),
          },
        },
        {
          status: 400,
        },
      );
    }

    if (roundedDebit <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Voucher amount must be greater than zero",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // Post voucher
    // --------------------------------------------------------

    const updated =
      await db
        .update(vouchers)
        .set({
          status: "posted",

          totalAmount:
            roundedDebit.toFixed(2),

          updatedAt:
            new Date(),
        })
        .where(
          and(
            eq(
              vouchers.id,
              params.id,
            ),
            eq(
              vouchers.organizationId,
              tenant.organizationId,
            ),
            eq(
              vouchers.status,
              "draft",
            ),
          ),
        )
        .returning({
          id: vouchers.id,
          organizationId:
            vouchers.organizationId,
          voucherNumber:
            vouchers.voucherNumber,
          voucherType:
            vouchers.voucherType,
          voucherDate:
            vouchers.voucherDate,
          narration:
            vouchers.narration,
          status:
            vouchers.status,
          totalAmount:
            vouchers.totalAmount,
          createdAt:
            vouchers.createdAt,
          updatedAt:
            vouchers.updatedAt,
        });

    if (
      updated.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Voucher could not be posted",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Voucher posted successfully",
      data: updated[0],
    });
  } catch (error) {
    console.error(
      "POST /api/vouchers/[id]/post error:",
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
            : "Failed to post voucher",
      },
      {
        status,
      },
    );
  }
}