// app/api/admin/payouts/route.ts
/*eslint-disable @typescript-eslint/no-explicit-any*/
import { db } from "@/db";
import { PayoutsTable, UsersTable } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - List all payout requests
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get("status");

    // Validate status against PayoutStatus enum
    const validStatuses = ["PENDING", "COMPLETED", "PROCESSING", "REJECTED"] as const;
    const status = rawStatus && validStatuses.includes(rawStatus as any)
      ? (rawStatus as (typeof validStatuses)[number])
      : null;

    // Build conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(PayoutsTable.status, status));
    }

    const payouts = await db
      .select({
        id: PayoutsTable.id,
        jyotishiId: PayoutsTable.jyotishiId,
        jyotishiName: UsersTable.name,
        amount: PayoutsTable.amount,
        status: PayoutsTable.status,
        requestedAt: PayoutsTable.requestedAt,
        processedAt: PayoutsTable.processedAt,
        transactionId: PayoutsTable.transactionId,
        paymentMethod: PayoutsTable.paymentMethod,
      })
      .from(PayoutsTable)
      .leftJoin(UsersTable, eq(PayoutsTable.jyotishiId, UsersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(PayoutsTable.requestedAt));

    return NextResponse.json({ payouts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 }
    );
  }
}