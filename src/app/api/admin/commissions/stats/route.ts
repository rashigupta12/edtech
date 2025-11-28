// app/api/admin/commissions/stats/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
/*eslint-disable  @typescript-eslint/no-explicit-any*/
import { db } from "@/db";
import {
  CommissionsTable,
  UsersTable
} from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Commission statistics
export async function GET(req: NextRequest) {
  try {
    const [stats] = await db
      .select({
        totalCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
        pendingCommission: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PENDING' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
        paidCommission: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PAID' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
        totalSales: sql<number>`COUNT(*)`,
      })
      .from(CommissionsTable);

    // Top performing Jyotishis
    const topJyotishis = await db
      .select({
        jyotishiId: UsersTable.id,
        jyotishiName: UsersTable.name,
        totalSales: sql<number>`COUNT(*)`,
        totalCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
      })
      .from(CommissionsTable)
      .leftJoin(UsersTable, eq(CommissionsTable.jyotishiId, UsersTable.id))
      .groupBy(UsersTable.id, UsersTable.name)
      .orderBy(desc(sql`SUM(${CommissionsTable.commissionAmount})`))
      .limit(10);

    return NextResponse.json(
      {
        stats,
        topJyotishis,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching commission stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch commission statistics" },
      { status: 500 }
    );
  }
}
