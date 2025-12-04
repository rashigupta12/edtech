/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { BatchEnrollmentsTable, BatchesTable, UsersTable } from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch batch enrollments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");

    if (!batchId && !userId && !id) {
      return NextResponse.json(
        { success: false, error: { message: "Batch ID, User ID, or Enrollment ID is required" } },
        { status: 400 }
      );
    }

    // Fetch single enrollment by ID
    if (id) {
      const enrollments = await db
        .select({
          enrollment: BatchEnrollmentsTable,
          user: UsersTable,
          batch: BatchesTable,
        })
        .from(BatchEnrollmentsTable)
        .leftJoin(UsersTable, eq(BatchEnrollmentsTable.userId, UsersTable.id))
        .leftJoin(BatchesTable, eq(BatchEnrollmentsTable.batchId, BatchesTable.id))
        .where(eq(BatchEnrollmentsTable.id, id));

      const result = enrollments[0];

      if (!result || !result.enrollment) {
        return NextResponse.json(
          { success: false, error: { message: "Enrollment not found" } },
          { status: 404 }
        );
      }

      const formattedEnrollment = {
        ...result.enrollment,
        userName: result.user?.name ?? null,
        userEmail: result.user?.email ?? null,
        batchName: result.batch?.name ?? null,
      };

      return NextResponse.json({ success: true, data: formattedEnrollment });
    }

    // Fetch enrollments by batch or user
    const conditions = [];
    if (batchId) conditions.push(eq(BatchEnrollmentsTable.batchId, batchId));
    if (userId) conditions.push(eq(BatchEnrollmentsTable.userId, userId));

    const results = await db
      .select({
        enrollment: BatchEnrollmentsTable,
        user: UsersTable,
        batch: BatchesTable,
      })
      .from(BatchEnrollmentsTable)
      .leftJoin(UsersTable, eq(BatchEnrollmentsTable.userId, UsersTable.id))
      .leftJoin(BatchesTable, eq(BatchEnrollmentsTable.batchId, BatchesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(BatchEnrollmentsTable.enrollmentDate));

    const enrollments = results.map((result) => ({
      ...result.enrollment,
      userName: result.user?.name ?? null,
      userEmail: result.user?.email ?? null,
      batchName: result.batch?.name ?? null,
    }));

    return NextResponse.json({ success: true, data: enrollments });

  } catch (error: any) {
    console.error("Error fetching batch enrollments:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to fetch enrollments" } },
      { status: 500 }
    );
  }
}

