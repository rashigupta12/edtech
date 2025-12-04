/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/enrollments/route.ts
import { db } from '@/db';
import {
  AssessmentAttemptsTable,
  AssessmentsTable,
  BootcampEnrollmentsTable,
  BootcampsTable,
  CourseLessonsTable,
  CourseModulesTable,
  CoursesTable,
  EnrollmentsTable,
  LessonCompletionRulesTable,
  LessonProgressTable
} from '@/db/schema';
import { and, count, desc, eq, sql } from 'drizzle-orm';
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
// ASSESSMENT CHECKING FUNCTIONS
// ===========================

const checkModuleAssessmentsPassed = async (userId: string, courseId: string, enrollmentId: string) => {
  try {
    const modulesWithAssessments = await db
      .select({
        moduleId: CourseModulesTable.id,
        assessmentId: AssessmentsTable.id,
        moduleTitle: CourseModulesTable.title,
        assessmentRequired: CourseModulesTable.assessmentRequired,
        minimumPassingScore: CourseModulesTable.minimumPassingScore
      })
      .from(CourseModulesTable)
      .leftJoin(
        AssessmentsTable,
        and(
          eq(AssessmentsTable.moduleId, CourseModulesTable.id),
          eq(AssessmentsTable.assessmentLevel, 'MODULE_ASSESSMENT')
        )
      )
      .where(
        and(
          eq(CourseModulesTable.courseId, courseId),
          eq(CourseModulesTable.hasAssessment, true)
        )
      );

    const results = await Promise.all(
      modulesWithAssessments.map(async (mod) => {
        if (!mod.assessmentId) {
          return { moduleId: mod.moduleId, passed: true, noAssessment: true };
        }

        const [passedAttempt] = await db
          .select()
          .from(AssessmentAttemptsTable)
          .where(
            and(
              eq(AssessmentAttemptsTable.assessmentId, mod.assessmentId),
              eq(AssessmentAttemptsTable.userId, userId),
              eq(AssessmentAttemptsTable.enrollmentId, enrollmentId),
              eq(AssessmentAttemptsTable.status, 'COMPLETED'),
              eq(AssessmentAttemptsTable.passed, true)
            )
          )
          .orderBy(desc(AssessmentAttemptsTable.attemptNumber))
          .limit(1);

        return {
          moduleId: mod.moduleId,
          moduleTitle: mod.moduleTitle,
          passed: !!passedAttempt,
          assessmentRequired: mod.assessmentRequired,
          hasPassedAttempt: !!passedAttempt
        };
      })
    );

    return results;
  } catch (_error) {
    console.error('Error checking module assessments:', _error);
    return [];
  }
};

const checkFinalAssessmentPassed = async (userId: string, courseId: string, enrollmentId: string) => {
  try {
    const [finalAssessment] = await db
      .select({
        assessmentId: AssessmentsTable.id,
        passingScore: AssessmentsTable.passingScore,
        isRequired: AssessmentsTable.isRequired
      })
      .from(AssessmentsTable)
      .where(
        and(
          eq(AssessmentsTable.courseId, courseId),
          eq(AssessmentsTable.assessmentLevel, 'COURSE_FINAL')
        )
      )
      .limit(1);

    if (!finalAssessment || !finalAssessment.isRequired) {
      return { passed: true, notRequired: true };
    }

    const [passedAttempt] = await db
      .select()
      .from(AssessmentAttemptsTable)
      .where(
        and(
          eq(AssessmentAttemptsTable.assessmentId, finalAssessment.assessmentId),
          eq(AssessmentAttemptsTable.userId, userId),
          eq(AssessmentAttemptsTable.enrollmentId, enrollmentId),
          eq(AssessmentAttemptsTable.status, 'COMPLETED'),
          eq(AssessmentAttemptsTable.passed, true)
        )
      )
      .orderBy(desc(AssessmentAttemptsTable.attemptNumber))
      .limit(1);

    return {
      passed: !!passedAttempt,
      assessmentId: finalAssessment.assessmentId,
      passingScore: finalAssessment.passingScore
    };
  } catch (_error) {
    console.error('Error checking final assessment:', _error);
    return { passed: false };
  }
};

