/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/assessments/route.ts
import { db } from '@/db';
import {
  AssessmentAttemptsTable,
  AssessmentQuestionsTable,
  AssessmentsTable,
  CourseLessonsTable,
  CourseModulesTable,
  CoursesTable,
  EnrollmentsTable,
  LessonProgressTable,
} from '@/db/schema';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// ===========================
// TYPES
// ===========================

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
};

type SearchParams = {
  id?: string;
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  level?: string;
  questions?: string;
  attempts?: string;
  userId?: string;
  attempt?: string;
  submit?: string;
  questionId?: string;
  questionsBank?: string;
};

type AssessmentData = {
  title: string;
  description?: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  assessmentLevel: 'LESSON_QUIZ' | 'MODULE_ASSESSMENT' | 'COURSE_FINAL';
  duration?: number;
  passingScore?: number;
  maxAttempts?: number;
  timeLimit?: number;
  isRequired?: boolean;
  showCorrectAnswers?: boolean;
  allowRetake?: boolean;
  randomizeQuestions?: boolean;
  availableFrom?: string;
  availableUntil?: string;
  createdBy: string;
  facultyId?: string;
};

type QuestionData = {
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  options?: any[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
  negativePoints?: number;
  questionBankId?: string;
};

type AttemptData = {
  answers: any;
  questionDetails?: any;
  completedAt?: string;
  timeSpent?: number;
};

// ===========================
// HELPERS
// ===========================

const parseBoolean = (value: string | null | undefined): boolean => {
  return value === 'true' || value === '1';
};

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
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
};

// Calculate score for an attempt
const calculateScore = (questions: any[], answers: any): { score: number; totalPoints: number; percentage: number; passed: boolean; passingScore: number } => {
  let score = 0;
  let totalPoints = 0;

  questions.forEach((question) => {
    totalPoints += question.points || 1;
    
    const userAnswer = answers[question.id];
    if (userAnswer !== undefined && userAnswer !== null) {
      if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
        if (userAnswer === question.correctAnswer) {
          score += question.points || 1;
        } else if (question.negativePoints) {
          score -= question.negativePoints;
        }
      } else if (question.questionType === 'SHORT_ANSWER') {
        // For short answers, you might want more sophisticated checking
        if (userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
          score += question.points || 1;
        }
      }
    }
  });

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const passingScore = questions[0]?.assessment?.passingScore || 60;
  const passed = percentage >= passingScore;

  return { score, totalPoints, percentage, passed, passingScore };
};

// ===========================
// CONTROLLERS
// ===========================

