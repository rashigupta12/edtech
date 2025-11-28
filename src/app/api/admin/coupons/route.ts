// app/api/admin/coupons/route.ts
import { db } from "@/db";
import {
  CouponCoursesTable,
  CouponsTable,
  CouponTypesTable,
  UsersTable,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// GET - List all coupons (admin view)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const role = session?.user?.role;

    if (!userId || role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");
    // const couponScope = searchParams.get("couponScope");

    const conditions = [];
    
    if (isActive !== null) {
      conditions.push(eq(CouponsTable.isActive, isActive === "true"));
    }
    

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
        description: CouponsTable.description,
        createdAt: CouponsTable.createdAt,
        typeName: CouponTypesTable.typeName,
        typeCode: CouponTypesTable.typeCode,
        createdBy: UsersTable.name,
        createdByEmail: UsersTable.email,
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
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(CouponsTable.createdAt);

    return NextResponse.json({ coupons }, { status: 200 });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST - Create coupon (admin)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const role = session?.user?.role;

    if (!userId || role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      couponTypeId,
      discountValue,
      discountType,
      maxUsageCount,
      validFrom,
      validUntil,
      description,
      courseIds,
      couponScope = "GENERAL", // Default to GENERAL for admin
    } = body;

    if (!couponTypeId || !discountValue || !validFrom || !validUntil || !discountType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get coupon type details
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

    // Validate discount limits
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

    // Generate admin coupon code
    const formattedDiscount = discountValue.toString().replace(".", "");
    const couponCode = `ADM${couponType.typeCode}${formattedDiscount}${Date.now().toString().slice(-4)}`;

    // Check for existing coupon code
    const [existingCoupon] = await db
      .select()
      .from(CouponsTable)
      .where(eq(CouponsTable.code, couponCode))
      .limit(1);

    if (existingCoupon) {
      return NextResponse.json(
        { error: "Coupon code already exists. Please try again." },
        { status: 400 }
      );
    }

    // Create coupon
    const [coupon] = await db
      .insert(CouponsTable)
      .values({
        code: couponCode,
        couponTypeId,
        createdByJyotishiId: userId, // Admin user ID
        discountType,
        discountValue,
        maxUsageCount: maxUsageCount || null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        description,
      })
      .returning();

    // Add course restrictions if provided
    if (courseIds?.length > 0 && couponScope === "GENERAL") {
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