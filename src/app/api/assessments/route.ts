// src/app/api/assessments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { AssessmentsTable, AssessmentQuestionsTable, AssessmentAttemptsTable } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

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
// CONTROLLERS - ASSESSMENTS
// ===========================

// GET COURSE ASSESSMENTS
const getCourseAssessments = async (courseId: string) => {
  const assessments = await db
    .select()
    .from(AssessmentsTable)
    .where(eq(AssessmentsTable.courseId, courseId))
    .orderBy(desc(AssessmentsTable.createdAt));

  return successResponse(assessments);
};

// GET MODULE ASSESSMENTS
const getModuleAssessments = async (moduleId: string) => {
  const assessments = await db
    .select()
    .from(AssessmentsTable)
    .where(eq(AssessmentsTable.moduleId, moduleId))
    .orderBy(desc(AssessmentsTable.createdAt));

  return successResponse(assessments);
};

// GET ASSESSMENT BY ID
const getAssessmentById = async (id: string) => {
  const [assessment] = await db
    .select()
    .from(AssessmentsTable)
    .where(eq(AssessmentsTable.id, id))
    .limit(1);

  if (!assessment) return errorResponse('Assessment not found', 'NOT_FOUND', 404);
  return successResponse(assessment);
};

// CREATE ASSESSMENT
const createAssessment = async (request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.courseId || !body.title || !body.createdBy) {
      return errorResponse('Missing required fields: courseId, title, createdBy');
    }

    const [assessment] = await db
      .insert(AssessmentsTable)
      .values({
        courseId: body.courseId,
        moduleId: body.moduleId || null,
        title: body.title,
        description: body.description || null,
        duration: body.duration || null,
        passingScore: body.passingScore || 60,
        maxAttempts: body.maxAttempts || null,
        isRequired: body.isRequired || false,
        createdBy: body.createdBy,
      })
      .returning();

    return successResponse(assessment, 'Assessment created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create assessment', 'CREATE_ERROR', 500);
  }
};

// UPDATE ASSESSMENT
const updateAssessment = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [assessment] = await db.select().from(AssessmentsTable).where(eq(AssessmentsTable.id, id)).limit(1);
    if (!assessment) return errorResponse('Assessment not found', 'NOT_FOUND', 404);

    const [updated] = await db
      .update(AssessmentsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(AssessmentsTable.id, id))
      .returning();

    return successResponse(updated, 'Assessment updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update assessment', 'UPDATE_ERROR', 500);
  }
};

// DELETE ASSESSMENT
const deleteAssessment = async (id: string) => {
  try {
    const [assessment] = await db.select().from(AssessmentsTable).where(eq(AssessmentsTable.id, id)).limit(1);
    if (!assessment) return errorResponse('Assessment not found', 'NOT_FOUND', 404);

    await db.delete(AssessmentsTable).where(eq(AssessmentsTable.id, id));
    return successResponse({ id }, 'Assessment deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete assessment', 'DELETE_ERROR', 500);
  }
};

// ===========================
// CONTROLLERS - QUESTIONS
// ===========================

// GET ASSESSMENT QUESTIONS
const getAssessmentQuestions = async (assessmentId: string) => {
  const questions = await db
    .select()
    .from(AssessmentQuestionsTable)
    .where(eq(AssessmentQuestionsTable.assessmentId, assessmentId))
    .orderBy(AssessmentQuestionsTable.sortOrder);

  return successResponse(questions);
};

// ADD QUESTION
const addQuestion = async (assessmentId: string, request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.questionText || !body.correctAnswer) {
      return errorResponse('Missing required fields: questionText, correctAnswer');
    }

    // Get max sort order
    const [maxOrder] = await db
      .select({ max: sql<number>`MAX(${AssessmentQuestionsTable.sortOrder})` })
      .from(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.assessmentId, assessmentId));

    const sortOrder = (maxOrder?.max ?? -1) + 1;

    const [question] = await db
      .insert(AssessmentQuestionsTable)
      .values({
        assessmentId,
        questionText: body.questionText,
        questionType: body.questionType || 'MULTIPLE_CHOICE',
        options: body.options || null,
        correctAnswer: body.correctAnswer,
        points: body.points || 1,
        explanation: body.explanation || null,
        sortOrder: body.sortOrder ?? sortOrder,
      })
      .returning();

    return successResponse(question, 'Question added successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to add question', 'ADD_QUESTION_ERROR', 500);
  }
};

