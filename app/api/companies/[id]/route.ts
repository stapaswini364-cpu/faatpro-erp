import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "../../../../db/connection";

import { companies } from "../../../../db/schema/companies";
import { countries } from "../../../../db/schema/countries";
import { states } from "../../../../db/schema/states";
import { cities } from "../../../../db/schema/cities";
import { currencies } from "../../../../db/schema/currencies";

import { getTenantContext } from "../../../../lib/tenant";

import {
  PermissionError,
  requirePermission,
} from "../../../../lib/rbac";

type RouteContext = {
  params: {
    id: string;
  };
};

// ============================================================
// DATABASE ERROR HELPER
// ============================================================

function getDatabaseError(error: unknown) {
  const dbError = error as {
    code?: string;
    detail?: string;
    constraint?: string;
    table?: string;
    column?: string;
    message?: string;
    cause?: {
      code?: string;
      detail?: string;
      constraint?: string;
      table?: string;
      column?: string;
      message?: string;
    };
  };

  const cause = dbError.cause ?? {};

  return {
    code:
      cause.code ??
      dbError.code ??
      "DATABASE_ERROR",

    message:
      cause.detail ??
      dbError.detail ??
      cause.message ??
      dbError.message ??
      "Database operation failed",

    detail:
      cause.detail ??
      dbError.detail,

    constraint:
      cause.constraint ??
      dbError.constraint,

    table:
      cause.table ??
      dbError.table,

    column:
      cause.column ??
      dbError.column,
  };
}

// ============================================================
// GET /api/companies/:id
// Permission: company.view
// Tenant: current organization only
// ============================================================

export async function GET(
  _request: Request,
  { params }: RouteContext,
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

    const companyId = String(
      params.id ?? "",
    ).trim();

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Company ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const db = getDb();

    const result = await db
      .select()
      .from(companies)
      .where(
        and(
          eq(
            companies.id,
            companyId,
          ),
          eq(
            companies.organizationId,
            organizationId,
          ),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Company not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      tenantId: organizationId,
      count: 1,
      data: result[0],
    });
  } catch (error) {
    console.error(
      "GET /api/companies/[id] error:",
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

    const dbError =
      getDatabaseError(error);

    return NextResponse.json(
      {
        success: false,
        message: dbError.message,
        code: dbError.code,
      },
      {
        status: 500,
      },
    );
  }
}

