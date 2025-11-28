/* eslint-disable @typescript-eslint/no-unused-vars */

import { db } from "@/db";
import { UsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


// app/api/user/profile/route.ts
export async function GET(req: NextRequest) {
  try {
    // Get user from session/token
    const userId = "user-id-from-session"; // Replace with actual auth

    const [user] = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        mobile: UsersTable.mobile,
        gstNumber: UsersTable.gstNumber,
        isGstVerified: UsersTable.isGstVerified,
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, userId))
      .limit(1);

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = "user-id-from-session";
    const body = await req.json();
    const { name, mobile, gstNumber } = body;

    const [updatedUser] = await db
      .update(UsersTable)
      .set({ name, mobile, gstNumber, updatedAt: new Date() })
      .where(eq(UsersTable.id, userId))
      .returning();

    return NextResponse.json(
      { message: "Profile updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}