// UPDATE QUESTION
const updateQuestion = async (questionId: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [question] = await db
      .select()
      .from(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.id, questionId))
      .limit(1);

    if (!question) return errorResponse('Question not found', 'NOT_FOUND', 404);

    const [updated] = await db
      .update(AssessmentQuestionsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(AssessmentQuestionsTable.id, questionId))
      .returning();

    return successResponse(updated, 'Question updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update question', 'UPDATE_ERROR', 500);
  }
};

// DELETE QUESTION
const deleteQuestion = async (questionId: string) => {
  try {
    const [question] = await db
      .select()
      .from(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.id, questionId))
      .limit(1);

    if (!question) return errorResponse('Question not found', 'NOT_FOUND', 404);

    await db.delete(AssessmentQuestionsTable).where(eq(AssessmentQuestionsTable.id, questionId));
    return successResponse({ id: questionId }, 'Question deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete question', 'DELETE_ERROR', 500);
  }
};

// REORDER QUESTIONS
const reorderQuestions = async (assessmentId: string, request: NextRequest) => {
  try {
    const body = await request.json();
    if (!Array.isArray(body.questions)) return errorResponse('Questions array is required');

    for (const question of body.questions) {
      await db
        .update(AssessmentQuestionsTable)
        .set({ sortOrder: question.sortOrder })
        .where(eq(AssessmentQuestionsTable.id, question.id));
    }

    return successResponse({ assessmentId }, 'Questions reordered successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to reorder questions', 'REORDER_ERROR', 500);
  }
};

// ===========================
// CONTROLLERS - ATTEMPTS
// ===========================

// START ASSESSMENT ATTEMPT
const startAttempt = async (assessmentId: string, request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.userId || !body.enrollmentId) {
      return errorResponse('Missing required fields: userId, enrollmentId');
    }

    // Get assessment
    const [assessment] = await db
      .select()
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, assessmentId))
      .limit(1);

    if (!assessment) return errorResponse('Assessment not found', 'NOT_FOUND', 404);

    // Check max attempts
    if (assessment.maxAttempts) {
      const attempts = await db
        .select()
        .from(AssessmentAttemptsTable)
        .where(
          and(
            eq(AssessmentAttemptsTable.assessmentId, assessmentId),
            eq(AssessmentAttemptsTable.userId, body.userId)
          )
        );

      if (attempts.length >= assessment.maxAttempts) {
        return errorResponse('Maximum attempts reached', 'MAX_ATTEMPTS', 400);
      }
    }

    // Create attempt
    const [attempt] = await db
      .insert(AssessmentAttemptsTable)
      .values({
        assessmentId,
        userId: body.userId,
        enrollmentId: body.enrollmentId,
        attemptNumber: body.attemptNumber || 1,
        answers: {},
        score: 0,
        totalPoints: 0,
        percentage: 0,
        passed: false,
        startedAt: new Date(),
      })
      .returning();

    return successResponse(attempt, 'Assessment attempt started', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to start attempt', 'START_ERROR', 500);
  }
};

// GET ATTEMPT
const getAttempt = async (attemptId: string) => {
  const [attempt] = await db
    .select()
    .from(AssessmentAttemptsTable)
    .where(eq(AssessmentAttemptsTable.id, attemptId))
    .limit(1);

  if (!attempt) return errorResponse('Attempt not found', 'NOT_FOUND', 404);
  return successResponse(attempt);
};

// UPDATE ATTEMPT (save answers)
const updateAttempt = async (attemptId: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [attempt] = await db
      .select()
      .from(AssessmentAttemptsTable)
      .where(eq(AssessmentAttemptsTable.id, attemptId))
      .limit(1);

    if (!attempt) return errorResponse('Attempt not found', 'NOT_FOUND', 404);

    const [updated] = await db
      .update(AssessmentAttemptsTable)
      .set({ answers: body.answers || attempt.answers })
      .where(eq(AssessmentAttemptsTable.id, attemptId))
      .returning();

    return successResponse(updated, 'Answers saved');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to save answers', 'UPDATE_ERROR', 500);
  }
};

