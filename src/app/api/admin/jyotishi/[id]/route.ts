// app/api/admin/jyotishi/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from "@/db";
import {
  CommissionsTable,
  CoursesTable,
  UsersTable,
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - Get Jyotishi details with all new fields
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;

  try {
    const [jyotishi] = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        mobile: UsersTable.mobile,
        commissionRate: UsersTable.commissionRate,
        jyotishiCode: UsersTable.jyotishiCode,
        bankAccountNumber: UsersTable.bankAccountNumber,
        bankIfscCode: UsersTable.bankIfscCode,
        bankAccountHolderName: UsersTable.bankAccountHolderName,
        bankName: UsersTable.bankName,
        bankBranchName: UsersTable.bankBranchName,
        cancelledChequeImage: UsersTable.cancelledChequeImage,
        panNumber: UsersTable.panNumber,
        isActive: UsersTable.isActive,
        createdAt: UsersTable.createdAt,
      })
      .from(UsersTable)
      .where(and(eq(UsersTable.id, params.id), eq(UsersTable.role, "JYOTISHI")))
      .limit(1);

    if (!jyotishi) {
      return NextResponse.json(
        { error: "Jyotishi not found" },
        { status: 404 }
      );
    }

    // Get commission statistics
    const [stats] = await db
      .select({
        totalCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
        pendingCommission: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PENDING' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
        paidCommission: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PAID' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
        totalSales: sql<number>`COUNT(*)`,
      })
      .from(CommissionsTable)
      .where(eq(CommissionsTable.jyotishiId, params.id));

    // Get recent commissions
    const recentCommissions = await db
      .select({
        id: CommissionsTable.id,
        saleAmount: CommissionsTable.saleAmount,
        commissionAmount: CommissionsTable.commissionAmount,
        status: CommissionsTable.status,
        createdAt: CommissionsTable.createdAt,
        courseName: CoursesTable.title,
        studentName: UsersTable.name,
      })
      .from(CommissionsTable)
      .leftJoin(CoursesTable, eq(CommissionsTable.courseId, CoursesTable.id))
      .leftJoin(UsersTable, eq(CommissionsTable.studentId, UsersTable.id))
      .where(eq(CommissionsTable.jyotishiId, params.id))
      .orderBy(desc(CommissionsTable.createdAt))
      .limit(10);

    return NextResponse.json(
      {
        jyotishi,
        stats: stats || {
          totalCommission: 0,
          pendingCommission: 0,
          paidCommission: 0,
          totalSales: 0,
        },
        recentCommissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching jyotishi:", error);
    return NextResponse.json(
      { error: "Failed to fetch Astrologer details" },
      { status: 500 }
    );
  }
}

// PUT - Update Jyotishi with all new fields
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;

  try {
    const body = await req.json();

    const {
      name,
      mobile,
      commissionRate,
      jyotishiCode,
      bio,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      bankName,
      bankBranchName,
      cancelledChequeImage,
      panNumber,
      isActive,
    } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (name !== undefined) updateData.name = name;
    if (mobile !== undefined) updateData.mobile = mobile || null;
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (jyotishiCode !== undefined) updateData.jyotishiCode = jyotishiCode; // usually read-only, but allow if needed
    if (bio !== undefined) updateData.bio = bio || null;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber || null;
    if (bankIfscCode !== undefined) updateData.bankIfscCode = bankIfscCode || null;
    if (bankAccountHolderName !== undefined) updateData.bankAccountHolderName = bankAccountHolderName || null;
    if (bankName !== undefined) updateData.bankName = bankName || null;
    if (bankBranchName !== undefined) updateData.bankBranchName = bankBranchName || null;
    if (cancelledChequeImage !== undefined) updateData.cancelledChequeImage = cancelledChequeImage || null;
    if (panNumber !== undefined) updateData.panNumber = panNumber || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedJyotishi] = await db
      .update(UsersTable)
      .set(updateData)
      .where(and(eq(UsersTable.id, params.id), eq(UsersTable.role, "JYOTISHI")))
      .returning({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        mobile: UsersTable.mobile,
        commissionRate: UsersTable.commissionRate,
        jyotishiCode: UsersTable.jyotishiCode,
        bankAccountNumber: UsersTable.bankAccountNumber,
        bankIfscCode: UsersTable.bankIfscCode,
        bankAccountHolderName: UsersTable.bankAccountHolderName,
        bankName: UsersTable.bankName,
        bankBranchName: UsersTable.bankBranchName,
        cancelledChequeImage: UsersTable.cancelledChequeImage,
        panNumber: UsersTable.panNumber,
        isActive: UsersTable.isActive,
        createdAt: UsersTable.createdAt,
      });

    if (!updatedJyotishi) {
      return NextResponse.json(
        { error: "Jyotishi not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Jyotishi updated successfully",
        jyotishi: updatedJyotishi,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating jyotishi:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update jyotishi" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete (deactivate) Jyotishi
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;

  try {
    const [jyotishi] = await db
      .update(UsersTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(UsersTable.id, params.id), eq(UsersTable.role, "JYOTISHI")))
      .returning();

    if (!jyotishi) {
      return NextResponse.json(
        { error: "Jyotishi not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Astrologer deactivated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deactivating jyotishi:", error);
    return NextResponse.json(
      { error: "Failed to deactivate jyotishi" },
      { status: 500 }
    );
  }
}