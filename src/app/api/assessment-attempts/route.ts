/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/assessment-attempts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  AssessmentAttemptsTable,
  AssessmentsTable,
  EnrollmentsTable,
  LessonProgressTable,
  AssessmentQuestionsTable,
} from '@/db/schema';
import { eq, and, desc, count, sql, asc, isNotNull } from 'drizzle-orm';

// ===========================
// TYPES & HELPERS
// ===========================

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string };
};

type AssessmentAnswers = Record<string, any>;

interface AssessmentResult {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  correctAnswers: number;
  totalQuestions: number;
  detailedResults: Array<{
    questionId: string;
    questionText: string;
    questionType: string;
    correctAnswer: any;
    userAnswer: any;
    isCorrect: boolean;
    points: number;
    explanation?: string;
  }>;
}

const parseBoolean = (value: string | null | undefined): boolean =>
  value === 'true' || value === '1';

const validateId = (id: string | undefined): { valid: boolean; error?: string } => {
  if (!id) return { valid: false, error: 'ID is required' };
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return { valid: false, error: 'Invalid ID format' };
  return { valid: true };
};

const successResponse = <T>(
  data: T,
  message?: string,
  status = 200,
): NextResponse<ApiResponse<T>> => {
  return NextResponse.json({ success: true, data, message }, { status });
};

const errorResponse = (
  message: string,
  code = 'ERROR',
  status = 400,
): NextResponse<ApiResponse> => {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
};

// ===========================
// ASSESSMENT HELPER FUNCTIONS
// ===========================

const calculateAssessmentScore = async (
  assessmentId: string,
  answers: AssessmentAnswers,
): Promise<AssessmentResult> => {
  try {
    const questions = await db
      .select({
        id: AssessmentQuestionsTable.id,
        questionText: AssessmentQuestionsTable.questionText,
        questionType: AssessmentQuestionsTable.questionType,
        difficulty: AssessmentQuestionsTable.difficulty,
        options: AssessmentQuestionsTable.options,
        correctAnswer: AssessmentQuestionsTable.correctAnswer,
        explanation: AssessmentQuestionsTable.explanation,
        points: AssessmentQuestionsTable.points,
        negativePoints: AssessmentQuestionsTable.negativePoints,
        sortOrder: AssessmentQuestionsTable.sortOrder,
      })
      .from(AssessmentQuestionsTable)
      .where(
        and(
          eq(AssessmentQuestionsTable.assessmentId, assessmentId),
          eq(AssessmentQuestionsTable.isActive, true),
        ),
      )
      .orderBy(asc(AssessmentQuestionsTable.sortOrder));

    let score = 0;
    let correctAnswers = 0;
    let totalPoints = 0;
    const detailedResults: any[] = [];

    questions.forEach((question) => {
      totalPoints += question.points || 1;
      const userAnswer = answers[question.id];

      let isCorrect = false;
      let pointsEarned = 0;

      if (userAnswer !== undefined && userAnswer !== null) {
        if (
          question.questionType === 'MULTIPLE_CHOICE' ||
          question.questionType === 'TRUE_FALSE'
        ) {
          if (userAnswer === question.correctAnswer) {
            isCorrect = true;
            pointsEarned = question.points || 1;
            score += pointsEarned;
            correctAnswers++;
          } else if (question.negativePoints) {
            pointsEarned = -question.negativePoints;
            score -= question.negativePoints;
          }
        } else if (question.questionType === 'SHORT_ANSWER') {
          const userAnswerClean = userAnswer.toString().trim().toLowerCase();
          const correctAnswerClean = question.correctAnswer.toString().trim().toLowerCase();
          if (userAnswerClean === correctAnswerClean) {
            isCorrect = true;
            pointsEarned = question.points || 1;
            score += pointsEarned;
            correctAnswers++;
          }
        }
      }

      detailedResults.push({
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        difficulty: question.difficulty,
        correctAnswer: question.correctAnswer,
        userAnswer,
        isCorrect,
        points: pointsEarned,
        maxPoints: question.points || 1,
        negativePoints: question.negativePoints,
        explanation: question.explanation,
      });
    });

    const [assessment] = await db
      .select({ passingScore: AssessmentsTable.passingScore })
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, assessmentId))
      .limit(1);

    const passingScore = assessment?.passingScore || 60;
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percentage >= passingScore;

    return {
      score,
      totalPoints,
      percentage,
      passed,
      passingScore,
      correctAnswers,
      totalQuestions: questions.length,
      detailedResults,
    };
  } catch (error) {
    console.error('calculateAssessmentScore error:', error);
    throw new Error('Failed to calculate assessment score');
  }
};

