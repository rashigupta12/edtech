import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { BatchesTable, CollegesTable, DepartmentsTable } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// GET - Fetch batches (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get("collegeId");
    const departmentId = searchParams.get("departmentId");
    const id = searchParams.get("id");

    // Fetch single batch by ID
    if (id) {
      const batches = await db
        .select({
          batch: BatchesTable,
          college: CollegesTable,
          department: DepartmentsTable,
        })
        .from(BatchesTable)
        .leftJoin(CollegesTable, eq(BatchesTable.collegeId, CollegesTable.id))
        .leftJoin(DepartmentsTable, eq(BatchesTable.departmentId, DepartmentsTable.id))
        .where(eq(BatchesTable.id, id));

      const result = batches[0];

      if (!result || !result.batch) {
        return NextResponse.json(
          { success: false, error: { message: "Batch not found" } },
          { status: 404 }
        );
      }

      const formattedBatch = {
        ...result.batch,
        collegeName: result.college?.collegeName ?? null,
        departmentName: result.department?.name ?? null,
        departmentCode: result.department?.code ?? null,
      };

      return NextResponse.json({ success: true, data: formattedBatch });
    }

    // Fetch list of batches
    const conditions = [];
    if (collegeId) conditions.push(eq(BatchesTable.collegeId, collegeId));
    if (departmentId) conditions.push(eq(BatchesTable.departmentId, departmentId));

    const results = await db
      .select({
        batch: BatchesTable,
        college: CollegesTable,
        department: DepartmentsTable,
      })
      .from(BatchesTable)
      .leftJoin(CollegesTable, eq(BatchesTable.collegeId, CollegesTable.id))
      .leftJoin(DepartmentsTable, eq(BatchesTable.departmentId, DepartmentsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(BatchesTable.createdAt));

    // Format the results to include joined data
    const batches = results.map((result) => ({
      ...result.batch,
      collegeName: result.college?.collegeName ?? null,
      departmentName: result.department?.name ?? null,
      departmentCode: result.department?.code ?? null,
    }));

    return NextResponse.json({ success: true, data: batches });

  } catch (error: any) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to fetch batches" } },
      { status: 500 }
    );
  }
}

// POST - Create a new batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ["collegeId", "name", "code", "academicYear"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: { message: `${field} is required` } },
          { status: 400 }
        );
      }
    }

    // Check if college exists
    const [collegeExists] = await db
      .select({ id: CollegesTable.id })
      .from(CollegesTable)
      .where(eq(CollegesTable.id, body.collegeId))
      .limit(1);

    if (!collegeExists) {
      return NextResponse.json(
        { success: false, error: { message: "College not found" } },
        { status: 404 }
      );
    }

    // Check if department exists if provided
    if (body.departmentId) {
      const [departmentExists] = await db
        .select({ id: DepartmentsTable.id })
        .from(DepartmentsTable)
        .where(eq(DepartmentsTable.id, body.departmentId))
        .limit(1);

      if (!departmentExists) {
        return NextResponse.json(
          { success: false, error: { message: "Department not found" } },
          { status: 404 }
        );
      }
    }

    // Check for duplicate batch code within the same college
    const [existingBatch] = await db
      .select({ id: BatchesTable.id })
      .from(BatchesTable)
      .where(
        and(
          eq(BatchesTable.collegeId, body.collegeId),
          eq(BatchesTable.code, body.code)
        )
      )
      .limit(1);

    if (existingBatch) {
      return NextResponse.json(
        { success: false, error: { message: "Batch code already exists in this college" } },
        { status: 409 }
      );
    }

    // Validate date order
    if (body.startDate && body.endDate && new Date(body.startDate) > new Date(body.endDate)) {
      return NextResponse.json(
        { success: false, error: { message: "End date must be after start date" } },
        { status: 400 }
      );
    }

    // Create batch
    const [newBatch] = await db
      .insert(BatchesTable)
      .values({
        collegeId: body.collegeId,
        departmentId: body.departmentId || null,
        name: body.name,
        code: body.code,
        academicYear: body.academicYear,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        description: body.description || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: newBatch },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating batch:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to create batch" } },
      { status: 500 }
    );
  }
}

