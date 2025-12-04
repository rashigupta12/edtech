import { db } from "@/db";
import { BatchCoursesTable, BatchesTable, CoursesTable, FacultyTable, UsersTable } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch batch courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");
    const courseId = searchParams.get("courseId");
    const id = searchParams.get("id");

    if (!batchId && !courseId && !id) {
      return NextResponse.json(
        { success: false, error: { message: "Batch ID, Course ID, or ID is required" } },
        { status: 400 }
      );
    }

    // Fetch single batch course by ID
    if (id) {
      const batchCourses = await db
        .select({
          batchCourse: BatchCoursesTable,
          course: CoursesTable,
          faculty: FacultyTable,
          user: UsersTable,
          batch: BatchesTable,
        })
        .from(BatchCoursesTable)
        .leftJoin(CoursesTable, eq(BatchCoursesTable.courseId, CoursesTable.id))
        .leftJoin(FacultyTable, eq(BatchCoursesTable.facultyId, FacultyTable.id))
        .leftJoin(UsersTable, eq(FacultyTable.userId, UsersTable.id))
        .leftJoin(BatchesTable, eq(BatchCoursesTable.batchId, BatchesTable.id))
        .where(eq(BatchCoursesTable.id, id));

      const result = batchCourses[0];

      if (!result || !result.batchCourse) {
        return NextResponse.json(
          { success: false, error: { message: "Batch course not found" } },
          { status: 404 }
        );
      }

      const formattedBatchCourse = {
        ...result.batchCourse,
        courseTitle: result.course?.title ?? null,
        courseCode: result.course?.code ?? null,
        facultyName: result.user?.name ?? null,
        batchName: result.batch?.name ?? null,
      };

      return NextResponse.json({ success: true, data: formattedBatchCourse });
    }

    // Fetch batch courses by batch or course
    const conditions = [];
    if (batchId) conditions.push(eq(BatchCoursesTable.batchId, batchId));
    if (courseId) conditions.push(eq(BatchCoursesTable.courseId, courseId));

    const results = await db
      .select({
        batchCourse: BatchCoursesTable,
        course: CoursesTable,
        faculty: FacultyTable,
        user: UsersTable,
        batch: BatchesTable,
      })
      .from(BatchCoursesTable)
      .leftJoin(CoursesTable, eq(BatchCoursesTable.courseId, CoursesTable.id))
      .leftJoin(FacultyTable, eq(BatchCoursesTable.facultyId, FacultyTable.id))
      .leftJoin(UsersTable, eq(FacultyTable.userId, UsersTable.id))
      .leftJoin(BatchesTable, eq(BatchCoursesTable.batchId, BatchesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(BatchCoursesTable.semester, asc(BatchCoursesTable.createdAt));

    const batchCourses = results.map((result) => ({
      ...result.batchCourse,
      courseTitle: result.course?.title ?? null,
      courseCode: result.course?.code ?? null,
      facultyName: result.user?.name ?? null,
      batchName: result.batch?.name ?? null,
    }));

    return NextResponse.json({ success: true, data: batchCourses });

  } catch (error: any) {
    console.error("Error fetching batch courses:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to fetch batch courses" } },
      { status: 500 }
    );
  }
}

