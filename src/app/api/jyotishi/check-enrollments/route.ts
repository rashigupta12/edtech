// app/api/jyotishi/check-enrollments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { EnrollmentsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Get all enrollments for this course
    const enrollments = await db
      .select({
        studentId: EnrollmentsTable.userId,
      })
      .from(EnrollmentsTable)
      .where(eq(EnrollmentsTable.courseId, courseId));

    // Create enrollment check array
    const enrollmentChecks = enrollments.map(enrollment => ({
      studentId: enrollment.studentId,
      isEnrolled: true
    }));

    return NextResponse.json({
      enrollments: enrollmentChecks
    });
  } catch (error) {
    console.error("Error checking enrollments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}