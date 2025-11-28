
// app/api/admin/jyotishi/[id]/stats/route.ts
import { db } from "@/db";
import {
  CommissionsTable,
  CoursesTable,
  UsersTable
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Get detailed statistics
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query conditions
    const conditions = [eq(CommissionsTable.jyotishiId, params.id)];

    if (startDate) {
      conditions.push(
        sql`${CommissionsTable.createdAt} >= ${new Date(startDate)}`
      );
    }
    if (endDate) {
      conditions.push(
        sql`${CommissionsTable.createdAt} <= ${new Date(endDate)}`
      );
    }

    // Overall statistics
    const [overallStats] = await db
      .select({
        totalCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
        pendingCommission: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PENDING' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
        paidCommission: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PAID' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
        totalSales: sql<number>`COUNT(*)`,
        totalSaleAmount: sql<number>`COALESCE(SUM(${CommissionsTable.saleAmount}), 0)`,
      })
      .from(CommissionsTable)
      .where(and(...conditions));

    // Course-wise breakdown
    const courseBreakdown = await db
      .select({
        courseId: CoursesTable.id,
        courseName: CoursesTable.title,
        totalSales: sql<number>`COUNT(*)`,
        totalCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
      })
      .from(CommissionsTable)
      .leftJoin(CoursesTable, eq(CommissionsTable.courseId, CoursesTable.id))
      .where(and(...conditions))
      .groupBy(CoursesTable.id, CoursesTable.title);

    // Monthly trend (last 12 months)
    const monthlyTrend = await db
      .select({
        month: sql<string>`TO_CHAR(${CommissionsTable.createdAt}, 'YYYY-MM')`,
        totalSales: sql<number>`COUNT(*)`,
        totalCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
      })
      .from(CommissionsTable)
      .where(eq(CommissionsTable.jyotishiId, params.id))
      .groupBy(sql`TO_CHAR(${CommissionsTable.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${CommissionsTable.createdAt}, 'YYYY-MM') DESC`)
      .limit(12);

    // Top students
    const topStudents = await db
      .select({
        studentId: UsersTable.id,
        studentName: UsersTable.name,
        studentEmail: UsersTable.email,
        totalPurchases: sql<number>`COUNT(*)`,
        totalCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
      })
      .from(CommissionsTable)
      .leftJoin(UsersTable, eq(CommissionsTable.studentId, UsersTable.id))
      .where(eq(CommissionsTable.jyotishiId, params.id))
      .groupBy(UsersTable.id, UsersTable.name, UsersTable.email)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    return NextResponse.json(
      {
        overallStats,
        courseBreakdown,
        monthlyTrend,
        topStudents,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching jyotishi stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}