const checkLessonQuizCompletion = async (lessonId: string, userId: string, enrollmentId: string) => {
  try {
    const [lesson] = await db
      .select({
        hasQuiz: CourseLessonsTable.hasQuiz,
        quizRequired: CourseLessonsTable.quizRequired
      })
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.id, lessonId))
      .limit(1);

    if (!lesson.hasQuiz || !lesson.quizRequired) {
      return { quizRequired: false, quizPassed: true };
    }

    const [quizAssessment] = await db
      .select({
        assessmentId: AssessmentsTable.id
      })
      .from(AssessmentsTable)
      .where(
        and(
          eq(AssessmentsTable.lessonId, lessonId),
          eq(AssessmentsTable.assessmentLevel, 'LESSON_QUIZ')
        )
      )
      .limit(1);

    if (!quizAssessment) {
      return { quizRequired: false, quizPassed: true };
    }

    const [passedAttempt] = await db
      .select()
      .from(AssessmentAttemptsTable)
      .where(
        and(
          eq(AssessmentAttemptsTable.assessmentId, quizAssessment.assessmentId),
          eq(AssessmentAttemptsTable.userId, userId),
          eq(AssessmentAttemptsTable.enrollmentId, enrollmentId),
          eq(AssessmentAttemptsTable.status, 'COMPLETED'),
          eq(AssessmentAttemptsTable.passed, true)
        )
      )
      .orderBy(desc(AssessmentAttemptsTable.attemptNumber))
      .limit(1);

    return {
      quizRequired: true,
      quizPassed: !!passedAttempt,
      assessmentId: quizAssessment.assessmentId
    };
  } catch (_error) {
    console.error('Error checking lesson quiz:', _error);
    return { quizRequired: false, quizPassed: false };
  }
};

const checkLessonCompletionRules = async (lessonId: string, userId: string, enrollmentId: string) => {
  try {
    const [completionRules] = await db
      .select()
      .from(LessonCompletionRulesTable)
      .where(eq(LessonCompletionRulesTable.lessonId, lessonId))
      .limit(1);

    const [lessonProgress] = await db
      .select({
        isCompleted: LessonProgressTable.isCompleted,
        videoPercentageWatched: LessonProgressTable.videoPercentageWatched,
        resourcesViewed: LessonProgressTable.resourcesViewed,
        quizAttempted: LessonProgressTable.quizAttempted,
        quizPassed: LessonProgressTable.quizPassed
      })
      .from(LessonProgressTable)
      .where(
        and(
          eq(LessonProgressTable.lessonId, lessonId),
          eq(LessonProgressTable.userId, userId),
          eq(LessonProgressTable.enrollmentId, enrollmentId)
        )
      )
      .limit(1);

    if (!lessonProgress) {
      return { isComplete: false, rules: completionRules };
    }

    const videoComplete = !completionRules?.requireVideoWatched ||
      (lessonProgress.videoPercentageWatched || 0) >= (completionRules.minVideoWatchPercentage || 90);

    const quizResult = await checkLessonQuizCompletion(lessonId, userId, enrollmentId);
    const quizComplete = !completionRules?.requireQuizPassed || quizResult.quizPassed;

    let resourcesComplete = true;
    if (completionRules?.requireResourcesViewed) {
      try {
        const resourcesViewed = lessonProgress.resourcesViewed as Record<string, any> | null;
        resourcesComplete = resourcesViewed !== null &&
          typeof resourcesViewed === 'object' &&
          Object.keys(resourcesViewed).length > 0;
      } catch {
        resourcesComplete = false;
      }
    }

    const isComplete = videoComplete && quizComplete && resourcesComplete && lessonProgress.isCompleted;

    return {
      isComplete,
      videoComplete,
      quizComplete,
      resourcesComplete,
      rules: completionRules,
      quizResult
    };
  } catch (_error) {
    console.error('Error checking completion rules:', _error);
    return { isComplete: false, videoComplete: false, quizComplete: false, resourcesComplete: false };
  }
};

