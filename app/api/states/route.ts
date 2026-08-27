import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "../../../db/connection";
import { states } from "../../../db/schema/states";
import { getTenantContext } from "../../../lib/tenant";
import {
  PermissionError,
  requirePermission,
} from "../../../lib/rbac";

export async function GET(
  request: NextRequest,
) {
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

    const countryId =
      request.nextUrl.searchParams.get(
        "countryId",
      );

    if (!countryId) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const db = getDb();

    const result = await db
      .select({
        id: states.id,
        name: states.name,
        code: states.code,
        countryId: states.countryId,
      })
      .from(states)
      .where(
        and(
          eq(
            states.organizationId,
            organizationId,
          ),
          eq(
            states.countryId,
            countryId,
          ),
          eq(
            states.isActive,
            true,
          ),
        ),
      )
      .orderBy(states.name);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "GET /api/states error:",
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
            : "Failed to fetch states",
      },
      {
        status: 500,
      },
    );
  }
}