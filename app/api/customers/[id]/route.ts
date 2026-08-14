import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getTenantContext } from "@/lib/tenant";
import { getDb } from "@/db/connection";
import { customers } from "@/db/schema/customers";

type RouteContext = {
  params: {
    id: string;
  };
};

// ============================================================
// GET /api/customers/[id]
// Returns ONLY the customer belonging to current tenant.
// ============================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
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
        and(
          eq(customers.id, params.id),
          eq(
            customers.organizationId,
            tenant.organizationId,
          ),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Customer GET by ID error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch customer",
      },
      { status: 500 },
    );
  }
}

// ============================================================
// PUT /api/customers/[id]
// Updates ONLY the customer belonging to current tenant.
// ============================================================

export async function PUT(
  request: NextRequest,
  { params }: RouteContext,
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
      isActive,
    } = body;

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
    // Check that customer belongs to current tenant.
    // --------------------------------------------------------

    const existingCustomer = await db
      .select({
        id: customers.id,
        customerCode: customers.customerCode,
      })
      .from(customers)
      .where(
        and(
          eq(customers.id, params.id),
          eq(
            customers.organizationId,
            tenant.organizationId,
          ),
        ),
      )
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 },
      );
    }

    // --------------------------------------------------------
    // If customer code is changing, make sure the new code
    // does not already exist in this tenant.
    // --------------------------------------------------------

    if (
      customerCode &&
      customerCode !== existingCustomer[0].customerCode
    ) {
      const duplicate = await db
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

      if (duplicate.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Customer code already exists in this organization",
          },
          { status: 409 },
        );
      }
    }

    // --------------------------------------------------------
    // Update only current tenant's record.
    // organizationId is NEVER changed from request body.
    // --------------------------------------------------------

    const updated = await db
      .update(customers)
      .set({
        ...(customerCode !== undefined && {
          customerCode,
        }),

        customerName,

        mobile:
          mobile !== undefined
            ? mobile || null
            : undefined,

        email:
          email !== undefined
            ? email || null
            : undefined,

        address:
          address !== undefined
            ? address || null
            : undefined,

        city:
          city !== undefined
            ? city || null
            : undefined,

        state:
          state !== undefined
            ? state || null
            : undefined,

        pinCode:
          pinCode !== undefined
            ? pinCode || null
            : undefined,

        isActive:
          isActive !== undefined
            ? Boolean(isActive)
            : undefined,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customers.id, params.id),
          eq(
            customers.organizationId,
            tenant.organizationId,
          ),
        ),
      )
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

    if (updated.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully",
      data: updated[0],
    });
  } catch (error) {
    console.error("Customer PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update customer",
      },
      { status: 500 },
    );
  }
}

// ============================================================
// DELETE /api/customers/[id]
// Deletes ONLY the customer belonging to current tenant.
// ============================================================

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const tenant = await getTenantContext();

    const db = getDb();

    const deleted = await db
      .delete(customers)
      .where(
        and(
          eq(customers.id, params.id),
          eq(
            customers.organizationId,
            tenant.organizationId,
          ),
        ),
      )
      .returning({
        id: customers.id,
        customerCode: customers.customerCode,
        customerName: customers.customerName,
      });

    if (deleted.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
      data: deleted[0],
    });
  } catch (error) {
    console.error("Customer DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete customer",
      },
      { status: 500 },
    );
  }
}