// CREATE ASSESSMENT
const createAssessment = async (request: NextRequest) => {
  try {
    const body = await request.json() as AssessmentData;

    // Validation
    if (!body.title || !body.courseId || !body.createdBy) {
      return errorResponse('Missing required fields: title, courseId, createdBy');
    }

    // Validate assessment level
    if (!['LESSON_QUIZ', 'MODULE_ASSESSMENT', 'COURSE_FINAL'].includes(body.assessmentLevel)) {
      return errorResponse('Invalid assessment level');
    }

    // Validate based on level
    if (body.assessmentLevel === 'LESSON_QUIZ' && !body.lessonId) {
      return errorResponse('Lesson ID is required for lesson quiz');
    }

    if (body.assessmentLevel === 'MODULE_ASSESSMENT' && !body.moduleId) {
      return errorResponse('Module ID is required for module assessment');
    }

    if (body.assessmentLevel === 'COURSE_FINAL') {
      body.moduleId = undefined;
      body.lessonId = undefined;
    }

    // Check if course exists
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, body.courseId))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    // For lesson quiz, check if lesson exists and doesn't already have a quiz
    if (body.lessonId) {
      const [lesson] = await db
        .select()
        .from(CourseLessonsTable)
        .where(eq(CourseLessonsTable.id, body.lessonId))
        .limit(1);

      if (!lesson) {
        return errorResponse('Lesson not found', 'NOT_FOUND', 404);
      }

      // Check if lesson already has a quiz
      const [existingQuiz] = await db
        .select()
        .from(AssessmentsTable)
        .where(
          and(
            eq(AssessmentsTable.lessonId, body.lessonId),
            eq(AssessmentsTable.assessmentLevel, 'LESSON_QUIZ')
          )
        )
        .limit(1);

      if (existingQuiz) {
        return errorResponse('Lesson already has a quiz', 'DUPLICATE', 409);
      }
    }

    // For module assessment, check if module exists
    if (body.moduleId) {
      const [module] = await db
        .select()
        .from(CourseModulesTable)
        .where(eq(CourseModulesTable.id, body.moduleId))
        .limit(1);

      if (!module) {
        return errorResponse('Module not found', 'NOT_FOUND', 404);
      }
    }

    // Create assessment
    const [newAssessment] = await db
      .insert(AssessmentsTable)
      .values({
        courseId: body.courseId,
        moduleId: body.moduleId || null,
        lessonId: body.lessonId || null,
        assessmentLevel: body.assessmentLevel,
        title: body.title,
        description: body.description || null,
        duration: body.duration || null,
        passingScore: body.passingScore || 60,
        maxAttempts: body.maxAttempts || null,
        timeLimit: body.timeLimit || null,
        isRequired: body.isRequired || false,
        showCorrectAnswers: body.showCorrectAnswers || false,
        allowRetake: body.allowRetake || true,
        randomizeQuestions: body.randomizeQuestions || false,
        availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
        availableUntil: body.availableUntil ? new Date(body.availableUntil) : null,
        createdBy: body.createdBy,
        facultyId: body.facultyId || null,
      })
      .returning();

    // Update course/module/lesson flags
    if (body.assessmentLevel === 'LESSON_QUIZ' && body.lessonId) {
      await db
        .update(CourseLessonsTable)
        .set({
          hasQuiz: true,
          quizRequired: body.isRequired || false,
        })
        .where(eq(CourseLessonsTable.id, body.lessonId));
    } else if (body.assessmentLevel === 'MODULE_ASSESSMENT' && body.moduleId) {
      await db
        .update(CourseModulesTable)
        .set({
          hasAssessment: true,
          assessmentRequired: body.isRequired || false,
          minimumPassingScore: body.passingScore || 60,
        })
        .where(eq(CourseModulesTable.id, body.moduleId));
    } else if (body.assessmentLevel === 'COURSE_FINAL') {
      await db
        .update(CoursesTable)
        .set({
          hasFinalAssessment: true,
          finalAssessmentRequired: body.isRequired !== undefined ? body.isRequired : true,
          minimumCoursePassingScore: body.passingScore || 60,
        })
        .where(eq(CoursesTable.id, body.courseId));
    }

    return successResponse(newAssessment, 'Assessment created successfully', 201);
  } catch (error: any) {
    console.error('Create assessment error:', error);
    return errorResponse(error.message || 'Failed to create assessment', 'CREATE_ERROR', 500);
  }
};

// GET ASSESSMENT BY ID
// const getAssessment = async (id: string) => {
//   try {
//     const [assessment] = await db
//       .select()
//       .from(AssessmentsTable)
//       .where(eq(AssessmentsTable.id, id))
//       .limit(1);

//     if (!assessment) {
//       return errorResponse('Assessment not found', 'NOT_FOUND', 404);
//     }

