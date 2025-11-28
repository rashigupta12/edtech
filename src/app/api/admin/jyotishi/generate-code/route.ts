// app/api/admin/jyotishi/generate-code/route.ts
import { db } from "@/db";
import {
  UsersTable
} from "@/db/schema";
import { and, eq, like } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
// POST - Generate unique Jyotishi code
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Extract initials from name
    const nameParts = name.trim().split(" ");
    let initials = "";

    if (nameParts.length === 1) {
      // Single name: take first 2 letters
      initials = nameParts[0].substring(0, 2).toUpperCase();
    } else {
      // Multiple names: take first letter of first and last name
      initials = (
        nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
      ).toUpperCase();
    }

    // Find existing codes with same initials
    const existingCodes = await db
      .select({ jyotishiCode: UsersTable.jyotishiCode })
      .from(UsersTable)
      .where(
        and(
          eq(UsersTable.role, "JYOTISHI"),
          like(UsersTable.jyotishiCode, `${initials}%`)
        )
      );

    // Extract sequence numbers
    const usedSequences = new Set(
      existingCodes
        .map((c) => {
          const match = c.jyotishiCode?.match(/\d+$/);
          return match ? parseInt(match[0]) : 0;
        })
        .filter((n) => n > 0)
    );

    // Find next available sequence (001-999)
    let nextSequence = 1;
    while (usedSequences.has(nextSequence) && nextSequence <= 999) {
      nextSequence++;
    }

    if (nextSequence > 999) {
      return NextResponse.json(
        { error: `Maximum Jyotishi accounts reached for initials ${initials}` },
        { status: 400 }
      );
    }

    const jyotishiCode = `${initials}${nextSequence.toString().padStart(3, "0")}`;

    return NextResponse.json(
      { jyotishiCode, initials, sequence: nextSequence },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating Jyotishi code:", error);
    return NextResponse.json(
      { error: "Failed to generate Jyotishi code" },
      { status: 500 }
    );
  }
}