const checkAssessmentAvailability = async (assessmentId: string) => {
  const [assessment] = await db
    .select({
      availableFrom: AssessmentsTable.availableFrom,
      availableUntil: AssessmentsTable.availableUntil,
    })
    .from(AssessmentsTable)
    .where(eq(AssessmentsTable.id, assessmentId))
    .limit(1);

  if (!assessment) return { available: false, reason: 'Assessment not found' };

  const now = new Date();
  if (assessment.availableFrom && now < assessment.availableFrom) {
    return { available: false, reason: 'Assessment not available yet' };
  }
  if (assessment.availableUntil && now > assessment.availableUntil) {
    return { available: false, reason: 'Assessment deadline has passed' };
  }

  return { available: true };
};

const checkAttemptLimits = async (
  assessmentId: string,
  userId: string,
  enrollmentId: string,
) => {
  const [assessment] = await db
    .select({
      maxAttempts: AssessmentsTable.maxAttempts,
      allowRetake: AssessmentsTable.allowRetake,
    })
    .from(AssessmentsTable)
    .where(eq(AssessmentsTable.id, assessmentId))
    .limit(1);

  const [attemptCount] = await db
    .select({ count: count() })
    .from(AssessmentAttemptsTable)
    .where(
      and(
        eq(AssessmentAttemptsTable.assessmentId, assessmentId),
        eq(AssessmentAttemptsTable.userId, userId),
        eq(AssessmentAttemptsTable.enrollmentId, enrollmentId),
      ),
    );

  const currentAttempt = attemptCount.count + 1;

  if (assessment.maxAttempts && currentAttempt > assessment.maxAttempts) {
    return {
      allowed: false,
      reason: `Maximum attempts (${assessment.maxAttempts}) exceeded`,
      currentAttempt: currentAttempt - 1,
      maxAttempts: assessment.maxAttempts,
    };
  }

  if (!assessment.allowRetake) {
    const [passedAttempt] = await db
      .select()
      .from(AssessmentAttemptsTable)
      .where(
        and(
          eq(AssessmentAttemptsTable.assessmentId, assessmentId),
          eq(AssessmentAttemptsTable.userId, userId),
          eq(AssessmentAttemptsTable.enrollmentId, enrollmentId),
          eq(AssessmentAttemptsTable.passed, true),
        ),
      )
      .limit(1);

    if (passedAttempt) {
      return {
        allowed: false,
        reason: 'Assessment already passed and retake not allowed',
        currentAttempt: currentAttempt - 1,
      };
    }
  }

  return { allowed: true, currentAttempt };
};

