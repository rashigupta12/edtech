/* eslint-disable @typescript-eslint/no-unused-vars */
import { UsersTable } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";

// GET - List all users
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const query = db.select({
      id: UsersTable.id,
      name: UsersTable.name,
      email: UsersTable.email,
      mobile: UsersTable.mobile,
      role: UsersTable.role,
      emailVerified: UsersTable.emailVerified,
      createdAt: UsersTable.createdAt,
    }).from(UsersTable);

    const users = await (role && (role === "ADMIN" || role === "USER")
      ? query.where(eq(UsersTable.role, role as "ADMIN" | "USER"))
      : query);

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}