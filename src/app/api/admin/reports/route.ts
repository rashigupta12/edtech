
// app/api/admin/reports/commissions/route.ts
import { db } from "@/db";
import {
  CommissionsTable,
  CouponsTable,
  CoursesTable,
  PaymentsTable,
  UsersTable
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Generate commission report
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const jyotishiId = searchParams.get("jyotishiId");
    const format = searchParams.get("format") || "json"; // json or csv

    const conditions = [];
    if (startDate) {
      conditions.push(
        sql`${CommissionsTable.createdAt} >= ${new Date(startDate)}`
      );
    }
    if (endDate) {
      conditions.push(
        sql`${CommissionsTable.createdAt} <= ${new Date(endDate)}`
      );
    }
    if (jyotishiId) {
      conditions.push(eq(CommissionsTable.jyotishiId, jyotishiId));
    }

    const commissions = await db
      .select({
        commissionId: CommissionsTable.id,
        jyotishiName: UsersTable.name,
        jyotishiEmail: UsersTable.email,
        courseName: CoursesTable.title,
        studentName: sql<string>`student.name`,
        studentEmail: sql<string>`student.email`,
        couponCode: CouponsTable.code,
        saleAmount: CommissionsTable.saleAmount,
        commissionRate: CommissionsTable.commissionRate,
        commissionAmount: CommissionsTable.commissionAmount,
        status: CommissionsTable.status,
        invoiceNumber: PaymentsTable.invoiceNumber,
        createdAt: CommissionsTable.createdAt,
        paidAt: CommissionsTable.paidAt,
      })
      .from(CommissionsTable)
      .leftJoin(UsersTable, eq(CommissionsTable.jyotishiId, UsersTable.id))
      .leftJoin(CoursesTable, eq(CommissionsTable.courseId, CoursesTable.id))
      .leftJoin(
        sql`users as student`,
        eq(CommissionsTable.studentId, sql`student.id`)
      )
      .leftJoin(CouponsTable, eq(CommissionsTable.couponId, CouponsTable.id))
      .leftJoin(PaymentsTable, eq(CommissionsTable.paymentId, PaymentsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(CommissionsTable.createdAt));

    if (format === "csv") {
      // Convert to CSV
      const csv = [
        // Headers
        [
          "Commission ID",
          "Jyotishi Name",
          "Jyotishi Email",
          "Course Name",
          "Student Name",
          "Student Email",
          "Coupon Code",
          "Sale Amount",
          "Commission Rate (%)",
          "Commission Amount",
          "Status",
          "Invoice Number",
          "Created At",
          "Paid At",
        ].join(","),
        // Data rows
        ...commissions.map((c) =>
          [
            c.commissionId,
            c.jyotishiName,
            c.jyotishiEmail,
            c.courseName,
            c.studentName,
            c.studentEmail,
            c.couponCode,
            c.saleAmount,
            c.commissionRate,
            c.commissionAmount,
            c.status,
            c.invoiceNumber,
            c.createdAt,
            c.paidAt || "",
          ].join(",")
        ),
      ].join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="commission-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ commissions }, { status: 200 });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}