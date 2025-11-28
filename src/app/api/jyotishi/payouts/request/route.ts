// app/api/jyotishi/payouts/request/route.ts

import { auth } from "@/auth";
import { db } from "@/db";
import {
  CommissionsTable,
  PayoutsTable,
  UsersTable
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// POST - Request payout
export async function POST(req: NextRequest) {
  try {
  const session = await auth()
      const jyotishiId = session?.user.id;
         if (!jyotishiId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }
    const body = await req.json();
    const { amount, paymentMethod, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payout amount" },
        { status: 400 }
      );
    }

    // Check pending commissions
    const [pendingStats] = await db
      .select({
        pendingAmount: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
      })
      .from(CommissionsTable)
      .where(
        and(
          eq(CommissionsTable.jyotishiId, jyotishiId),
          eq(CommissionsTable.status, "PENDING")
        )
      );

    if (parseFloat(pendingStats.pendingAmount.toString()) < amount) {
      return NextResponse.json(
        { error: "Insufficient pending commission balance" },
        { status: 400 }
      );
    }

    // Get bank details
    const [jyotishi] = await db
      .select({
        bankAccountNumber: UsersTable.bankAccountNumber,
        bankIfscCode: UsersTable.bankIfscCode,
        bankAccountHolderName: UsersTable.bankAccountHolderName,
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, jyotishiId))
      .limit(1);

    if (
      !jyotishi.bankAccountNumber ||
      !jyotishi.bankIfscCode ||
      !jyotishi.bankAccountHolderName
    ) {
      return NextResponse.json(
        { error: "Please update your bank details before requesting payout" },
        { status: 400 }
      );
    }

    // Create payout request
    const [payout] = await db
      .insert(PayoutsTable)
      .values({
        jyotishiId,
        amount: amount.toString(),
        status: "PENDING",
        paymentMethod: paymentMethod || "Bank Transfer",
        bankDetails: {
          accountNumber: jyotishi.bankAccountNumber,
          ifscCode: jyotishi.bankIfscCode,
          accountHolderName: jyotishi.bankAccountHolderName,
        },
        notes,
      })
      .returning();

    return NextResponse.json(
      { message: "Payout request submitted successfully", payout },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error requesting payout:", error);
    return NextResponse.json(
      { error: "Failed to submit payout request" },
      { status: 500 }
    );
  }
}