const updateLessonProgressAfterAssessment = async (
  assessmentId: string,
  userId: string,
  enrollmentId: string,
  passed: boolean,
) => {
  try {
    const [assessment] = await db
      .select({
        lessonId: AssessmentsTable.lessonId,
        assessmentLevel: AssessmentsTable.assessmentLevel,
      })
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, assessmentId))
      .limit(1);

    if (assessment.lessonId && assessment.assessmentLevel === 'LESSON_QUIZ') {
      const [existingProgress] = await db
        .select()
        .from(LessonProgressTable)
        .where(
          and(
            eq(LessonProgressTable.lessonId, assessment.lessonId),
            eq(LessonProgressTable.userId, userId),
            eq(LessonProgressTable.enrollmentId, enrollmentId),
          ),
        )
        .limit(1);

      if (existingProgress) {
        await db
          .update(LessonProgressTable)
          .set({
            quizAttempted: true,
            quizPassed: passed,
            updatedAt: new Date(),
          })
          .where(eq(LessonProgressTable.id, existingProgress.id));
      } else {
        await db.insert(LessonProgressTable).values({
          userId,
          lessonId: assessment.lessonId,
          enrollmentId,
          quizAttempted: true,
          quizPassed: passed,
          isCompleted: false,
        });
      }
    }
  } catch (error) {
    console.error('updateLessonProgressAfterAssessment error:', error);
  }
};

const updateEnrollmentStatistics = async (
  enrollmentId: string,
  assessmentId: string,
  score: number,
  percentage: number,
) => {
  try {
    const [assessment] = await db
      .select({
        assessmentLevel: AssessmentsTable.assessmentLevel,
        passingScore: AssessmentsTable.passingScore,
      })
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, assessmentId))
      .limit(1);

    if (!assessment) return;

    if (assessment.assessmentLevel === 'COURSE_FINAL') {
      await db
        .update(EnrollmentsTable)
        .set({
          finalAssessmentScore: percentage,
          overallScore: percentage,
          updatedAt: new Date(),
        })
        .where(eq(EnrollmentsTable.id, enrollmentId));
    } else if (assessment.assessmentLevel === 'MODULE_ASSESSMENT') {
      const [stats] = await db
        .select({
          avg: sql<number>`AVG(${AssessmentAttemptsTable.percentage})`,
        })
        .from(AssessmentAttemptsTable)
        .innerJoin(
          AssessmentsTable,
          eq(AssessmentAttemptsTable.assessmentId, AssessmentsTable.id),
        )
        .where(
          and(
            eq(AssessmentAttemptsTable.enrollmentId, enrollmentId),
            eq(AssessmentAttemptsTable.status, 'COMPLETED'),
            eq(AssessmentsTable.assessmentLevel, 'MODULE_ASSESSMENT'),
          ),
        );

      const averageQuizScore = stats.avg ? Math.round(stats.avg) : 0;

      await db
        .update(EnrollmentsTable)
        .set({
          averageQuizScore,
          overallScore: averageQuizScore,
          updatedAt: new Date(),
        })
        .where(eq(EnrollmentsTable.id, enrollmentId));
    } else if (assessment.assessmentLevel === 'LESSON_QUIZ') {
      const [stats] = await db
        .select({
          avg: sql<number>`AVG(${AssessmentAttemptsTable.percentage})`,
        })
        .from(AssessmentAttemptsTable)
        .innerJoin(
          AssessmentsTable,
          eq(AssessmentAttemptsTable.assessmentId, AssessmentsTable.id),
        )
        .where(
          and(
            eq(AssessmentAttemptsTable.enrollmentId, enrollmentId),
            eq(AssessmentAttemptsTable.status, 'COMPLETED'),
            eq(AssessmentsTable.assessmentLevel, 'LESSON_QUIZ'),
          ),
        );

      const averageQuizScore = stats.avg ? Math.round(stats.avg) : 0;

      await db
        .update(EnrollmentsTable)
        .set({
          averageQuizScore,
          updatedAt: new Date(),
        })
        .where(eq(EnrollmentsTable.id, enrollmentId));
    }
  } catch (error) {
    console.error('updateEnrollmentStatistics error:', error);
  }
};

// ===========================
// CONTROLLERS
// ===========================

