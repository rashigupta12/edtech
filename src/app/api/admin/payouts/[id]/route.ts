import { db } from "@/db";
import {
  CommissionsTable,
  CoursesTable,
  PayoutsTable,
  UsersTable
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Get payout details
export async function GET(
  req: NextRequest,
   context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params; 
  try {
    const [payout] = await db
      .select({
        id: PayoutsTable.id,
        jyotishiId: PayoutsTable.jyotishiId,
        jyotishiName: UsersTable.name,
        jyotishiEmail: UsersTable.email,
        jyotishiMobile: UsersTable.mobile,
        amount: PayoutsTable.amount,
        status: PayoutsTable.status,
        requestedAt: PayoutsTable.requestedAt,
        processedAt: PayoutsTable.processedAt,
        paymentMethod: PayoutsTable.paymentMethod,
        transactionId: PayoutsTable.transactionId,
        transactionProof: PayoutsTable.transactionProof,
        bankDetails: PayoutsTable.bankDetails,
        notes: PayoutsTable.notes,
        rejectionReason: PayoutsTable.rejectionReason,
      })
      .from(PayoutsTable)
      .leftJoin(UsersTable, eq(PayoutsTable.jyotishiId, UsersTable.id))
      .where(eq(PayoutsTable.id, params.id))
      .limit(1);

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    // Get associated commissions
    const commissions = await db
      .select({
        id: CommissionsTable.id,
        saleAmount: CommissionsTable.saleAmount,
        commissionAmount: CommissionsTable.commissionAmount,
        courseName: CoursesTable.title,
        studentName: UsersTable.name,
        createdAt: CommissionsTable.createdAt,
      })
      .from(CommissionsTable)
      .leftJoin(CoursesTable, eq(CommissionsTable.courseId, CoursesTable.id))
      .leftJoin(UsersTable, eq(CommissionsTable.studentId, UsersTable.id))
      .where(eq(CommissionsTable.payoutId, params.id));

    return NextResponse.json(
      {
        payout,
        commissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching payout details:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout details" },
      { status: 500 }
    );
  }
}

// PUT - Approve/Reject payout
export async function PUT(
  req: NextRequest,
    context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params; 
  try {
    const body = await req.json();
    const { action, rejectionReason } = body;
    const adminId = "admin-id-from-session";

    if (action === "reject") {
      const [payout] = await db
        .update(PayoutsTable)
        .set({
          status: "REJECTED",
          processedAt: new Date(),
          processedBy: adminId,
          rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(PayoutsTable.id, params.id))
        .returning();

      return NextResponse.json(
        { message: "Payout rejected", payout },
        { status: 200 }
      );
    } else if (action === "approve") {
      const [payout] = await db
        .update(PayoutsTable)
        .set({
          status: "PROCESSING",
          processedAt: new Date(),
          processedBy: adminId,
          updatedAt: new Date(),
        })
        .where(eq(PayoutsTable.id, params.id))
        .returning();

      return NextResponse.json(
        { message: "Payout approved and ready for processing", payout },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating payout:", error);
    return NextResponse.json(
      { error: "Failed to update payout" },
      { status: 500 }
    );
  }
}