//     return successResponse(assessment);
//   } catch (error: any) {
//     return errorResponse(error.message || 'Failed to get assessment', 'GET_ERROR', 500);
//   }
// };
// UPDATE ASSESSMENT
const updateAssessment = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json() as Partial<AssessmentData>;
    const validation = validateId(id);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    // Get existing assessment
    const [existingAssessment] = await db
      .select()
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, id))
      .limit(1);

    if (!existingAssessment) {
      return errorResponse('Assessment not found', 'NOT_FOUND', 404);
    }

    // Prepare update data
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.passingScore !== undefined) updateData.passingScore = body.passingScore;
    if (body.maxAttempts !== undefined) updateData.maxAttempts = body.maxAttempts;
    if (body.timeLimit !== undefined) updateData.timeLimit = body.timeLimit;
    if (body.isRequired !== undefined) updateData.isRequired = body.isRequired;
    if (body.showCorrectAnswers !== undefined) updateData.showCorrectAnswers = body.showCorrectAnswers;
    if (body.allowRetake !== undefined) updateData.allowRetake = body.allowRetake;
    if (body.randomizeQuestions !== undefined) updateData.randomizeQuestions = body.randomizeQuestions;
    if (body.availableFrom !== undefined) updateData.availableFrom = body.availableFrom ? new Date(body.availableFrom) : null;
    if (body.availableUntil !== undefined) updateData.availableUntil = body.availableUntil ? new Date(body.availableUntil) : null;
    
    // Update assessment
    const [updatedAssessment] = await db
      .update(AssessmentsTable)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(AssessmentsTable.id, id))
      .returning();

    // Update flags on course/module/lesson if changed
    if (body.isRequired !== undefined) {
      if (existingAssessment.assessmentLevel === 'LESSON_QUIZ' && existingAssessment.lessonId) {
        await db
          .update(CourseLessonsTable)
          .set({
            quizRequired: body.isRequired,
          })
          .where(eq(CourseLessonsTable.id, existingAssessment.lessonId));
      } else if (existingAssessment.assessmentLevel === 'MODULE_ASSESSMENT' && existingAssessment.moduleId) {
        await db
          .update(CourseModulesTable)
          .set({
            assessmentRequired: body.isRequired,
            minimumPassingScore: body.passingScore || existingAssessment.passingScore,
          })
          .where(eq(CourseModulesTable.id, existingAssessment.moduleId));
      } else if (existingAssessment.assessmentLevel === 'COURSE_FINAL') {
        await db
          .update(CoursesTable)
          .set({
            finalAssessmentRequired: body.isRequired !== undefined ? body.isRequired : true,
            minimumCoursePassingScore: body.passingScore || existingAssessment.passingScore,
          })
          .where(eq(CoursesTable.id, existingAssessment.courseId));
      }
    }

    return successResponse(updatedAssessment, 'Assessment updated successfully');
  } catch (error: any) {
    console.error('Update assessment error:', error);
    return errorResponse(error.message || 'Failed to update assessment', 'UPDATE_ERROR', 500);
  }
};

