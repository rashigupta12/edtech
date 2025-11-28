import { db } from "@/db";
import { CouponTypesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const { isActive } = await req.json();
    const { id } = params;

    // Validate the ID
    if (!id) {
      return NextResponse.json({ error: "Coupon type ID is required" }, { status: 400 });
    }

    // Check if coupon type exists
    const [existingCouponType] = await db
      .select()
      .from(CouponTypesTable)
      .where(eq(CouponTypesTable.id, id))
      .limit(1);

    if (!existingCouponType) {
      return NextResponse.json({ error: "Coupon type not found" }, { status: 404 });
    }

    // Update the coupon type status
    const [updated] = await db
      .update(CouponTypesTable)
      .set({ 
        isActive, 
        updatedAt: new Date() 
      })
      .where(eq(CouponTypesTable.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Failed to update coupon type" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Coupon type status updated successfully", 
      couponType: updated 
    });
  } catch (error) {
    console.error("Toggle coupon type status error:", error);
    return NextResponse.json({ 
      error: "Failed to update coupon type status" 
    }, { status: 500 });
  }
}