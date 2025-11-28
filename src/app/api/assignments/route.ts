/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { AssignmentsTable, AssignmentSubmissionsTable, CoursesTable } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// ===========================
// TYPES & HELPERS
// ===========================

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string };
};

const parseBoolean = (value: string | null | undefined): boolean => value === 'true' || value === '1';

const validateId = (id: string | undefined): { valid: boolean; error?: string } => {
  if (!id) return { valid: false, error: 'ID is required' };
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return { valid: false, error: 'Invalid ID format' };
  return { valid: true };
};

const successResponse = <T>(data: T, message?: string, status = 200): NextResponse<ApiResponse<T>> => {
  return NextResponse.json({ success: true, data, message }, { status });
};

const errorResponse = (message: string, code = 'ERROR', status = 400): NextResponse<ApiResponse> => {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
};

// ===========================
// CONTROLLERS - ASSIGNMENTS
// ===========================

// GET COURSE ASSIGNMENTS
const getCourseAssignments = async (courseId: string) => {
  const assignments = await db
    .select()
    .from(AssignmentsTable)
    .where(eq(AssignmentsTable.courseId, courseId))
    .orderBy(desc(AssignmentsTable.createdAt));

  return successResponse(assignments);
};

// GET MODULE ASSIGNMENTS
const getModuleAssignments = async (moduleId: string) => {
  const assignments = await db
    .select()
    .from(AssignmentsTable)
    .where(eq(AssignmentsTable.moduleId, moduleId))
    .orderBy(desc(AssignmentsTable.createdAt));

  return successResponse(assignments);
};

// GET ASSIGNMENT BY ID
const getAssignmentById = async (id: string) => {
  const [assignment] = await db
    .select()
    .from(AssignmentsTable)
    .where(eq(AssignmentsTable.id, id))
    .limit(1);

  if (!assignment) return errorResponse('Assignment not found', 'NOT_FOUND', 404);
  return successResponse(assignment);
};

// CREATE ASSIGNMENT
const createAssignment = async (request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.courseId || !body.title || !body.description || !body.createdBy) {
      return errorResponse('Missing required fields: courseId, title, description, createdBy');
    }

    const [assignment] = await db
      .insert(AssignmentsTable)
      .values({
        courseId: body.courseId,
        moduleId: body.moduleId || null,
        title: body.title,
        description: body.description,
        instructions: body.instructions || null,
        attachments: body.attachments || null,
        dueDate: body.dueDate || null,
        maxScore: body.maxScore || 100,
        createdBy: body.createdBy,
      })
      .returning();

    return successResponse(assignment, 'Assignment created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create assignment', 'CREATE_ERROR', 500);
  }
};

// UPDATE ASSIGNMENT
const updateAssignment = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [assignment] = await db.select().from(AssignmentsTable).where(eq(AssignmentsTable.id, id)).limit(1);
    if (!assignment) return errorResponse('Assignment not found', 'NOT_FOUND', 404);

    const [updated] = await db
      .update(AssignmentsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(AssignmentsTable.id, id))
      .returning();

    return successResponse(updated, 'Assignment updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update assignment', 'UPDATE_ERROR', 500);
  }
};

// DELETE ASSIGNMENT
const deleteAssignment = async (id: string) => {
  try {
    const [assignment] = await db.select().from(AssignmentsTable).where(eq(AssignmentsTable.id, id)).limit(1);
    if (!assignment) return errorResponse('Assignment not found', 'NOT_FOUND', 404);

    await db.delete(AssignmentsTable).where(eq(AssignmentsTable.id, id));
    return successResponse({ id }, 'Assignment deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete assignment', 'DELETE_ERROR', 500);
  }
};

// ===========================
// CONTROLLERS - SUBMISSIONS
// ===========================

// GET ASSIGNMENT SUBMISSIONS
const getAssignmentSubmissions = async (assignmentId: string) => {
  const submissions = await db
    .select()
    .from(AssignmentSubmissionsTable)
    .where(eq(AssignmentSubmissionsTable.assignmentId, assignmentId))
    .orderBy(desc(AssignmentSubmissionsTable.submittedAt));

  return successResponse(submissions);
};

// GET SUBMISSION BY ID
const getSubmissionById = async (id: string) => {
  const [submission] = await db
    .select()
    .from(AssignmentSubmissionsTable)
    .where(eq(AssignmentSubmissionsTable.id, id))
    .limit(1);

  if (!submission) return errorResponse('Submission not found', 'NOT_FOUND', 404);
  return successResponse(submission);
};

// GET USER'S SUBMISSIONS
const getUserSubmissions = async (userId: string) => {
  const submissions = await db
    .select({
      id: AssignmentSubmissionsTable.id,
      assignmentId: AssignmentSubmissionsTable.assignmentId,
      assignmentTitle: AssignmentsTable.title,
      courseTitle: CoursesTable.title,
      status: AssignmentSubmissionsTable.status,
      score: AssignmentSubmissionsTable.score,
      maxScore: AssignmentSubmissionsTable.maxScore,
      submittedAt: AssignmentSubmissionsTable.submittedAt,
      gradedAt: AssignmentSubmissionsTable.gradedAt,
    })
    .from(AssignmentSubmissionsTable)
    .innerJoin(AssignmentsTable, eq(AssignmentSubmissionsTable.assignmentId, AssignmentsTable.id))
    .innerJoin(CoursesTable, eq(AssignmentsTable.courseId, CoursesTable.id))
    .where(eq(AssignmentSubmissionsTable.userId, userId))
    .orderBy(desc(AssignmentSubmissionsTable.submittedAt));

  return successResponse(submissions);
};

