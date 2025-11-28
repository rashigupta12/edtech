import { db } from "@/db";
import { BlogsTable, BlogTagsTable, UsersTable } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build the where conditions
    const conditions = [eq(BlogsTable.isPublished, true)];
    
    // Start building the query
    let query = db
      .select({
        id: BlogsTable.id,
        slug: BlogsTable.slug,
        title: BlogsTable.title,
        excerpt: BlogsTable.excerpt,
        thumbnailUrl: BlogsTable.thumbnailUrl,
        publishedAt: BlogsTable.publishedAt,
        viewCount: BlogsTable.viewCount,
        authorName: UsersTable.name,
      })
      .from(BlogsTable)
      .leftJoin(UsersTable, eq(BlogsTable.authorId, UsersTable.id));

    // If a tag is provided, join the tags table and add the tag condition
    if (tag) {
      query = query.leftJoin(BlogTagsTable, eq(BlogsTable.id, BlogTagsTable.blogId));
      conditions.push(eq(BlogTagsTable.tag, tag));
    }

    // Apply all conditions at once
    const blogs = await query
      .where(and(...conditions))
      .orderBy(desc(BlogsTable.publishedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ blogs }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}