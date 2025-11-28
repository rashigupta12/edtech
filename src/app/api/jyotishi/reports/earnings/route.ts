// app/api/jyotishi/reports/earnings/route.ts
import { db } from "@/db";
import {
  CommissionsTable,
  CouponsTable,
  CoursesTable,
  UsersTable
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Generate earnings report for Jyotishi
export async function GET(req: NextRequest) {
  try {
    const jyotishiId = "jyotishi-id-from-session";
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "json";

    const conditions = [eq(CommissionsTable.jyotishiId, jyotishiId)];
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

    const earnings = await db
      .select({
        id: CommissionsTable.id,
        courseName: CoursesTable.title,
        studentName: UsersTable.name,
        couponCode: CouponsTable.code,
        saleAmount: CommissionsTable.saleAmount,
        commissionAmount: CommissionsTable.commissionAmount,
        status: CommissionsTable.status,
        createdAt: CommissionsTable.createdAt,
        paidAt: CommissionsTable.paidAt,
      })
      .from(CommissionsTable)
      .leftJoin(CoursesTable, eq(CommissionsTable.courseId, CoursesTable.id))
      .leftJoin(UsersTable, eq(CommissionsTable.studentId, UsersTable.id))
      .leftJoin(CouponsTable, eq(CommissionsTable.couponId, CouponsTable.id))
      .where(and(...conditions))
      .orderBy(desc(CommissionsTable.createdAt));

    if (format === "csv") {
      const csv = [
        [
          "Course Name",
          "Student Name",
          "Coupon Code",
          "Sale Amount",
          "Commission Amount",
          "Status",
          "Date",
          "Paid Date",
        ].join(","),
        ...earnings.map((e) =>
          [
            e.courseName,
            e.studentName,
            e.couponCode,
            e.saleAmount,
            e.commissionAmount,
            e.status,
            e.createdAt,
            e.paidAt || "",
          ].join(",")
        ),
      ].join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="earnings-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ earnings }, { status: 200 });
  } catch (error) {
    console.error("Error generating earnings report:", error);
    return NextResponse.json(
      { error: "Failed to generate earnings report" },
      { status: 500 }
    );
  }
}