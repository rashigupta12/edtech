//app/api/admin/blogs
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BlogsTable, BlogTagsTable } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

// GET - List all blogs
export async function GET(req: NextRequest) {
  try {
    const blogs = await db.select().from(BlogsTable);
    return NextResponse.json({ blogs }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

// POST - Create blog
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, title, excerpt, content, thumbnailUrl, authorId, tags, isPublished } = body;

    const [blog] = await db
      .insert(BlogsTable)
      .values({
        slug,
        title,
        excerpt,
        content,
        thumbnailUrl,
        authorId,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      })
      .returning();

    // Insert tags
    if (tags && tags.length > 0) {
      await db.insert(BlogTagsTable).values(
        tags.map((tag: string) => ({
          blogId: blog.id,
          tag,
        }))
      );
    }

    return NextResponse.json(
      { message: "Blog created successfully", blog },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    );
  }
}