// SUBMIT ATTEMPT
const submitAttempt = async (attemptId: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [attempt] = await db
      .select()
      .from(AssessmentAttemptsTable)
      .where(eq(AssessmentAttemptsTable.id, attemptId))
      .limit(1);

    if (!attempt) return errorResponse('Attempt not found', 'NOT_FOUND', 404);

    // Calculate score (you'll need to implement scoring logic)
    const score = body.score || 0;
    const totalPoints = body.totalPoints || 100;
    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= 60; // or use assessment's passing score

    const [submitted] = await db
      .update(AssessmentAttemptsTable)
      .set({
        answers: body.answers || attempt.answers,
        score,
        totalPoints,
        percentage,
        passed,
        completedAt: new Date(),
      })
      .where(eq(AssessmentAttemptsTable.id, attemptId))
      .returning();

    return successResponse(submitted, 'Assessment submitted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to submit attempt', 'SUBMIT_ERROR', 500);
  }
};

// GET USER'S ATTEMPTS
const getUserAttempts = async (assessmentId: string, userId: string) => {
  const attempts = await db
    .select()
    .from(AssessmentAttemptsTable)
    .where(
      and(
        eq(AssessmentAttemptsTable.assessmentId, assessmentId),
        eq(AssessmentAttemptsTable.userId, userId)
      )
    )
    .orderBy(desc(AssessmentAttemptsTable.startedAt));

  return successResponse(attempts);
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
    const questions = searchParams.get('questions');
    const attemptId = searchParams.get('attemptId');
    const attempts = searchParams.get('attempts');
    const userId = searchParams.get('userId');

    // GET /api/assessments?attemptId=123
    if (attemptId) {
      const validation = validateId(attemptId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getAttempt(attemptId);
    }

    // GET /api/assessments?id=123&attempts=true&userId=456
    if (id && parseBoolean(attempts) && userId) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      const userValidation = validateId(userId);
      if (!userValidation.valid) return errorResponse(userValidation.error!);
      return await getUserAttempts(id, userId);
    }

    // GET /api/assessments?id=123&questions=true
    if (id && parseBoolean(questions)) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getAssessmentQuestions(id);
    }

    // GET /api/assessments?id=123
    if (id) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getAssessmentById(id);
    }

    // GET /api/assessments?moduleId=123
    if (moduleId) {
      const validation = validateId(moduleId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getModuleAssessments(moduleId);
    }

    // GET /api/assessments?courseId=123
    if (courseId) {
      const validation = validateId(courseId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getCourseAssessments(courseId);
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
    const addQuestionParam = searchParams.get('addQuestion');
    const start = searchParams.get('start');

    // POST /api/assessments?id=123&start=true
    if (id && parseBoolean(start)) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await startAttempt(id, request);
    }

    // POST /api/assessments?id=123&addQuestion=true
    if (id && parseBoolean(addQuestionParam)) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await addQuestion(id, request);
    }

    // POST /api/assessments (create new)
    return await createAssessment(request);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const questionId = searchParams.get('questionId');
    const attemptId = searchParams.get('attemptId');
    const reorder = searchParams.get('reorder');
    const submit = searchParams.get('submit');

    // PUT /api/assessments?attemptId=123&submit=true
    if (attemptId && parseBoolean(submit)) {
      const validation = validateId(attemptId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await submitAttempt(attemptId, request);
    }

    // PUT /api/assessments?attemptId=123
    if (attemptId) {
      const validation = validateId(attemptId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await updateAttempt(attemptId, request);
    }

    // PUT /api/assessments?id=123&reorder=true
    if (id && parseBoolean(reorder)) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await reorderQuestions(id, request);
    }

    // PUT /api/assessments?questionId=123
    if (questionId) {
      const validation = validateId(questionId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await updateQuestion(questionId, request);
    }

    // PUT /api/assessments?id=123
    if (id) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await updateAssessment(id, request);
    }

    return errorResponse('id, questionId, or attemptId is required');
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const questionId = searchParams.get('questionId');

    // DELETE /api/assessments?questionId=123
    if (questionId) {
      const validation = validateId(questionId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await deleteQuestion(questionId);
    }

    // DELETE /api/assessments?id=123
    if (id) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await deleteAssessment(id);
    }

    return errorResponse('id or questionId is required');
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}