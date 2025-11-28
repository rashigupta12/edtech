//src/app/api/admin/blogs/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "nodejs";

import { db } from "@/db";
import { BlogsTable, BlogTagsTable, UsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - Get single blog with all details
export async function GET(
  req: NextRequest,
   context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const [blog] = await db
      .select({
        id: BlogsTable.id,
        slug: BlogsTable.slug,
        title: BlogsTable.title,
        excerpt: BlogsTable.excerpt,
        content: BlogsTable.content,
        thumbnailUrl: BlogsTable.thumbnailUrl,
        authorId: BlogsTable.authorId,
        publishedAt: BlogsTable.publishedAt,
        isPublished: BlogsTable.isPublished,
        viewCount: BlogsTable.viewCount,
        createdAt: BlogsTable.createdAt,
        updatedAt: BlogsTable.updatedAt,
        authorName: UsersTable.name,
        authorEmail: UsersTable.email,
      })
      .from(BlogsTable)
      .leftJoin(UsersTable, eq(BlogsTable.authorId, UsersTable.id))
      .where(eq(BlogsTable.slug, params.id))
      .limit(1);

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Fetch tags
    const tags = await db
      .select()
      .from(BlogTagsTable)
      .where(eq(BlogTagsTable.blogId, blog.id));

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
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}

// PUT - Update blog
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    const body = await req.json();
    const {
      slug,
      title,
      excerpt,
      content,
      thumbnailUrl,
      isPublished,
      tags,
    } = body;

    // Check if blog exists
    const [existingBlog] = await db
      .select()
      .from(BlogsTable)
      .where(eq(BlogsTable.id, params.id))
      .limit(1);

    if (!existingBlog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // If slug is being changed, check if new slug already exists
    if (slug && slug !== existingBlog.slug) {
      const [slugExists] = await db
        .select()
        .from(BlogsTable)
        .where(eq(BlogsTable.slug, slug))
        .limit(1);

      if (slugExists) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (slug) updateData.slug = slug;
    if (title) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content) updateData.content = content;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      // Set publishedAt only when publishing for the first time
      if (isPublished && !existingBlog.publishedAt) {
        updateData.publishedAt = new Date();
      }
      // Clear publishedAt if unpublishing
      if (!isPublished) {
        updateData.publishedAt = null;
      }
    }

    // Update blog
    const [updatedBlog] = await db
      .update(BlogsTable)
      .set(updateData)
      .where(eq(BlogsTable.id, params.id))
      .returning();

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await db
        .delete(BlogTagsTable)
        .where(eq(BlogTagsTable.blogId, params.id));

      // Insert new tags
      if (tags.length > 0) {
        await db.insert(BlogTagsTable).values(
          tags.map((tag: string) => ({
            blogId: params.id,
            tag: tag.trim(),
          }))
        );
      }
    }

    // Fetch updated tags
    const updatedTags = await db
      .select()
      .from(BlogTagsTable)
      .where(eq(BlogTagsTable.blogId, params.id));

    return NextResponse.json(
      {
        message: "Blog updated successfully",
        blog: {
          ...updatedBlog,
          tags: updatedTags.map((t) => t.tag),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog
export async function DELETE(
  req: NextRequest,
 context: { params: Promise<{ id: string }> } 
) {
  const params = await context.params;  
  try {
    // Check if blog exists
    const [blog] = await db
      .select()
      .from(BlogsTable)
      .where(eq(BlogsTable.id, params.id))
      .limit(1);

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Delete blog (cascade will delete tags automatically)
    await db.delete(BlogsTable).where(eq(BlogsTable.id, params.id));

    return NextResponse.json(
      { message: "Blog deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
}