// ===========================
// CONTROLLERS - COURSE ENROLLMENTS
// ===========================

const listUserEnrollments = async (userId: string) => {
  try {
    const enrollments = await db
      .select({
        id: EnrollmentsTable.id,
        courseId: EnrollmentsTable.courseId,
        courseTitle: CoursesTable.title,
        courseThumbnail: CoursesTable.thumbnailUrl,
        status: EnrollmentsTable.status,
        progress: EnrollmentsTable.progress,
        enrolledAt: EnrollmentsTable.enrolledAt,
        lastAccessedAt: EnrollmentsTable.lastAccessedAt,
        completedAt: EnrollmentsTable.completedAt,
        overallScore: EnrollmentsTable.overallScore,
        certificateEligible: EnrollmentsTable.certificateEligible,
        certificateIssued: EnrollmentsTable.certificateIssued,
        completedLessons: EnrollmentsTable.completedLessons,
        totalLessons: EnrollmentsTable.totalLessons,
        completedAssessments: EnrollmentsTable.completedAssessments,
        totalAssessments: EnrollmentsTable.totalAssessments,
      })
      .from(EnrollmentsTable)
      .innerJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
      .where(eq(EnrollmentsTable.userId, userId))
      .orderBy(desc(EnrollmentsTable.lastAccessedAt));

    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const [totalLessons] = await db
          .select({ count: count() })
          .from(CourseLessonsTable)
          .where(eq(CourseLessonsTable.courseId, enrollment.courseId));

        const lessons = await db
          .select({ id: CourseLessonsTable.id })
          .from(CourseLessonsTable)
          .where(eq(CourseLessonsTable.courseId, enrollment.courseId));

        let completedLessonsCount = 0;
        for (const lesson of lessons) {
          const completionStatus = await checkLessonCompletionRules(lesson.id, userId, enrollment.id);
          if (completionStatus.isComplete) {
            completedLessonsCount++;
          }
        }

        let actualProgress = enrollment.progress;
        if (totalLessons.count > 0) {
          const calculatedProgress = Math.round((completedLessonsCount / totalLessons.count) * 100);
          actualProgress = Math.min(calculatedProgress, 100);

          const moduleAssessments = await checkModuleAssessmentsPassed(userId, enrollment.courseId, enrollment.id);
          const finalAssessment = await checkFinalAssessmentPassed(userId, enrollment.courseId, enrollment.id);

          const passedModuleAssessments = moduleAssessments.filter(m => m.passed || !m.assessmentRequired).length;
          const totalModuleAssessments = moduleAssessments.length;

          if (
            actualProgress !== enrollment.progress ||
            completedLessonsCount !== enrollment.completedLessons ||
            totalLessons.count !== enrollment.totalLessons
          ) {
            await db
              .update(EnrollmentsTable)
              .set({
                progress: actualProgress,
                completedLessons: completedLessonsCount,
                totalLessons: totalLessons.count,
                completedAssessments: passedModuleAssessments + (finalAssessment.passed ? 1 : 0),
                totalAssessments: totalModuleAssessments + (finalAssessment.notRequired ? 0 : 1),
                updatedAt: new Date()
              })
              .where(eq(EnrollmentsTable.id, enrollment.id));
          }

          if (actualProgress === 100) {
            const [course] = await db
              .select({
                requireAllAssessmentsPassed: CoursesTable.requireAllAssessmentsPassed,
                requireAllModulesComplete: CoursesTable.requireAllModulesComplete,
                minimumCoursePassingScore: CoursesTable.minimumCoursePassingScore
              })
              .from(CoursesTable)
              .where(eq(CoursesTable.id, enrollment.courseId))
              .limit(1);

            let allModuleAssessmentsPassed = true;
            for (const mod of moduleAssessments) {
              if (mod.assessmentRequired && !mod.passed) {
                allModuleAssessmentsPassed = false;
                break;
              }
            }

            const finalAssessmentPassed = finalAssessment.passed || finalAssessment.notRequired;

            const shouldCompleteCourse = course.requireAllModulesComplete
              ? actualProgress === 100 && (!course.requireAllAssessmentsPassed || (allModuleAssessmentsPassed && finalAssessmentPassed))
              : true;

            if (shouldCompleteCourse && enrollment.status !== 'COMPLETED') {
              await db
                .update(EnrollmentsTable)
                .set({
                  status: 'COMPLETED',
                  completedAt: new Date(),
                  certificateEligible: true
                })
                .where(eq(EnrollmentsTable.id, enrollment.id));

              enrollment.status = 'COMPLETED';
              enrollment.certificateEligible = true;
            }
          }
        } else {
          actualProgress = 0;
          if (enrollment.progress !== 0 || enrollment.totalLessons !== 0) {
            await db
              .update(EnrollmentsTable)
              .set({
                progress: 0,
                totalLessons: 0,
                updatedAt: new Date()
              })
              .where(eq(EnrollmentsTable.id, enrollment.id));
          }
        }

        return {
          ...enrollment,
          progress: actualProgress,
          completedLessons: completedLessonsCount,
          totalLessons: totalLessons.count
        };
      })
    );

    return successResponse(enrollmentsWithProgress);
  } catch (error: any) {
    console.error('listUserEnrollments error:', error);
    return errorResponse(error.message || 'Failed to fetch enrollments', 'FETCH_ERROR', 500);
  }
};

