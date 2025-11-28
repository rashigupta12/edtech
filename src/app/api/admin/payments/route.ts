/* eslint-disable @typescript-eslint/no-unused-vars */
import { PaymentsTable } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let payments;

    if (userId) {
      // ✅ If userId is provided, apply filter directly in the query chain
      payments = await db
        .select()
        .from(PaymentsTable)
        .where(eq(PaymentsTable.userId, userId));
    } else {
      // ✅ Otherwise, fetch all
      payments = await db.select().from(PaymentsTable);
    }

    return NextResponse.json({ payments }, { status: 200 });
  } catch (error) {
    console.error("Payments API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
