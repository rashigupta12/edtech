/*eslint-disable  @typescript-eslint/no-explicit-any*/

import { db } from "@/db";
import {
  CommissionsTable,
  CouponCoursesTable,
  CouponsTable,
  CouponTypesTable,
  PaymentsTable,
  UsersTable,
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // ✅ your /src/auth.ts file

// =====================================================
// 5. JYOTISHI - COUPON MANAGEMENT
// =====================================================


export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const jyotishiId = session?.user?.id;
    const role = session?.user?.role;

    if (!jyotishiId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (role === "JYOTISHI") conditions.push(eq(CouponsTable.createdByJyotishiId, jyotishiId));

    if (status !== "ALL") {
      if (status === "EXPIRED") {
        conditions.push(sql`${CouponsTable.validUntil} < NOW()`);
        conditions.push(eq(CouponsTable.isActive, true));
      } else if (status === "ACTIVE") {
        conditions.push(eq(CouponsTable.isActive, true));
        conditions.push(sql`${CouponsTable.validUntil} >= NOW() OR ${CouponsTable.validUntil} IS NULL`);
      } else if (status === "INACTIVE") {
        conditions.push(eq(CouponsTable.isActive, false));
      }
    }

    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(CouponsTable)
      .where(conditions.length ? and(...conditions) : undefined);

    const coupons = await db
      .select({
        id: CouponsTable.id,
        code: CouponsTable.code,
        discountType: CouponsTable.discountType,
        discountValue: CouponsTable.discountValue,
        maxUsageCount: CouponsTable.maxUsageCount,
        currentUsageCount: CouponsTable.currentUsageCount,
        validFrom: CouponsTable.validFrom,
        validUntil: CouponsTable.validUntil,
        isActive: CouponsTable.isActive,
        createdAt: CouponsTable.createdAt,
        typeName: CouponTypesTable.typeName,
        totalUsage: sql<number>`COUNT(${PaymentsTable.id})`.mapWith(Number),
        totalRevenue: sql<number>`COALESCE(SUM(${PaymentsTable.finalAmount}), 0)`.mapWith(Number),
        totalCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`.mapWith(Number),
      })
      .from(CouponsTable)
      .leftJoin(CouponTypesTable, eq(CouponsTable.couponTypeId, CouponTypesTable.id))
      .leftJoin(PaymentsTable, and(eq(PaymentsTable.couponId, CouponsTable.id), eq(PaymentsTable.status, "COMPLETED")))
      .leftJoin(CommissionsTable, eq(PaymentsTable.id, CommissionsTable.paymentId))
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(CouponsTable.id, CouponTypesTable.typeName)
      .orderBy(desc(CouponsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ coupons, total: Number(totalResult?.count) || 0, page, limit }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
// POST - Create coupon with type selection
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const jyotishiId = session?.user?.id;
    const role = session?.user?.role;

    if (!jyotishiId || role !== "JYOTISHI") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      couponTypeId,
      discountValue,
      maxUsageCount,
      validFrom,
      validUntil,
      description,
      courseIds,
    } = body;

    if (!couponTypeId || !discountValue || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [jyotishi] = await db
      .select({
        jyotishiCode: UsersTable.jyotishiCode,
        commissionRate: UsersTable.commissionRate,
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, jyotishiId))
      .limit(1);

    if (!jyotishi?.jyotishiCode) {
      return NextResponse.json(
        { error: "Jyotishi code not found" },
        { status: 404 }
      );
    }

    const [couponType] = await db
      .select()
      .from(CouponTypesTable)
      .where(
        and(
          eq(CouponTypesTable.id, couponTypeId),
          eq(CouponTypesTable.isActive, true)
        )
      )
      .limit(1);

    if (!couponType) {
      return NextResponse.json(
        { error: "Coupon type not found or inactive" },
        { status: 404 }
      );
    }

    if (
      couponType.maxDiscountLimit &&
      parseFloat(discountValue) > parseFloat(couponType.maxDiscountLimit)
    ) {
      return NextResponse.json(
        {
          error: `Discount value exceeds maximum limit of ${couponType.maxDiscountLimit}`,
        },
        { status: 400 }
      );
    }

    const formattedDiscount = discountValue.toString().replace(".", "");
    const couponCode = `COUP${jyotishi.jyotishiCode}${couponType.typeCode}${formattedDiscount}`;

    const [existingCoupon] = await db
      .select()
      .from(CouponsTable)
      .where(eq(CouponsTable.code, couponCode))
      .limit(1);

    if (existingCoupon) {
      return NextResponse.json(
        { error: "Coupon code already exists. Try a different discount value." },
        { status: 400 }
      );
    }

    const [coupon] = await db
      .insert(CouponsTable)
      .values({
        code: couponCode,
        couponTypeId,
        createdByJyotishiId: jyotishiId,
        discountType: couponType.discountType,
        discountValue,
        maxUsageCount,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        description,
      })
      .returning();

    if (courseIds?.length > 0) {
      await db.insert(CouponCoursesTable).values(
        courseIds.map((courseId: string) => ({
          couponId: coupon.id,
          courseId,
        }))
      );
    }

    return NextResponse.json(
      {
        message: "Coupon created successfully",
        coupon: {
          ...coupon,
          typeName: couponType.typeName,
          jyotishiCode: jyotishi.jyotishiCode,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