const startAssessmentAttempt = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { assessmentId, userId, enrollmentId } = body;

    if (!assessmentId || !userId || !enrollmentId) {
      return errorResponse('Missing required fields');
    }

    const checks = [assessmentId, userId, enrollmentId].map(validateId);
    if (checks.some((c) => !c.valid)) {
      return errorResponse(checks.find((c) => !c.valid)?.error || 'Invalid ID');
    }

    const [assessment] = await db
      .select({ courseId: AssessmentsTable.courseId })
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, assessmentId))
      .limit(1);

    if (!assessment) return errorResponse('Assessment not found', 'NOT_FOUND', 404);

    const [enrollment] = await db
      .select()
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.id, enrollmentId),
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.courseId, assessment.courseId),
        ),
      )
      .limit(1);

    if (!enrollment) return errorResponse('Not enrolled', 'NOT_ENROLLED', 403);

    const availability = await checkAssessmentAvailability(assessmentId);
    if (!availability.available) {
      return errorResponse(availability.reason!, 'NOT_AVAILABLE', 403);
    }

    const attemptCheck = await checkAttemptLimits(assessmentId, userId, enrollmentId);
    if (!attemptCheck.allowed) {
      return errorResponse(attemptCheck.reason!, 'ATTEMPT_LIMIT', 403);
    }

    const [details] = await db
      .select({
        randomizeQuestions: AssessmentsTable.randomizeQuestions,
        timeLimit: AssessmentsTable.timeLimit,
      })
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, assessmentId))
      .limit(1);

    // Build base query with orderBy
    const questions = await db
      .select({
        id: AssessmentQuestionsTable.id,
        questionText: AssessmentQuestionsTable.questionText,
        questionType: AssessmentQuestionsTable.questionType,
        difficulty: AssessmentQuestionsTable.difficulty,
        options: AssessmentQuestionsTable.options,
        points: AssessmentQuestionsTable.points,
        negativePoints: AssessmentQuestionsTable.negativePoints,
        sortOrder: AssessmentQuestionsTable.sortOrder,
      })
      .from(AssessmentQuestionsTable)
      .where(
        and(
          eq(AssessmentQuestionsTable.assessmentId, assessmentId),
          eq(AssessmentQuestionsTable.isActive, true),
        ),
      )
      .orderBy(
        details.randomizeQuestions
          ? sql`RANDOM()`
          : asc(AssessmentQuestionsTable.sortOrder),
      );

    const [attempt] = await db
      .insert(AssessmentAttemptsTable)
      .values({
        assessmentId,
        userId,
        enrollmentId,
        attemptNumber: attemptCheck.currentAttempt,
        status: 'IN_PROGRESS',
        score: 0,
        totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
        percentage: 0,
        passed: false,
        startedAt: new Date(),
        timeSpent: 0,
        answers: {},
        questionDetails: questions,
      })
      .returning();

    return successResponse(
      {
        attempt,
        questions: questions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          difficulty: q.difficulty,
          options: q.options,
          points: q.points,
          negativePoints: q.negativePoints,
        })),
        timeLimit: details.timeLimit,
        currentAttempt: attemptCheck.currentAttempt,
        maxAttempts: attemptCheck.maxAttempts,
      },
      'Assessment started',
      201,
    );
  } catch (error: any) {
    console.error('startAssessmentAttempt error:', error);
    return errorResponse(error.message || 'Failed to start', 'START_ERROR', 500);
  }
};

