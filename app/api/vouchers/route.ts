import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db/connection";
import { getTenantContext } from "@/lib/tenant";
import { requirePermission } from "@/lib/rbac";

import {
  vouchers,
  voucherEntries,
  ledgers,
} from "@/db/schema";

// ============================================================
// TYPES
// ============================================================

type VoucherEntryInput = {
  ledgerId: string;
  debitAmount?: number | string;
  creditAmount?: number | string;
  narration?: string | null;
};

type CreateVoucherBody = {
  voucherNumber?: string;
  voucherType?:
    | "journal"
    | "payment"
    | "receipt"
    | "contra"
    | "sale"
    | "service"
    | "finance";
  voucherDate?: string;
  narration?: string | null;
  entries?: VoucherEntryInput[];
};

// ============================================================
// HELPERS
// ============================================================

function toAmount(value: unknown): number {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return NaN;
  }

  return amount;
}

function isValidDate(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

// ============================================================
// GET /api/vouchers
// ============================================================
// Permission: voucher.view
// ============================================================

export async function GET() {
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
      "voucher.view",
    );

    // --------------------------------------------------------
    // Database
    // --------------------------------------------------------

    const db = getDb();

    // --------------------------------------------------------
    // Get vouchers for current organization only
    // --------------------------------------------------------

    const result = await db
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
        eq(
          vouchers.organizationId,
          tenant.organizationId,
        ),
      )
      .orderBy(
        desc(vouchers.voucherDate),
        desc(vouchers.createdAt),
      );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "GET /api/vouchers error:",
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
            : "Failed to fetch vouchers",
      },
      {
        status,
      },
    );
  }
}

// ============================================================
// POST /api/vouchers
// ============================================================
// Permission: voucher.create
// Creates ONLY draft vouchers.
// ============================================================

