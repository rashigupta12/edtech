// app/api/jyotishi/assign-coupon/route.ts
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { UserCourseCouponsTable, CouponsTable, UsersTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user to verify Jyotishi role
    const currentUser = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.email, session.user.email))
      .limit(1);

    if (currentUser.length === 0 || currentUser[0].role !== "JYOTISHI") {
      return NextResponse.json({ error: "Forbidden - Jyotishi role required" }, { status: 403 });
    }

    const jyotishiId = currentUser[0].id;
    const body = await request.json();
    
    const { studentId, courseId, couponId } = body;

    // Validate required fields
    if (!studentId || !courseId || !couponId) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, courseId, couponId" },
        { status: 400 }
      );
    }

    // Verify coupon belongs to this Jyotishi and is active
    const coupon = await db
      .select()
      .from(CouponsTable)
      .where(
        and(
          eq(CouponsTable.id, couponId),
          eq(CouponsTable.createdByJyotishiId, jyotishiId),
          eq(CouponsTable.isActive, true)
        )
      )
      .limit(1);

    if (coupon.length === 0) {
      return NextResponse.json(
        { error: "Coupon not found or not owned by this Jyotishi" },
        { status: 404 }
      );
    }

    // Check if coupon is valid (within dates)
    const now = new Date();
    const validFrom = new Date(coupon[0].validFrom);
    const validUntil = new Date(coupon[0].validUntil);

    if (now < validFrom || now > validUntil) {
      return NextResponse.json(
        { error: "Coupon is not currently valid" },
        { status: 400 }
      );
    }

    // Check if user already has a coupon for this course
    const existingAssignment = await db
      .select()
      .from(UserCourseCouponsTable)
      .where(
        and(
          eq(UserCourseCouponsTable.userId, studentId),
          eq(UserCourseCouponsTable.courseId, courseId)
        )
      )
      .limit(1);

    if (existingAssignment.length > 0) {
      // Update existing assignment
      await db
        .update(UserCourseCouponsTable)
        .set({
          couponId,
          assignedBy: jyotishiId,
          createdAt: new Date(),
        })
        .where(eq(UserCourseCouponsTable.id, existingAssignment[0].id));

      return NextResponse.json({
        success: true,
        message: "Coupon assignment updated successfully",
        data: { id: existingAssignment[0].id },
      });
    }

    // Create new assignment
    const [assignment] = await db
      .insert(UserCourseCouponsTable)
      .values({
        userId: studentId,
        courseId,
        couponId,
        assignedBy: jyotishiId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Coupon assigned successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Error assigning coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}