const submitAssessmentAttempt = async (attemptId: string, request: NextRequest) => {
  try {
    const body = await request.json();
    const { answers } = body as { answers: AssessmentAnswers };

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return errorResponse('Invalid answers');
    }

    const [attempt] = await db
      .select()
      .from(AssessmentAttemptsTable)
      .where(eq(AssessmentAttemptsTable.id, attemptId))
      .limit(1);

    if (!attempt) return errorResponse('Attempt not found', 'NOT_FOUND', 404);
    if (attempt.status !== 'IN_PROGRESS') {
      return errorResponse('Already submitted', 'ALREADY_SUBMITTED', 400);
    }

    const timeSpent = Math.floor(
      (new Date().getTime() - new Date(attempt.startedAt).getTime()) / 1000,
    );

    const result = await calculateAssessmentScore(attempt.assessmentId, answers);

    const [updatedAttempt] = await db
      .update(AssessmentAttemptsTable)
      .set({
        status: 'COMPLETED',
        completedAt: new Date(),
        timeSpent,
        answers,
        score: result.score,
        percentage: result.percentage,
        passed: result.passed,
        updatedAt: new Date(),
      })
      .where(eq(AssessmentAttemptsTable.id, attemptId))
      .returning();

    await updateLessonProgressAfterAssessment(
      attempt.assessmentId,
      attempt.userId,
      attempt.enrollmentId,
      result.passed,
    );

    await updateEnrollmentStatistics(
      attempt.enrollmentId,
      attempt.assessmentId,
      result.score,
      result.percentage,
    );

    return successResponse({ attempt: updatedAttempt, results: result });
  } catch (error: any) {
    console.error('submitAssessmentAttempt error:', error);
    return errorResponse(error.message || 'Submit failed', 'SUBMIT_ERROR', 500);
  }
};

const getAssessmentAttempt = async (attemptId: string, userId?: string) => {
  const [attempt] = await db
    .select()
    .from(AssessmentAttemptsTable)
    .where(eq(AssessmentAttemptsTable.id, attemptId))
    .limit(1);

  if (!attempt) return errorResponse('Not found', 'NOT_FOUND', 404);
  if (userId && attempt.userId !== userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 403);
  }

  return successResponse(attempt);
};

const listUserAssessmentAttempts = async (
  userId: string,
  assessmentId?: string,
  enrollmentId?: string,
) => {
  const conditions = [eq(AssessmentAttemptsTable.userId, userId)];
  if (assessmentId) conditions.push(eq(AssessmentAttemptsTable.assessmentId, assessmentId));
  if (enrollmentId) conditions.push(eq(AssessmentAttemptsTable.enrollmentId, enrollmentId));

  const attempts = await db
    .select({
      attempt: AssessmentAttemptsTable,
      assessmentTitle: AssessmentsTable.title,
      assessmentLevel: AssessmentsTable.assessmentLevel,
    })
    .from(AssessmentAttemptsTable)
    .innerJoin(AssessmentsTable, eq(AssessmentAttemptsTable.assessmentId, AssessmentsTable.id))
    .where(and(...conditions))
    .orderBy(desc(AssessmentAttemptsTable.startedAt));

  return successResponse(attempts);
};

const getAssessmentResults = async (attemptId: string, userId: string) => {
  const [attempt] = await db
    .select()
    .from(AssessmentAttemptsTable)
    .where(eq(AssessmentAttemptsTable.id, attemptId))
    .limit(1);

  if (!attempt) return errorResponse('Not found', 'NOT_FOUND', 404);
  if (attempt.userId !== userId) return errorResponse('Unauthorized', 'UNAUTHORIZED', 403);
  if (attempt.status !== 'COMPLETED') return errorResponse('Not completed', 'NOT_COMPLETED', 400);

  const [assessment] = await db
    .select({
      showCorrectAnswers: AssessmentsTable.showCorrectAnswers,
      passingScore: AssessmentsTable.passingScore,
      title: AssessmentsTable.title,
    })
    .from(AssessmentsTable)
    .where(eq(AssessmentsTable.id, attempt.assessmentId))
    .limit(1);

  let correctAnswers: Record<string, any> | null = null;
  let detailedResults: any[] | null = null;

  if (assessment.showCorrectAnswers) {
    const questions = await db
      .select({
        id: AssessmentQuestionsTable.id,
        questionText: AssessmentQuestionsTable.questionText,
        questionType: AssessmentQuestionsTable.questionType,
        correctAnswer: AssessmentQuestionsTable.correctAnswer,
        explanation: AssessmentQuestionsTable.explanation,
        points: AssessmentQuestionsTable.points,
      })
      .from(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.assessmentId, attempt.assessmentId))
      .orderBy(asc(AssessmentQuestionsTable.sortOrder));

    detailedResults = questions.map((q) => {
      const userAnswer = (attempt.answers as AssessmentAnswers)?.[q.id];
      let isCorrect = false;
      if (userAnswer !== undefined && userAnswer !== null) {
        if (q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE') {
          isCorrect = userAnswer === q.correctAnswer;
        } else if (q.questionType === 'SHORT_ANSWER') {
          isCorrect =
            userAnswer.toString().trim().toLowerCase() ===
            q.correctAnswer.toString().trim().toLowerCase();
        }
      }
      return { ...q, userAnswer, isCorrect };
    });

    correctAnswers = questions.reduce((acc, q) => {
      acc[q.id] = q.correctAnswer;
      return acc;
    }, {} as Record<string, any>);
  }

  return successResponse({
    attempt,
    assessment,
    correctAnswers,
    detailedResults,
  });
};

