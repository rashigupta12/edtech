/* eslint-disable @typescript-eslint/no-unused-vars */

import { db } from "@/db";
import { CouponsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const body = await req.json();
    const { isActive, ...rest } = body;

    const [updatedCoupon] = await db
      .update(CouponsTable)
      .set({ ...rest, isActive, updatedAt: new Date() })
      .where(eq(CouponsTable.id, params.id))
      .returning();

    if (!updatedCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Coupon updated successfully", coupon: updatedCoupon },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

// PATCH - Toggle coupon active status
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: "isActive field is required and must be a boolean" },
        { status: 400 }
      );
    }

    const [updatedCoupon] = await db
      .update(CouponsTable)
      .set({ 
        isActive, 
        updatedAt: new Date() 
      })
      .where(eq(CouponsTable.id, params.id))
      .returning();

    if (!updatedCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json(
      { 
        message: `Coupon ${isActive ? 'activated' : 'deactivated'} successfully`, 
        coupon: updatedCoupon 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating coupon status:", error);
    return NextResponse.json(
      { error: "Failed to update coupon status" },
      { status: 500 }
    );
  }
}

// DELETE - Delete coupon
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    await db.delete(CouponsTable).where(eq(CouponsTable.id, params.id));

    return NextResponse.json(
      { message: "Coupon deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}