// POST - Create batch enrollments (multiple)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enrollments } = body;

    if (!enrollments || !Array.isArray(enrollments) || enrollments.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "Enrollments array is required" } },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const enrollment of enrollments) {
      try {
        // Validate required fields
        if (!enrollment.batchId || !enrollment.userId) {
          errors.push({ enrollment, error: "Batch ID and User ID are required" });
          continue;
        }

        // Check if batch exists
        const [batchExists] = await db
          .select({ id: BatchesTable.id })
          .from(BatchesTable)
          .where(eq(BatchesTable.id, enrollment.batchId))
          .limit(1);

        if (!batchExists) {
          errors.push({ enrollment, error: "Batch not found" });
          continue;
        }

        // Check if user exists
        const [userExists] = await db
          .select({ id: UsersTable.id })
          .from(UsersTable)
          .where(eq(UsersTable.id, enrollment.userId))
          .limit(1);

        if (!userExists) {
          errors.push({ enrollment, error: "User not found" });
          continue;
        }

        // Check for existing enrollment
        const [existingEnrollment] = await db
          .select({ id: BatchEnrollmentsTable.id })
          .from(BatchEnrollmentsTable)
          .where(
            and(
              eq(BatchEnrollmentsTable.batchId, enrollment.batchId),
              eq(BatchEnrollmentsTable.userId, enrollment.userId)
            )
          )
          .limit(1);

        if (existingEnrollment) {
          errors.push({ enrollment, error: "User already enrolled in this batch" });
          continue;
        }

        // Check for duplicate roll number in batch
        if (enrollment.rollNumber) {
          const [duplicateRollNumber] = await db
            .select({ id: BatchEnrollmentsTable.id })
            .from(BatchEnrollmentsTable)
            .where(
              and(
                eq(BatchEnrollmentsTable.batchId, enrollment.batchId),
                eq(BatchEnrollmentsTable.rollNumber, enrollment.rollNumber)
              )
            )
            .limit(1);

          if (duplicateRollNumber) {
            errors.push({ enrollment, error: "Roll number already exists in this batch" });
            continue;
          }
        }

        // Create enrollment
        const [newEnrollment] = await db
          .insert(BatchEnrollmentsTable)
          .values({
            batchId: enrollment.batchId,
            userId: enrollment.userId,
            rollNumber: enrollment.rollNumber || null,
            enrollmentDate: new Date(),
            isActive: true,
          })
          .returning();

        results.push(newEnrollment);
      } catch (error: any) {
        errors.push({ enrollment, error: error.message });
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { success: false, error: { message: "Failed to create enrollments", details: errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: results,
        meta: {
          created: results.length,
          failed: errors.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating batch enrollments:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to create enrollments" } },
      { status: 500 }
    );
  }
}

// PATCH - Update batch enrollment
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Enrollment ID is required" } },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if enrollment exists
    const [existingEnrollment] = await db
      .select()
      .from(BatchEnrollmentsTable)
      .where(eq(BatchEnrollmentsTable.id, id))
      .limit(1);

    if (!existingEnrollment) {
      return NextResponse.json(
        { success: false, error: { message: "Enrollment not found" } },
        { status: 404 }
      );
    }

    // Check for duplicate roll number if updating
    if (body.rollNumber && body.rollNumber !== existingEnrollment.rollNumber) {
      const [duplicateRollNumber] = await db
        .select({ id: BatchEnrollmentsTable.id })
        .from(BatchEnrollmentsTable)
        .where(
          and(
            eq(BatchEnrollmentsTable.batchId, existingEnrollment.batchId),
            eq(BatchEnrollmentsTable.rollNumber, body.rollNumber),
            sql`${BatchEnrollmentsTable.id} != ${id}`
          )
        )
        .limit(1);

      if (duplicateRollNumber) {
        return NextResponse.json(
          { success: false, error: { message: "Roll number already exists in this batch" } },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (body.rollNumber !== undefined) updateData.rollNumber = body.rollNumber || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Update enrollment
    const [updatedEnrollment] = await db
      .update(BatchEnrollmentsTable)
      .set(updateData)
      .where(eq(BatchEnrollmentsTable.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedEnrollment });

  } catch (error: any) {
    console.error("Error updating batch enrollment:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update enrollment" } },
      { status: 500 }
    );
  }
}

// DELETE - Remove batch enrollments
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const body = await request.json();
    const { enrollmentIds } = body;

    if (!id && (!enrollmentIds || !Array.isArray(enrollmentIds))) {
      return NextResponse.json(
        { success: false, error: { message: "Enrollment ID or enrollmentIds array is required" } },
        { status: 400 }
      );
    }

    let idsToDelete: string[] = [];
    
    if (id) {
      idsToDelete = [id];
    } else if (enrollmentIds) {
      idsToDelete = enrollmentIds;
    }

    // Check if enrollments exist
    const existingEnrollments = await db
      .select({ id: BatchEnrollmentsTable.id })
      .from(BatchEnrollmentsTable)
      .where(inArray(BatchEnrollmentsTable.id, idsToDelete));

    if (existingEnrollments.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "No enrollments found" } },
        { status: 404 }
      );
    }

    // Delete enrollments
    await db
      .delete(BatchEnrollmentsTable)
      .where(inArray(BatchEnrollmentsTable.id, idsToDelete));

    return NextResponse.json({
      success: true,
      message: `${idsToDelete.length} enrollment(s) deleted successfully`,
    });

  } catch (error) {
    console.error("Error deleting batch enrollments:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to delete enrollments" } },
      { status: 500 }
    );
  }
}