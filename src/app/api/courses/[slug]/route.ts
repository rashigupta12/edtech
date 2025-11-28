/*eslint-disable @typescript-eslint/no-explicit-any*/
// src/app/api/courses/[slug]/route.ts
import { auth } from "@/auth";
import { db } from "@/db";
import {
  CourseContentTable,
  CourseFeaturesTable,
  CoursesTable,
  CourseTopicsTable,
  CourseWhyLearnTable,
  UserCourseCouponsTable,
  CouponsTable,
  CouponTypesTable,
  CouponCoursesTable,
  UsersTable,
} from "@/db/schema";
import { eq, and, gt, lt, or, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;

  try {
    // Fetch base course
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.slug, params.slug))
      .limit(1);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Fetch related course data
    const features = await db
      .select()
      .from(CourseFeaturesTable)
      .where(eq(CourseFeaturesTable.courseId, course.id));

    const whyLearn = await db
      .select()
      .from(CourseWhyLearnTable)
      .where(eq(CourseWhyLearnTable.courseId, course.id));

    const content = await db
      .select()
      .from(CourseContentTable)
      .where(eq(CourseContentTable.courseId, course.id));

    const topics = await db
      .select()
      .from(CourseTopicsTable)
      .where(eq(CourseTopicsTable.courseId, course.id));

    // Handle coupon logic - FOR BOTH LOGGED-IN AND LOGGED-OUT USERS
    const session = await auth();
    let finalPrice = parseFloat(course.priceINR);
    let totalDiscountAmount = 0;
    let adminDiscountAmount = 0;
    let jyotishiDiscountAmount = 0;
    let priceAfterAdminDiscount = finalPrice;
    const appliedCoupons: any[] = [];
    let hasAssignedCoupon = false;

    const userId = session?.user?.id;

    // ✅ FIXED: Get general coupons (available to everyone) - ONLY course-specific coupons
    // Uses INNER JOIN to ensure coupons MUST be mapped to this specific course
    const generalCoupons = await db
      .select({
        coupon: CouponsTable,
        couponType: CouponTypesTable,
        creator: UsersTable,
      })
      .from(CouponsTable)
      .innerJoin(
        CouponTypesTable,
        eq(CouponsTable.couponTypeId, CouponTypesTable.id)
      )
      .leftJoin(
        UsersTable,
        eq(CouponsTable.createdByJyotishiId, UsersTable.id)
      )
      // ✅ INNER JOIN ensures coupon MUST be mapped to THIS course
      .innerJoin(
        CouponCoursesTable,
        and(
          eq(CouponCoursesTable.couponId, CouponsTable.id),
          eq(CouponCoursesTable.courseId, course.id)
        )
      )
      .where(
        and(
          eq(CouponsTable.isActive, true),
          lt(CouponsTable.validFrom, new Date()),
          gt(CouponsTable.validUntil, new Date()),
          or(
            isNull(CouponsTable.maxUsageCount),
            lt(CouponsTable.currentUsageCount, CouponsTable.maxUsageCount)
          )
        )
      )
      .groupBy(CouponsTable.id, CouponTypesTable.id, UsersTable.id);

    console.log("General coupons for course", course.id, ":", generalCoupons.length);

    let currentPrice = finalPrice;

    // Separate coupons by creator type
    const adminCoupons = generalCoupons.filter(
      (c) => c.creator?.role === "ADMIN" || c.coupon.createdByJyotishiId === null
    );
    const jyotishiCoupons = generalCoupons.filter(
      (c) => c.creator?.role === "JYOTISHI" && c.coupon.createdByJyotishiId !== null
    );

    console.log("Admin coupons:", adminCoupons.length);
    console.log("Jyotishi coupons:", jyotishiCoupons.length);

    // Apply admin coupons first
    for (const couponData of adminCoupons) {
      const { coupon, creator } = couponData;
      let discountAmount = 0;

      if (coupon.discountType === "FIXED_AMOUNT") {
        discountAmount = Math.min(
          parseFloat(coupon.discountValue),
          currentPrice
        );
      } else {
        discountAmount = (currentPrice * parseFloat(coupon.discountValue)) / 100;
      }

      if (discountAmount > 0) {
        currentPrice -= discountAmount;
        totalDiscountAmount += discountAmount;
        adminDiscountAmount += discountAmount;

        appliedCoupons.push({
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
          creatorType: "ADMIN" as const,
          creatorName: creator?.name,
          isPersonal: false, // General coupons are not personal
        });
      }
    }

    // Update price after admin discounts
    priceAfterAdminDiscount = currentPrice;

    // Apply jyotishi coupons second
    for (const couponData of jyotishiCoupons) {
      const { coupon, creator } = couponData;
      let discountAmount = 0;

      if (coupon.discountType === "FIXED_AMOUNT") {
        discountAmount = Math.min(
          parseFloat(coupon.discountValue),
          currentPrice
        );
      } else {
        discountAmount = (currentPrice * parseFloat(coupon.discountValue)) / 100;
      }

      if (discountAmount > 0) {
        currentPrice -= discountAmount;
        totalDiscountAmount += discountAmount;
        jyotishiDiscountAmount += discountAmount;

        appliedCoupons.push({
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
          creatorType: "JYOTISHI" as const,
          creatorName: creator?.name,
          isPersonal: false, // General coupons are not personal
        });
      }
    }

    // Only fetch and apply personal coupons if user is logged in
    if (userId) {
      const personalCoupons = await db
        .select({
          coupon: CouponsTable,
          couponType: CouponTypesTable,
          creator: UsersTable,
          assignment: UserCourseCouponsTable,
        })
        .from(UserCourseCouponsTable)
        .innerJoin(
          CouponsTable,
          eq(UserCourseCouponsTable.couponId, CouponsTable.id)
        )
        .innerJoin(
          CouponTypesTable,
          eq(CouponsTable.couponTypeId, CouponTypesTable.id)
        )
        .leftJoin(
          UsersTable,
          eq(CouponsTable.createdByJyotishiId, UsersTable.id)
        )
        .where(
          and(
            eq(UserCourseCouponsTable.userId, userId),
            eq(UserCourseCouponsTable.courseId, course.id),
            eq(CouponsTable.isActive, true),
            lt(CouponsTable.validFrom, new Date()),
            gt(CouponsTable.validUntil, new Date()),
            or(
              isNull(CouponsTable.maxUsageCount),
              lt(CouponsTable.currentUsageCount, CouponsTable.maxUsageCount)
            )
          )
        );

      console.log("Personal coupons for user", userId, "course", course.id, ":", personalCoupons.length);

      // Apply personal coupons on top of general coupons
      for (const couponData of personalCoupons) {
        const { coupon, creator } = couponData;
        
        // Skip if this coupon was already applied as a general coupon
        if (appliedCoupons.some(ac => ac.id === coupon.id)) continue;
        
        let discountAmount = 0;

        if (coupon.discountType === "FIXED_AMOUNT") {
          discountAmount = Math.min(
            parseFloat(coupon.discountValue),
            currentPrice
          );
        } else {
          discountAmount = (currentPrice * parseFloat(coupon.discountValue)) / 100;
        }

        if (discountAmount > 0) {
          currentPrice -= discountAmount;
          totalDiscountAmount += discountAmount;

          // Add to appropriate discount type
          if (creator?.role === "ADMIN" || coupon.createdByJyotishiId === null) {
            adminDiscountAmount += discountAmount;
          } else {
            jyotishiDiscountAmount += discountAmount;
          }

          appliedCoupons.push({
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount,
            creatorType: (creator?.role === "ADMIN" || coupon.createdByJyotishiId === null) ? "ADMIN" as const : "JYOTISHI" as const,
            creatorName: creator?.name,
            isPersonal: true,
          });

          hasAssignedCoupon = true;
        }
      }
    }

    finalPrice = Math.max(0, currentPrice);

    

    // ✅ Return response
  return NextResponse.json(
  {
    course: {
      ...course,
      commissionPercourse: course.commissionPercourse, // ← ADD THIS LINE
      features: features.map((f) => f.feature),
      whyLearn: whyLearn.map((w) => ({
        title: w.title,
        description: w.description,
      })),
      content: content.map((c) => c.content),
      topics: topics.map((t) => t.topic),
      originalPrice: course.priceINR,
      finalPrice: finalPrice.toFixed(2),
      discountAmount: totalDiscountAmount.toFixed(2),
      adminDiscountAmount: adminDiscountAmount.toFixed(2),
      jyotishiDiscountAmount: jyotishiDiscountAmount.toFixed(2),
      priceAfterAdminDiscount: priceAfterAdminDiscount.toFixed(2),
      appliedCoupons: appliedCoupons.length > 0 ? appliedCoupons : null,
      hasAssignedCoupon,
    },
  },
  { status: 200 }
);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}