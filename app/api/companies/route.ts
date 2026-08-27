import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "../../../db/connection";

import { companies } from "../../../db/schema/companies";
import { countries } from "../../../db/schema/countries";
import { states } from "../../../db/schema/states";
import { cities } from "../../../db/schema/cities";
import { currencies } from "../../../db/schema/currencies";

import { getTenantContext } from "../../../lib/tenant";

import {
  PermissionError,
  requirePermission,
} from "../../../lib/rbac";

// ============================================================
// GET /api/companies
// Permission: company.view
// ============================================================

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

    const data = await db
      .select()
      .from(companies)
      .where(
        eq(
          companies.organizationId,
          organizationId,
        ),
      );

    return NextResponse.json({
      success: true,
      tenantId: organizationId,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(
      "GET /api/companies error:",
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
            : "Failed to fetch companies",
      },
      {
        status: 500,
      },
    );
  }
}

// ============================================================
// POST /api/companies
// Permission: company.create
// ============================================================

export async function POST(
  request: Request,
) {
  try {
    const {
      userId,
      organizationId,
    } = await getTenantContext();

    await requirePermission(
      userId,
      organizationId,
      "company.create",
    );

    const body =
      await request.json();

    // ----------------------------------------------------------
    // Basic validation
    // ----------------------------------------------------------

    const companyName =
      String(
        body.name ?? "",
      ).trim();

    if (!companyName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Company name is required",
        },
        {
          status: 400,
        },
      );
    }

    const db = getDb();

    // ----------------------------------------------------------
    // COUNTRY
    // ----------------------------------------------------------

    let countryName =
      "India";

    let countryId:
      | string
      | null =
      body.countryId
        ? String(
            body.countryId,
          )
        : null;

    if (countryId) {
      const countryResult =
        await db
          .select({
            id: countries.id,
            name: countries.name,
          })
          .from(countries)
          .where(
            and(
              eq(
                countries.id,
                countryId,
              ),
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
          .limit(1);

      if (
        countryResult.length ===
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid country",
          },
          {
            status: 400,
          },
        );
      }

      countryName =
        countryResult[0].name;
    }

    // ----------------------------------------------------------
    // STATE
    // ----------------------------------------------------------

    let stateName:
      | string
      | null =
      body.state
        ? String(
            body.state,
          ).trim()
        : null;

    let stateId:
      | string
      | null =
      body.stateId
        ? String(
            body.stateId,
          )
        : null;

    if (stateId) {
      const stateResult =
        await db
          .select({
            id: states.id,
            name: states.name,
            countryId:
              states.countryId,
          })
          .from(states)
          .where(
            and(
              eq(
                states.id,
                stateId,
              ),
              eq(
                states.organizationId,
                organizationId,
              ),
              eq(
                states.isActive,
                true,
              ),
            ),
          )
          .limit(1);

      if (
        stateResult.length ===
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid state",
          },
          {
            status: 400,
          },
        );
      }

      if (
        countryId &&
        stateResult[0]
          .countryId !==
          countryId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected state does not belong to the selected country",
          },
          {
            status: 400,
          },
        );
      }

      if (!countryId) {
        countryId =
          stateResult[0]
            .countryId;

        const countryResult =
          await db
            .select({
              id: countries.id,
              name: countries.name,
            })
            .from(countries)
            .where(
              and(
                eq(
                  countries.id,
                  countryId,
                ),
                eq(
                  countries.organizationId,
                  organizationId,
                ),
              ),
            )
            .limit(1);

        if (
          countryResult.length >
          0
        ) {
          countryName =
            countryResult[0]
              .name;
        }
      }

      stateName =
        stateResult[0].name;
    }

    // ----------------------------------------------------------
    // CITY
    // ----------------------------------------------------------

    let cityName:
      | string
      | null =
      body.city
        ? String(
            body.city,
          ).trim()
        : null;

    const cityId:
      | string
      | null =
      body.cityId
        ? String(
            body.cityId,
          )
        : null;

    if (cityId) {
      const cityResult =
        await db
          .select({
            id: cities.id,
            name: cities.name,
            stateId:
              cities.stateId,
            countryId:
              cities.countryId,
          })
          .from(cities)
          .where(
            and(
              eq(
                cities.id,
                cityId,
              ),
              eq(
                cities.organizationId,
                organizationId,
              ),
              eq(
                cities.isActive,
                true,
              ),
            ),
          )
          .limit(1);

      if (
        cityResult.length ===
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid city",
          },
          {
            status: 400,
          },
        );
      }

      if (
        countryId &&
        cityResult[0]
          .countryId !==
          countryId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected city does not belong to the selected country",
          },
          {
            status: 400,
          },
        );
      }

      if (
        stateId &&
        cityResult[0]
          .stateId !==
          stateId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected city does not belong to the selected state",
          },
          {
            status: 400,
          },
        );
      }

      if (!stateId) {
        stateId =
          cityResult[0]
            .stateId;

        const stateResult =
          await db
            .select({
              id: states.id,
              name: states.name,
              countryId:
                states.countryId,
            })
            .from(states)
            .where(
              and(
                eq(
                  states.id,
                  stateId,
                ),
                eq(
                  states.organizationId,
                  organizationId,
                ),
              ),
            )
            .limit(1);

        if (
          stateResult.length >
          0
        ) {
          stateName =
            stateResult[0]
              .name;

          if (!countryId) {
            countryId =
              stateResult[0]
                .countryId;

            const countryResult =
              await db
                .select({
                  id: countries.id,
                  name:
                    countries.name,
                })
                .from(
                  countries,
                )
                .where(
                  and(
                    eq(
                      countries.id,
                      countryId,
                    ),
                    eq(
                      countries.organizationId,
                      organizationId,
                    ),
                  ),
                )
                .limit(1);

            if (
              countryResult.length >
              0
            ) {
              countryName =
                countryResult[0]
                  .name;
            }
          }
        }
      }

      cityName =
        cityResult[0].name;
    }

    // ----------------------------------------------------------
    // CURRENCY
    // ----------------------------------------------------------

    let currencyCode =
      String(
        body.baseCurrencyCode ??
          "INR",
      )
        .trim()
        .toUpperCase();

    const currencyId:
      | string
      | null =
      body.currencyId
        ? String(
            body.currencyId,
          )
        : null;

    if (currencyId) {
      const currencyResult =
        await db
          .select({
            id: currencies.id,
            code: currencies.code,
          })
          .from(currencies)
          .where(
            and(
              eq(
                currencies.id,
                currencyId,
              ),
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
          .limit(1);

      if (
        currencyResult.length ===
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid currency",
          },
          {
            status: 400,
          },
        );
      }

      currencyCode =
        currencyResult[0].code;
    }

    // ----------------------------------------------------------
    // CREATE COMPANY
    // ----------------------------------------------------------

    const [company] =
      await db
        .insert(companies)
        .values({
          organizationId,

          name:
            companyName,

          legalName:
            body.legalName ??
            null,

          registrationNumber:
            body.registrationNumber ??
            null,

          gstin:
            body.gstin ??
            null,

          pan:
            body.pan ??
            null,

          email:
            body.email ??
            null,

          phone:
            body.phone ??
            null,

          addressLine1:
            body.addressLine1 ??
            null,

          addressLine2:
            body.addressLine2 ??
            null,

          postalCode:
            body.postalCode ??
            null,

          countryId,
          stateId,
          cityId,
          currencyId,

          country:
            countryName,

          state:
            stateName,

          city:
            cityName,

          baseCurrencyCode:
            currencyCode,

          financialYearStart:
            body.financialYearStart ??
            null,

          financialYearEnd:
            body.financialYearEnd ??
            null,

          createdBy:
            userId,

          updatedBy:
            userId,
        })
        .returning();

    return NextResponse.json(
      {
        success: true,
        tenantId:
          organizationId,
        data: company,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/companies error:",
      error,
    );

    if (
      error instanceof PermissionError
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
          code: "FORBIDDEN",
        },
        {
          status: 403,
        },
      );
    }

    const dbError =
      error as {
        code?: string;
        detail?: string;
        constraint?: string;
        table?: string;
        column?: string;
        message?: string;
      };

    console.error(
      "Database error details:",
      {
        code: dbError.code,
        detail: dbError.detail,
        constraint:
          dbError.constraint,
        table: dbError.table,
        column:
          dbError.column,
        message:
          dbError.message,
      },
    );

    return NextResponse.json(
      {
        success: false,
        message:
          dbError.detail ??
          dbError.message ??
          "Failed to create company",
        code:
          dbError.code ??
          "DATABASE_ERROR",
      },
      {
        status: 500,
      },
    );
  }
}