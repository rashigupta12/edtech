//src/api/courses/enroll/route.ts

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { EnrollmentsTable, PaymentsTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// app/api/courses/enroll/route.ts
export async function POST(req: NextRequest) {
  try {
    const { courseId, paymentId } = await req.json();
    const userId = "user-id-from-session";

    // Check if already enrolled
    const [existingEnrollment] = await db
      .select()
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.courseId, courseId)
        )
      )
      .limit(1);

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Already enrolled in this course" },
        { status: 400 }
      );
    }

    // Verify payment
    const [payment] = await db
      .select()
      .from(PaymentsTable)
      .where(
        and(
          eq(PaymentsTable.id, paymentId),
          eq(PaymentsTable.userId, userId),
          eq(PaymentsTable.status, "COMPLETED")
        )
      )
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { error: "Valid payment not found" },
        { status: 400 }
      );
    }

    // Create enrollment
    const [enrollment] = await db
      .insert(EnrollmentsTable)
      .values({
        userId,
        courseId,
        status: "ACTIVE",
      })
      .returning();

    // Link payment to enrollment
    await db
      .update(PaymentsTable)
      .set({ enrollmentId: enrollment.id })
      .where(eq(PaymentsTable.id, paymentId));

    return NextResponse.json(
      { message: "Enrolled successfully", enrollment },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to enroll in course" },
      { status: 500 }
    );
  }
}