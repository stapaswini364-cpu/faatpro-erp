import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "../../../db/connection";
import { countries } from "../../../db/schema/countries";
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
        id: countries.id,
        name: countries.name,
        isoCode: countries.isoCode,
        iso3Code: countries.iso3Code,
        phoneCode: countries.phoneCode,
      })
      .from(countries)
      .where(
        and(
          eq(
            countries.organizationId,
            organizationId,
          ),
          eq(
            countries.isActive,
            true,
          ),
        ),
      )
      .orderBy(
        countries.name,
      );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "GET /api/countries error:",
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
            : "Failed to fetch countries",
      },
      {
        status: 500,
      },
    );
  }
}