// PUT - Update a batch
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Batch ID is required" } },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Check if batch exists
    const [existingBatch] = await db
      .select()
      .from(BatchesTable)
      .where(eq(BatchesTable.id, id))
      .limit(1);

    if (!existingBatch) {
      return NextResponse.json(
        { success: false, error: { message: "Batch not found" } },
        { status: 404 }
      );
    }

    // Check for duplicate batch code within the same college (if code is being updated)
    if (body.code && body.code !== existingBatch.code) {
      const [duplicateBatch] = await db
        .select({ id: BatchesTable.id })
        .from(BatchesTable)
        .where(
          and(
            eq(BatchesTable.collegeId, body.collegeId || existingBatch.collegeId),
            eq(BatchesTable.code, body.code),
            sql`${BatchesTable.id} != ${id}`
          )
        )
        .limit(1);

      if (duplicateBatch) {
        return NextResponse.json(
          { success: false, error: { message: "Batch code already exists in this college" } },
          { status: 409 }
        );
      }
    }

    // Validate date order
    const startDate = body.startDate ? new Date(body.startDate) : existingBatch.startDate;
    const endDate = body.endDate ? new Date(body.endDate) : existingBatch.endDate;
    
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { success: false, error: { message: "End date must be after start date" } },
        { status: 400 }
      );
    }

    // Check if department exists if provided
    if (body.departmentId && body.departmentId !== existingBatch.departmentId) {
      const [departmentExists] = await db
        .select({ id: DepartmentsTable.id })
        .from(DepartmentsTable)
        .where(eq(DepartmentsTable.id, body.departmentId))
        .limit(1);

      if (!departmentExists) {
        return NextResponse.json(
          { success: false, error: { message: "Department not found" } },
          { status: 404 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.academicYear !== undefined) updateData.academicYear = body.academicYear;
    if (body.departmentId !== undefined) updateData.departmentId = body.departmentId || null;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Update batch
    const [updatedBatch] = await db
      .update(BatchesTable)
      .set(updateData)
      .where(eq(BatchesTable.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedBatch });

  } catch (error) {
    console.error("Error updating batch:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update batch" } },
      { status: 500 }
    );
  }
}

// PATCH - Partially update a batch (e.g., toggle active status)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Batch ID is required" } },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Check if batch exists
    const [existingBatch] = await db
      .select({ id: BatchesTable.id })
      .from(BatchesTable)
      .where(eq(BatchesTable.id, id))
      .limit(1);

    if (!existingBatch) {
      return NextResponse.json(
        { success: false, error: { message: "Batch not found" } },
        { status: 404 }
      );
    }

    // Update only allowed fields
    const updateData: any = { updatedAt: new Date() };
    
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    // You can add more fields here if needed for partial updates
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;

    const [updatedBatch] = await db
      .update(BatchesTable)
      .set(updateData)
      .where(eq(BatchesTable.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedBatch });

  } catch (error: any) {
    console.error("Error updating batch:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update batch" } },
      { status: 500 }
    );
  }
}

// DELETE - Delete a batch
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Batch ID is required" } },
        { status: 400 }
      );
    }

    // Check if batch exists
    const [existingBatch] = await db
      .select({ id: BatchesTable.id })
      .from(BatchesTable)
      .where(eq(BatchesTable.id, id))
      .limit(1);

    if (!existingBatch) {
      return NextResponse.json(
        { success: false, error: { message: "Batch not found" } },
        { status: 404 }
      );
    }

    // Delete batch (cascade will handle related records)
    await db.delete(BatchesTable).where(eq(BatchesTable.id, id));

    return NextResponse.json({ 
      success: true, 
      message: "Batch deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting batch:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to delete batch" } },
      { status: 500 }
    );
  }
}