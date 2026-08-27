import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "../../../db/connection";
import { currencies } from "../../../db/schema/currencies";
import { getTenantContext } from "../../../lib/tenant";
import {
  PermissionError,
  requirePermission,
} from "../../../lib/rbac";

export async function GET() {
  try {
    const {
      userId,
      organizationId,
    } = await getTenantContext();

    await requirePermission(
      userId,
      organizationId,
      "company.view",
    );

    const db = getDb();

    const result = await db
      .select({
        id: currencies.id,
        name: currencies.name,
        code: currencies.code,
        symbol: currencies.symbol,
      })
      .from(currencies)
      .where(
        and(
          eq(
            currencies.organizationId,
            organizationId,
          ),
          eq(
            currencies.isActive,
            true,
          ),
        ),
      )
      .orderBy(
        currencies.code,
      );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "GET /api/currencies error:",
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
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch currencies",
      },
      {
        status: 500,
      },
    );
  }
}