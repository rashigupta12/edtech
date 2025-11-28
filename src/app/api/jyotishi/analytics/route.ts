
// app/api/jyotishi/analytics/route.ts
/*eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@/db";
import {
  CommissionsTable,
  CouponsTable,
  CoursesTable
} from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Get performance analytics
export async function GET(req: NextRequest) {
  try {
    const jyotishiId = "jyotishi-id-from-session";

    // Overall stats
    const [overallStats] = await db
      .select({
        totalEarnings: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
        totalSales: sql<number>`COUNT(*)`,
        averageCommission: sql<number>`COALESCE(AVG(${CommissionsTable.commissionAmount}), 0)`,
      })
      .from(CommissionsTable)
      .where(eq(CommissionsTable.jyotishiId, jyotishiId));

    // Monthly trend (last 12 months)
    const monthlyTrend = await db
      .select({
        month: sql<string>`TO_CHAR(${CommissionsTable.createdAt}, 'YYYY-MM')`,
        sales: sql<number>`COUNT(*)`,
        earnings: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
      })
      .from(CommissionsTable)
      .where(eq(CommissionsTable.jyotishiId, jyotishiId))
      .groupBy(sql`TO_CHAR(${CommissionsTable.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${CommissionsTable.createdAt}, 'YYYY-MM') DESC`)
      .limit(12);

    // Course performance
    const coursePerformance = await db
      .select({
        courseId: CoursesTable.id,
        courseName: CoursesTable.title,
        sales: sql<number>`COUNT(*)`,
        earnings: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
      })
      .from(CommissionsTable)
      .leftJoin(CoursesTable, eq(CommissionsTable.courseId, CoursesTable.id))
      .where(eq(CommissionsTable.jyotishiId, jyotishiId))
      .groupBy(CoursesTable.id, CoursesTable.title)
      .orderBy(desc(sql`COUNT(*)`));

    // Coupon performance
    const couponPerformance = await db
      .select({
        couponId: CouponsTable.id,
        couponCode: CouponsTable.code,
        usage: sql<number>`COUNT(*)`,
        earnings: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
      })
      .from(CommissionsTable)
      .leftJoin(CouponsTable, eq(CommissionsTable.couponId, CouponsTable.id))
      .where(eq(CommissionsTable.jyotishiId, jyotishiId))
      .groupBy(CouponsTable.id, CouponsTable.code)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    return NextResponse.json(
      {
        overallStats,
        monthlyTrend,
        coursePerformance,
        couponPerformance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}