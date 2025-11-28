// app/api/admin/commissions/pending/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
/*eslint-disable  @typescript-eslint/no-explicit-any*/
import { db } from "@/db";
import {
  CommissionsTable,
  CoursesTable,
  UsersTable
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Get pending commissions
export async function GET(req: NextRequest) {
  try {
    const pendingCommissions = await db
      .select({
        id: CommissionsTable.id,
        jyotishiId: CommissionsTable.jyotishiId,
        jyotishiName: UsersTable.name,
        courseName: CoursesTable.title,
        saleAmount: CommissionsTable.saleAmount,
        commissionAmount: CommissionsTable.commissionAmount,
        createdAt: CommissionsTable.createdAt,
      })
      .from(CommissionsTable)
      .leftJoin(UsersTable, eq(CommissionsTable.jyotishiId, UsersTable.id))
      .leftJoin(CoursesTable, eq(CommissionsTable.courseId, CoursesTable.id))
      .where(eq(CommissionsTable.status, "PENDING"))
      .orderBy(desc(CommissionsTable.createdAt));

    // Group by Jyotishi
    const groupedByJyotishi = pendingCommissions.reduce((acc, commission) => {
      const jyotishiId = commission.jyotishiId;
      if (!acc[jyotishiId]) {
        acc[jyotishiId] = {
          jyotishiId,
          jyotishiName: commission.jyotishiName,
          totalPending: 0,
          commissions: [],
        };
      }
      acc[jyotishiId].totalPending += parseFloat(
        commission.commissionAmount || "0"
      );
      acc[jyotishiId].commissions.push(commission);
      return acc;
    }, {} as any);

    return NextResponse.json(
      { pendingCommissions: Object.values(groupedByJyotishi) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching pending commissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending commissions" },
      { status: 500 }
    );
  }
}
