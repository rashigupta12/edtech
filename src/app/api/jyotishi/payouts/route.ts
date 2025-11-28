// app/api/jyotishi/payouts/route.ts
import { auth } from "@/auth";
import { db } from "@/db";
import { PayoutsTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    const jyotishiId = session?.user?.id;
    if (!jyotishiId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payouts = await db
      .select()
      .from(PayoutsTable)
      .where(eq(PayoutsTable.jyotishiId, jyotishiId))
      .orderBy(desc(PayoutsTable.requestedAt));

    return NextResponse.json({ payouts }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}