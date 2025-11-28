import { db } from "@/db";
import {
  CouponTypesTable,
  CouponsTable
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// =====================================================
// 1. ADMIN - COUPON TYPE MANAGEMENT
// =====================================================

// GET - List all coupon types
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");

    // ✅ Build query safely without $if()
    const baseQuery = db.select().from(CouponTypesTable);
    const couponTypes = await (isActive !== null
      ? baseQuery
          .where(eq(CouponTypesTable.isActive, isActive === "true"))
          .orderBy(CouponTypesTable.typeCode)
      : baseQuery.orderBy(CouponTypesTable.typeCode));

    // ✅ Get usage stats for each type
    const couponTypesWithStats = await Promise.all(
      couponTypes.map(async (type: typeof couponTypes[number]) => {
        const [stats] = await db
          .select({
            totalCoupons: sql<number>`COUNT(*)`,
            activeCoupons: sql<number>`COUNT(*) FILTER (WHERE ${CouponsTable.isActive} = true)`,
            totalUsage: sql<number>`COALESCE(SUM(${CouponsTable.currentUsageCount}), 0)`,
          })
          .from(CouponsTable)
          .where(eq(CouponsTable.couponTypeId, type.id));

        return {
          ...type,
          stats,
        };
      })
    );

    return NextResponse.json(
      { couponTypes: couponTypesWithStats },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching coupon types:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon types" },
      { status: 500 }
    );
  }
}

// POST - Create coupon type
export async function POST(req: NextRequest) {
  try {
 
   
    const body = await req.json();
    const {
      typeCode,
      typeName,
      description,
      discountType,
      maxDiscountLimit,
      adminId
    } = body;

    // ✅ Validate required fields
    if (!typeCode || !typeName || !discountType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Validate type code format (2 digits: 01–99)
    if (!/^\d{2}$/.test(typeCode) || parseInt(typeCode) < 1 || parseInt(typeCode) > 99) {
      return NextResponse.json(
        { error: "Type code must be a 2-digit number between 01 and 99" },
        { status: 400 }
      );
    }

    // ✅ Check if type code already exists
    const [existingType] = await db
      .select()
      .from(CouponTypesTable)
      .where(eq(CouponTypesTable.typeCode, typeCode))
      .limit(1);

    if (existingType) {
      return NextResponse.json(
        { error: "Type code already exists" },
        { status: 400 }
      );
    }

    // ✅ Create new coupon type
    const [couponType] = await db
      .insert(CouponTypesTable)
      .values({
        typeCode,
        typeName: typeName.toUpperCase(),
        description,
        discountType,
        maxDiscountLimit,
        createdBy: adminId,
      })
      .returning();

    return NextResponse.json(
      { message: "Coupon type created successfully", couponType },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating coupon type:", error);
    return NextResponse.json(
      { error: "Failed to create coupon type" },
      { status: 500 }
    );
  }
}
