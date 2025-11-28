/*eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/jyotishi/dashboard-stats/route.ts
import { auth } from "@/auth";
import { db } from "@/db";
import {
  CommissionsTable,
  CouponsTable,
  PayoutsTable,
  UsersTable,
  PaymentsTable // Add this import
} from "@/db/schema";
import { and, count, eq, gte, sql, sum } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== "JYOTISHI") {
      return NextResponse.json(
        { error: "Unauthorized - Agent access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') as 'ytd' | 'mtd' || 'mtd';

    const jyotishiId = session.user.id;

    // Calculate date ranges
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayThisYear = new Date(now.getFullYear(), 0, 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Determine date range based on filter
    const startDate = filter === 'mtd' ? firstDayThisMonth : firstDayThisYear;

    // 1. Total Active Coupons (not time-based)
    const [activeCoupons] = await db
      .select({ count: count() })
      .from(CouponsTable)
      .where(
        and(
          eq(CouponsTable.createdByJyotishiId, jyotishiId),
          eq(CouponsTable.isActive, true),
          sql`${CouponsTable.validUntil} > NOW()`
        )
      );

    const [totalCoupons] = await db
      .select({ count: count() })
      .from(CouponsTable)
      .where(eq(CouponsTable.createdByJyotishiId, jyotishiId));

    // 2. Total Sales Amount (All time - using PaymentsTable.finalAmount)
    const [totalSalesData] = await db
      .select({ 
        total: sum(PaymentsTable.finalAmount),
        count: count()
      })
      .from(PaymentsTable)
      .where(
        and(
          eq(PaymentsTable.jyotishiId, jyotishiId),
          eq(PaymentsTable.status, "COMPLETED")
        )
      );

    const totalSalesAmount = parseFloat(totalSalesData?.total || "0");
    const totalSalesCount = totalSalesData?.count || 0;

    // 3. Filtered Period Sales (MTD or YTD) - using PaymentsTable.finalAmount
    // const [filteredSales] = await db
    //   .select({ 
    //     total: sum(PaymentsTable.finalAmount),
    //     count: count()
    //   })
    //   .from(PaymentsTable)
    //   .where(
    //     and(
    //       eq(PaymentsTable.jyotishiId, jyotishiId),
    //       eq(PaymentsTable.status, "COMPLETED"),
    //       gte(PaymentsTable.createdAt, startDate)
    //     )
    //   );

    // const filteredSalesAmount = parseFloat(filteredSales?.total || "0");
    // const filteredSalesCount = filteredSales?.count || 0;

    // 4. This Month Sales
    const [thisMonthSalesData] = await db
      .select({ 
        total: sum(PaymentsTable.finalAmount),
        count: count()
      })
      .from(PaymentsTable)
      .where(
        and(
          eq(PaymentsTable.jyotishiId, jyotishiId),
          eq(PaymentsTable.status, "COMPLETED"),
          gte(PaymentsTable.createdAt, firstDayThisMonth)
        )
      );

    const thisMonthSalesAmount = parseFloat(thisMonthSalesData?.total || "0");
    const thisMonthSalesCount = thisMonthSalesData?.count || 0;

    // 5. YTD Sales
    const [ytdSalesData] = await db
      .select({ 
        total: sum(PaymentsTable.finalAmount),
        count: count()
      })
      .from(PaymentsTable)
      .where(
        and(
          eq(PaymentsTable.jyotishiId, jyotishiId),
          eq(PaymentsTable.status, "COMPLETED"),
          gte(PaymentsTable.createdAt, firstDayThisYear)
        )
      );

    const ytdSalesAmount = parseFloat(ytdSalesData?.total || "0");
    const ytdSalesCount = ytdSalesData?.count || 0;

    // 6. Commission Calculations (for commission card)
    const [totalCommissions] = await db
      .select({ 
        total: sum(CommissionsTable.commissionAmount),
        count: count()
      })
      .from(CommissionsTable)
      .where(eq(CommissionsTable.jyotishiId, jyotishiId));

    const totalCommissionsAmount = parseFloat(totalCommissions?.total || "0");

    // 7. Filtered Period Commissions (MTD or YTD)
    // const [filteredCommissions] = await db
    //   .select({ 
    //     total: sum(CommissionsTable.commissionAmount),
    //     count: count()
    //   })
    //   .from(CommissionsTable)
    //   .where(
    //     and(
    //       eq(CommissionsTable.jyotishiId, jyotishiId),
    //       gte(CommissionsTable.createdAt, startDate)
    //     )
    //   );

    // const filteredCommissionsAmount = parseFloat(filteredCommissions?.total || "0");

    // 8. This Month Commissions
    const [thisMonthCommissions] = await db
      .select({ 
        total: sum(CommissionsTable.commissionAmount),
        count: count()
      })
      .from(CommissionsTable)
      .where(
        and(
          eq(CommissionsTable.jyotishiId, jyotishiId),
          gte(CommissionsTable.createdAt, firstDayThisMonth)
        )
      );

    const thisMonthCommissionsAmount = parseFloat(thisMonthCommissions?.total || "0");

    // 9. YTD Commissions
    const [ytdCommissions] = await db
      .select({ 
        total: sum(CommissionsTable.commissionAmount),
        count: count()
      })
      .from(CommissionsTable)
      .where(
        and(
          eq(CommissionsTable.jyotishiId, jyotishiId),
          gte(CommissionsTable.createdAt, firstDayThisYear)
        )
      );

    const ytdCommissionsAmount = parseFloat(ytdCommissions?.total || "0");

    // 10. Last Month Sales (for growth calculation)
    const [lastMonthSales] = await db
      .select({ 
        total: sum(PaymentsTable.finalAmount)
      })
      .from(PaymentsTable)
      .where(
        and(
          eq(PaymentsTable.jyotishiId, jyotishiId),
          eq(PaymentsTable.status, "COMPLETED"),
          gte(PaymentsTable.createdAt, firstDayLastMonth),
          sql`${PaymentsTable.createdAt} < ${firstDayThisMonth}`
        )
      );

    const lastMonthSalesAmount = parseFloat(lastMonthSales?.total || "0");
    const salesGrowth = lastMonthSalesAmount > 0 
      ? ((thisMonthSalesAmount - lastMonthSalesAmount) / lastMonthSalesAmount) * 100 
      : thisMonthSalesAmount > 0 ? 100 : 0;

    // 11. Pending Commissions (Not yet paid out)
    const [pendingCommissions] = await db
      .select({ 
        total: sum(CommissionsTable.commissionAmount),
        count: count()
      })
      .from(CommissionsTable)
      .where(
        and(
          eq(CommissionsTable.jyotishiId, jyotishiId),
          eq(CommissionsTable.status, "PENDING")
        )
      );

    const pendingAmount = parseFloat(pendingCommissions?.total || "0");
    const pendingCount = pendingCommissions?.count || 0;

    // 12. Paid Commissions
    const [paidCommissions] = await db
      .select({ 
        total: sum(CommissionsTable.commissionAmount)
      })
      .from(CommissionsTable)
      .where(
        and(
          eq(CommissionsTable.jyotishiId, jyotishiId),
          eq(CommissionsTable.status, "PAID")
        )
      );

    const paidAmount = parseFloat(paidCommissions?.total || "0");

    // 13. Recent Payouts
    const [completedPayouts] = await db
      .select({ 
        total: sum(PayoutsTable.amount),
        count: count()
      })
      .from(PayoutsTable)
      .where(
        and(
          eq(PayoutsTable.jyotishiId, jyotishiId),
          eq(PayoutsTable.status, "COMPLETED")
        )
      );

    const totalPayouts = parseFloat(completedPayouts?.total || "0");
    const payoutCount = completedPayouts?.count || 0;

    // 14. Get agent's commission rate
    const [agentInfo] = await db
      .select({ 
        commissionRate: UsersTable.commissionRate,
        jyotishiCode: UsersTable.jyotishiCode
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, jyotishiId));

    const commissionRate = parseFloat(agentInfo?.commissionRate || "0");

    // 15. Coupon Usage Stats (this month and YTD)
    const [couponUsageThisMonth] = await db
      .select({ count: count() })
      .from(CommissionsTable)
      .where(
        and(
          eq(CommissionsTable.jyotishiId, jyotishiId),
          gte(CommissionsTable.createdAt, firstDayThisMonth)
        )
      );

    const [couponUsageYTD] = await db
      .select({ count: count() })
      .from(CommissionsTable)
      .where(
        and(
          eq(CommissionsTable.jyotishiId, jyotishiId),
          gte(CommissionsTable.createdAt, firstDayThisYear)
        )
      );

    return NextResponse.json({
      coupons: {
        active: activeCoupons.count || 0,
        total: totalCoupons.count || 0,
        usedThisMonth: couponUsageThisMonth.count || 0,
        usedYTD: couponUsageYTD.count || 0
      },
      sales: { // NEW: Separate sales data from earnings/commissions
        total: totalSalesAmount,
        thisMonth: thisMonthSalesAmount,
        ytd: ytdSalesAmount,
        mtd: thisMonthSalesAmount,
        growth: Math.round(salesGrowth * 10) / 10,
        totalCount: totalSalesCount,
        ytdCount: ytdSalesCount,
        mtdCount: thisMonthSalesCount
      },
      commissions: {
        total: totalCommissionsAmount,
        pending: {
          amount: pendingAmount,
          count: pendingCount
        },
        paid: {
          amount: paidAmount
        },
        ytd: ytdCommissionsAmount,
        mtd: thisMonthCommissionsAmount
      },
      payouts: {
        total: totalPayouts,
        count: payoutCount
      },
      agent: {
        commissionRate: commissionRate,
        code: agentInfo?.jyotishiCode || "N/A"
      },
      performance: {
        thisMonthSales: thisMonthSalesCount,
        avgCommissionPerSale: thisMonthSalesCount > 0 ? thisMonthCommissionsAmount / thisMonthSalesCount : 0
      }
    });
  } catch (error) {
    console.error("Agent dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}