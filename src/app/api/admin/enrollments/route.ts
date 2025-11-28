/* eslint-disable @typescript-eslint/no-unused-vars */
import { EnrollmentsTable, CoursesTable } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let enrollments;

    if (userId) {
      // Filter by userId
      enrollments = await db
        .select({
          id: EnrollmentsTable.id,
          userId: EnrollmentsTable.userId,
          courseId: EnrollmentsTable.courseId,
          status: EnrollmentsTable.status,
          enrolledAt: EnrollmentsTable.enrolledAt,
          certificateIssued: EnrollmentsTable.certificateIssued,
          course: {
            id: CoursesTable.id,
            title: CoursesTable.title,
            slug: CoursesTable.slug,
          },
        })
        .from(EnrollmentsTable)
        .leftJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
        .where(eq(EnrollmentsTable.userId, userId)); // ✅ .where() directly in the chain
    } else {
      // No userId filter — fetch all
      enrollments = await db
        .select({
          id: EnrollmentsTable.id,
          userId: EnrollmentsTable.userId,
          courseId: EnrollmentsTable.courseId,
          status: EnrollmentsTable.status,
          enrolledAt: EnrollmentsTable.enrolledAt,
          certificateIssued: EnrollmentsTable.certificateIssued,
          course: {
            id: CoursesTable.id,
            title: CoursesTable.title,
            slug: CoursesTable.slug,
          },
        })
        .from(EnrollmentsTable)
        .leftJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id));
    }

    return NextResponse.json({ enrollments }, { status: 200 });
  } catch (error) {
    console.error("Enrollments API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}