const getEnrollmentById = async (id: string) => {
  const [enrollment] = await db
    .select({
      id: EnrollmentsTable.id,
      userId: EnrollmentsTable.userId,
      courseId: EnrollmentsTable.courseId,
      courseTitle: CoursesTable.title,
      status: EnrollmentsTable.status,
      progress: EnrollmentsTable.progress,
      enrolledAt: EnrollmentsTable.enrolledAt,
      startedAt: EnrollmentsTable.startedAt,
      completedAt: EnrollmentsTable.completedAt,
      lastAccessedAt: EnrollmentsTable.lastAccessedAt,
      certificateEligible: EnrollmentsTable.certificateEligible,
      certificateIssued: EnrollmentsTable.certificateIssued,
      overallScore: EnrollmentsTable.overallScore,
      finalAssessmentScore: EnrollmentsTable.finalAssessmentScore,
      averageQuizScore: EnrollmentsTable.averageQuizScore,
    })
    .from(EnrollmentsTable)
    .innerJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
    .where(eq(EnrollmentsTable.id, id))
    .limit(1);

  if (!enrollment) return errorResponse('Enrollment not found', 'NOT_FOUND', 404);
  return successResponse(enrollment);
};

const getCourseEnrollments = async (courseId: string) => {
  const enrollments = await db
    .select()
    .from(EnrollmentsTable)
    .where(eq(EnrollmentsTable.courseId, courseId))
    .orderBy(desc(EnrollmentsTable.enrolledAt));

  return successResponse(enrollments);
};