// GET ASSESSMENT WITH QUESTIONS
const getAssessmentWithQuestions = async (id: string, userId?: string) => {
  try {
    // Get assessment
    const [assessment] = await db
      .select()
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, id))
      .limit(1);

    if (!assessment) {
      return errorResponse('Assessment not found', 'NOT_FOUND', 404);
    }

    // Get questions (ordered by sortOrder)
    const questions = await db
      .select()
      .from(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.assessmentId, id))
      .orderBy(asc(AssessmentQuestionsTable.sortOrder));

    // If user ID provided and randomizeQuestions is true, shuffle questions
    let shuffledQuestions = questions;
    if (assessment.randomizeQuestions && userId) {
      // Generate a seeded random shuffle based on user ID
      shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    }

    // Get course information
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, assessment.courseId))
      .limit(1);

    // Get module information if available
    let moduleInfo = null;
    if (assessment.moduleId) {
      const [module] = await db
        .select()
        .from(CourseModulesTable)
        .where(eq(CourseModulesTable.id, assessment.moduleId))
        .limit(1);
      moduleInfo = module;
    }

    // Get lesson information if available
    let lessonInfo = null;
    if (assessment.lessonId) {
      const [lesson] = await db
        .select()
        .from(CourseLessonsTable)
        .where(eq(CourseLessonsTable.id, assessment.lessonId))
        .limit(1);
      lessonInfo = lesson;
    }

    // Return assessment with questions and related info
    return successResponse({
      ...assessment,
      questions: shuffledQuestions.map(q => ({
        id: q.id,
        assessmentId: q.assessmentId,
        questionText: q.questionText,
        questionType: q.questionType,
        difficulty: q.difficulty,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points || 1,
        negativePoints: q.negativePoints || 0,
        sortOrder: q.sortOrder,
        questionBankId: q.questionBankId,
        isActive: q.isActive,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
      courseTitle: course?.title || 'Unknown Course',
      moduleTitle: moduleInfo?.title || null,
      lessonTitle: lessonInfo?.title || null,
    });
  } catch (error: any) {
    console.error('getAssessmentWithQuestions error:', error);
    return errorResponse(error.message || 'Failed to get assessment', 'GET_ERROR', 500);
  }
};

// GET USER ATTEMPTS FOR ASSESSMENT
const getUserAttempts = async (assessmentId: string, userId: string) => {
  try {
    const validation = validateId(assessmentId);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    const validation2 = validateId(userId);
    if (!validation2.valid) {
      return errorResponse(validation2.error!);
    }

    const attempts = await db
      .select()
      .from(AssessmentAttemptsTable)
      .where(
        and(
          eq(AssessmentAttemptsTable.assessmentId, assessmentId),
          eq(AssessmentAttemptsTable.userId, userId)
        )
      )
      .orderBy(desc(AssessmentAttemptsTable.attemptNumber));

    const [assessment] = await db
      .select()
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, assessmentId))
      .limit(1);

    return successResponse({
      attempts,
      maxAttempts: assessment?.maxAttempts,
      canRetake: assessment?.allowRetake || true,
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to get attempts', 'GET_ERROR', 500);
  }
};

// CREATE ASSESSMENT ATTEMPT
const createAttempt = async (assessmentId: string, userId: string, request: NextRequest) => {
  try {
    const validation = validateId(assessmentId);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    const validation2 = validateId(userId);
    if (!validation2.valid) {
      return errorResponse(validation2.error!);
    }

    // Get assessment
    const [assessment] = await db
      .select()
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, assessmentId))
      .limit(1);

    if (!assessment) {
      return errorResponse('Assessment not found', 'NOT_FOUND', 404);
    }

    // Check enrollment
    const [enrollment] = await db
      .select()
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.courseId, assessment.courseId)
        )
      )
      .limit(1);

    if (!enrollment) {
      return errorResponse('User is not enrolled in this course', 'NOT_ENROLLED', 403);
    }

    // Check availability
    const now = new Date();
    if (assessment.availableFrom && now < assessment.availableFrom) {
      return errorResponse('Assessment is not available yet', 'NOT_AVAILABLE', 403);
    }

    if (assessment.availableUntil && now > assessment.availableUntil) {
      return errorResponse('Assessment is no longer available', 'EXPIRED', 403);
    }

    // Get user's previous attempts
    const previousAttempts = await db
      .select()
      .from(AssessmentAttemptsTable)
      .where(
        and(
          eq(AssessmentAttemptsTable.assessmentId, assessmentId),
          eq(AssessmentAttemptsTable.userId, userId)
        )
      );

    // Check max attempts
    if (assessment.maxAttempts && previousAttempts.length >= assessment.maxAttempts) {
      return errorResponse('Maximum attempts reached', 'MAX_ATTEMPTS', 403);
    }

    // Check if user has passed and retake is not allowed
    const hasPassed = previousAttempts.some(attempt => attempt.passed);
    if (hasPassed && !assessment.allowRetake) {
      return errorResponse('You have already passed this assessment and retake is not allowed', 'ALREADY_PASSED', 403);
    }

    // Get questions for the attempt
    const questions = await db
      .select()
      .from(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.assessmentId, assessmentId))
      .orderBy(asc(AssessmentQuestionsTable.sortOrder));

    if (questions.length === 0) {
      return errorResponse('Assessment has no questions', 'NO_QUESTIONS', 400);
    }

    // Shuffle questions if randomizeQuestions is true
    let attemptQuestions = questions;
    if (assessment.randomizeQuestions) {
      attemptQuestions = [...questions].sort(() => Math.random() - 0.5);
    }

    // Create attempt
    const attemptNumber = previousAttempts.length + 1;
    const [newAttempt] = await db
      .insert(AssessmentAttemptsTable)
      .values({
        assessmentId,
        userId,
        enrollmentId: enrollment.id,
        attemptNumber,
        status: 'IN_PROGRESS',
        answers: {} as Record<string, any>, // ✅ FIXED: Changed from {} as any to {} as Record<string, any>
        questionDetails: attemptQuestions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          points: q.points,
          negativePoints: q.negativePoints,
        })),
        score: 0,
        totalPoints: attemptQuestions.reduce((sum, q) => sum + (q.points || 1), 0),
        percentage: 0,
        passed: false,
        startedAt: new Date(),
      })
      .returning();

    return successResponse({
      ...newAttempt,
      questions: attemptQuestions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        points: q.points,
        negativePoints: q.negativePoints,
      })),
      timeLimit: assessment.timeLimit,
    }, 'Attempt started successfully', 201);
  } catch (error: any) {
    console.error('Create attempt error:', error);
    return errorResponse(error.message || 'Failed to create attempt', 'ATTEMPT_ERROR', 500);
  }
};

