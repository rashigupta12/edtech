// app/api/admin/dashboard/jyotishi-overview/route.ts
/*eslint-disable  @typescript-eslint/no-unused-vars */
import { db } from "@/db";
import {
  CommissionsTable,
  PayoutsTable,
  UsersTable
} from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Jyotishi overview for admin
export async function GET(req: NextRequest) {
  try {
    // Total Jyotishis
    const [jyotishiCount] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`COUNT(*) FILTER (WHERE ${UsersTable.isActive} = true)`,
      })
      .from(UsersTable)
      .where(eq(UsersTable.role, "JYOTISHI"));

    // Commission statistics
    const [commissionStats] = await db
      .select({
        totalCommissions: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
        pendingCommissions: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PENDING' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
        paidCommissions: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PAID' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
        totalSales: sql<number>`COUNT(*)`,
      })
      .from(CommissionsTable);

    // Pending payouts
    const [pendingPayouts] = await db
      .select({
        count: sql<number>`COUNT(*)`,
        totalAmount: sql<number>`COALESCE(SUM(${PayoutsTable.amount}), 0)`,
      })
      .from(PayoutsTable)
      .where(eq(PayoutsTable.status, "PENDING"));

    // This month commission
    const [thisMonthCommission] = await db
      .select({
        amount: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
        sales: sql<number>`COUNT(*)`,
      })
      .from(CommissionsTable)
      .where(
        sql`${CommissionsTable.createdAt} >= DATE_TRUNC('month', CURRENT_DATE)`
      );

    // Top performing Jyotishis
    const topJyotishis = await db
      .select({
        jyotishiId: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        totalSales: sql<number>`COUNT(*)`,
        totalEarnings: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
      })
      .from(CommissionsTable)
      .leftJoin(UsersTable, eq(CommissionsTable.jyotishiId, UsersTable.id))
      .groupBy(UsersTable.id, UsersTable.name, UsersTable.email)
      .orderBy(desc(sql`SUM(${CommissionsTable.commissionAmount})`))
      .limit(5);

    // Recent payout requests
    const recentPayoutRequests = await db
      .select({
        id: PayoutsTable.id,
        jyotishiName: UsersTable.name,
        amount: PayoutsTable.amount,
        status: PayoutsTable.status,
        requestedAt: PayoutsTable.requestedAt,
      })
      .from(PayoutsTable)
      .leftJoin(UsersTable, eq(PayoutsTable.jyotishiId, UsersTable.id))
      .orderBy(desc(PayoutsTable.requestedAt))
      .limit(10);

    return NextResponse.json(
      {
        jyotishiCount,
        commissionStats,
        pendingPayouts,
        thisMonthCommission,
        topJyotishis,
        recentPayoutRequests,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching jyotishi overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch jyotishi overview" },
      { status: 500 }
    );
  }
}
