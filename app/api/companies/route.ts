import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "../../../db/connection";
import { companies } from "../../../db/schema/companies";
import { getTenantContext } from "../../../lib/tenant";

export async function GET() {
  try {
    const { organizationId } = await getTenantContext();

    const db = getDb();

    const data = await db
      .select()
      .from(companies)
      .where(eq(companies.organizationId, organizationId));

    return NextResponse.json({
      success: true,
      tenantId: organizationId,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("GET /api/companies error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch companies",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, organizationId } = await getTenantContext();

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          message: "Company name is required",
        },
        { status: 400 },
      );
    }

    const db = getDb();

    const [company] = await db
      .insert(companies)
      .values({
        organizationId,

        name: body.name,
        legalName: body.legalName ?? null,
        registrationNumber: body.registrationNumber ?? null,
        gstin: body.gstin ?? null,
        pan: body.pan ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        addressLine1: body.addressLine1 ?? null,
        addressLine2: body.addressLine2 ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        postalCode: body.postalCode ?? null,
        country: body.country ?? "India",
        baseCurrencyCode: body.baseCurrencyCode ?? "INR",
        financialYearStart: body.financialYearStart ?? null,
        financialYearEnd: body.financialYearEnd ?? null,

        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        tenantId: organizationId,
        data: company,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/companies error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create company",
      },
      { status: 500 },
    );
  }
}