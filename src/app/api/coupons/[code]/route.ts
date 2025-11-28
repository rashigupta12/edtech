/* eslint-disable @typescript-eslint/no-unused-vars */
/*eslint-disable  @typescript-eslint/no-explicit-any*/
// app/api/coupons/[code]/route.ts
import { db } from "@/db";
import {
  CouponTypesTable,
  CouponsTable,
  UsersTable
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Get public coupon details (for display)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{
    code: any; id: string 
}> } 
) {
  const params = await context.params;  
  try {
    const [coupon] = await db
      .select({
        code: CouponsTable.code,
        discountType: CouponsTable.discountType,
        discountValue: CouponsTable.discountValue,
        description: CouponsTable.description,
        validUntil: CouponsTable.validUntil,
        isActive: CouponsTable.isActive,
        typeName: CouponTypesTable.typeName,
        jyotishiName: UsersTable.name,
      })
      .from(CouponsTable)
      .leftJoin(
        CouponTypesTable,
        eq(CouponsTable.couponTypeId, CouponTypesTable.id)
      )
      .leftJoin(
        UsersTable,
        eq(CouponsTable.createdByJyotishiId, UsersTable.id)
      )
      .where(
        and(
          eq(CouponsTable.code, params.code.toUpperCase()),
          eq(CouponsTable.isActive, true)
        )
      )
      .limit(1);

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found or inactive" },
        { status: 404 }
      );
    }

    return NextResponse.json({ coupon }, { status: 200 });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}
