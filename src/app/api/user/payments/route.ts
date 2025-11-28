/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@/db";
import { CoursesTable, EnrollmentsTable, PaymentsTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth';

// app/api/user/payments/route.ts
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user.id;
    if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }

    const payments = await db
      .select({
        id: PaymentsTable.id,
        invoiceNumber: PaymentsTable.invoiceNumber,
        amount: PaymentsTable.amount,
        finalAmount: PaymentsTable.finalAmount,
        currency: PaymentsTable.currency,
        status: PaymentsTable.status,
        createdAt: PaymentsTable.createdAt,
        courseTitle: CoursesTable.title,
      })
      .from(PaymentsTable)
      .leftJoin(
        EnrollmentsTable,
        eq(PaymentsTable.enrollmentId, EnrollmentsTable.id)
      )
      .leftJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
      .where(eq(PaymentsTable.userId, userId))
      .orderBy(desc(PaymentsTable.createdAt));

    return NextResponse.json({ payments }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}