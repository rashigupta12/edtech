// app/api/bootcamps/enrollment-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  BootcampEnrollmentsTable,
  UsersTable,
  BootcampsTable,
  CollegesTable,
} from "@/db/schema";
import { eq, count, and, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    
    // Get query parameters
    const userId = searchParams.get("userId");
    const bootcampId = searchParams.get("bootcampId");
    const status = searchParams.get("status");

    // 1. Get total enrollments with filters
    const validStatuses = ["ACTIVE", "COMPLETED", "DROPPED"];
    const conditions = [];
    if (userId) conditions.push(eq(BootcampEnrollmentsTable.userId, userId));
    if (bootcampId) conditions.push(eq(BootcampEnrollmentsTable.bootcampId, bootcampId));
    if (status && validStatuses.includes(status)) conditions.push(eq(BootcampEnrollmentsTable.status, status as "ACTIVE" | "COMPLETED" | "DROPPED"));
    
    const totalQuery = conditions.length > 0
      ? db.select({ count: count() }).from(BootcampEnrollmentsTable).where(and(...conditions))
      : db.select({ count: count() }).from(BootcampEnrollmentsTable);
    
    const [{ count: totalEnrollments }] = await totalQuery;

    // 2. Get enrollments by status
    const statusData = await db
      .select({
        status: BootcampEnrollmentsTable.status,
        count: count(),
      })
      .from(BootcampEnrollmentsTable)
      .groupBy(BootcampEnrollmentsTable.status);

    // 3. Get top bootcamps
    const topBootcamps = await db
      .select({
        bootcampId: BootcampsTable.id,
        title: BootcampsTable.title,
        slug: BootcampsTable.slug,
        enrollments: count(BootcampEnrollmentsTable.id),
        collegeName: CollegesTable.collegeName,
      })
      .from(BootcampEnrollmentsTable)
      .innerJoin(BootcampsTable, eq(BootcampEnrollmentsTable.bootcampId, BootcampsTable.id))
      .leftJoin(CollegesTable, eq(BootcampsTable.collegeId, CollegesTable.id))
      .groupBy(BootcampsTable.id, BootcampsTable.title, BootcampsTable.slug, CollegesTable.collegeName)
      .orderBy(desc(count(BootcampEnrollmentsTable.id)))
      .limit(10);

    // 4. Get recent enrollments
    const recentEnrollments = await db
      .select({
        id: BootcampEnrollmentsTable.id,
        studentName: UsersTable.name,
        studentEmail: UsersTable.email,
        bootcampTitle: BootcampsTable.title,
        bootcampSlug: BootcampsTable.slug,
        status: BootcampEnrollmentsTable.status,
        progress: BootcampEnrollmentsTable.progress,
        enrolledAt: BootcampEnrollmentsTable.enrolledAt,
        collegeName: CollegesTable.collegeName,
      })
      .from(BootcampEnrollmentsTable)
      .innerJoin(UsersTable, eq(BootcampEnrollmentsTable.userId, UsersTable.id))
      .innerJoin(BootcampsTable, eq(BootcampEnrollmentsTable.bootcampId, BootcampsTable.id))
      .leftJoin(CollegesTable, eq(BootcampsTable.collegeId, CollegesTable.id))
      .orderBy(desc(BootcampEnrollmentsTable.enrolledAt))
      .limit(10);

    // 5. Get completion stats
    const [{ completed, active }] = await db
      .select({
        completed: count(sql`CASE WHEN ${BootcampEnrollmentsTable.status} = 'COMPLETED' THEN 1 END`),
        active: count(sql`CASE WHEN ${BootcampEnrollmentsTable.status} = 'ACTIVE' THEN 1 END`),
        dropped: count(sql`CASE WHEN ${BootcampEnrollmentsTable.status} = 'DROPPED' THEN 1 END`),
      })
      .from(BootcampEnrollmentsTable);

    // 6. Get average progress
    const [{ avgProgress }] = await db
      .select({
        avgProgress: sql<number>`AVG(${BootcampEnrollmentsTable.progress})`,
      })
      .from(BootcampEnrollmentsTable);

    // Calculate completion rate
    const completionRate = totalEnrollments > 0 
      ? Math.round((Number(completed) / totalEnrollments) * 100) 
      : 0;

    const response = {
      success: true,
      data: {
        summary: {
          totalEnrollments,
          completionRate,
          activeEnrollments: Number(active),
          completedEnrollments: Number(completed),
          averageProgress: Math.round(Number(avgProgress) || 0),
        },
        statusBreakdown: statusData.map(item => ({
          status: item.status,
          count: Number(item.count),
          percentage: Math.round((Number(item.count) / totalEnrollments) * 100)
        })),
        topBootcamps: topBootcamps.map(item => ({
          id: item.bootcampId,
          title: item.title,
          slug: item.slug,
          enrollments: Number(item.enrollments),
          college: item.collegeName,
        })),
        recentEnrollments: recentEnrollments.map(item => ({
          id: item.id,
          student: {
            name: item.studentName,
            email: item.studentEmail,
          },
          bootcamp: {
            title: item.bootcampTitle,
            slug: item.bootcampSlug,
          },
          status: item.status,
          progress: item.progress,
          enrolledAt: item.enrolledAt,
          college: item.collegeName,
        })),
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Error fetching bootcamp stats:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch bootcamp enrollment statistics" 
      },
      { status: 500 }
    );
  }
}

// Optional: Simple POST endpoint for student-specific data
export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Get student's bootcamp enrollments
    const enrollments = await db
      .select({
        id: BootcampEnrollmentsTable.id,
        bootcampId: BootcampsTable.id,
        bootcampTitle: BootcampsTable.title,
        bootcampSlug: BootcampsTable.slug,
        status: BootcampEnrollmentsTable.status,
        progress: BootcampEnrollmentsTable.progress,
        enrolledAt: BootcampEnrollmentsTable.enrolledAt,
        completedAt: BootcampEnrollmentsTable.completedAt,
      })
      .from(BootcampEnrollmentsTable)
      .innerJoin(BootcampsTable, eq(BootcampEnrollmentsTable.bootcampId, BootcampsTable.id))
      .where(eq(BootcampEnrollmentsTable.userId, studentId))
      .orderBy(desc(BootcampEnrollmentsTable.enrolledAt));

    return NextResponse.json({
      success: true,
      data: {
        studentId,
        totalEnrollments: enrollments.length,
        enrollments,
      },
    });

  } catch (error) {
    console.error("Error fetching student bootcamps:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch student bootcamp data" 
      },
      { status: 500 }
    );
  }
}