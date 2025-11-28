// src/app/api/admin/jyotishis/search/route.ts
import { db } from "@/db";
import { UsersTable } from "@/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Search for Jyotishis by name, email, or jyotishiCode
    const jyotishis = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        jyotishiCode: UsersTable.jyotishiCode,
        commissionRate: UsersTable.commissionRate,
      })
      .from(UsersTable)
      .where(
        and(
          eq(UsersTable.role, "JYOTISHI"),
          eq(UsersTable.isActive, true),
          or(
            sql`LOWER(${UsersTable.name}) LIKE LOWER(${`%${query}%`})`,
            sql`LOWER(${UsersTable.email}) LIKE LOWER(${`%${query}%`})`,
            sql`LOWER(${UsersTable.jyotishiCode}) LIKE LOWER(${`%${query}%`})`
          )
        )
      )
      .limit(10);

    return NextResponse.json(
      { jyotishis },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Jyotishi search error:", error);
    return NextResponse.json(
      { error: "Failed to search jyotishis" },
      { status: 500 }
    );
  }
}