const abandonAssessmentAttempt = async (attemptId: string) => {
  const [attempt] = await db
    .select()
    .from(AssessmentAttemptsTable)
    .where(eq(AssessmentAttemptsTable.id, attemptId))
    .limit(1);

  if (!attempt) return errorResponse('Not found', 'NOT_FOUND', 404);
  if (attempt.status !== 'IN_PROGRESS') {
    return errorResponse('Cannot abandon', 'INVALID_STATUS', 400);
  }

  const [updated] = await db
    .update(AssessmentAttemptsTable)
    .set({ status: 'ABANDONED', completedAt: new Date(), updatedAt: new Date() })
    .where(eq(AssessmentAttemptsTable.id, attemptId))
    .returning();

  return successResponse(updated, 'Assessment abandoned');
};

// ===========================
// ROUTE HANDLERS
// ===========================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const assessmentId = searchParams.get('assessmentId');
    const enrollmentId = searchParams.get('enrollmentId');
    const results = searchParams.get('results');

    if (parseBoolean(results) && id && userId) {
      if (!validateId(id).valid || !validateId(userId).valid) return errorResponse('Invalid ID');
      return await getAssessmentResults(id, userId);
    }

    if (id) {
      if (!validateId(id).valid) return errorResponse('Invalid ID');
      return await getAssessmentAttempt(id, userId || undefined);
    }

    if (userId) {
      if (!validateId(userId).valid) return errorResponse('Invalid userId');
      return await listUserAssessmentAttempts(userId, assessmentId || undefined, enrollmentId || undefined);
    }

    return errorResponse('id or userId required');
  } catch (error: any) {
    console.error('GET error:', error);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submit = searchParams.get('submit');
    const id = searchParams.get('id');

    if (parseBoolean(submit) && id) {
      if (!validateId(id).valid) return errorResponse('Invalid ID');
      return await submitAssessmentAttempt(id, request);
    }

    return await startAssessmentAttempt(request);
  } catch (error: any) {
    console.error('POST error:', error);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const abandon = searchParams.get('abandon');

    if (!id || !validateId(id).valid) return errorResponse('Valid ID required');

    if (parseBoolean(abandon)) {
      return await abandonAssessmentAttempt(id);
    }

    return await submitAssessmentAttempt(id, request);
  } catch (error: any) {
    console.error('PUT error:', error);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || !validateId(id).valid) return errorResponse('Valid ID required');

    const [attempt] = await db
      .select()
      .from(AssessmentAttemptsTable)
      .where(eq(AssessmentAttemptsTable.id, id))
      .limit(1);

    if (!attempt) return errorResponse('Not found', 'NOT_FOUND', 404);

    await db.delete(AssessmentAttemptsTable).where(eq(AssessmentAttemptsTable.id, id));
    return successResponse({ id }, 'Deleted');
  } catch (error: any) {
    console.error('DELETE error:', error);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
}