/*eslint-disable  @typescript-eslint/no-unused-vars*/
// app/api/jyotishi/coupon-types/route.ts
import { db } from "@/db";
import {
  CouponTypesTable
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - List available coupon types for Jyotishi
export async function GET(req: NextRequest) {
  try {
    const couponTypes = await db
      .select()
      .from(CouponTypesTable)
      .where(eq(CouponTypesTable.isActive, true))
      .orderBy(CouponTypesTable.typeCode);

    return NextResponse.json({ couponTypes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching coupon types:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon types" },
      { status: 500 }
    );
  }
}