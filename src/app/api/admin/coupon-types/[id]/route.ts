/* eslint-disable @typescript-eslint/no-unused-vars */
/*eslint-disable  @typescript-eslint/no-explicit-any*/
// app/api/admin/coupon-types/[id]/route.ts
import { db } from "@/db";
import {
  CouponTypesTable,
  CouponsTable,
  UsersTable
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Get coupon type details
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const [couponType] = await db
      .select()
      .from(CouponTypesTable)
      .where(eq(CouponTypesTable.id, params.id))
      .limit(1);

    if (!couponType) {
      return NextResponse.json(
        { error: "Coupon type not found" },
        { status: 404 }
      );
    }

    // Get coupons using this type
    const coupons = await db
      .select({
        id: CouponsTable.id,
        code: CouponsTable.code,
        discountValue: CouponsTable.discountValue,
        isActive: CouponsTable.isActive,
        currentUsageCount: CouponsTable.currentUsageCount,
        jyotishiName: UsersTable.name,
        jyotishiCode: UsersTable.jyotishiCode,
        createdAt: CouponsTable.createdAt,
      })
      .from(CouponsTable)
      .leftJoin(
        UsersTable,
        eq(CouponsTable.createdByJyotishiId, UsersTable.id)
      )
      .where(eq(CouponsTable.couponTypeId, params.id))
      .orderBy(desc(CouponsTable.createdAt))
      .limit(20);

    return NextResponse.json(
      {
        couponType,
        coupons,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching coupon type:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon type" },
      { status: 500 }
    );
  }
}

// PUT - Update coupon type
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const body = await req.json();
    const { typeName, description, maxDiscountLimit, isActive } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (typeName) updateData.typeName = typeName.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (maxDiscountLimit !== undefined)
      updateData.maxDiscountLimit = maxDiscountLimit;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedType] = await db
      .update(CouponTypesTable)
      .set(updateData)
      .where(eq(CouponTypesTable.id, params.id))
      .returning();

    if (!updatedType) {
      return NextResponse.json(
        { error: "Coupon type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Coupon type updated successfully", couponType: updatedType },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating coupon type:", error);
    return NextResponse.json(
      { error: "Failed to update coupon type" },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate coupon type
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const [couponType] = await db
      .update(CouponTypesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(CouponTypesTable.id, params.id))
      .returning();

    if (!couponType) {
      return NextResponse.json(
        { error: "Coupon type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Coupon type deactivated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deactivating coupon type:", error);
    return NextResponse.json(
      { error: "Failed to deactivate coupon type" },
      { status: 500 }
    );
  }
}