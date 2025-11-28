// app/api/jyotishi/students/[id]/route.ts
import { db } from "@/db";
import {
  CommissionsTable,
  CouponsTable,
  CoursesTable,
  EnrollmentsTable,
  PaymentsTable,
  UsersTable
} from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Get student details
export async function GET(
  req: NextRequest,
   context: { params: Promise<{ id: string }> } 
) {
   const params = await context.params; 
  try {
    // const jyotishiId = "jyotishi-id-from-session";

    // Get student info
    const [student] = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        mobile: UsersTable.mobile,
        createdAt: UsersTable.createdAt,
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, params.id))
      .limit(1);

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get purchase history
    const purchases = await db
      .select({
        id: PaymentsTable.id,
        invoiceNumber: PaymentsTable.invoiceNumber,
        amount: PaymentsTable.finalAmount,
        courseName: CoursesTable.title,
        couponCode: CouponsTable.code,
        commission: CommissionsTable.commissionAmount,
        createdAt: PaymentsTable.createdAt,
      })
      .from(PaymentsTable)
      .leftJoin(
        EnrollmentsTable,
        eq(PaymentsTable.enrollmentId, EnrollmentsTable.id)
      )
      .leftJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
      .leftJoin(CouponsTable, eq(PaymentsTable.couponId, CouponsTable.id))
      .leftJoin(
        CommissionsTable,
        eq(PaymentsTable.id, CommissionsTable.paymentId)
      )
      .where(
        and(
          eq(PaymentsTable.userId, params.id),
          eq(PaymentsTable.status, "COMPLETED")
        )
      )
      .orderBy(desc(PaymentsTable.createdAt));

    return NextResponse.json(
      {
        student,
        purchases,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching student details:", error);
    return NextResponse.json(
      { error: "Failed to fetch student details" },
      { status: 500 }
    );
  }
}
