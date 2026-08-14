import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";

import { getTenantContext } from "@/lib/tenant";
import { getDb } from "@/db/connection";
import { customers } from "@/db/schema/customers";

// ============================================================
// GET /api/customers
// Returns customers belonging ONLY to the current tenant.
// ============================================================

export async function GET() {
  try {
    const tenant = await getTenantContext();

    const db = getDb();

    const result = await db
      .select({
        id: customers.id,
        organizationId: customers.organizationId,
        customerCode: customers.customerCode,
        customerName: customers.customerName,
        mobile: customers.mobile,
        email: customers.email,
        address: customers.address,
        city: customers.city,
        state: customers.state,
        pinCode: customers.pinCode,
        isActive: customers.isActive,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .where(
        eq(
          customers.organizationId,
          tenant.organizationId,
        ),
      )
      .orderBy(desc(customers.createdAt));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Customer GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch customers",
      },
      { status: 401 },
    );
  }
}

// ============================================================
// POST /api/customers
// Creates a customer inside the CURRENT tenant.
//
// IMPORTANT:
// organizationId is NOT accepted from the frontend.
// It is automatically taken from getTenantContext().
// ============================================================

export async function POST(
  request: NextRequest,
) {
  try {
    const tenant = await getTenantContext();

    const body = await request.json();

    const {
      customerCode,
      customerName,
      mobile,
      email,
      address,
      city,
      state,
      pinCode,
    } = body;

    // --------------------------------------------------------
    // Basic validation
    // --------------------------------------------------------

    if (!customerCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer code is required",
        },
        { status: 400 },
      );
    }

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required",
        },
        { status: 400 },
      );
    }

    const db = getDb();

    // --------------------------------------------------------
    // Check duplicate customer code
    // ONLY inside current tenant.
    // --------------------------------------------------------

    const existingCustomer = await db
      .select({
        id: customers.id,
      })
      .from(customers)
      .where(
        and(
          eq(
            customers.organizationId,
            tenant.organizationId,
          ),
          eq(
            customers.customerCode,
            customerCode,
          ),
        ),
      )
      .limit(1);

    if (existingCustomer.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer code already exists in this organization",
        },
        { status: 409 },
      );
    }

    // --------------------------------------------------------
    // Create customer
    //
    // organizationId comes from server-side tenant context.
    // --------------------------------------------------------

    const inserted = await db
      .insert(customers)
      .values({
        organizationId: tenant.organizationId,

        customerCode,
        customerName,

        mobile: mobile || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pinCode: pinCode || null,

        isActive: true,
      })
      .returning({
        id: customers.id,
        organizationId: customers.organizationId,
        customerCode: customers.customerCode,
        customerName: customers.customerName,
        mobile: customers.mobile,
        email: customers.email,
        address: customers.address,
        city: customers.city,
        state: customers.state,
        pinCode: customers.pinCode,
        isActive: customers.isActive,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      });

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully",
        data: inserted[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Customer POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create customer",
      },
      { status: 500 },
    );
  }
}