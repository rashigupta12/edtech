// app/api/admin/commissions/bulk-pay/route.ts
import { db } from "@/db";
import {
  CommissionsTable,
  PaymentsTable,
  PayoutsTable
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// POST - Process bulk commission payments
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jyotishiId, transactionId, transactionProof, notes } = body;
    const adminId = "admin-id-from-session";

    if (!jyotishiId) {
      return NextResponse.json(
        { error: "Jyotishi ID is required" },
        { status: 400 }
      );
    }

    // Get all pending commissions for this Jyotishi
    const pendingCommissions = await db
      .select()
      .from(CommissionsTable)
      .where(
        and(
          eq(CommissionsTable.jyotishiId, jyotishiId),
          eq(CommissionsTable.status, "PENDING")
        )
      );

    if (pendingCommissions.length === 0) {
      return NextResponse.json(
        { error: "No pending commissions found" },
        { status: 404 }
      );
    }

    // Calculate total amount
    const totalAmount = pendingCommissions.reduce(
      (sum, commission) => sum + parseFloat(commission.commissionAmount),
      0
    );

    // Create payout record
    const [payout] = await db
      .insert(PayoutsTable)
      .values({
        jyotishiId,
        amount: totalAmount.toString(),
        status: "COMPLETED",
        requestedAt: new Date(),
        processedAt: new Date(),
        processedBy: adminId,
        paymentMethod: "Bank Transfer",
        transactionId,
        transactionProof,
        notes,
      })
      .returning();

    // Update all commissions to PAID
    const commissionIds = pendingCommissions.map((c) => c.id);
    await db
      .update(CommissionsTable)
      .set({
        status: "PAID",
        paidAt: new Date(),
        payoutId: payout.id,
        updatedAt: new Date(),
      })
      .where(sql`${CommissionsTable.id} = ANY(${commissionIds})`);

    // Update payment commission_paid flags
    for (const commission of pendingCommissions) {
      await db
        .update(PaymentsTable)
        .set({ commissionPaid: true })
        .where(eq(PaymentsTable.id, commission.paymentId));
    }

    return NextResponse.json(
      {
        message: "Bulk commission payment processed successfully",
        payout,
        commissionsCount: pendingCommissions.length,
        totalAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing bulk payment:", error);
    return NextResponse.json(
      { error: "Failed to process bulk payment" },
      { status: 500 }
    );
  }
}