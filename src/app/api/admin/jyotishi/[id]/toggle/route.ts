import { db } from "@/db";
import { UsersTable } from "@/db/schema";
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

    const [updated] = await db
      .update(UsersTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(UsersTable.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Jyotishi not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Status updated", jyotishi: updated });
  } catch (error) {
    console.error("Toggle jyotishi status error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}