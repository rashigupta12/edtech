/* eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable   @typescript-eslint/no-unused-vars*/
// src/app/api/progress/route.ts
import { db } from '@/db';
import {
  AssessmentAttemptsTable,
  AssessmentsTable,
  CourseLessonsTable,
  CourseModulesTable,
  EnrollmentsTable,
  LessonCompletionRulesTable,
  LessonProgressTable
} from '@/db/schema';
import { and, count, desc, eq } from 'drizzle-orm';
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
// HELPER FUNCTIONS
// ===========================

const checkLessonQuizCompletion = async (lessonId: string, userId: string, enrollmentId: string) => {
  try {
    // Check if lesson has quiz
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

    // Get lesson quiz assessment
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

    // Check for passed quiz attempt
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
  } catch (error) {
    console.error('Error checking lesson quiz:', error);
    return { quizRequired: false, quizPassed: false };
  }
};

const updateEnrollmentProgress = async (enrollmentId: string, courseId: string, userId: string) => {
  try {
    // Get all lessons in course
    const [totalLessons] = await db
      .select({ count: count() })
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.courseId, courseId));

    // Get lessons completed according to completion rules
    const lessons = await db
      .select({
        id: CourseLessonsTable.id
      })
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.courseId, courseId));

    let completedLessonsCount = 0;
    for (const lesson of lessons) {
      // Get completion rules
      const [completionRules] = await db
        .select()
        .from(LessonCompletionRulesTable)
        .where(eq(LessonCompletionRulesTable.lessonId, lesson.id))
        .limit(1);

      // Get lesson progress
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
            eq(LessonProgressTable.lessonId, lesson.id),
            eq(LessonProgressTable.userId, userId),
            eq(LessonProgressTable.enrollmentId, enrollmentId)
          )
        )
        .limit(1);

      if (lessonProgress) {
        // Check video requirement
        const videoComplete = !completionRules?.requireVideoWatched ||
          (lessonProgress.videoPercentageWatched || 0) >= (completionRules.minVideoWatchPercentage || 90);

        // Check quiz requirement
        const quizResult = await checkLessonQuizCompletion(lesson.id, userId, enrollmentId);
        const quizComplete = !completionRules?.requireQuizPassed || quizResult.quizPassed;

        // Check resources requirement
        let resourcesComplete = true;
        if (completionRules?.requireResourcesViewed) {
          try {
            const resourcesViewed = lessonProgress.resourcesViewed as Record<string, any> | null;
            resourcesComplete = resourcesViewed !== null &&
              typeof resourcesViewed === 'object' &&
              Object.keys(resourcesViewed).length > 0;
          } catch (error) {
            resourcesComplete = false;
          }
        }

        const isComplete = videoComplete && quizComplete && resourcesComplete && lessonProgress.isCompleted;

        if (isComplete) {
          completedLessonsCount++;
        }
      }
    }

    // Calculate progress percentage
    const progress = totalLessons.count > 0 ? Math.round((completedLessonsCount / totalLessons.count) * 100) : 0;

    // Get assessment statistics
    const [moduleAssessments] = await db
      .select({ count: count() })
      .from(CourseModulesTable)
      .where(
        and(
          eq(CourseModulesTable.courseId, courseId),
          eq(CourseModulesTable.hasAssessment, true)
        )
      );

    const [finalAssessment] = await db
      .select({ count: count() })
      .from(AssessmentsTable)
      .where(
        and(
          eq(AssessmentsTable.courseId, courseId),
          eq(AssessmentsTable.assessmentLevel, 'COURSE_FINAL'),
          eq(AssessmentsTable.isRequired, true)
        )
      );

    // Count passed assessments
    const [passedModuleAssessments] = await db
      .select({ count: count() })
      .from(AssessmentAttemptsTable)
      .innerJoin(AssessmentsTable, eq(AssessmentAttemptsTable.assessmentId, AssessmentsTable.id))
      .innerJoin(CourseModulesTable, eq(AssessmentsTable.moduleId, CourseModulesTable.id))
      .where(
        and(
          eq(AssessmentAttemptsTable.userId, userId),
          eq(AssessmentAttemptsTable.enrollmentId, enrollmentId),
          eq(AssessmentAttemptsTable.status, 'COMPLETED'),
          eq(AssessmentAttemptsTable.passed, true),
          eq(AssessmentsTable.assessmentLevel, 'MODULE_ASSESSMENT'),
          eq(CourseModulesTable.courseId, courseId)
        )
      );

    const [passedFinalAssessment] = await db
      .select({ count: count() })
      .from(AssessmentAttemptsTable)
      .innerJoin(AssessmentsTable, eq(AssessmentAttemptsTable.assessmentId, AssessmentsTable.id))
      .where(
        and(
          eq(AssessmentAttemptsTable.userId, userId),
          eq(AssessmentAttemptsTable.enrollmentId, enrollmentId),
          eq(AssessmentAttemptsTable.status, 'COMPLETED'),
          eq(AssessmentAttemptsTable.passed, true),
          eq(AssessmentsTable.assessmentLevel, 'COURSE_FINAL'),
          eq(AssessmentsTable.courseId, courseId)
        )
      );

    // Update enrollment
    await db
      .update(EnrollmentsTable)
      .set({
        progress,
        completedLessons: completedLessonsCount,
        totalLessons: totalLessons.count,
        completedAssessments: passedModuleAssessments.count + passedFinalAssessment.count,
        totalAssessments: moduleAssessments.count + finalAssessment.count,
        lastAccessedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(EnrollmentsTable.id, enrollmentId));

    return {
      progress,
      completedLessons: completedLessonsCount,
      totalLessons: totalLessons.count,
      completedAssessments: passedModuleAssessments.count + passedFinalAssessment.count,
      totalAssessments: moduleAssessments.count + finalAssessment.count,
    };

  } catch (error) {
    console.error('Update enrollment progress error:', error);
    throw error;
  }
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
  try {
    const [enrollment] = await db
      .select({
        id: EnrollmentsTable.id,
        progress: EnrollmentsTable.progress,
        status: EnrollmentsTable.status,
        completedAt: EnrollmentsTable.completedAt,
        overallScore: EnrollmentsTable.overallScore,
        certificateEligible: EnrollmentsTable.certificateEligible,
      })
      .from(EnrollmentsTable)
      .where(and(eq(EnrollmentsTable.courseId, courseId), eq(EnrollmentsTable.userId, userId)))
      .limit(1);

    if (!enrollment) {
      return errorResponse('Not enrolled in this course', 'NOT_ENROLLED', 404);
    }

    // Update progress first
    const progressData = await updateEnrollmentProgress(enrollment.id, courseId, userId);

    // Get all lessons in course
    const lessons = await db
      .select({
        id: CourseLessonsTable.id,
        title: CourseLessonsTable.title,
        moduleId: CourseLessonsTable.moduleId,
        moduleTitle: CourseModulesTable.title,
        contentType: CourseLessonsTable.contentType,
        hasQuiz: CourseLessonsTable.hasQuiz,
        quizRequired: CourseLessonsTable.quizRequired,
      })
      .from(CourseLessonsTable)
      .innerJoin(CourseModulesTable, eq(CourseLessonsTable.moduleId, CourseModulesTable.id))
      .where(eq(CourseLessonsTable.courseId, courseId))
      .orderBy(CourseModulesTable.sortOrder, CourseLessonsTable.sortOrder);

    // Get lesson progress details with completion rules
    const lessonsProgress = await Promise.all(
      lessons.map(async (lesson) => {
        const [lessonProgress] = await db
          .select({
            lessonId: LessonProgressTable.lessonId,
            isCompleted: LessonProgressTable.isCompleted,
            completedAt: LessonProgressTable.completedAt,
            lastWatchedPosition: LessonProgressTable.lastWatchedPosition,
            watchDuration: LessonProgressTable.watchDuration,
            videoPercentageWatched: LessonProgressTable.videoPercentageWatched,
            resourcesViewed: LessonProgressTable.resourcesViewed,
            quizAttempted: LessonProgressTable.quizAttempted,
            quizPassed: LessonProgressTable.quizPassed,
          })
          .from(LessonProgressTable)
          .where(
            and(
              eq(LessonProgressTable.lessonId, lesson.id),
              eq(LessonProgressTable.userId, userId),
              eq(LessonProgressTable.enrollmentId, enrollment.id)
            )
          )
          .limit(1);

        // Get completion rules
        const [completionRules] = await db
          .select()
          .from(LessonCompletionRulesTable)
          .where(eq(LessonCompletionRulesTable.lessonId, lesson.id))
          .limit(1);

        // Check quiz completion
        const quizResult = await checkLessonQuizCompletion(lesson.id, userId, enrollment.id);

        // Check if lesson is complete based on rules
        let isComplete = false;
        if (lessonProgress) {
          const videoComplete = !completionRules?.requireVideoWatched ||
            (lessonProgress.videoPercentageWatched || 0) >= (completionRules.minVideoWatchPercentage || 90);

          const quizComplete = !completionRules?.requireQuizPassed || quizResult.quizPassed;

          // Safely check resourcesViewed
          let resourcesComplete = true;
          if (completionRules?.requireResourcesViewed) {
            try {
              const resourcesViewed = lessonProgress.resourcesViewed as Record<string, any> | null;
              resourcesComplete = resourcesViewed !== null &&
                typeof resourcesViewed === 'object' &&
                Object.keys(resourcesViewed).length > 0;
            } catch (error) {
              resourcesComplete = false;
            }
          }

          isComplete = videoComplete && quizComplete && resourcesComplete && Boolean(lessonProgress.isCompleted);
        }

        return {
          ...lesson,
          progress: lessonProgress || null,
          isComplete,
          completionRules,
          quizResult,
        };
      })
    );

    // Get module assessments
    const moduleAssessments = await db
      .select({
        moduleId: CourseModulesTable.id,
        moduleTitle: CourseModulesTable.title,
        assessmentId: AssessmentsTable.id,
        assessmentTitle: AssessmentsTable.title,
        hasAssessment: CourseModulesTable.hasAssessment,
        assessmentRequired: CourseModulesTable.assessmentRequired,
        minimumPassingScore: CourseModulesTable.minimumPassingScore,
      })
      .from(CourseModulesTable)
      .leftJoin(
        AssessmentsTable,
        and(
          eq(AssessmentsTable.moduleId, CourseModulesTable.id),
          eq(AssessmentsTable.assessmentLevel, 'MODULE_ASSESSMENT')
        )
      )
      .where(eq(CourseModulesTable.courseId, courseId));

    // Get module assessment status
    const moduleAssessmentStatus = await Promise.all(
      moduleAssessments.map(async (module) => {
        if (!module.assessmentId || !module.hasAssessment) {
          return { ...module, passed: true, attempted: false };
        }

        const [latestAttempt] = await db
          .select()
          .from(AssessmentAttemptsTable)
          .where(
            and(
              eq(AssessmentAttemptsTable.assessmentId, module.assessmentId),
              eq(AssessmentAttemptsTable.userId, userId),
              eq(AssessmentAttemptsTable.enrollmentId, enrollment.id)
            )
          )
          .orderBy(desc(AssessmentAttemptsTable.attemptNumber))
          .limit(1);

        return {
          ...module,
          passed: latestAttempt?.passed || false,
          attempted: !!latestAttempt,
          latestScore: latestAttempt?.percentage || 0,
        };
      })
    );

    // Get final assessment
    const [finalAssessment] = await db
      .select({
        id: AssessmentsTable.id,
        title: AssessmentsTable.title,
        passingScore: AssessmentsTable.passingScore,
        isRequired: AssessmentsTable.isRequired,
      })
      .from(AssessmentsTable)
      .where(
        and(
          eq(AssessmentsTable.courseId, courseId),
          eq(AssessmentsTable.assessmentLevel, 'COURSE_FINAL')
        )
      )
      .limit(1);

    let finalAssessmentStatus = null;
    if (finalAssessment) {
      const [latestAttempt] = await db
        .select()
        .from(AssessmentAttemptsTable)
        .where(
          and(
            eq(AssessmentAttemptsTable.assessmentId, finalAssessment.id),
            eq(AssessmentAttemptsTable.userId, userId),
            eq(AssessmentAttemptsTable.enrollmentId, enrollment.id)
          )
        )
        .orderBy(desc(AssessmentAttemptsTable.attemptNumber))
        .limit(1);

      finalAssessmentStatus = {
        ...finalAssessment,
        passed: latestAttempt?.passed || false,
        attempted: !!latestAttempt,
        latestScore: latestAttempt?.percentage || 0,
        latestAttemptId: latestAttempt?.id,
      };
    }

    return successResponse({
      enrollmentId: enrollment.id,
      courseId,
      overallProgress: progressData.progress,
      completedLessons: progressData.completedLessons,
      totalLessons: progressData.totalLessons,
      completedAssessments: progressData.completedAssessments,
      totalAssessments: progressData.totalAssessments,
      status: enrollment.status,
      completedAt: enrollment.completedAt,
      overallScore: enrollment.overallScore,
      certificateEligible: enrollment.certificateEligible,
      lessonsProgress,
      moduleAssessmentStatus,
      finalAssessmentStatus,
    });
  } catch (error: any) {
    console.error('getCourseProgress error:', error);
    return errorResponse(error.message || 'Failed to get course progress', 'PROGRESS_ERROR', 500);
  }
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
  try {
    // Get lesson details first
    const [lesson] = await db
      .select({
        id: CourseLessonsTable.id,
        title: CourseLessonsTable.title,
        courseId: CourseLessonsTable.courseId,
        hasQuiz: CourseLessonsTable.hasQuiz,
        quizRequired: CourseLessonsTable.quizRequired,
      })
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.id, lessonId))
      .limit(1);

    if (!lesson) {
      return errorResponse('Lesson not found', 'NOT_FOUND', 404);
    }

    // Get enrollment
    const [enrollment] = await db
      .select({
        id: EnrollmentsTable.id,
      })
      .from(EnrollmentsTable)
      .where(and(eq(EnrollmentsTable.courseId, lesson.courseId), eq(EnrollmentsTable.userId, userId)))
      .limit(1);

    if (!enrollment) {
      return errorResponse('Not enrolled in this course', 'NOT_ENROLLED', 404);
    }

    const [progress] = await db
      .select()
      .from(LessonProgressTable)
      .where(and(eq(LessonProgressTable.lessonId, lessonId), eq(LessonProgressTable.userId, userId)))
      .limit(1);

    if (!progress) {
      return successResponse({
        lessonId,
        userId,
        enrollmentId: enrollment.id,
        isCompleted: false,
        lastWatchedPosition: 0,
        watchDuration: 0,
        videoPercentageWatched: 0,
        resourcesViewed: null,
        quizAttempted: false,
        quizPassed: false,
      });
    }

    return successResponse(progress);
  } catch (error: any) {
    console.error('getLessonProgress error:', error);
    return errorResponse(error.message || 'Failed to get lesson progress', 'LESSON_PROGRESS_ERROR', 500);
  }
};