const getEnrollmentStats = async (userId?: string) => {
  try {
    let stats: any = {};

    if (userId) {
      const [totalEnrollments] = await db.select({ count: count() }).from(EnrollmentsTable).where(eq(EnrollmentsTable.userId, userId));
      const [activeEnrollments] = await db.select({ count: count() }).from(EnrollmentsTable).where(and(eq(EnrollmentsTable.userId, userId), eq(EnrollmentsTable.status, 'ACTIVE')));
      const [completedEnrollments] = await db.select({ count: count() }).from(EnrollmentsTable).where(and(eq(EnrollmentsTable.userId, userId), eq(EnrollmentsTable.status, 'COMPLETED')));

      stats = {
        total: totalEnrollments?.count || 0,
        active: activeEnrollments?.count || 0,
        completed: completedEnrollments?.count || 0,
      };
    } else {
      const [total] = await db.select({ count: count() }).from(EnrollmentsTable);
      const [active] = await db.select({ count: count() }).from(EnrollmentsTable).where(eq(EnrollmentsTable.status, 'ACTIVE'));
      const [completed] = await db.select({ count: count() }).from(EnrollmentsTable).where(eq(EnrollmentsTable.status, 'COMPLETED'));

      stats = {
        total: total?.count || 0,
        active: active?.count || 0,
        completed: completed?.count || 0,
      };
    }

    return successResponse(stats);
  } catch (error: any) {
    console.error('getEnrollmentStats error:', error);
    return errorResponse(error.message || 'Failed to get stats', 'STATS_ERROR', 500);
  }
};

const enrollInCourse = async (request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.userId || !body.courseId) {
      return errorResponse('Missing required fields: userId, courseId');
    }

    const [course] = await db
      .select({ status: CoursesTable.status, maxStudents: CoursesTable.maxStudents, currentEnrollments: CoursesTable.currentEnrollments })
      .from(CoursesTable)
      .where(eq(CoursesTable.id, body.courseId))
      .limit(1);

    if (!course) return errorResponse('Course not found', 'NOT_FOUND', 404);
    if (course.status !== 'PUBLISHED') return errorResponse('Course is not published', 'NOT_PUBLISHED', 400);
    if (course.maxStudents && course.currentEnrollments >= course.maxStudents) return errorResponse('Course is full', 'COURSE_FULL', 400);

    const [existing] = await db
      .select()
      .from(EnrollmentsTable)
      .where(and(eq(EnrollmentsTable.userId, body.userId), eq(EnrollmentsTable.courseId, body.courseId)))
      .limit(1);

    if (existing) return errorResponse('Already enrolled in this course', 'ALREADY_ENROLLED', 409);

    const [enrollment] = await db
      .insert(EnrollmentsTable)
      .values({
        userId: body.userId,
        courseId: body.courseId,
        status: 'ACTIVE',
        progress: 0,
        enrolledAt: new Date(),
        startedAt: new Date(),
        lastAccessedAt: new Date(),
      })
      .returning();

    await db
      .update(CoursesTable)
      .set({ currentEnrollments: sql`${CoursesTable.currentEnrollments} + 1`, updatedAt: new Date() })
      .where(eq(CoursesTable.id, body.courseId));

    return successResponse(enrollment, 'Enrolled successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to enroll', 'ENROLL_ERROR', 500);
  }
};

const updateEnrollment = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();
    const [enrollment] = await db.select().from(EnrollmentsTable).where(eq(EnrollmentsTable.id, id)).limit(1);
    if (!enrollment) return errorResponse('Enrollment not found', 'NOT_FOUND', 404);

    const [updated] = await db.update(EnrollmentsTable).set({ ...body, updatedAt: new Date() }).where(eq(EnrollmentsTable.id, id)).returning();
    return successResponse(updated, 'Enrollment updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update enrollment', 'UPDATE_ERROR', 500);
  }
};

const unenrollFromCourse = async (id: string) => {
  try {
    const [enrollment] = await db.select().from(EnrollmentsTable).where(eq(EnrollmentsTable.id, id)).limit(1);
    if (!enrollment) return errorResponse('Enrollment not found', 'NOT_FOUND', 404);

    await db.delete(EnrollmentsTable).where(eq(EnrollmentsTable.id, id));

    await db
      .update(CoursesTable)
      .set({ currentEnrollments: sql`${CoursesTable.currentEnrollments} - 1`, updatedAt: new Date() })
      .where(eq(CoursesTable.id, enrollment.courseId));

    return successResponse({ id }, 'Unenrolled successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to unenroll', 'UNENROLL_ERROR', 500);
  }
};

