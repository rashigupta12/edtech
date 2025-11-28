/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { UsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// app/api/gst/verify/route.ts
export async function POST(req: NextRequest) {
  try {
    const { gstNumber } = await req.json();
    const userId = "user-id-from-session";

    // Call GST Verification API
    // Example using a hypothetical GST API
    const response = await fetch(
      `https://gst-api-provider.com/verify/${gstNumber}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GST_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "GST verification failed" },
        { status: 400 }
      );
    }

    const gstData = await response.json();

    // Update user with GST details
    await db
      .update(UsersTable)
      .set({
        gstNumber,
        isGstVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(UsersTable.id, userId));

    return NextResponse.json(
      {
        message: "GST verified successfully",
        gstData: {
          legalName: gstData.legalName,
          tradeName: gstData.tradeName,
          address: gstData.address,
          status: gstData.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to verify GST" },
      { status: 500 }
    );
  }
}