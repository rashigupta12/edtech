/*eslint-disable  @typescript-eslint/no-explicit-any*/
// app/api/jyotishi/earnings/route.ts
import { auth } from "@/auth";
import { db } from "@/db";
import {
  CommissionsTable,
  CouponsTable,
  CoursesTable,
  UsersTable,
  PaymentsTable, // Add this import
} from "@/db/schema";
import { and, desc, eq, sql, gte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const jyotishiId = session?.user?.id;
    if (!jyotishiId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    const filter = searchParams.get("filter") as 'ytd' | 'mtd' || 'mtd';
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    // Calculate date ranges for YTD/MTD
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayThisYear = new Date(now.getFullYear(), 0, 1);
    const startDate = filter === 'mtd' ? firstDayThisMonth : firstDayThisYear;

    // ---------- base conditions ----------
    const conds: any[] = [eq(CommissionsTable.jyotishiId, jyotishiId)];
    const paymentConds: any[] = [eq(PaymentsTable.jyotishiId, jyotishiId)];
    
    if (start) {
      conds.push(sql`${CommissionsTable.createdAt} >= ${new Date(start)}`);
      paymentConds.push(sql`${PaymentsTable.createdAt} >= ${new Date(start)}`);
    } else {
      // Apply YTD/MTD filter if no custom date range
      conds.push(gte(CommissionsTable.createdAt, startDate));
      paymentConds.push(gte(PaymentsTable.createdAt, startDate));
    }
    
    if (end) {
      conds.push(sql`${CommissionsTable.createdAt} <= ${new Date(end)}`);
      paymentConds.push(sql`${PaymentsTable.createdAt} <= ${new Date(end)}`);
    }

    // ---------- aggregated stats ----------
    // Commission stats
    const [commissionStats] = await db
      .select({
        totalCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}),0)`.mapWith(Number),
        pendingEarnings: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status}='PENDING' THEN ${CommissionsTable.commissionAmount} ELSE 0 END),0)`.mapWith(Number),
        paidEarnings: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status}='PAID' THEN ${CommissionsTable.commissionAmount} ELSE 0 END),0)`.mapWith(Number),
        totalSalesCount: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(CommissionsTable)
      .where(and(...conds));

    // Sales stats from Payments table (course sale amounts)
    const [salesStats] = await db
      .select({
        totalSales: sql<number>`COALESCE(SUM(${PaymentsTable.finalAmount}),0)`.mapWith(Number),
        salesCount: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(PaymentsTable)
      .where(and(...paymentConds, eq(PaymentsTable.status, "COMPLETED")));

    // YTD Stats
    const [ytdCommissionStats] = await db
      .select({
        ytdCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}),0)`.mapWith(Number),
        ytdSalesCount: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(CommissionsTable)
      .where(and(
        eq(CommissionsTable.jyotishiId, jyotishiId),
        gte(CommissionsTable.createdAt, firstDayThisYear)
      ));

    const [ytdSalesStats] = await db
      .select({
        ytdSales: sql<number>`COALESCE(SUM(${PaymentsTable.finalAmount}),0)`.mapWith(Number),
      })
      .from(PaymentsTable)
      .where(and(
        eq(PaymentsTable.jyotishiId, jyotishiId),
        eq(PaymentsTable.status, "COMPLETED"),
        gte(PaymentsTable.createdAt, firstDayThisYear)
      ));

    // MTD Stats
    const [mtdCommissionStats] = await db
      .select({
        mtdCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}),0)`.mapWith(Number),
        mtdSalesCount: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(CommissionsTable)
      .where(and(
        eq(CommissionsTable.jyotishiId, jyotishiId),
        gte(CommissionsTable.createdAt, firstDayThisMonth)
      ));

    const [mtdSalesStats] = await db
      .select({
        mtdSales: sql<number>`COALESCE(SUM(${PaymentsTable.finalAmount}),0)`.mapWith(Number),
      })
      .from(PaymentsTable)
      .where(and(
        eq(PaymentsTable.jyotishiId, jyotishiId),
        eq(PaymentsTable.status, "COMPLETED"),
        gte(PaymentsTable.createdAt, firstDayThisMonth)
      ));

    // All-time totals
    const [allTimeCommissionStats] = await db
      .select({
        totalCommissionAllTime: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}),0)`.mapWith(Number),
      })
      .from(CommissionsTable)
      .where(eq(CommissionsTable.jyotishiId, jyotishiId));

    const [allTimeSalesStats] = await db
      .select({
        totalSalesAllTime: sql<number>`COALESCE(SUM(${PaymentsTable.finalAmount}),0)`.mapWith(Number),
      })
      .from(PaymentsTable)
      .where(and(
        eq(PaymentsTable.jyotishiId, jyotishiId),
        eq(PaymentsTable.status, "COMPLETED")
      ));

    // ---------- recent commissions (paginated) ----------
    const recent = await db
      .select({
        id: CommissionsTable.id,
        saleAmount: CommissionsTable.saleAmount,
        commissionAmount: CommissionsTable.commissionAmount,
        status: CommissionsTable.status,
        courseName: CoursesTable.title,
        studentName: UsersTable.name,
        couponCode: CouponsTable.code,
        createdAt: CommissionsTable.createdAt,
        paidAt: CommissionsTable.paidAt,
      })
      .from(CommissionsTable)
      .leftJoin(CoursesTable, eq(CommissionsTable.courseId, CoursesTable.id))
      .leftJoin(UsersTable, eq(CommissionsTable.studentId, UsersTable.id))
      .leftJoin(CouponsTable, eq(CommissionsTable.couponId, CouponsTable.id))
      .where(and(...conds))
      .orderBy(desc(CommissionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // ---------- total rows for pagination ----------
    const [{ total }] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(CommissionsTable)
      .where(and(...conds));

    const stats = {
      // Current period stats (based on filter or custom date range)
      totalSales: salesStats.totalSales.toString(),
      totalCommission: commissionStats.totalCommission.toString(),
      paidEarnings: commissionStats.paidEarnings.toString(),
      pendingEarnings: commissionStats.pendingEarnings.toString(),
      salesCount: commissionStats.totalSalesCount,
      
      // YTD stats
      ytdSales: ytdSalesStats.ytdSales.toString(),
      ytdCommission: ytdCommissionStats.ytdCommission.toString(),
      ytdSalesCount: ytdCommissionStats.ytdSalesCount,
      
      // MTD stats
      mtdSales: mtdSalesStats.mtdSales.toString(),
      mtdCommission: mtdCommissionStats.mtdCommission.toString(),
      mtdSalesCount: mtdCommissionStats.mtdSalesCount,
      
      // All-time totals
      totalSalesAllTime: allTimeSalesStats.totalSalesAllTime.toString(),
      totalCommissionAllTime: allTimeCommissionStats.totalCommissionAllTime.toString(),
    };

    return NextResponse.json(
      {
        stats,
        recentCommissions: recent,
        pagination: { page, limit, total: Number(total) },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Earnings API error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}