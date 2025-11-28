/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@/db";
import {
  CouponCoursesTable,
  CouponTypesTable,
  CouponsTable,
  UserCourseCouponsTable,
  UsersTable
} from "@/db/schema";
import { and, eq, or, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// app/api/coupons/validate/route.ts
// POST - Validate coupon code
export async function POST(req: NextRequest) {
  try {
    const { code, courseId, userId } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Get coupon with type and creator details
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
        createdByJyotishiId: CouponsTable.createdByJyotishiId,
        typeName: CouponTypesTable.typeName,
        creatorName: UsersTable.name,
        creatorCode: UsersTable.jyotishiCode,
        commissionRate: UsersTable.commissionRate,
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
      .where(eq(CouponsTable.code, code.toUpperCase()))
      .limit(1);

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 404 }
      );
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "This coupon is no longer active" },
        { status: 400 }
      );
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.validFrom) {
      return NextResponse.json(
        { error: "This coupon is not yet valid" },
        { status: 400 }
      );
    }

    if (now > coupon.validUntil) {
      return NextResponse.json(
        { error: "This coupon has expired" },
        { status: 400 }
      );
    }

    // Check usage limit
    if (
      coupon.maxUsageCount &&
      coupon.currentUsageCount >= coupon.maxUsageCount
    ) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit" },
        { status: 400 }
      );
    }

    // Check course restrictions
    const [courseRestriction] = await db
      .select()
      .from(CouponCoursesTable)
      .where(eq(CouponCoursesTable.couponId, coupon.id))
      .limit(1);

    if (courseRestriction) {
      // Coupon has course restrictions, check if it applies to this course
      const [validCourse] = await db
        .select()
        .from(CouponCoursesTable)
        .where(
          and(
            eq(CouponCoursesTable.couponId, coupon.id),
            eq(CouponCoursesTable.courseId, courseId)
          )
        )
        .limit(1);

      if (!validCourse) {
        return NextResponse.json(
          { error: "This coupon is not valid for the selected course" },
          { status: 400 }
        );
      }
    }

    // Check user-specific assignments (personal coupons)
    const [userAssignment] = await db
      .select()
      .from(UserCourseCouponsTable)
      .where(
        and(
          eq(UserCourseCouponsTable.couponId, coupon.id),
          eq(UserCourseCouponsTable.courseId, courseId)
        )
      )
      .limit(1);

    if (userAssignment) {
      // This is a personal coupon assigned to specific users
      if (!userId) {
        return NextResponse.json(
          { error: "Please log in to use this coupon" },
          { status: 400 }
        );
      }

      // Check if this specific user is assigned this coupon
      const [userSpecificAssignment] = await db
        .select()
        .from(UserCourseCouponsTable)
        .where(
          and(
            eq(UserCourseCouponsTable.couponId, coupon.id),
            eq(UserCourseCouponsTable.courseId, courseId),
            eq(UserCourseCouponsTable.userId, userId)
          )
        )
        .limit(1);

      if (!userSpecificAssignment) {
        return NextResponse.json(
          { error: "This coupon is not assigned to you" },
          { status: 400 }
        );
      }
    } else {
      // This is a general coupon (no user assignments)
      // Check if there are any user assignments for this coupon at all
      const [anyUserAssignment] = await db
        .select()
        .from(UserCourseCouponsTable)
        .where(eq(UserCourseCouponsTable.couponId, coupon.id))
        .limit(1);

      if (anyUserAssignment) {
        // This coupon has user assignments, but not for this course
        // So it's not valid for this course
        return NextResponse.json(
          { error: "This coupon is not valid for the selected course" },
          { status: 400 }
        );
      }
      // If no user assignments exist at all, it's a true general coupon
    }

    // If we reach here, the coupon is valid
    return NextResponse.json(
      {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          description: coupon.description,
          typeName: coupon.typeName,
          creatorName: coupon.creatorName,
          creatorCode: coupon.creatorCode,
          isPersonal: !!userAssignment, // Indicates if this is a personal coupon
        },
        commission: {
          jyotishiId: coupon.createdByJyotishiId,
          commissionRate: coupon.commissionRate,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}