// SUBMIT ASSIGNMENT
const submitAssignment = async (assignmentId: string, request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.userId || !body.enrollmentId) {
      return errorResponse('Missing required fields: userId, enrollmentId');
    }

    // Check if already submitted
    const [existing] = await db
      .select()
      .from(AssignmentSubmissionsTable)
      .where(
        and(
          eq(AssignmentSubmissionsTable.assignmentId, assignmentId),
          eq(AssignmentSubmissionsTable.userId, body.userId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing submission
      const [updated] = await db
        .update(AssignmentSubmissionsTable)
        .set({
          content: body.content || existing.content,
          attachments: body.attachments || existing.attachments,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(AssignmentSubmissionsTable.id, existing.id))
        .returning();

      return successResponse(updated, 'Assignment resubmitted successfully');
    }

    // Create new submission
    const [submission] = await db
      .insert(AssignmentSubmissionsTable)
      .values({
        assignmentId,
        userId: body.userId,
        enrollmentId: body.enrollmentId,
        content: body.content || null,
        attachments: body.attachments || null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      })
      .returning();

    return successResponse(submission, 'Assignment submitted successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to submit assignment', 'SUBMIT_ERROR', 500);
  }
};

// GRADE SUBMISSION
const gradeSubmission = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    if (body.score === undefined) {
      return errorResponse('Score is required for grading');
    }

    const [submission] = await db
      .select()
      .from(AssignmentSubmissionsTable)
      .where(eq(AssignmentSubmissionsTable.id, id))
      .limit(1);

    if (!submission) return errorResponse('Submission not found', 'NOT_FOUND', 404);

    const [graded] = await db
      .update(AssignmentSubmissionsTable)
      .set({
        score: body.score,
        maxScore: body.maxScore || submission.maxScore,
        feedback: body.feedback || null,
        status: 'GRADED',
        gradedBy: body.gradedBy || null,
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(AssignmentSubmissionsTable.id, id))
      .returning();

    return successResponse(graded, 'Assignment graded successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to grade assignment', 'GRADE_ERROR', 500);
  }
};

// DELETE SUBMISSION
const deleteSubmission = async (id: string) => {
  try {
    const [submission] = await db
      .select()
      .from(AssignmentSubmissionsTable)
      .where(eq(AssignmentSubmissionsTable.id, id))
      .limit(1);

    if (!submission) return errorResponse('Submission not found', 'NOT_FOUND', 404);

    await db.delete(AssignmentSubmissionsTable).where(eq(AssignmentSubmissionsTable.id, id));
    return successResponse({ id }, 'Submission deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete submission', 'DELETE_ERROR', 500);
  }
};

// ===========================
// ROUTE HANDLERS
// ===========================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const courseId = searchParams.get('courseId');
    const moduleId = searchParams.get('moduleId');
    const submissions = searchParams.get('submissions');
    const submissionId = searchParams.get('submissionId');
    const userId = searchParams.get('userId');
    const mySubmissions = searchParams.get('mySubmissions');

    // GET /api/assignments?mySubmissions=true&userId=123
    if (parseBoolean(mySubmissions) && userId) {
      const validation = validateId(userId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getUserSubmissions(userId);
    }

    // GET /api/assignments?submissionId=123
    if (submissionId) {
      const validation = validateId(submissionId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getSubmissionById(submissionId);
    }

    // GET /api/assignments?id=123&submissions=true
    if (id && parseBoolean(submissions)) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getAssignmentSubmissions(id);
    }

    // GET /api/assignments?id=123
    if (id) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getAssignmentById(id);
    }

    // GET /api/assignments?moduleId=123
    if (moduleId) {
      const validation = validateId(moduleId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getModuleAssignments(moduleId);
    }

    // GET /api/assignments?courseId=123
    if (courseId) {
      const validation = validateId(courseId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getCourseAssignments(courseId);
    }

    return errorResponse('courseId, moduleId, or id parameter is required');
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const submit = searchParams.get('submit');

    // POST /api/assignments?id=123&submit=true
    if (id && parseBoolean(submit)) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await submitAssignment(id, request);
    }

    // POST /api/assignments (create new)
    return await createAssignment(request);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const submissionId = searchParams.get('submissionId');
    const grade = searchParams.get('grade');

    // PUT /api/assignments?submissionId=123&grade=true
    if (submissionId && parseBoolean(grade)) {
      const validation = validateId(submissionId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await gradeSubmission(submissionId, request);
    }

    // PUT /api/assignments?submissionId=123
    if (submissionId) {
      const validation = validateId(submissionId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await gradeSubmission(submissionId, request);
    }

    // PUT /api/assignments?id=123
    if (id) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await updateAssignment(id, request);
    }

    return errorResponse('id or submissionId is required');
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const submissionId = searchParams.get('submissionId');

    // DELETE /api/assignments?submissionId=123
    if (submissionId) {
      const validation = validateId(submissionId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await deleteSubmission(submissionId);
    }

    // DELETE /api/assignments?id=123
    if (id) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await deleteAssignment(id);
    }

    return errorResponse('id or submissionId is required');
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}