// ============================================================
// PUT /api/companies/:id
// Permission: company.edit
// Tenant: current organization only
// ============================================================

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const {
      userId,
      organizationId,
    } = await getTenantContext();

    await requirePermission(
      userId,
      organizationId,
      "company.edit",
    );

    const companyId = String(
      params.id ?? "",
    ).trim();

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Company ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const body =
      await request.json();

    const db = getDb();

    // ----------------------------------------------------------
    // FIND COMPANY IN CURRENT TENANT
    // ----------------------------------------------------------

    const existing =
      await db
        .select()
        .from(companies)
        .where(
          and(
            eq(
              companies.id,
              companyId,
            ),
            eq(
              companies.organizationId,
              organizationId,
            ),
          ),
        )
        .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Company not found",
        },
        {
          status: 404,
        },
      );
    }

    const current =
      existing[0];

    // ----------------------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------------------

    const nextName =
      body.name !== undefined
        ? String(
            body.name ?? "",
          ).trim()
        : current.name;

    if (!nextName) {
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

    // ----------------------------------------------------------
    // COUNTRY
    // ----------------------------------------------------------

    let countryId =
      body.countryId !== undefined
        ? body.countryId
          ? String(
              body.countryId,
            )
          : null
        : current.countryId;

    let countryName =
      body.country !== undefined
        ? String(
            body.country ?? "",
          ).trim() || "India"
        : current.country || "India";

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

    let stateId =
      body.stateId !== undefined
        ? body.stateId
          ? String(
              body.stateId,
            )
          : null
        : current.stateId;

    let stateName =
      body.state !== undefined
        ? body.state
          ? String(
              body.state,
            ).trim()
          : null
        : current.state;

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
          countryResult.length > 0
        ) {
          countryName =
            countryResult[0].name;
        }
      }

      stateName =
        stateResult[0].name;
    }

    // ----------------------------------------------------------
    // CITY
    // ----------------------------------------------------------

    const cityId =
      body.cityId !== undefined
        ? body.cityId
          ? String(
              body.cityId,
            )
          : null
        : current.cityId;

    let cityName =
      body.city !== undefined
        ? body.city
          ? String(
              body.city,
            ).trim()
          : null
        : current.city;

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
          stateResult.length > 0
        ) {
          stateName =
            stateResult[0].name;

          if (!countryId) {
            countryId =
              stateResult[0]
                .countryId;

            const countryResult =
              await db
                .select({
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
                    eq(
                      countries.isActive,
                      true,
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

    const currencyId =
      body.currencyId !== undefined
        ? body.currencyId
          ? String(
              body.currencyId,
            )
          : null
        : current.currencyId;

    let currencyCode =
      body.baseCurrencyCode !==
      undefined
        ? String(
            body.baseCurrencyCode ??
              "",
          )
            .trim()
            .toUpperCase()
        : current.baseCurrencyCode;

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
    // BUILD UPDATE OBJECT
    // ----------------------------------------------------------

    const updateData = {
      name: nextName,

      legalName:
        body.legalName !==
        undefined
          ? body.legalName
            ? String(
                body.legalName,
              ).trim()
            : null
          : current.legalName,

      registrationNumber:
        body.registrationNumber !==
        undefined
          ? body.registrationNumber
            ? String(
                body.registrationNumber,
              ).trim()
            : null
          : current.registrationNumber,

      gstin:
        body.gstin !== undefined
          ? body.gstin
            ? String(
                body.gstin,
              )
                .trim()
                .toUpperCase()
            : null
          : current.gstin,

      pan:
        body.pan !== undefined
          ? body.pan
            ? String(
                body.pan,
              )
                .trim()
                .toUpperCase()
            : null
          : current.pan,

      addressLine1:
        body.addressLine1 !==
        undefined
          ? body.addressLine1
            ? String(
                body.addressLine1,
              ).trim()
            : null
          : current.addressLine1,

      addressLine2:
        body.addressLine2 !==
        undefined
          ? body.addressLine2
            ? String(
                body.addressLine2,
              ).trim()
            : null
          : current.addressLine2,

      postalCode:
        body.postalCode !==
        undefined
          ? body.postalCode
            ? String(
                body.postalCode,
              ).trim()
            : null
          : current.postalCode,

      email:
        body.email !== undefined
          ? body.email
            ? String(
                body.email,
              ).trim()
            : null
          : current.email,

      phone:
        body.phone !== undefined
          ? body.phone
            ? String(
                body.phone,
              ).trim()
            : null
          : current.phone,

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
        body.financialYearStart !==
        undefined
          ? body.financialYearStart ||
            null
          : current.financialYearStart,

      financialYearEnd:
        body.financialYearEnd !==
        undefined
          ? body.financialYearEnd ||
            null
          : current.financialYearEnd,

      updatedBy:
        userId,

      updatedAt:
        new Date(),
    };

    const [updatedCompany] =
      await db
        .update(companies)
        .set(updateData)
        .where(
          and(
            eq(
              companies.id,
              companyId,
            ),
            eq(
              companies.organizationId,
              organizationId,
            ),
          ),
        )
        .returning();

    if (!updatedCompany) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Company could not be updated",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      tenantId: organizationId,
      message:
        "Company updated successfully",
      data: updatedCompany,
    });
  } catch (error) {
    console.error(
      "PUT /api/companies/[id] error:",
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

    const dbError =
      getDatabaseError(error);

    console.error(
      "Database error details:",
      dbError,
    );

    return NextResponse.json(
      {
        success: false,
        message: dbError.message,
        code: dbError.code,
      },
      {
        status: 500,
      },
    );
  }
}

// ============================================================
// DELETE /api/companies/:id
// Permission: company.delete
// Soft delete: isActive = false
// ============================================================

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const {
      userId,
      organizationId,
    } = await getTenantContext();

    await requirePermission(
      userId,
      organizationId,
      "company.delete",
    );

    const companyId = String(
      params.id ?? "",
    ).trim();

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Company ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const db = getDb();

    const existing =
      await db
        .select({
          id: companies.id,
          name: companies.name,
          isActive:
            companies.isActive,
        })
        .from(companies)
        .where(
          and(
            eq(
              companies.id,
              companyId,
            ),
            eq(
              companies.organizationId,
              organizationId,
            ),
          ),
        )
        .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Company not found",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !existing[0].isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Company is already inactive",
        },
        {
          status: 409,
        },
      );
    }

    const [deletedCompany] =
      await db
        .update(companies)
        .set({
          isActive: false,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              companies.id,
              companyId,
            ),
            eq(
              companies.organizationId,
              organizationId,
            ),
          ),
        )
        .returning({
          id: companies.id,
          name: companies.name,
          isActive:
            companies.isActive,
          updatedAt:
            companies.updatedAt,
        });

    return NextResponse.json({
      success: true,
      tenantId: organizationId,
      message:
        "Company deleted successfully",
      data: deletedCompany,
    });
  } catch (error) {
    console.error(
      "DELETE /api/companies/[id] error:",
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

    const dbError =
      getDatabaseError(error);

    console.error(
      "Database error details:",
      dbError,
    );

    return NextResponse.json(
      {
        success: false,
        message: dbError.message,
        code: dbError.code,
      },
      {
        status: 500,
      },
    );
  }
}