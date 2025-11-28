// src/app/api/user/learning-summary/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

import { db } from "@/db";
import { EnrollmentsTable, PaymentsTable } from "@/db/schema";
import { eq, and, count, sum } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get enrolled courses count
    const [enrolledResult] = await db
      .select({ count: count() })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.status, "ACTIVE")
        )
      );

    // Get active courses count (courses with ACTIVE status)
    const [activeResult] = await db
      .select({ count: count() })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.status, "ACTIVE")
        )
      );

    // Get total spent from completed payments
    const [totalSpentResult] = await db
      .select({ total: sum(PaymentsTable.finalAmount) })
      .from(PaymentsTable)
      .where(
        and(
          eq(PaymentsTable.userId, userId),
          eq(PaymentsTable.status, "COMPLETED")
        )
      );

    const learningSummary = {
      enrolledCourses: enrolledResult?.count || 0,
      activeCourses: activeResult?.count || 0,
      totalSpent: Number(totalSpentResult?.total) || 0,
    };

    return NextResponse.json(learningSummary);
  } catch (error) {
    console.error('Failed to fetch learning summary:', error);
    return NextResponse.json(
      { error: "Failed to fetch learning summary" },
      { status: 500 }
    );
  }
}