// SUBMIT ATTEMPT
const submitAttempt = async (attemptId: string, request: NextRequest) => {
  try {
    const body = await request.json() as AttemptData;
    const validation = validateId(attemptId);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    // Get attempt
    const [attempt] = await db
      .select()
      .from(AssessmentAttemptsTable)
      .where(eq(AssessmentAttemptsTable.id, attemptId))
      .limit(1);

    if (!attempt) {
      return errorResponse('Attempt not found', 'NOT_FOUND', 404);
    }

    if (attempt.status === 'COMPLETED') {
      return errorResponse('Attempt already submitted', 'ALREADY_SUBMITTED', 400);
    }

    // Get assessment
    const [assessment] = await db
      .select()
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, attempt.assessmentId))
      .limit(1);

    if (!assessment) {
      return errorResponse('Assessment not found', 'NOT_FOUND', 404);
    }

    // Get questions from questionDetails
    const questionDetails: any[] = (attempt.questionDetails as any[]) || [];
    
    // Calculate score
    const { score, totalPoints, percentage, passed, passingScore } = calculateScore(
      questionDetails,
      body.answers || {}
    );

    // Update attempt
    const [updatedAttempt] = await db
      .update(AssessmentAttemptsTable)
      .set({
        answers: body.answers || {},
        status: 'COMPLETED',
        score,
        totalPoints,
        percentage,
        passed,
        completedAt: body.completedAt ? new Date(body.completedAt) : new Date(),
        timeSpent: body.timeSpent || 0,
      })
      .where(eq(AssessmentAttemptsTable.id, attemptId))
      .returning();

    // Update lesson progress if this is a lesson quiz
    if (assessment.assessmentLevel === 'LESSON_QUIZ' && assessment.lessonId) {
      await db
        .update(LessonProgressTable) // ✅ FIXED: Changed from db._.LessonProgressTable to LessonProgressTable
        .set({
          quizAttempted: true,
          quizScore: score,
          quizPassed: passed,
          lastQuizAttemptId: attemptId,
        })
        .where(
          and(
            eq(LessonProgressTable.lessonId, assessment.lessonId), // ✅ FIXED: Changed from db._.LessonProgressTable to LessonProgressTable
            eq(LessonProgressTable.userId, attempt.userId) // ✅ FIXED: Changed from db._.LessonProgressTable to LessonProgressTable
          )
        );
    }

    // Update enrollment statistics
    await updateEnrollmentStats(attempt.enrollmentId, assessment, passed, percentage);

    return successResponse({
      ...updatedAttempt,
      passingScore,
      showCorrectAnswers: assessment.showCorrectAnswers,
    }, 'Attempt submitted successfully');
  } catch (error: any) {
    console.error('Submit attempt error:', error);
    return errorResponse(error.message || 'Failed to submit attempt', 'SUBMIT_ERROR', 500);
  }
};

