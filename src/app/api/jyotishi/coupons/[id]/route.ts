/*eslint-disable @typescript-eslint/no-explicit-any*/
// app/api/jyotishi/coupons/[id]/route.ts
import { db } from "@/db";
import {
  CommissionsTable,
  CouponCoursesTable,
  CouponsTable,
  CouponTypesTable,
  CoursesTable,
  EnrollmentsTable,
  PaymentsTable,
  UsersTable
} from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// app/api/jyotishi/coupons/[id]/route.ts
// GET - Get coupon details
export async function GET(
  req: NextRequest,
    context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const jyotishiId = "jyotishi-id-from-session";

    const [coupon] = await db
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
        typeDescription: CouponTypesTable.description,
      })
      .from(CouponsTable)
      .leftJoin(
        CouponTypesTable,
        eq(CouponsTable.couponTypeId, CouponTypesTable.id)
      )
      .where(
        and(
          eq(CouponsTable.id, params.id),
          eq(CouponsTable.createdByJyotishiId, jyotishiId)
        )
      )
      .limit(1);

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Get usage details with commission
    const usageDetails = await db
      .select({
        id: PaymentsTable.id,
        invoiceNumber: PaymentsTable.invoiceNumber,
        amount: PaymentsTable.finalAmount,
        commission: CommissionsTable.commissionAmount,
        commissionStatus: CommissionsTable.status,
        studentName: UsersTable.name,
        studentEmail: UsersTable.email,
        courseName: CoursesTable.title,
        createdAt: PaymentsTable.createdAt,
      })
      .from(PaymentsTable)
      .leftJoin(UsersTable, eq(PaymentsTable.userId, UsersTable.id))
      .leftJoin(
        EnrollmentsTable,
        eq(PaymentsTable.enrollmentId, EnrollmentsTable.id)
      )
      .leftJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
      .leftJoin(
        CommissionsTable,
        eq(PaymentsTable.id, CommissionsTable.paymentId)
      )
      .where(
        and(
          eq(PaymentsTable.couponId, params.id),
          eq(PaymentsTable.status, "COMPLETED")
        )
      )
      .orderBy(desc(PaymentsTable.createdAt));

    // Get linked courses
    const linkedCourses = await db
      .select({
        id: CoursesTable.id,
        title: CoursesTable.title,
        slug: CoursesTable.slug,
      })
      .from(CouponCoursesTable)
      .leftJoin(CoursesTable, eq(CouponCoursesTable.courseId, CoursesTable.id))
      .where(eq(CouponCoursesTable.couponId, params.id));

    return NextResponse.json(
      {
        coupon,
        usageDetails,
        linkedCourses,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching coupon details:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon details" },
      { status: 500 }
    );
  }
}

// PUT - Update coupon
export async function PUT(
  req: NextRequest,
    context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const jyotishiId = "jyotishi-id-from-session";
    const body = await req.json();
    const { isActive, validUntil, maxUsageCount, description } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (isActive !== undefined) updateData.isActive = isActive;
    if (validUntil) updateData.validUntil = new Date(validUntil);
    if (maxUsageCount !== undefined) updateData.maxUsageCount = maxUsageCount;
    if (description !== undefined) updateData.description = description;

    const [updatedCoupon] = await db
      .update(CouponsTable)
      .set(updateData)
      .where(
        and(
          eq(CouponsTable.id, params.id),
          eq(CouponsTable.createdByJyotishiId, jyotishiId)
        )
      )
      .returning();

    if (!updatedCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Coupon updated successfully", coupon: updatedCoupon },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate coupon
export async function DELETE(
  req: NextRequest,
    context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const jyotishiId = "jyotishi-id-from-session";

    const [coupon] = await db
      .update(CouponsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(CouponsTable.id, params.id),
          eq(CouponsTable.createdByJyotishiId, jyotishiId)
        )
      )
      .returning();

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Coupon deactivated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Failed to deactivate coupon" },
      { status: 500 }
    );
  }
}