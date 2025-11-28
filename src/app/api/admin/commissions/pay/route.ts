// app/api/admin/commissions/pay/route.ts
import { db } from "@/db";
import {
  CommissionsTable,
  PaymentsTable,
  PayoutsTable
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// POST - Process commission payment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      payoutId,
      commissionIds,
      transactionId,
      transactionProof,
      notes,
    } = body;
    const adminId = "admin-id-from-session"; // Replace with actual auth

    if (!payoutId || !commissionIds || commissionIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update payout status
    const [payout] = await db
      .update(PayoutsTable)
      .set({
        status: "COMPLETED",
        processedAt: new Date(),
        processedBy: adminId,
        transactionId,
        transactionProof,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(PayoutsTable.id, payoutId))
      .returning();

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    // Update commission status
    await db
      .update(CommissionsTable)
      .set({
        status: "PAID",
        paidAt: new Date(),
        payoutId,
        updatedAt: new Date(),
      })
      .where(sql`${CommissionsTable.id} = ANY(${commissionIds})`);

    // Update payment commission_paid flag
    const commissions = await db
      .select()
      .from(CommissionsTable)
      .where(sql`${CommissionsTable.id} = ANY(${commissionIds})`);

    for (const commission of commissions) {
      await db
        .update(PaymentsTable)
        .set({ commissionPaid: true })
        .where(eq(PaymentsTable.id, commission.paymentId));
    }

    return NextResponse.json(
      { message: "Commission payment processed successfully", payout },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing commission payment:", error);
    return NextResponse.json(
      { error: "Failed to process commission payment" },
      { status: 500 }
    );
  }
}