// ===========================
// BOOTCAMP ENROLLMENTS
// ===========================

const listUserBootcampEnrollments = async (userId: string) => {
  const enrollments = await db
    .select({
      id: BootcampEnrollmentsTable.id,
      bootcampId: BootcampEnrollmentsTable.bootcampId,
      bootcampTitle: BootcampsTable.title,
      bootcampThumbnail: BootcampsTable.thumbnailUrl,
      status: BootcampEnrollmentsTable.status,
      progress: BootcampEnrollmentsTable.progress,
      enrolledAt: BootcampEnrollmentsTable.enrolledAt,
    })
    .from(BootcampEnrollmentsTable)
    .innerJoin(BootcampsTable, eq(BootcampEnrollmentsTable.bootcampId, BootcampsTable.id))
    .where(eq(BootcampEnrollmentsTable.userId, userId))
    .orderBy(desc(BootcampEnrollmentsTable.enrolledAt));

  return successResponse(enrollments);
};

const getBootcampEnrollmentById = async (id: string) => {
  const [enrollment] = await db.select().from(BootcampEnrollmentsTable).where(eq(BootcampEnrollmentsTable.id, id)).limit(1);
  if (!enrollment) return errorResponse('Bootcamp enrollment not found', 'NOT_FOUND', 404);
  return successResponse(enrollment);
};

const enrollInBootcamp = async (request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.userId || !body.bootcampId) {
      return errorResponse('Missing required fields: userId, bootcampId');
    }

    const [existing] = await db
      .select()
      .from(BootcampEnrollmentsTable)
      .where(and(eq(BootcampEnrollmentsTable.userId, body.userId), eq(BootcampEnrollmentsTable.bootcampId, body.bootcampId)))
      .limit(1);

    if (existing) return errorResponse('Already enrolled in this bootcamp', 'ALREADY_ENROLLED', 409);

    const [enrollment] = await db
      .insert(BootcampEnrollmentsTable)
      .values({
        userId: body.userId,
        bootcampId: body.bootcampId,
        status: 'ACTIVE',
        progress: 0,
        enrolledAt: new Date(),
      })
      .returning();

    return successResponse(enrollment, 'Enrolled in bootcamp successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to enroll in bootcamp', 'BOOTCAMP_ENROLL_ERROR', 500);
  }
};

// ===========================
// ROUTE HANDLERS
// ===========================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const stats = searchParams.get('stats');
    const bootcamp = searchParams.get('bootcamp');

    if (parseBoolean(stats)) {
      return await getEnrollmentStats(userId || undefined);
    }

    if (courseId) {
      const validation = validateId(courseId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getCourseEnrollments(courseId);
    }

    if (parseBoolean(bootcamp) && userId) {
      const validation = validateId(userId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await listUserBootcampEnrollments(userId);
    }

    if (parseBoolean(bootcamp) && id) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getBootcampEnrollmentById(id);
    }

    if (id) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getEnrollmentById(id);
    }

    if (userId) {
      const validation = validateId(userId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await listUserEnrollments(userId);
    }

    return errorResponse('userId parameter is required');
  } catch (error: any) {
    console.error('GET error:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bootcamp = searchParams.get('bootcamp');

    if (parseBoolean(bootcamp)) {
      return await enrollInBootcamp(request);
    }

    return await enrollInCourse(request);
  } catch (error: any) {
    console.error('POST error:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('ID is required for update operations');
    const validation = validateId(id);
    if (!validation.valid) return errorResponse(validation.error!);

    return await updateEnrollment(id, request);
  } catch (error: any) {
    console.error('PUT error:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('ID is required for delete operation');
    const validation = validateId(id);
    if (!validation.valid) return errorResponse(validation.error!);

    return await unenrollFromCourse(id);
  } catch (error: any) {
    console.error('DELETE error:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}