// POST - Create batch course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["batchId", "courseId"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: { message: `${field} is required` } },
          { status: 400 }
        );
      }
    }

    // Check if batch exists
    const [batchExists] = await db
      .select({ id: BatchesTable.id })
      .from(BatchesTable)
      .where(eq(BatchesTable.id, body.batchId))
      .limit(1);

    if (!batchExists) {
      return NextResponse.json(
        { success: false, error: { message: "Batch not found" } },
        { status: 404 }
      );
    }

    // Check if course exists
    const [courseExists] = await db
      .select({ id: CoursesTable.id })
      .from(CoursesTable)
      .where(eq(CoursesTable.id, body.courseId))
      .limit(1);

    if (!courseExists) {
      return NextResponse.json(
        { success: false, error: { message: "Course not found" } },
        { status: 404 }
      );
    }

    // Check if faculty exists if provided
    if (body.facultyId) {
      const [facultyExists] = await db
        .select({ id: FacultyTable.id })
        .from(FacultyTable)
        .where(eq(FacultyTable.id, body.facultyId))
        .limit(1);

      if (!facultyExists) {
        return NextResponse.json(
          { success: false, error: { message: "Faculty not found" } },
          { status: 404 }
        );
      }
    }

    // Check for existing batch course
    const [existingBatchCourse] = await db
      .select({ id: BatchCoursesTable.id })
      .from(BatchCoursesTable)
      .where(
        and(
          eq(BatchCoursesTable.batchId, body.batchId),
          eq(BatchCoursesTable.courseId, body.courseId)
        )
      )
      .limit(1);

    if (existingBatchCourse) {
      return NextResponse.json(
        { success: false, error: { message: "Course already assigned to this batch" } },
        { status: 409 }
      );
    }

    // Validate semester if provided
    if (body.semester && (body.semester < 1 || body.semester > 12)) {
      return NextResponse.json(
        { success: false, error: { message: "Semester must be between 1 and 12" } },
        { status: 400 }
      );
    }

    // Create batch course
    const [newBatchCourse] = await db
      .insert(BatchCoursesTable)
      .values({
        batchId: body.batchId,
        courseId: body.courseId,
        facultyId: body.facultyId || null,
        semester: body.semester ? parseInt(body.semester) : null,
        academicYear: body.academicYear || null,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: newBatchCourse },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating batch course:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to create batch course" } },
      { status: 500 }
    );
  }
}

// PUT - Update batch course
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Batch course ID is required" } },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if batch course exists
    const [existingBatchCourse] = await db
      .select()
      .from(BatchCoursesTable)
      .where(eq(BatchCoursesTable.id, id))
      .limit(1);

    if (!existingBatchCourse) {
      return NextResponse.json(
        { success: false, error: { message: "Batch course not found" } },
        { status: 404 }
      );
    }

    // Check if faculty exists if provided
    if (body.facultyId && body.facultyId !== existingBatchCourse.facultyId) {
      const [facultyExists] = await db
        .select({ id: FacultyTable.id })
        .from(FacultyTable)
        .where(eq(FacultyTable.id, body.facultyId))
        .limit(1);

      if (!facultyExists) {
        return NextResponse.json(
          { success: false, error: { message: "Faculty not found" } },
          { status: 404 }
        );
      }
    }

    // Validate semester if provided
    if (body.semester && (body.semester < 1 || body.semester > 12)) {
      return NextResponse.json(
        { success: false, error: { message: "Semester must be between 1 and 12" } },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.facultyId !== undefined) updateData.facultyId = body.facultyId || null;
    if (body.semester !== undefined) updateData.semester = body.semester ? parseInt(body.semester) : null;
    if (body.academicYear !== undefined) updateData.academicYear = body.academicYear || null;

    // Update batch course
    const [updatedBatchCourse] = await db
      .update(BatchCoursesTable)
      .set(updateData)
      .where(eq(BatchCoursesTable.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedBatchCourse });

  } catch (error: any) {
    console.error("Error updating batch course:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update batch course" } },
      { status: 500 }
    );
  }
}

// DELETE - Remove batch course
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Batch course ID is required" } },
        { status: 400 }
      );
    }

    // Check if batch course exists
    const [existingBatchCourse] = await db
      .select({ id: BatchCoursesTable.id })
      .from(BatchCoursesTable)
      .where(eq(BatchCoursesTable.id, id))
      .limit(1);

    if (!existingBatchCourse) {
      return NextResponse.json(
        { success: false, error: { message: "Batch course not found" } },
        { status: 404 }
      );
    }

    // Delete batch course
    await db.delete(BatchCoursesTable).where(eq(BatchCoursesTable.id, id));

    return NextResponse.json({
      success: true,
      message: "Batch course removed successfully",
    });

  } catch (error) {
    console.error("Error deleting batch course:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to delete batch course" } },
      { status: 500 }
    );
  }
}