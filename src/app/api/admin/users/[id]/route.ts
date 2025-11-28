/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { UsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
// GET - Get user details
export async function GET(
  req: NextRequest,
   context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const [user] = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        mobile: UsersTable.mobile,
        role: UsersTable.role,
        emailVerified: UsersTable.emailVerified,
        gstNumber: UsersTable.gstNumber,
        isGstVerified: UsersTable.isGstVerified,
        createdAt: UsersTable.createdAt,
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, params.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  req: NextRequest,
 context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const body = await req.json();
    const { name, email, mobile, role } = body;

    const [updatedUser] = await db
      .update(UsersTable)
      .set({ name, email, mobile, role, updatedAt: new Date() })
      .where(eq(UsersTable.id, params.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}