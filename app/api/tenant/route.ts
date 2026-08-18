import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";

export async function GET() {
  try {
    const tenant = await getTenantContext();

    return NextResponse.json({
      success: true,
      tenant,
    });
  } catch (error) {
    console.error("Tenant context error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get tenant context",
      },
      { status: 401 }
    );
  }
}