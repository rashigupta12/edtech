/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/progress/route.ts
import { db } from '@/db';
import { CourseLessonsTable, EnrollmentsTable, LessonProgressTable } from '@/db/schema';
import { and, count, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

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
// CONTROLLERS
// ===========================

// GET LEARNING OVERVIEW
const getLearningOverview = async (userId: string) => {
  const [totalEnrollments] = await db
    .select({ count: count() })
    .from(EnrollmentsTable)
    .where(eq(EnrollmentsTable.userId, userId));

  const [completedLessons] = await db
    .select({ count: count() })
    .from(LessonProgressTable)
    .where(and(eq(LessonProgressTable.userId, userId), eq(LessonProgressTable.isCompleted, true)));

  const enrollments = await db
    .select({
      enrollmentId: EnrollmentsTable.id,
      courseId: EnrollmentsTable.courseId,
      progress: EnrollmentsTable.progress,
      status: EnrollmentsTable.status,
    })
    .from(EnrollmentsTable)
    .where(eq(EnrollmentsTable.userId, userId));

  return successResponse({
    totalCourses: totalEnrollments?.count || 0,
    completedLessons: completedLessons?.count || 0,
    enrollments,
  });
};

// GET COURSE PROGRESS
const getCourseProgress = async (courseId: string, userId: string) => {
  const [enrollment] = await db
    .select()
    .from(EnrollmentsTable)
    .where(and(eq(EnrollmentsTable.courseId, courseId), eq(EnrollmentsTable.userId, userId)))
    .limit(1);

  if (!enrollment) {
    return errorResponse('Not enrolled in this course', 'NOT_ENROLLED', 404);
  }

  // Get all lessons in course
  const [totalLessons] = await db
    .select({ count: count() })
    .from(CourseLessonsTable)
    .where(eq(CourseLessonsTable.courseId, courseId));

  // Get completed lessons
  const [completedLessons] = await db
    .select({ count: count() })
    .from(LessonProgressTable)
    .where(
      and(
        eq(LessonProgressTable.userId, userId),
        eq(LessonProgressTable.isCompleted, true)
      )
    );

  // Get lesson progress details
  const lessonsProgress = await db
    .select({
      lessonId: LessonProgressTable.lessonId,
      lessonTitle: CourseLessonsTable.title,
      isCompleted: LessonProgressTable.isCompleted,
      completedAt: LessonProgressTable.completedAt,
      lastWatchedPosition: LessonProgressTable.lastWatchedPosition,
      watchDuration: LessonProgressTable.watchDuration,
    })
    .from(LessonProgressTable)
    .innerJoin(CourseLessonsTable, eq(LessonProgressTable.lessonId, CourseLessonsTable.id))
    .where(and(eq(LessonProgressTable.userId, userId), eq(CourseLessonsTable.courseId, courseId)));

  const progressPercentage = totalLessons?.count ? Math.round(((completedLessons?.count || 0) / totalLessons.count) * 100) : 0;

  return successResponse({
    enrollmentId: enrollment.id,
    courseId,
    totalLessons: totalLessons?.count || 0,
    completedLessons: completedLessons?.count || 0,
    progressPercentage,
    status: enrollment.status,
    lessonsProgress,
  });
};

// UPDATE COURSE PROGRESS
const updateCourseProgress = async (courseId: string, userId: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [enrollment] = await db
      .select()
      .from(EnrollmentsTable)
      .where(and(eq(EnrollmentsTable.courseId, courseId), eq(EnrollmentsTable.userId, userId)))
      .limit(1);

    if (!enrollment) {
      return errorResponse('Not enrolled in this course', 'NOT_ENROLLED', 404);
    }

    const [updated] = await db
      .update(EnrollmentsTable)
      .set({
        progress: body.progress || enrollment.progress,
        lastAccessedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(EnrollmentsTable.id, enrollment.id))
      .returning();

    return successResponse(updated, 'Progress updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update progress', 'UPDATE_ERROR', 500);
  }
};

// GET LESSON PROGRESS
const getLessonProgress = async (lessonId: string, userId: string) => {
  const [progress] = await db
    .select()
    .from(LessonProgressTable)
    .where(and(eq(LessonProgressTable.lessonId, lessonId), eq(LessonProgressTable.userId, userId)))
    .limit(1);

  if (!progress) {
    return successResponse({
      lessonId,
      userId,
      isCompleted: false,
      lastWatchedPosition: 0,
      watchDuration: 0,
    });
  }

  return successResponse(progress);
};

// UPDATE LESSON PROGRESS
const updateLessonProgress = async (lessonId: string, userId: string, request: NextRequest) => {
  try {
    const body = await request.json();

    // Get enrollment ID
    const [lesson] = await db.select().from(CourseLessonsTable).where(eq(CourseLessonsTable.id, lessonId)).limit(1);
    if (!lesson) return errorResponse('Lesson not found', 'NOT_FOUND', 404);

    const [enrollment] = await db
      .select()
      .from(EnrollmentsTable)
      .where(and(eq(EnrollmentsTable.courseId, lesson.courseId), eq(EnrollmentsTable.userId, userId)))
      .limit(1);

    if (!enrollment) {
      return errorResponse('Not enrolled in this course', 'NOT_ENROLLED', 404);
    }

    // Check if progress exists
    const [existing] = await db
      .select()
      .from(LessonProgressTable)
      .where(and(eq(LessonProgressTable.lessonId, lessonId), eq(LessonProgressTable.userId, userId)))
      .limit(1);

    let progress;

    if (existing) {
      // Update existing
      [progress] = await db
        .update(LessonProgressTable)
        .set({
          lastWatchedPosition: body.lastWatchedPosition ?? existing.lastWatchedPosition,
          watchDuration: body.watchDuration ?? existing.watchDuration,
          isCompleted: body.isCompleted ?? existing.isCompleted,
          completedAt: body.isCompleted ? new Date() : existing.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(LessonProgressTable.id, existing.id))
        .returning();
    } else {
      // Create new
      [progress] = await db
        .insert(LessonProgressTable)
        .values({
          userId,
          lessonId,
          enrollmentId: enrollment.id,
          lastWatchedPosition: body.lastWatchedPosition || 0,
          watchDuration: body.watchDuration || 0,
          isCompleted: body.isCompleted || false,
          completedAt: body.isCompleted ? new Date() : null,
        })
        .returning();
    }

    return successResponse(progress, 'Lesson progress updated');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update lesson progress', 'UPDATE_ERROR', 500);
  }
};

// MARK LESSON COMPLETE
const markLessonComplete = async (lessonId: string, userId: string) => {
  try {
    const [lesson] = await db.select().from(CourseLessonsTable).where(eq(CourseLessonsTable.id, lessonId)).limit(1);
    if (!lesson) return errorResponse('Lesson not found', 'NOT_FOUND', 404);

    const [enrollment] = await db
      .select()
      .from(EnrollmentsTable)
      .where(and(eq(EnrollmentsTable.courseId, lesson.courseId), eq(EnrollmentsTable.userId, userId)))
      .limit(1);

    if (!enrollment) {
      return errorResponse('Not enrolled in this course', 'NOT_ENROLLED', 404);
    }

    const [existing] = await db
      .select()
      .from(LessonProgressTable)
      .where(and(eq(LessonProgressTable.lessonId, lessonId), eq(LessonProgressTable.userId, userId)))
      .limit(1);

    let progress;

    if (existing) {
      [progress] = await db
        .update(LessonProgressTable)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(LessonProgressTable.id, existing.id))
        .returning();
    } else {
      [progress] = await db
        .insert(LessonProgressTable)
        .values({
          userId,
          lessonId,
          enrollmentId: enrollment.id,
          isCompleted: true,
          completedAt: new Date(),
        })
        .returning();
    }

    return successResponse(progress, 'Lesson marked as complete');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to mark lesson complete', 'COMPLETE_ERROR', 500);
  }
};

// GET BOOTCAMP PROGRESS
const getBootcampProgress = async (bootcampId: string, userId: string) => {
  // Implementation similar to course progress but for bootcamps
  return successResponse({
    bootcampId,
    userId,
    message: 'Bootcamp progress tracking',
  });
};

// ===========================
// ROUTE HANDLERS
// ===========================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');
    const bootcampId = searchParams.get('bootcampId');
    const overview = searchParams.get('overview');

    if (!userId) return errorResponse('userId is required');

    const userValidation = validateId(userId);
    if (!userValidation.valid) return errorResponse(userValidation.error!);

    // GET /api/progress?userId=123&overview=true
    if (parseBoolean(overview)) {
      return await getLearningOverview(userId);
    }

    // GET /api/progress?userId=123&bootcampId=456
    if (bootcampId) {
      const validation = validateId(bootcampId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getBootcampProgress(bootcampId, userId);
    }

    // GET /api/progress?userId=123&lessonId=789
    if (lessonId) {
      const validation = validateId(lessonId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getLessonProgress(lessonId, userId);
    }

    // GET /api/progress?userId=123&courseId=456
    if (courseId) {
      const validation = validateId(courseId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getCourseProgress(courseId, userId);
    }

    return errorResponse('courseId, lessonId, or overview parameter is required');
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const lessonId = searchParams.get('lessonId');
    const complete = searchParams.get('complete');

    if (!userId) return errorResponse('userId is required');
    if (!lessonId) return errorResponse('lessonId is required');

    const userValidation = validateId(userId);
    if (!userValidation.valid) return errorResponse(userValidation.error!);

    const lessonValidation = validateId(lessonId);
    if (!lessonValidation.valid) return errorResponse(lessonValidation.error!);

    // POST /api/progress?userId=123&lessonId=456&complete=true
    if (parseBoolean(complete)) {
      return await markLessonComplete(lessonId, userId);
    }

    // POST /api/progress?userId=123&lessonId=456
    return await updateLessonProgress(lessonId, userId, request);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    if (!userId) return errorResponse('userId is required');

    const userValidation = validateId(userId);
    if (!userValidation.valid) return errorResponse(userValidation.error!);

    // PUT /api/progress?userId=123&lessonId=456
    if (lessonId) {
      const validation = validateId(lessonId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await updateLessonProgress(lessonId, userId, request);
    }

    // PUT /api/progress?userId=123&courseId=456
    if (courseId) {
      const validation = validateId(courseId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await updateCourseProgress(courseId, userId, request);
    }

    return errorResponse('courseId or lessonId is required');
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}