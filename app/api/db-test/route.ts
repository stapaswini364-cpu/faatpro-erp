import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/connection";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.execute(sql`SELECT NOW() AS current_time`);

    return NextResponse.json({
      success: true,
      message: "Database connected successfully",
      database: "faatpro_erp",
      currentTime: result[0]?.current_time,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: String(error),
      },
      { status: 500 }
    );
  }
}