// UPDATE LESSON PROGRESS
const updateLessonProgress = async (lessonId: string, userId: string, request: NextRequest) => {
  try {
    const body = await request.json();

    // Get lesson and course info
    const [lesson] = await db
      .select({
        id: CourseLessonsTable.id,
        title: CourseLessonsTable.title,
        courseId: CourseLessonsTable.courseId,
        hasQuiz: CourseLessonsTable.hasQuiz,
        quizRequired: CourseLessonsTable.quizRequired,
      })
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.id, lessonId))
      .limit(1);

    if (!lesson) return errorResponse('Lesson not found', 'NOT_FOUND', 404);

    // Get enrollment
    const [enrollment] = await db
      .select({
        id: EnrollmentsTable.id,
        courseId: EnrollmentsTable.courseId,
      })
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
          videoPercentageWatched: body.videoPercentageWatched ?? existing.videoPercentageWatched,
          isCompleted: body.isCompleted ?? existing.isCompleted,
          completedAt: body.isCompleted ? new Date() : existing.completedAt,
          resourcesViewed: body.resourcesViewed ?? existing.resourcesViewed,
          quizAttempted: body.quizAttempted ?? existing.quizAttempted,
          quizPassed: body.quizPassed ?? existing.quizPassed,
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
          videoPercentageWatched: body.videoPercentageWatched || 0,
          isCompleted: body.isCompleted || false,
          completedAt: body.isCompleted ? new Date() : null,
          resourcesViewed: body.resourcesViewed || null,
          quizAttempted: body.quizAttempted || false,
          quizPassed: body.quizPassed || false,
        })
        .returning();
    }

    // Update enrollment progress
    await updateEnrollmentProgress(enrollment.id, enrollment.courseId, userId);

    return successResponse(progress, 'Lesson progress updated');
  } catch (error: any) {
    console.error('updateLessonProgress error:', error);
    return errorResponse(error.message || 'Failed to update lesson progress', 'UPDATE_ERROR', 500);
  }
};

