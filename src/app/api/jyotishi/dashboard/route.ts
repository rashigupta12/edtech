// app/api/jyotishi/dashboard/route.ts
/*eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@/db";
import {
  CommissionsTable,
  CouponsTable,
  CouponTypesTable,
  CoursesTable,
  UsersTable
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Dashboard summary
export async function GET(req: NextRequest) {
  try {
    const jyotishiId = "jyotishi-id-from-session";

    // Get Jyotishi details
    const [jyotishi] = await db
      .select({
        name: UsersTable.name,
        jyotishiCode: UsersTable.jyotishiCode,
        commissionRate: UsersTable.commissionRate,
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, jyotishiId))
      .limit(1);

    // Overall commission statistics
    const [commissionStats] = await db
      .select({
        totalEarnings: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
        pendingEarnings: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PENDING' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
        paidEarnings: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PAID' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
        totalSales: sql<number>`COUNT(*)`,
      })
      .from(CommissionsTable)
      .where(eq(CommissionsTable.jyotishiId, jyotishiId));

    // This month stats
    const [thisMonthStats] = await db
      .select({
        earnings: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
        sales: sql<number>`COUNT(*)`,
      })
      .from(CommissionsTable)
      .where(
        and(
          eq(CommissionsTable.jyotishiId, jyotishiId),
          sql`${CommissionsTable.createdAt} >= DATE_TRUNC('month', CURRENT_DATE)`
        )
      );

    // Coupons count
    const [couponsCount] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`COUNT(*) FILTER (WHERE ${CouponsTable.isActive} = true)`,
      })
      .from(CouponsTable)
      .where(eq(CouponsTable.createdByJyotishiId, jyotishiId));

    // Total students
    const [studentsCount] = await db
      .select({
        total: sql<number>`COUNT(DISTINCT ${CommissionsTable.studentId})`,
      })
      .from(CommissionsTable)
      .where(eq(CommissionsTable.jyotishiId, jyotishiId));

    // Recent activity
    const recentActivity = await db
      .select({
        id: CommissionsTable.id,
        amount: CommissionsTable.commissionAmount,
        courseName: CoursesTable.title,
        studentName: UsersTable.name,
        status: CommissionsTable.status,
        createdAt: CommissionsTable.createdAt,
        couponCode: CouponsTable.code,
      })
      .from(CommissionsTable)
      .leftJoin(CoursesTable, eq(CommissionsTable.courseId, CoursesTable.id))
      .leftJoin(UsersTable, eq(CommissionsTable.studentId, UsersTable.id))
      .leftJoin(CouponsTable, eq(CommissionsTable.couponId, CouponsTable.id))
      .where(eq(CommissionsTable.jyotishiId, jyotishiId))
      .orderBy(desc(CommissionsTable.createdAt))
      .limit(5);

    // Top performing coupons
    const topCoupons = await db
      .select({
        code: CouponsTable.code,
        typeName: CouponTypesTable.typeName,
        usage: sql<number>`COUNT(*)`,
        earnings: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
      })
      .from(CommissionsTable)
      .leftJoin(CouponsTable, eq(CommissionsTable.couponId, CouponsTable.id))
      .leftJoin(
        CouponTypesTable,
        eq(CouponsTable.couponTypeId, CouponTypesTable.id)
      )
      .where(eq(CommissionsTable.jyotishiId, jyotishiId))
      .groupBy(CouponsTable.code, CouponTypesTable.typeName)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5);

    return NextResponse.json(
      {
        jyotishi,
        commissionStats,
        thisMonth: thisMonthStats,
        coupons: couponsCount,
        students: studentsCount,
        recentActivity,
        topCoupons,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
