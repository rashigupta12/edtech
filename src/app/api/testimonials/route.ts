/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
// app/api/admin/testimonials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db"; // Adjust import path
import { TestimonialsTable } from "@/db/schema";
import { eq, desc, asc, ilike, or, and, sql } from "drizzle-orm";

// GET - Fetch testimonials with filters and pagination OR single testimonial by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    // If ID is provided, fetch single testimonial
    if (id) {
      const testimonial = await db
        .select()
        .from(TestimonialsTable)
        .where(eq(TestimonialsTable.id, id))
        .limit(1);

      if (!testimonial.length) {
        return NextResponse.json(
          {
            success: false,
            error: "Testimonial not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: testimonial[0],
      });
    }

    // Otherwise, fetch list with pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search");
    const isApproved = searchParams.get("isApproved");
    const isFeatured = searchParams.get("isFeatured");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(TestimonialsTable.studentName, `%${search}%`),
          ilike(TestimonialsTable.collegeName, `%${search}%`),
          ilike(TestimonialsTable.courseName, `%${search}%`),
          ilike(TestimonialsTable.testimonial, `%${search}%`)
        )
      );
    }

    if (isApproved !== null && isApproved !== undefined && isApproved !== "") {
      conditions.push(
        eq(TestimonialsTable.isApproved, isApproved === "true")
      );
    }

    if (isFeatured !== null && isFeatured !== undefined && isFeatured !== "") {
      conditions.push(
        eq(TestimonialsTable.isFeatured, isFeatured === "true")
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(TestimonialsTable)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Get testimonials
    const orderByColumn =
      sortBy === "rating"
        ? TestimonialsTable.rating
        : sortBy === "sortOrder"
        ? TestimonialsTable.sortOrder
        : sortBy === "studentName"
        ? TestimonialsTable.studentName
        : TestimonialsTable.createdAt;

    const testimonials = await db
      .select()
      .from(TestimonialsTable)
      .where(whereClause)
      .orderBy(
        sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn)
      )
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: testimonials,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch testimonials",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new testimonial
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      studentName,
      studentImage,
      collegeName,
      courseName,
      rating,
      testimonial,
      isApproved,
      isFeatured,
      sortOrder,
    } = body;

    // Validation
    if (!studentName || !testimonial || !rating) {
      return NextResponse.json(
        {
          success: false,
          error: "Student name, testimonial, and rating are required",
        },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Rating must be between 1 and 5",
        },
        { status: 400 }
      );
    }

    // Create testimonial
    const newTestimonial = await db
      .insert(TestimonialsTable)
      .values({
        studentName,
        studentImage: studentImage || null,
        collegeName: collegeName || null,
        courseName: courseName || null,
        rating,
        testimonial,
        isApproved: isApproved ?? false,
        isFeatured: isFeatured ?? false,
        sortOrder: sortOrder ?? 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newTestimonial[0],
      message: "Testimonial created successfully",
    });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create testimonial",
      },
      { status: 500 }
    );
  }
}

// PUT - Update a testimonial
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Testimonial ID is required",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate rating if provided
    if (body.rating && (body.rating < 1 || body.rating > 5)) {
      return NextResponse.json(
        {
          success: false,
          error: "Rating must be between 1 and 5",
        },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (body.studentName !== undefined) updateData.studentName = body.studentName;
    if (body.studentImage !== undefined) updateData.studentImage = body.studentImage;
    if (body.collegeName !== undefined) updateData.collegeName = body.collegeName;
    if (body.courseName !== undefined) updateData.courseName = body.courseName;
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.testimonial !== undefined) updateData.testimonial = body.testimonial;
    if (body.isApproved !== undefined) updateData.isApproved = body.isApproved;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

    // Update testimonial
    const updated = await db
      .update(TestimonialsTable)
      .set(updateData)
      .where(eq(TestimonialsTable.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Testimonial not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated[0],
      message: "Testimonial updated successfully",
    });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update testimonial",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a testimonial
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Testimonial ID is required",
        },
        { status: 400 }
      );
    }

    // Delete testimonial
    const deleted = await db
      .delete(TestimonialsTable)
      .where(eq(TestimonialsTable.id, id))
      .returning();

    if (!deleted.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Testimonial not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete testimonial",
      },
      { status: 500 }
    );
  }
}