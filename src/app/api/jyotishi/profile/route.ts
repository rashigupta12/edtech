// =====================================================
// 4. JYOTISHI - PROFILE MANAGEMENT
// =====================================================
/*eslint-disable @typescript-eslint/no-unused-vars */
/*eslint-disable @typescript-eslint/no-explicit-any */
// app/api/jyotishi/profile/route.ts
import { db } from "@/db";
import {
  UsersTable
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// GET - Get Jyotishi profile
export async function GET(req: NextRequest) {
  try {
    const jyotishiId = "jyotishi-id-from-session"; // Replace with actual auth

    const [jyotishi] = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        mobile: UsersTable.mobile,
        commissionRate: UsersTable.commissionRate,
        bankAccountNumber: UsersTable.bankAccountNumber,
        bankIfscCode: UsersTable.bankIfscCode,
        bankAccountHolderName: UsersTable.bankAccountHolderName,
        panNumber: UsersTable.panNumber,
        isActive: UsersTable.isActive,
        createdAt: UsersTable.createdAt,
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, jyotishiId))
      .limit(1);

    if (!jyotishi) {
      return NextResponse.json(
        { error: "Jyotishi not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ jyotishi }, { status: 200 });
  } catch (error) {
    console.error("Error fetching jyotishi profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update Jyotishi profile
export async function PUT(req: NextRequest) {
  try {
    const jyotishiId = "jyotishi-id-from-session";
    const body = await req.json();
    const {
      name,
      mobile,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      panNumber,
    } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;
    if (bankAccountNumber) updateData.bankAccountNumber = bankAccountNumber;
    if (bankIfscCode) updateData.bankIfscCode = bankIfscCode;
    if (bankAccountHolderName)
      updateData.bankAccountHolderName = bankAccountHolderName;
    if (panNumber) updateData.panNumber = panNumber;

    const [updatedJyotishi] = await db
      .update(UsersTable)
      .set(updateData)
      .where(eq(UsersTable.id, jyotishiId))
      .returning();

    return NextResponse.json(
      { message: "Profile updated successfully", jyotishi: updatedJyotishi },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}