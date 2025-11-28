// app/api/admin/commissions/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
/*eslint-disable  @typescript-eslint/no-explicit-any*/
import { db } from "@/db";
import {
  CommissionsTable,
  CoursesTable,
  UsersTable,
  CommissionStatus, // Import the enum!
} from "@/db/schema";
import { and, desc, eq, sql, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - List all commissions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get("status");
    const jyotishiId = searchParams.get("jyotishiId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    // Validate status against CommissionStatus enum
    const validStatuses = ["PENDING", "PAID", "CANCELLED"] as const;
    const status = rawStatus && validStatuses.includes(rawStatus as any)
      ? (rawStatus as typeof validStatuses[number])
      : null;

    const conditions: any[] = [];

    if (status) {
      conditions.push(eq(CommissionsTable.status, status));
    }
    if (jyotishiId) {
      conditions.push(eq(CommissionsTable.jyotishiId, jyotishiId));
    }

    const commissions = await db
      .select({
        id: CommissionsTable.id,
        jyotishiId: CommissionsTable.jyotishiId,
        jyotishiName: UsersTable.name,
        courseName: CoursesTable.title,
        studentName: sql<string>`student.name`,
        saleAmount: CommissionsTable.saleAmount,
        commissionRate: CommissionsTable.commissionRate,
        commissionAmount: CommissionsTable.commissionAmount,
        status: CommissionsTable.status,
        paidAt: CommissionsTable.paidAt,
        createdAt: CommissionsTable.createdAt,
      })
      .from(CommissionsTable)
      .leftJoin(UsersTable, eq(CommissionsTable.jyotishiId, UsersTable.id))
      .leftJoin(CoursesTable, eq(CommissionsTable.courseId, CoursesTable.id))
      .leftJoin(
        sql`users as student`,
        eq(CommissionsTable.studentId, sql`student.id`)
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(CommissionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(CommissionsTable);

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count }] = await countQuery;

    return NextResponse.json(
      {
        commissions,
        pagination: {
          page,
          limit,
          total: Number(count),
          totalPages: Math.ceil(Number(count) / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch commissions" },
      { status: 500 }
    );
  }
}