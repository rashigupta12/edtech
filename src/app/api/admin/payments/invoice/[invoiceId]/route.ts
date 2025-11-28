// src/app/api/admin/payments/invoice/[invoiceId]/route.ts
import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  PaymentsTable,
  UsersTable,
  EnrollmentsTable,
  CoursesTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
 context: { params: Promise<{  invoiceId : string }> } 
) {
  const params = await context.params;  
  const { invoiceId } = params;

  try {
    const result = await db
      .select({
        // Payment fields
        id: PaymentsTable.id,
        invoiceNumber: PaymentsTable.invoiceNumber,
        amount: PaymentsTable.amount,
        gstAmount: PaymentsTable.gstAmount,
        discountAmount: PaymentsTable.discountAmount,
        finalAmount: PaymentsTable.finalAmount,
        currency: PaymentsTable.currency,
        status: PaymentsTable.status,
        paymentMethod: PaymentsTable.paymentMethod,
        razorpayPaymentId: PaymentsTable.razorpayPaymentId,
        createdAt: PaymentsTable.createdAt,
        updatedAt: PaymentsTable.updatedAt,
        jyotishiId: PaymentsTable.jyotishiId,
        commissionAmount: PaymentsTable.commissionAmount,
        billingAddress: PaymentsTable.billingAddress,

        // User fields (aliased)
        userId: UsersTable.id,
        userName: UsersTable.name,
        userEmail: UsersTable.email,
        userMobile: UsersTable.mobile,

        // Enrollment + Course
        enrollmentCourseId: EnrollmentsTable.courseId,
        courseId: CoursesTable.id,
        courseTitle: CoursesTable.title,
        courseSlug: CoursesTable.slug,
      })
      .from(PaymentsTable)
      .leftJoin(UsersTable, eq(PaymentsTable.userId, UsersTable.id))
      .leftJoin(EnrollmentsTable, eq(PaymentsTable.enrollmentId, EnrollmentsTable.id))
      .leftJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
      .where(eq(PaymentsTable.invoiceNumber, invoiceId))
      .limit(1);

    if (result.length === 0) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    const row = result[0];

    // Restructure into clean object
    const payload = {
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      amount: row.amount,
      gstAmount: row.gstAmount,
      discountAmount: row.discountAmount,
      finalAmount: row.finalAmount,
      currency: row.currency,
      status: row.status,
      paymentMethod: row.paymentMethod,
      razorpayPaymentId: row.razorpayPaymentId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      jyotishiId: row.jyotishiId,
      commissionAmount: row.commissionAmount,
      billingAddress: row.billingAddress,

      user: {
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
        mobile: row.userMobile,
      },

      enrollment: {
        courseId: row.enrollmentCourseId,
        course: row.courseId
          ? {
              id: row.courseId,
              title: row.courseTitle,
              slug: row.courseSlug,
            }
          : null,
      },
    };

    return Response.json(payload);
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}