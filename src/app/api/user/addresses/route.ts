/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { UserAddressTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = "user-id-from-session";

    const addresses = await db
      .select()
      .from(UserAddressTable)
      .where(eq(UserAddressTable.userId, userId));

    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = "user-id-from-session";
    const body = await req.json();

    const [address] = await db
      .insert(UserAddressTable)
      .values({
        userId,
        ...body,
      })
      .returning();

    return NextResponse.json(
      { message: "Address added successfully", address },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add address" },
      { status: 500 }
    );
  }
}