// MARK LESSON COMPLETE
const markLessonComplete = async (lessonId: string, userId: string) => {
  try {
    const [lesson] = await db
      .select({
        id: CourseLessonsTable.id,
        courseId: CourseLessonsTable.courseId,
        hasQuiz: CourseLessonsTable.hasQuiz,
        quizRequired: CourseLessonsTable.quizRequired,
      })
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.id, lessonId))
      .limit(1);

    if (!lesson) return errorResponse('Lesson not found', 'NOT_FOUND', 404);

    const [enrollment] = await db
      .select({
        id: EnrollmentsTable.id,
        courseId: EnrollmentsTable.courseId,
      })
      .from(EnrollmentsTable)
      .where(and(eq(EnrollmentsTable.courseId, lesson.courseId), eq(EnrollmentsTable.userId, userId)))
      .limit(1);

    if (!enrollment) {
      return errorResponse('Not enrolled in this course', 'NOT_ENROLLED', 403);
    }

    // Get completion rules
    const [completionRules] = await db
      .select()
      .from(LessonCompletionRulesTable)
      .where(eq(LessonCompletionRulesTable.lessonId, lessonId))
      .limit(1);

    // Check if lesson has required quiz
    if (lesson.hasQuiz && lesson.quizRequired && completionRules?.requireQuizPassed) {
      // Get lesson quiz
      const [quiz] = await db
        .select()
        .from(AssessmentsTable)
        .where(
          and(
            eq(AssessmentsTable.lessonId, lessonId),
            eq(AssessmentsTable.assessmentLevel, 'LESSON_QUIZ')
          )
        )
        .limit(1);

      if (quiz) {
        // Check if user has passed the quiz
        const [attempt] = await db
          .select()
          .from(AssessmentAttemptsTable)
          .where(
            and(
              eq(AssessmentAttemptsTable.assessmentId, quiz.id),
              eq(AssessmentAttemptsTable.userId, userId),
              eq(AssessmentAttemptsTable.enrollmentId, enrollment.id),
              eq(AssessmentAttemptsTable.status, 'COMPLETED'),
              eq(AssessmentAttemptsTable.passed, true)
            )
          )
          .orderBy(desc(AssessmentAttemptsTable.attemptNumber))
          .limit(1);

        if (!attempt) {
          return errorResponse('You must pass the quiz to complete this lesson', 'QUIZ_REQUIRED', 403);
        }
      }
    }

    // Check existing progress
    const [existingProgress] = await db
      .select()
      .from(LessonProgressTable)
      .where(
        and(
          eq(LessonProgressTable.lessonId, lessonId),
          eq(LessonProgressTable.userId, userId),
          eq(LessonProgressTable.enrollmentId, enrollment.id)
        )
      )
      .limit(1);

    let progress;
    if (existingProgress) {
      // Update existing progress
      [progress] = await db
        .update(LessonProgressTable)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date(),
          videoPercentageWatched: completionRules?.requireVideoWatched ? 100 : existingProgress.videoPercentageWatched,
        })
        .where(eq(LessonProgressTable.id, existingProgress.id))
        .returning();
    } else {
      // Create new progress
      [progress] = await db
        .insert(LessonProgressTable)
        .values({
          userId,
          lessonId,
          enrollmentId: enrollment.id,
          isCompleted: true,
          completedAt: new Date(),
          videoPercentageWatched: completionRules?.requireVideoWatched ? 100 : 0,
        })
        .returning();
    }

    // Update enrollment progress
    await updateEnrollmentProgress(enrollment.id, enrollment.courseId, userId);

    return successResponse(progress, 'Lesson marked as complete');
  } catch (error: any) {
    console.error('markLessonComplete error:', error);
    return errorResponse(error.message || 'Failed to mark lesson as complete', 'COMPLETE_ERROR', 500);
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
    console.error('GET error:', error);
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
    console.error('POST error:', error);
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
    console.error('PUT error:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}