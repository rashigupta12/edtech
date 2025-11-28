/*eslint-disable @typescript-eslint/no-unused-vars */
// app/api/admin/coupon-types/next-code/route.ts
import { db } from "@/db";
import {
  CouponTypesTable
} from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
// GET - Get next available type code
export async function GET(req: NextRequest) {
  try {
    const existingCodes = await db
      .select({ typeCode: CouponTypesTable.typeCode })
      .from(CouponTypesTable)
      .orderBy(CouponTypesTable.typeCode);

    const usedCodes = new Set(
      existingCodes.map((c) => parseInt(c.typeCode))
    );

    // Find next available code (01-99)
    for (let i = 1; i <= 99; i++) {
      if (!usedCodes.has(i)) {
        return NextResponse.json(
          { nextCode: i.toString().padStart(2, "0") },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      { error: "All type codes (01-99) are used" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error getting next code:", error);
    return NextResponse.json(
      { error: "Failed to get next code" },
      { status: 500 }
    );
  }
}