export async function POST(
  request: NextRequest,
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
      "voucher.create",
    );

    // --------------------------------------------------------
    // Parse body
    // --------------------------------------------------------

    const body =
      (await request.json()) as CreateVoucherBody;

    const {
      voucherNumber,
      voucherType,
      voucherDate,
      narration,
      entries,
    } = body;

    // --------------------------------------------------------
    // Required fields
    // --------------------------------------------------------

    if (
      !voucherNumber ||
      typeof voucherNumber !== "string" ||
      !voucherNumber.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Voucher number is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!voucherType) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Voucher type is required",
        },
        {
          status: 400,
        },
      );
    }

    const allowedVoucherTypes = [
      "journal",
      "payment",
      "receipt",
      "contra",
      "sale",
      "service",
      "finance",
    ];

    if (
      !allowedVoucherTypes.includes(
        voucherType,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid voucher type",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !voucherDate ||
      !isValidDate(voucherDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid voucher date is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Array.isArray(entries) ||
      entries.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least two voucher entries are required",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // Normalize entries
    // --------------------------------------------------------

    const normalizedEntries =
      entries.map(
        (entry, index) => {
          const debitAmount =
            toAmount(
              entry.debitAmount,
            );

          const creditAmount =
            toAmount(
              entry.creditAmount,
            );

          return {
            index,
            ledgerId:
              entry.ledgerId,
            debitAmount,
            creditAmount,
            narration:
              entry.narration ??
              null,
          };
        },
      );

    // --------------------------------------------------------
    // Validate ledger IDs
    // --------------------------------------------------------

    for (const entry of normalizedEntries) {
      if (
        !entry.ledgerId ||
        typeof entry.ledgerId !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Ledger ID is required for entry ${entry.index + 1}`,
          },
          {
            status: 400,
          },
        );
      }
    }

    // --------------------------------------------------------
    // Validate amounts
    // --------------------------------------------------------

    for (const entry of normalizedEntries) {
      if (
        Number.isNaN(
          entry.debitAmount,
        ) ||
        Number.isNaN(
          entry.creditAmount,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Invalid amount in entry ${entry.index + 1}`,
          },
          {
            status: 400,
          },
        );
      }

      if (
        entry.debitAmount < 0 ||
        entry.creditAmount < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Negative amounts are not allowed in entry ${entry.index + 1}`,
          },
          {
            status: 400,
          },
        );
      }

      const hasDebit =
        entry.debitAmount > 0;

      const hasCredit =
        entry.creditAmount > 0;

      if (
        (hasDebit && hasCredit) ||
        (!hasDebit && !hasCredit)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Entry ${entry.index + 1} must contain either debit or credit amount, not both`,
          },
          {
            status: 400,
          },
        );
      }
    }

    // --------------------------------------------------------
    // Calculate totals
    // --------------------------------------------------------

    const totalDebit =
      normalizedEntries.reduce(
        (sum, entry) =>
          sum + entry.debitAmount,
        0,
      );

    const totalCredit =
      normalizedEntries.reduce(
        (sum, entry) =>
          sum + entry.creditAmount,
        0,
      );

    const roundedDebit =
      Number(
        totalDebit.toFixed(2),
      );

    const roundedCredit =
      Number(
        totalCredit.toFixed(2),
      );

    // --------------------------------------------------------
    // Accounting rule
    // Debit must equal Credit
    // --------------------------------------------------------

    if (
      roundedDebit !==
      roundedCredit
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Voucher is not balanced: total debit must equal total credit",
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
            "Voucher total amount must be greater than zero",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // Database
    // --------------------------------------------------------

    const db = getDb();

    // --------------------------------------------------------
    // Check duplicate voucher number
    // --------------------------------------------------------

    const duplicateVoucher =
      await db
        .select({
          id: vouchers.id,
        })
        .from(vouchers)
        .where(
          and(
            eq(
              vouchers.organizationId,
              tenant.organizationId,
            ),
            eq(
              vouchers.voucherNumber,
              voucherNumber.trim(),
            ),
          ),
        )
        .limit(1);

    if (
      duplicateVoucher.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Voucher number already exists in this organization",
        },
        {
          status: 409,
        },
      );
    }

    // --------------------------------------------------------
    // Get unique ledger IDs
    // --------------------------------------------------------

    const ledgerIds = Array.from(
      new Set(
        normalizedEntries.map(
          (entry) =>
            entry.ledgerId,
        ),
      ),
    );

    // --------------------------------------------------------
    // Validate ledgers belong to tenant
    // --------------------------------------------------------

    const tenantLedgers =
      await db
        .select({
          id: ledgers.id,
          ledgerCode:
            ledgers.ledgerCode,
          ledgerName:
            ledgers.ledgerName,
          isActive:
            ledgers.isActive,
        })
        .from(ledgers)
        .where(
          and(
            eq(
              ledgers.organizationId,
              tenant.organizationId,
            ),
            inArray(
              ledgers.id,
              ledgerIds,
            ),
          ),
        );

    // --------------------------------------------------------
    // All ledgers must exist
    // --------------------------------------------------------

    if (
      tenantLedgers.length !==
      ledgerIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more ledger IDs are invalid or do not belong to this organization",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // All ledgers must be active
    // --------------------------------------------------------

    const inactiveLedger =
      tenantLedgers.find(
        (ledger) =>
          !ledger.isActive,
      );

    if (inactiveLedger) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Ledger '${inactiveLedger.ledgerName}' is inactive`,
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // Transaction
    // --------------------------------------------------------

    const created =
      await db.transaction(
        async (tx) => {
          // --------------------------------------------------
          // Create voucher
          // --------------------------------------------------

          const insertedVoucher =
            await tx
              .insert(vouchers)
              .values({
                organizationId:
                  tenant.organizationId,

                voucherNumber:
                  voucherNumber.trim(),

                voucherType,

                voucherDate:
                  new Date(
                    voucherDate,
                  ),

                narration:
                  narration ??
                  null,

                // Every newly created voucher
                // starts as DRAFT.
                status: "draft",

                totalAmount:
                  roundedDebit.toFixed(
                    2,
                  ),
              })
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
            insertedVoucher.length ===
            0
          ) {
            throw new Error(
              "Failed to create voucher",
            );
          }

          const voucher =
            insertedVoucher[0];

          // --------------------------------------------------
          // Create voucher entries
          // --------------------------------------------------

          await tx
            .insert(voucherEntries)
            .values(
              normalizedEntries.map(
                (entry) => ({
                  organizationId:
                    tenant.organizationId,

                  voucherId:
                    voucher.id,

                  ledgerId:
                    entry.ledgerId,

                  debitAmount:
                    entry.debitAmount.toFixed(
                      2,
                    ),

                  creditAmount:
                    entry.creditAmount.toFixed(
                      2,
                    ),

                  narration:
                    entry.narration,
                }),
              ),
            );

          return voucher;
        },
      );

    // --------------------------------------------------------
    // Success
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message:
          "Draft voucher created successfully",
        data: created,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/vouchers error:",
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
            : "Failed to create voucher",
      },
      {
        status,
      },
    );
  }
}