// UPDATE ENROLLMENT STATISTICS
const updateEnrollmentStats = async (enrollmentId: string, assessment: any, passed: boolean, score: number) => {
  try {
    const enrollment = await db
      .select()
      .from(EnrollmentsTable)
      .where(eq(EnrollmentsTable.id, enrollmentId))
      .limit(1);

    if (!enrollment[0]) return;

    // Update overall score based on assessment level
    const updates: any = {};
    
    if (assessment.assessmentLevel === 'COURSE_FINAL') {
      updates.finalAssessmentScore = score;
    }

    // Calculate average quiz score
    const allAttempts = await db
      .select()
      .from(AssessmentAttemptsTable)
      .where(eq(AssessmentAttemptsTable.enrollmentId, enrollmentId));

    const quizAttempts = allAttempts.filter(a => 
      a.percentage !== null && a.percentage !== undefined
    );
    
    if (quizAttempts.length > 0) {
      const totalScore = quizAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0);
      updates.averageQuizScore = Math.round(totalScore / quizAttempts.length);
      updates.overallScore = Math.round(totalScore / quizAttempts.length);
    }

    // Update completed assessments count
    const completedAssessments = allAttempts.filter(a => 
      a.status === 'COMPLETED' && a.passed
    ).length;
    
    updates.completedAssessments = completedAssessments;

    await db
      .update(EnrollmentsTable)
      .set(updates)
      .where(eq(EnrollmentsTable.id, enrollmentId));

  } catch (error) {
    console.error('Update enrollment stats error:', error);
  }
};

// ADD QUESTION TO ASSESSMENT
const addQuestion = async (assessmentId: string, request: NextRequest) => {
  try {
    const body = await request.json() as QuestionData;
    const validation = validateId(assessmentId);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    if (!body.questionText || !body.questionType || !body.correctAnswer) {
      return errorResponse('Missing required fields: questionText, questionType, correctAnswer');
    }

    // Get current max sort order
    const [maxOrder] = await db
      .select({ max: sql<number>`MAX(${AssessmentQuestionsTable.sortOrder})` })
      .from(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.assessmentId, assessmentId));

    const sortOrder = (maxOrder?.max ?? -1) + 1;

    const [newQuestion] = await db
      .insert(AssessmentQuestionsTable)
      .values({
        assessmentId,
        questionText: body.questionText,
        questionType: body.questionType,
        difficulty: body.difficulty || 'MEDIUM',
        options: body.options || null,
        correctAnswer: body.correctAnswer,
        explanation: body.explanation || null,
        points: body.points || 1,
        negativePoints: body.negativePoints || 0,
        questionBankId: body.questionBankId || null,
        sortOrder,
        isActive: true,
      })
      .returning();

    return successResponse(newQuestion, 'Question added successfully', 201);
  } catch (error: any) {
    console.error('Add question error:', error);
    return errorResponse(error.message || 'Failed to add question', 'QUESTION_ERROR', 500);
  }
};




// Add this function to delete a question:
const deleteQuestion = async (questionId: string) => {
  try {
    const validation = validateId(questionId);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    // Check if question exists
    const [question] = await db
      .select()
      .from(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.id, questionId))
      .limit(1);

    if (!question) {
      return errorResponse('Question not found', 'NOT_FOUND', 404);
    }

    // Delete the question
    await db
      .delete(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.id, questionId));

    return successResponse({ id: questionId }, 'Question deleted successfully');
  } catch (error: any) {
    console.error('Delete question error:', error);
    return errorResponse(error.message || 'Failed to delete question', 'DELETE_ERROR', 500);
  }
};
// GET QUESTIONS FROM QUESTION BANK
const getQuestionBankQuestions = async (questionBankId: string) => {
  try {
    const validation = validateId(questionBankId);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    const questions = await db
      .select()
      .from(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.questionBankId, questionBankId))
      .orderBy(asc(AssessmentQuestionsTable.sortOrder));

    return successResponse(questions);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to get questions', 'GET_ERROR', 500);
  }
};

