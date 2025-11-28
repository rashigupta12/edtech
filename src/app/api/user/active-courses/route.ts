// src/app/api/user/active-courses/route.ts
import { auth } from "@/auth";
import { db } from "@/db";
import {
  CourseSessionsTable,
  CoursesTable,
  EnrollmentsTable
} from "@/db/schema";
import { and, count, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get active enrollments with course details
    const enrollments = await db
      .select({
        enrollmentId: EnrollmentsTable.id,
        courseId: CoursesTable.id,
        courseTitle: CoursesTable.title,
        courseSlug: CoursesTable.slug,
        courseThumbnail: CoursesTable.thumbnailUrl,
        totalSessions: CoursesTable.totalSessions,
        enrolledAt: EnrollmentsTable.enrolledAt,
      })
      .from(EnrollmentsTable)
      .innerJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.status, "ACTIVE")
        )
      )
      .orderBy(sql`${EnrollmentsTable.enrolledAt} DESC`)
      .limit(3);

    // For each enrollment, calculate progress
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get completed sessions count for this course
        const completedSessionsResult = await db
          .select({ count: count() })
          .from(CourseSessionsTable)
          .where(
            and(
              eq(CourseSessionsTable.courseId, enrollment.courseId),
              eq(CourseSessionsTable.isCompleted, true)
            )
          );

        const completed = completedSessionsResult[0]?.count || 0;
        const total = enrollment.totalSessions || 1;
        const progress = Math.min(Math.round((completed / total) * 100), 100);

        return {
          id: enrollment.courseId,
          title: enrollment.courseTitle,
          slug: enrollment.courseSlug,
          progress,
          sessions: total,
          completedSessions: completed,
          thumbnail: enrollment.courseThumbnail,
        };
      })
    );

    return NextResponse.json(coursesWithProgress);
  } catch (error) {
    console.error("Active courses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch active courses" },
      { status: 500 }
    );
  }
}