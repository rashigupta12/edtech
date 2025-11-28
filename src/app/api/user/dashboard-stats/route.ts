// src/app/api/user/dashboard-stats/route.ts
import { auth } from "@/auth";
import { db } from "@/db";
import {
  CourseSessionsTable,
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

    // Get enrolled courses count
    const enrolledCoursesResult = await db
      .select({ count: count() })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.status, "ACTIVE")
        )
      );

    // Get total hours learned (sum of completed sessions)
    const hoursResult = await db
      .select({
        totalHours: sql<number>`COALESCE(SUM(${CourseSessionsTable.duration}), 0)`
      })
      .from(CourseSessionsTable)
      .innerJoin(EnrollmentsTable, eq(CourseSessionsTable.courseId, EnrollmentsTable.courseId))
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(CourseSessionsTable.isCompleted, true)
        )
      );

    // Get certificates count
    const certificatesResult = await db
      .select({ count: count() })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.certificateIssued, true)
        )
      );

    // Get certificates in progress
    const inProgressResult = await db
      .select({ count: count() })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.status, "ACTIVE"),
          eq(EnrollmentsTable.certificateIssued, false)
        )
      );

    // Calculate learning streak (days with completed sessions)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await db
      .select({
        date: sql<string>`DATE(${CourseSessionsTable.sessionDate})`
      })
      .from(CourseSessionsTable)
      .innerJoin(EnrollmentsTable, eq(CourseSessionsTable.courseId, EnrollmentsTable.courseId))
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(CourseSessionsTable.isCompleted, true),
          sql`${CourseSessionsTable.sessionDate} >= ${thirtyDaysAgo}`
        )
      )
      .orderBy(sql`DATE(${CourseSessionsTable.sessionDate}) DESC`);

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const uniqueDates = [...new Set(recentSessions.map(s => s.date))].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    for (let i = 0; i < uniqueDates.length; i++) {
      const sessionDate = new Date(uniqueDates[i]);
      sessionDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (sessionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    // Get enrolled courses with this month's count
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const thisMonthEnrollments = await db
      .select({ count: count() })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          sql`${EnrollmentsTable.enrolledAt} >= ${firstDayOfMonth}`
        )
      );

    const totalHoursInMinutes = hoursResult[0]?.totalHours || 0;
    const totalHours = Math.round(totalHoursInMinutes / 60);

    return NextResponse.json({
      enrolledCourses: enrolledCoursesResult[0]?.count || 0,
      newThisMonth: thisMonthEnrollments[0]?.count || 0,
      hoursLearned: totalHours,
      certificates: certificatesResult[0]?.count || 0,
      certificatesInProgress: inProgressResult[0]?.count || 0,
      learningStreak: streak,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}