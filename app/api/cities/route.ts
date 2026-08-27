import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "../../../db/connection";
import { cities } from "../../../db/schema/cities";
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

    const stateId =
      request.nextUrl.searchParams.get(
        "stateId",
      );

    if (!stateId) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const db = getDb();

    const result = await db
      .select({
        id: cities.id,
        name: cities.name,
        code: cities.code,
        countryId:
          cities.countryId,
        stateId:
          cities.stateId,
      })
      .from(cities)
      .where(
        and(
          eq(
            cities.organizationId,
            organizationId,
          ),
          eq(
            cities.stateId,
            stateId,
          ),
          eq(
            cities.isActive,
            true,
          ),
        ),
      )
      .orderBy(cities.name);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "GET /api/cities error:",
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
            : "Failed to fetch cities",
      },
      {
        status: 500,
      },
    );
  }
}