// GET COURSE ASSESSMENTS
const getCourseAssessments = async (courseId: string) => {
  try {
    const validation = validateId(courseId);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    const assessments = await db
      .select()
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.courseId, courseId))
      .orderBy(asc(AssessmentsTable.createdAt));

    return successResponse(assessments);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to get assessments', 'GET_ERROR', 500);
  }
};

// GET Handler
// GET Handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: SearchParams = {
      id: searchParams.get('id') || undefined,
      courseId: searchParams.get('courseId') || undefined,
      moduleId: searchParams.get('moduleId') || undefined,
      lessonId: searchParams.get('lessonId') || undefined,
      level: searchParams.get('level') || undefined,
      questions: searchParams.get('questions') || undefined,
      attempts: searchParams.get('attempts') || undefined,
      userId: searchParams.get('userId') || undefined,
      questionsBank: searchParams.get('questionsBank') || undefined,
    };

    // Route: GET /api/assessments?id=123
    if (params.id) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      
      // If questions parameter is true OR if no specific parameter is set, get with questions
      if (parseBoolean(params.questions) || (!params.attempts && !params.questionsBank)) {
        return await getAssessmentWithQuestions(params.id, params.userId);
      }
    }

    // Route: GET /api/assessments?id=123&attempts=true&userId=456
    if (params.id && parseBoolean(params.attempts) && params.userId) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getUserAttempts(params.id, params.userId);
    }

    // Route: GET /api/assessments?questionsBank=123
    if (params.questionsBank) {
      return await getQuestionBankQuestions(params.questionsBank);
    }

    // Route: GET /api/assessments?courseId=123
    if (params.courseId) {
      return await getCourseAssessments(params.courseId);
    }

    return errorResponse('Invalid request parameters', 'INVALID_REQUEST', 400);
  } catch (error: any) {
    console.error('GET error:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

// POST Handler
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: SearchParams = {
      id: searchParams.get('id') || undefined,
      attempt: searchParams.get('attempt') || undefined,
      submit: searchParams.get('submit') || undefined,
      questions: searchParams.get('questions') || undefined,
      userId: searchParams.get('userId') || undefined,
    };

    // Route: POST /api/assessments?id=123&attempt=true&userId=456
    if (params.id && parseBoolean(params.attempt) && params.userId) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await createAttempt(params.id, params.userId, request);
    }

    // Route: POST /api/assessments?id=123&questions=true
    if (params.id && parseBoolean(params.questions)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await addQuestion(params.id, request);
    }

    // Route: POST /api/assessments (create assessment)
    return await createAssessment(request);
  } catch (error: any) {
    console.error('POST error:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

// UPDATE QUESTION
const updateQuestion = async (questionId: string, request: NextRequest) => {
  try {
    const body = await request.json() as Partial<QuestionData>;
    const validation = validateId(questionId);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    // Get existing question
    const [existingQuestion] = await db
      .select()
      .from(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.id, questionId))
      .limit(1);

    if (!existingQuestion) {
      return errorResponse('Question not found', 'NOT_FOUND', 404);
    }

    // Prepare update data
    const updateData: any = {};

    if (body.questionText !== undefined) updateData.questionText = body.questionText;
    if (body.questionType !== undefined) updateData.questionType = body.questionType;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.options !== undefined) updateData.options = body.options;
    if (body.correctAnswer !== undefined) updateData.correctAnswer = body.correctAnswer;
    if (body.explanation !== undefined) updateData.explanation = body.explanation;
    if (body.points !== undefined) updateData.points = body.points;
    if (body.negativePoints !== undefined) updateData.negativePoints = body.negativePoints;
    if (body.questionBankId !== undefined) updateData.questionBankId = body.questionBankId;

    // Update question
    const [updatedQuestion] = await db
      .update(AssessmentQuestionsTable)
      .set(updateData)
      .where(eq(AssessmentQuestionsTable.id, questionId))
      .returning();

    return successResponse(updatedQuestion, 'Question updated successfully');
  } catch (error: any) {
    console.error('Update question error:', error);
    return errorResponse(error.message || 'Failed to update question', 'UPDATE_ERROR', 500);
  }
};


