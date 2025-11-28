// app/api/jyotishi/students/route.ts
/*eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@/db";
import {
  CommissionsTable,
  CouponsTable,
  PaymentsTable,
  UsersTable
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// GET - Get all USER role users (students) with optional purchase statistics
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user to verify Jyotishi role
    const currentUser = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.email, session.user.email))
      .limit(1);

    if (currentUser.length === 0 || currentUser[0].role !== "JYOTISHI") {
      return NextResponse.json({ error: "Forbidden - Jyotishi role required" }, { status: 403 });
    }

    const jyotishiId = currentUser[0].id;

    // ✅ FIX: Get ALL users with USER role, with optional purchase statistics
    const students = await db
      .select({
        studentId: UsersTable.id,
        studentName: UsersTable.name,
        studentEmail: UsersTable.email,
        studentMobile: UsersTable.mobile,
        totalPurchases: sql<number>`COUNT(DISTINCT ${PaymentsTable.id})`.mapWith(Number),
        totalSpent: sql<number>`COALESCE(SUM(${PaymentsTable.finalAmount}), 0)`.mapWith(Number),
        totalCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`.mapWith(Number),
        lastPurchase: sql<Date | null>`MAX(${PaymentsTable.createdAt})`.as("lastPurchase"),
      })
      .from(UsersTable)
      // ✅ LEFT JOIN so we get ALL users, even those without purchases
      .leftJoin(
        PaymentsTable, 
        and(
          eq(PaymentsTable.userId, UsersTable.id),
          eq(PaymentsTable.status, "COMPLETED")
        )
      )
      .leftJoin(
        CommissionsTable,
        eq(PaymentsTable.id, CommissionsTable.paymentId)
      )
      .leftJoin(CouponsTable, eq(PaymentsTable.couponId, CouponsTable.id))
      .where(
        // ✅ Only get users with USER role
        eq(UsersTable.role, "USER")
      )
      .groupBy(
        UsersTable.id,
        UsersTable.name,
        UsersTable.email,
        UsersTable.mobile
      )
      .orderBy(desc(UsersTable.createdAt)); // Order by user creation date

    return NextResponse.json({ students }, { status: 200 });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}