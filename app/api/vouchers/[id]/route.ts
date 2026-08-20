import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";

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

type RouteContext = {
  params: {
    id: string;
  };
};

type VoucherEntryInput = {
  ledgerId: string;
  debitAmount?: number | string;
  creditAmount?: number | string;
  narration?: string | null;
};

type UpdateVoucherBody = {
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

function getErrorStatus(error: unknown): number {
  if (
    error instanceof Error &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }

  return 500;
}

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

function validateEntries(entries: VoucherEntryInput[]) {
  if (
    !Array.isArray(entries) ||
    entries.length < 2
  ) {
    return {
      valid: false,
      message:
        "At least two voucher entries are required",
    };
  }

  const normalizedEntries = entries.map(
    (entry, index) => {
      const debitAmount = toAmount(
        entry.debitAmount,
      );

      const creditAmount = toAmount(
        entry.creditAmount,
      );

      return {
        index,
        ledgerId: entry.ledgerId,
        debitAmount,
        creditAmount,
        narration:
          entry.narration ?? null,
      };
    },
  );

  for (const entry of normalizedEntries) {
    if (
      !entry.ledgerId ||
      typeof entry.ledgerId !== "string"
    ) {
      return {
        valid: false,
        message:
          `Ledger ID is required for entry ${entry.index + 1}`,
      };
    }

    if (
      Number.isNaN(entry.debitAmount) ||
      Number.isNaN(entry.creditAmount)
    ) {
      return {
        valid: false,
        message:
          `Invalid amount in entry ${entry.index + 1}`,
      };
    }

    if (
      entry.debitAmount < 0 ||
      entry.creditAmount < 0
    ) {
      return {
        valid: false,
        message:
          `Negative amounts are not allowed in entry ${entry.index + 1}`,
      };
    }

    const hasDebit =
      entry.debitAmount > 0;

    const hasCredit =
      entry.creditAmount > 0;

    if (
      (hasDebit && hasCredit) ||
      (!hasDebit && !hasCredit)
    ) {
      return {
        valid: false,
        message:
          `Entry ${entry.index + 1} must contain either debit or credit amount, not both`,
      };
    }
  }

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

  const roundedDebit = Number(
    totalDebit.toFixed(2),
  );

  const roundedCredit = Number(
    totalCredit.toFixed(2),
  );

  if (
    roundedDebit !==
    roundedCredit
  ) {
    return {
      valid: false,
      message:
        "Voucher is not balanced: total debit must equal total credit",
      totalDebit: roundedDebit,
      totalCredit: roundedCredit,
    };
  }

  if (roundedDebit <= 0) {
    return {
      valid: false,
      message:
        "Voucher total amount must be greater than zero",
    };
  }

  return {
    valid: true,
    entries: normalizedEntries,
    totalAmount: roundedDebit,
  };
}

// ============================================================
// GET /api/vouchers/[id]
// Permission: voucher.view
// ============================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const tenant =
      await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "voucher.view",
    );

    const db = getDb();

    // --------------------------------------------------------
    // Get voucher
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
    // Get voucher entries
    // --------------------------------------------------------

    const entries =
      await db
        .select({
          id: voucherEntries.id,
          organizationId:
            voucherEntries.organizationId,
          voucherId:
            voucherEntries.voucherId,
          ledgerId:
            voucherEntries.ledgerId,
          ledgerCode:
            ledgers.ledgerCode,
          ledgerName:
            ledgers.ledgerName,
          debitAmount:
            voucherEntries.debitAmount,
          creditAmount:
            voucherEntries.creditAmount,
          narration:
            voucherEntries.narration,
          createdAt:
            voucherEntries.createdAt,
        })
        .from(voucherEntries)
        .innerJoin(
          ledgers,
          eq(
            voucherEntries.ledgerId,
            ledgers.id,
          ),
        )
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
            eq(
              ledgers.organizationId,
              tenant.organizationId,
            ),
          ),
        );

    return NextResponse.json({
      success: true,
      data: {
        ...voucher,
        entries,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/vouchers/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch voucher",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

// ============================================================
// PUT /api/vouchers/[id]
// Permission: voucher.edit
//
// Only DRAFT vouchers can be edited.
// ============================================================

export async function PUT(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const tenant =
      await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "voucher.edit",
    );

    const body =
      (await request.json()) as UpdateVoucherBody;

    const db = getDb();

    // --------------------------------------------------------
    // Find voucher
    // --------------------------------------------------------

    const existingResult =
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
      existingResult.length === 0
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

    const existing =
      existingResult[0];

    // --------------------------------------------------------
    // Only draft can be edited
    // --------------------------------------------------------

    if (
      existing.status !== "draft"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Voucher cannot be edited because its status is '${existing.status}'`,
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // Determine updated values
    // --------------------------------------------------------

    const voucherNumber =
      body.voucherNumber ??
      existing.voucherNumber;

    const voucherType =
      body.voucherType ??
      existing.voucherType;

    const voucherDate =
      body.voucherDate ??
      existing.voucherDate.toISOString();

    const narration =
      body.narration !== undefined
        ? body.narration
        : existing.narration;

    // --------------------------------------------------------
    // Validate voucher number
    // --------------------------------------------------------

    if (
      !voucherNumber ||
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

    // --------------------------------------------------------
    // Validate voucher type
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // Validate date
    // --------------------------------------------------------

    if (
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

    // --------------------------------------------------------
    // Duplicate voucher number
    // --------------------------------------------------------

    if (
      voucherNumber.trim() !==
      existing.voucherNumber
    ) {
      const duplicate =
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
        duplicate.length > 0
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
    }

    // --------------------------------------------------------
    // Get existing entries if entries not supplied
    // --------------------------------------------------------

    let normalizedEntries:
      | {
          index: number;
          ledgerId: string;
          debitAmount: number;
          creditAmount: number;
          narration: string | null;
        }[]
      | undefined;

    let totalAmount: number;

    if (body.entries !== undefined) {
      const validation =
        validateEntries(
          body.entries,
        );

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            message:
              validation.message,
            ...(validation.totalDebit !==
              undefined && {
              data: {
                totalDebit:
                  validation.totalDebit.toFixed(
                    2,
                  ),
                totalCredit:
                  validation.totalCredit?.toFixed(
                    2,
                  ),
              },
            }),
          },
          {
            status: 400,
          },
        );
      }

      normalizedEntries =
        validation.entries!;

      totalAmount =
        validation.totalAmount!;
    } else {
      totalAmount = Number(
        existing.totalAmount,
      );
    }

    // --------------------------------------------------------
    // Validate ledger ownership for new entries
    // --------------------------------------------------------

    if (
      normalizedEntries
    ) {
      const ledgerIds =
        Array.from(
          new Set(
            normalizedEntries.map(
              (entry) =>
                entry.ledgerId,
            ),
          ),
        );

      const tenantLedgers =
        await db
          .select({
            id: ledgers.id,
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
    }

    // --------------------------------------------------------
    // Transaction
    // --------------------------------------------------------

    const updated =
      await db.transaction(
        async (tx) => {
          const updatedVoucher =
            await tx
              .update(vouchers)
              .set({
                voucherNumber:
                  voucherNumber.trim(),

                voucherType,

                voucherDate:
                  new Date(
                    voucherDate,
                  ),

                narration,

                totalAmount:
                  totalAmount.toFixed(
                    2,
                  ),

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
            updatedVoucher.length ===
            0
          ) {
            throw new Error(
              "Voucher not found or is no longer editable",
            );
          }

          // --------------------------------------------------
          // Replace entries only when supplied
          // --------------------------------------------------

          if (
            normalizedEntries
          ) {
            await tx
              .delete(voucherEntries)
              .where(
                and(
                  eq(
                    voucherEntries.voucherId,
                    params.id,
                  ),
                  eq(
                    voucherEntries.organizationId,
                    tenant.organizationId,
                  ),
                ),
              );

            await tx
              .insert(voucherEntries)
              .values(
                normalizedEntries.map(
                  (entry) => ({
                    organizationId:
                      tenant.organizationId,

                    voucherId:
                      params.id,

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
          }

          return updatedVoucher[0];
        },
      );

    return NextResponse.json({
      success: true,
      message:
        "Voucher updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error(
      "PUT /api/vouchers/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update voucher",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

// ============================================================
// DELETE /api/vouchers/[id]
// Permission: voucher.delete
//
// Only DRAFT vouchers can be deleted.
// ============================================================

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const tenant =
      await getTenantContext();

    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "voucher.delete",
    );

    const db = getDb();

    // --------------------------------------------------------
    // Find voucher
    // --------------------------------------------------------

    const existing =
      await db
        .select({
          id: vouchers.id,
          voucherNumber:
            vouchers.voucherNumber,
          voucherType:
            vouchers.voucherType,
          status:
            vouchers.status,
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
      existing.length === 0
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

    // --------------------------------------------------------
    // Only draft can be deleted
    // --------------------------------------------------------

    if (
      existing[0].status !==
      "draft"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Voucher cannot be deleted because its status is '${existing[0].status}'`,
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // Delete
    // Entries cascade automatically.
    // --------------------------------------------------------

    const deleted =
      await db
        .delete(vouchers)
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
          voucherNumber:
            vouchers.voucherNumber,
          voucherType:
            vouchers.voucherType,
          status:
            vouchers.status,
        });

    if (
      deleted.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Voucher not found or cannot be deleted",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Draft voucher deleted successfully",
      data: deleted[0],
    });
  } catch (error) {
    console.error(
      "DELETE /api/vouchers/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete voucher",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}