// PUT Handler
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: SearchParams = {
      id: searchParams.get('id') || undefined,
      submit: searchParams.get('submit') || undefined,
      questionId: searchParams.get('questionId') || undefined, // Add this
    };

    // Route: PUT /api/assessments?id=123&submit=true
    if (params.id && parseBoolean(params.submit)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await submitAttempt(params.id, request);
    }

    // Route: PUT /api/assessments?questionId=123 (update question)
    if (params.questionId) {
      const validation = validateId(params.questionId);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await updateQuestion(params.questionId, request);
    }

    // Route: PUT /api/assessments?id=123 (update assessment)
    if (params.id) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await updateAssessment(params.id, request);
    }

    return errorResponse('Invalid request parameters', 'INVALID_REQUEST', 400);
  } catch (error: any) {
    console.error('PUT error:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

// DELETE Handler
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: SearchParams = {
      id: searchParams.get('id') || undefined,
      questionId: searchParams.get('questionId') || undefined, // Add this
    };

    // Route: DELETE /api/assessments?questionId=123 (delete question)
    if (params.questionId) {
      const validation = validateId(params.questionId);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await deleteQuestion(params.questionId);
    }

    // Rest of your existing delete assessment code...
    if (!params.id) {
      return errorResponse('ID is required for delete operation');
    }

    const validation = validateId(params.id);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    // Check if assessment exists
    const [assessment] = await db
      .select()
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.id, params.id))
      .limit(1);

    if (!assessment) {
      return errorResponse('Assessment not found', 'NOT_FOUND', 404);
    }

    // Delete related attempts first
    await db
      .delete(AssessmentAttemptsTable)
      .where(eq(AssessmentAttemptsTable.assessmentId, params.id));

    // Delete questions
    await db
      .delete(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.assessmentId, params.id));

    // Delete assessment
    await db
      .delete(AssessmentsTable)
      .where(eq(AssessmentsTable.id, params.id));

    // Reset flags on course/module/lesson
    if (assessment.assessmentLevel === 'LESSON_QUIZ' && assessment.lessonId) {
      await db
        .update(CourseLessonsTable)
        .set({
          hasQuiz: false,
          quizRequired: false,
        })
        .where(eq(CourseLessonsTable.id, assessment.lessonId));
    } else if (assessment.assessmentLevel === 'MODULE_ASSESSMENT' && assessment.moduleId) {
      await db
        .update(CourseModulesTable)
        .set({
          hasAssessment: false,
          assessmentRequired: false,
          minimumPassingScore: 60,
        })
        .where(eq(CourseModulesTable.id, assessment.moduleId));
    } else if (assessment.assessmentLevel === 'COURSE_FINAL') {
      await db
        .update(CoursesTable)
        .set({
          hasFinalAssessment: false,
          finalAssessmentRequired: true,
          minimumCoursePassingScore: 60,
        })
        .where(eq(CoursesTable.id, assessment.courseId));
    }

    return successResponse({ id: params.id }, 'Assessment deleted successfully');
  } catch (error: any) {
    console.error('DELETE error:', error);
    return errorResponse(error.message || 'Failed to delete', 'DELETE_ERROR', 500);
  }
}