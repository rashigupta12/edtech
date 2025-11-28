/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@/db";
import { BlogsTable, BlogTagsTable, UsersTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug : string }> } 
) {
  const params = await context.params;  
  try{
    const [blog] = await db
      .select({
        id: BlogsTable.id,
        slug: BlogsTable.slug,
        title: BlogsTable.title,
        content: BlogsTable.content,
        thumbnailUrl: BlogsTable.thumbnailUrl,
        publishedAt: BlogsTable.publishedAt,
        viewCount: BlogsTable.viewCount,
        authorName: UsersTable.name,
        authorId: UsersTable.id,
      })
      .from(BlogsTable)
      .leftJoin(UsersTable, eq(BlogsTable.authorId, UsersTable.id))
      .where(
        and(
            eq(BlogsTable.slug, params.slug),
        eq(BlogsTable.isPublished, true)
        )
      
      )
      .limit(1);

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Get tags
    const tags = await db
      .select()
      .from(BlogTagsTable)
      .where(eq(BlogTagsTable.blogId, blog.id));

    // Increment view count
    await db
      .update(BlogsTable)
      .set({ viewCount: (blog.viewCount ?? 0) + 1 })
      .where(eq(BlogsTable.id, blog.id));

    return NextResponse.json(
      {
        blog: {
          ...blog,
          tags: tags.map((t) => t.tag),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}