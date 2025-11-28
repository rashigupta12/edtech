// app/api/jyotishi/coupons/preview/route.ts
import { auth } from "@/auth";
import { db } from "@/db";
import {
  CouponTypesTable,
  CouponsTable,
  UsersTable
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// POST - Preview coupon code before creation
export async function POST(req: NextRequest) {
  try {

     const session = await auth();
        const jyotishiId = session?.user?.id;
        const role = session?.user?.role;
    
        if (!jyotishiId || role !== "JYOTISHI") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    
    const { couponTypeId, discountValue } = await req.json();

    if (!couponTypeId || !discountValue) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get Jyotishi code
    const [jyotishi] = await db
      .select({ jyotishiCode: UsersTable.jyotishiCode })
      .from(UsersTable)
      .where(eq(UsersTable.id, jyotishiId))
      .limit(1);

    if (!jyotishi || !jyotishi.jyotishiCode) {
      return NextResponse.json(
        { error: "Jyotishi code not found" },
        { status: 404 }
      );
    }

    // Get coupon type
    const [couponType] = await db
      .select()
      .from(CouponTypesTable)
      .where(eq(CouponTypesTable.id, couponTypeId))
      .limit(1);

    if (!couponType) {
      return NextResponse.json(
        { error: "Coupon type not found" },
        { status: 404 }
      );
    }

    // Generate coupon code: COUP[JyotishiCode][TypeCode][DiscountValue]
    // Format discount value to remove decimals for percentage
    const formattedDiscount = discountValue.toString().replace(".", "");
    const couponCode = `COUP${jyotishi.jyotishiCode}${couponType.typeCode}${formattedDiscount}`;

    // Check if code already exists
    const [existingCoupon] = await db
      .select()
      .from(CouponsTable)
      .where(eq(CouponsTable.code, couponCode))
      .limit(1);

    return NextResponse.json(
      {
        couponCode,
        exists: !!existingCoupon,
        couponType: {
          code: couponType.typeCode,
          name: couponType.typeName,
          discountType: couponType.discountType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error previewing coupon:", error);
    return NextResponse.json(
      { error: "Failed to preview coupon" },
      { status: 500 }
    );
  }
}