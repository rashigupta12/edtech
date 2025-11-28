/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@/db";
import { WebsiteContentTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - Get all website content
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section");

    let content;
    if (section) {
      content = await db
        .select()
        .from(WebsiteContentTable)
        .where(eq(WebsiteContentTable.section, section));
    } else {
      content = await db
        .select()
        .from(WebsiteContentTable);
    }

    return NextResponse.json({ content }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch website content" },
      { status: 500 }
    );
  }
}

// PUT - Update website content
export async function PUT(req: NextRequest) {
  try {
    const { key, section, content } = await req.json();
    const adminId = "admin-id-from-session";

    const [existing] = await db
      .select()
      .from(WebsiteContentTable)
      .where(
        and(
           eq(WebsiteContentTable.key, key),
        eq(WebsiteContentTable.section, section)
        )
       
      )
      .limit(1);

    let result;
    if (existing) {
      [result] = await db
        .update(WebsiteContentTable)
        .set({
          content,
          updatedBy: adminId,
          updatedAt: new Date(),
        })
        .where(eq(WebsiteContentTable.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(WebsiteContentTable)
        .values({
          key,
          section,
          content,
          updatedBy: adminId,
        })
        .returning();
    }

    return NextResponse.json(
      { message: "Content updated successfully", content: result },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update website content" },
      { status: 500 }
    );
  }
}