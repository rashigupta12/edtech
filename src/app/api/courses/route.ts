/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { CoursesTable } from "@/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const forJyotishi = searchParams.get("forJyotishi"); // New parameter

    const allowedStatuses = [
      "REGISTRATION_OPEN",
      "COMPLETED",
      "DRAFT",
      "UPCOMING",
      "ONGOING",
      "ARCHIVED",
    ] as const;

    type StatusType = (typeof allowedStatuses)[number];

    let courses;

    // Build where conditions
    const conditions = [];
    
    // Add status filter if provided
    if (statusParam && allowedStatuses.includes(statusParam as StatusType)) {
      conditions.push(eq(CoursesTable.status, statusParam as StatusType));
    }
    
    // ✅ NEW: Add commission filter for Jyotishi
    if (forJyotishi === "true") {
      conditions.push(isNotNull(CoursesTable.commissionPercourse));
    }

    // Execute query with conditions
    if (conditions.length > 0) {
      courses = await db
        .select()
        .from(CoursesTable)
        .where(and(...conditions));
    } else {
      courses = await db.select().from(CoursesTable);
    }

    // Convert numeric strings to numbers and include commission info
    courses = courses.map((c: any) => ({
      ...c,
      priceINR: Number(c.priceINR),
      priceUSD: Number(c.priceUSD),
      commissionPercourse: c.commissionPercourse ? Number(c.commissionPercourse) : null,
      hasCommission: c.commissionPercourse !== null && c.commissionPercourse !== undefined,
    }));

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}