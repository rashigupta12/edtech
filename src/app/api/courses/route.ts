// src/app/api/courses/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from '@/db';
import {
  CategoriesTable,
  CollegesTable,
  CourseLearningOutcomesTable,
  CourseModulesTable,
  CourseLessonsTable,
  CourseRequirementsTable,
  CoursesTable,
  AssessmentsTable,
  AssessmentQuestionsTable,
  AssessmentAttemptsTable,
  EnrollmentsTable,
  LessonProgressTable,
  UsersTable,
  CourseFacultyTable,
  FacultyTable,
  QuestionBanksTable,
  LessonCompletionRulesTable,
} from '@/db/schema';
import { desc, eq, and, sql, asc } from 'drizzle-orm';
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
  slug?: string;
  submit?: string;
  approve?: string;
  reject?: string;
  publish?: string;
  archive?: string;
  curriculum?: string;
  modules?: string;
  outcomes?: string;
  requirements?: string;
  updateModule?: string;
  deleteModule?: string;
  updateOutcome?: string;
  deleteOutcome?: string;
  updateRequirement?: string;
  deleteRequirement?: string;
  lessons?: string;
  updateLesson?: string;
  deleteLesson?: string;
  assessments?: string;
  assessmentLevel?: string;
  lessonId?: string;
  moduleId?: string;
  completion?: string;
  userId?: string;
  faculty?: string;
  addFaculty?: string;
  removeFaculty?: string;
  progress?: string;
  stats?: string;
  analytics?: string;
  questionBank?: string;
  completionRules?: string;
  updateCompletionRules?: string;
  markComplete?: string;
  facultyId?: string
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

type CompletionRulesData = {
  requireVideoWatched?: boolean;
  minVideoWatchPercentage?: number;
  requireQuizPassed?: boolean;
  requireResourcesViewed?: boolean;
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

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

// LIST ALL COURSES
const listCourses = async () => {
  const courses = await db
    .select({
      id: CoursesTable.id,
      slug: CoursesTable.slug,
      title: CoursesTable.title,
      shortDescription: CoursesTable.shortDescription,
      thumbnailUrl: CoursesTable.thumbnailUrl,
      duration: CoursesTable.duration,
      level: CoursesTable.level,
      language: CoursesTable.language,
      status: CoursesTable.status,
      isFeatured: CoursesTable.isFeatured,
      currentEnrollments: CoursesTable.currentEnrollments,
      createdAt: CoursesTable.createdAt,
      collegeName: CollegesTable.collegeName,
      categoryName: CategoriesTable.name,
      price: CoursesTable.price,
      isFree: CoursesTable.isFree,
      hasFinalAssessment: CoursesTable.hasFinalAssessment,
      finalAssessmentRequired: CoursesTable.finalAssessmentRequired,
    })
    .from(CoursesTable)
    .leftJoin(CollegesTable, eq(CoursesTable.collegeId, CollegesTable.id))
    .leftJoin(CategoriesTable, eq(CoursesTable.categoryId, CategoriesTable.id))
    .orderBy(desc(CoursesTable.createdAt));

  return successResponse(courses);
};

// GET SINGLE COURSE
const getCourseById = async (id: string) => {
  const [course] = await db
    .select({
      id: CoursesTable.id,
      slug: CoursesTable.slug,
      title: CoursesTable.title,
      shortDescription: CoursesTable.shortDescription,
      description: CoursesTable.description,
      thumbnailUrl: CoursesTable.thumbnailUrl,
      previewVideoUrl: CoursesTable.previewVideoUrl,
      duration: CoursesTable.duration,
      level: CoursesTable.level,
      language: CoursesTable.language,
      prerequisites: CoursesTable.prerequisites,
      status: CoursesTable.status,
      isFeatured: CoursesTable.isFeatured,
      maxStudents: CoursesTable.maxStudents,
      currentEnrollments: CoursesTable.currentEnrollments,
      isFree: CoursesTable.isFree,
      price: CoursesTable.price,
      discountPrice: CoursesTable.discountPrice,
      hasFinalAssessment: CoursesTable.hasFinalAssessment,
      finalAssessmentRequired: CoursesTable.finalAssessmentRequired,
      minimumCoursePassingScore: CoursesTable.minimumCoursePassingScore,
      requireAllModulesComplete: CoursesTable.requireAllModulesComplete,
      requireAllAssessmentsPassed: CoursesTable.requireAllAssessmentsPassed,
      createdAt: CoursesTable.createdAt,
      publishedAt: CoursesTable.publishedAt,
      collegeName: CollegesTable.collegeName,
      collegeId: CollegesTable.id,
      categoryName: CategoriesTable.name,
      categoryId: CategoriesTable.id,
    })
    .from(CoursesTable)
    .leftJoin(CollegesTable, eq(CoursesTable.collegeId, CollegesTable.id))
    .leftJoin(CategoriesTable, eq(CoursesTable.categoryId, CategoriesTable.id))
    .where(eq(CoursesTable.id, id))
    .limit(1);

  if (!course) {
    return errorResponse('Course not found', 'NOT_FOUND', 404);
  }

  const outcomes = await db
    .select()
    .from(CourseLearningOutcomesTable)
    .where(eq(CourseLearningOutcomesTable.courseId, id))
    .orderBy(CourseLearningOutcomesTable.sortOrder);

  const requirements = await db
    .select()
    .from(CourseRequirementsTable)
    .where(eq(CourseRequirementsTable.courseId, id))
    .orderBy(CourseRequirementsTable.sortOrder);

  // Get faculty
  const faculty = await db
    .select({
      id: FacultyTable.id,
      userId: FacultyTable.userId,
      name: UsersTable.name,
      designation: FacultyTable.designation,
      facultyRole: FacultyTable.facultyRole,
      isPrimaryInstructor: CourseFacultyTable.isPrimaryInstructor,
      teachingRole: CourseFacultyTable.teachingRole,
    })
    .from(CourseFacultyTable)
    .innerJoin(FacultyTable, eq(CourseFacultyTable.facultyId, FacultyTable.id))
    .innerJoin(UsersTable, eq(FacultyTable.userId, UsersTable.id))
    .where(eq(CourseFacultyTable.courseId, id));

  // Get assessments
  const assessments = await db
    .select()
    .from(AssessmentsTable)
    .where(eq(AssessmentsTable.courseId, id))
    .orderBy(asc(AssessmentsTable.assessmentLevel), asc(AssessmentsTable.createdAt));

  return successResponse({
    ...course,
    outcomes,
    requirements,
    faculty,
    assessments,
  });
};

// GET COURSE CURRICULUM (Full structure with modules)
const getCourseCurriculum = async (id: string) => {
  const [course] = await db
    .select()
    .from(CoursesTable)
    .where(eq(CoursesTable.id, id))
    .limit(1);

  if (!course) {
    return errorResponse('Course not found', 'NOT_FOUND', 404);
  }

  const modules = await db
    .select()
    .from(CourseModulesTable)
    .where(eq(CourseModulesTable.courseId, id))
    .orderBy(CourseModulesTable.sortOrder);

  const curriculum = {
    courseId: id,
    courseTitle: course.title,
    modules: modules,
    totalModules: modules.length,
  };

  return successResponse(curriculum);
};

// GET COURSE MODULES
const getCourseModules = async (id: string) => {
  const [course] = await db
    .select()
    .from(CoursesTable)
    .where(eq(CoursesTable.id, id))
    .limit(1);

  if (!course) {
    return errorResponse('Course not found', 'NOT_FOUND', 404);
  }

  const modules = await db
    .select()
    .from(CourseModulesTable)
    .where(eq(CourseModulesTable.courseId, id))
    .orderBy(CourseModulesTable.sortOrder);

  return successResponse(modules);
};

// CREATE COURSE
const createCourse = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.title || !body.categoryId || !body.createdBy) {
      return errorResponse('Missing required fields: title, categoryId, createdBy');
    }

    // Generate slug
    const slug = body.slug || generateSlug(body.title);

    // Check if slug exists
    const [existing] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.slug, slug))
      .limit(1);

    if (existing) {
      return errorResponse('Course slug already exists', 'DUPLICATE', 409);
    }

    // Create course
    const [newCourse] = await db
      .insert(CoursesTable)
      .values({
        slug,
        title: body.title,
        shortDescription: body.shortDescription,
        description: body.description,
        categoryId: body.categoryId,
        createdBy: body.createdBy,
        collegeId: body.collegeId || null,
        thumbnailUrl: body.thumbnailUrl || null,
        previewVideoUrl: body.previewVideoUrl || null,
        duration: body.duration || null,
        language: body.language || 'English',
        level: body.level || 'Beginner',
        prerequisites: body.prerequisites || null,
        status: body.status || 'DRAFT',
        isFeatured: false,
        maxStudents: body.maxStudents || null,
        currentEnrollments: 0,
        isFree: body.isFree ?? true,
        price: body.price || null,
        discountPrice: body.discountPrice || null,
        hasFinalAssessment: false,
        finalAssessmentRequired: true,
        minimumCoursePassingScore: 60,
        requireAllModulesComplete: true,
        requireAllAssessmentsPassed: true,
      })
      .returning();

    return successResponse(newCourse, 'Course created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create course', 'CREATE_ERROR', 500);
  }
};

// UPDATE COURSE
const updateCourse = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, id))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    // If updating slug, check uniqueness
    if (body.slug && body.slug !== course.slug) {
      const [existing] = await db
        .select()
        .from(CoursesTable)
        .where(eq(CoursesTable.slug, body.slug))
        .limit(1);

      if (existing) {
        return errorResponse('Course slug already exists', 'DUPLICATE', 409);
      }
    }

    const [updated] = await db
      .update(CoursesTable)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(CoursesTable.id, id))
      .returning();

    return successResponse(updated, 'Course updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update course', 'UPDATE_ERROR', 500);
  }
};

// DELETE COURSE
const deleteCourse = async (id: string) => {
  try {
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, id))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    await db.delete(CoursesTable).where(eq(CoursesTable.id, id));

    return successResponse({ id }, 'Course deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete course', 'DELETE_ERROR', 500);
  }
};

// SUBMIT COURSE FOR APPROVAL
const submitCourse = async (id: string) => {
  try {
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, id))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    if (course.status !== 'DRAFT') {
      return errorResponse('Only draft courses can be submitted', 'INVALID_STATE', 400);
    }

    const [submitted] = await db
      .update(CoursesTable)
      .set({
        status: 'PENDING_APPROVAL',
        submittedForApprovalAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(CoursesTable.id, id))
      .returning();

    return successResponse(submitted, 'Course submitted for approval');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to submit course', 'SUBMIT_ERROR', 500);
  }
};

// APPROVE COURSE (ADMIN)
const approveCourse = async (id: string, request: NextRequest) => {
  try {
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, id))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    if (course.status !== 'PENDING_APPROVAL') {
      return errorResponse('Course is not in pending approval state', 'INVALID_STATE', 400);
    }

    const [approved] = await db
      .update(CoursesTable)
      .set({
        status: 'APPROVED',
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(CoursesTable.id, id))
      .returning();

    return successResponse(approved, 'Course approved successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to approve course', 'APPROVE_ERROR', 500);
  }
};

// REJECT COURSE (ADMIN)
const rejectCourse = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return errorResponse('Rejection reason is required');
    }

    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, id))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    const [rejected] = await db
      .update(CoursesTable)
      .set({
        status: 'REJECTED',
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(CoursesTable.id, id))
      .returning();

    return successResponse(rejected, 'Course rejected');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to reject course', 'REJECT_ERROR', 500);
  }
};

// PUBLISH COURSE
const publishCourse = async (id: string) => {
  try {
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, id))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    if (course.status !== 'APPROVED') {
      return errorResponse('Only approved courses can be published', 'INVALID_STATE', 400);
    }

    const [published] = await db
      .update(CoursesTable)
      .set({
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(CoursesTable.id, id))
      .returning();

    return successResponse(published, 'Course published successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to publish course', 'PUBLISH_ERROR', 500);
  }
};

// ARCHIVE COURSE
const archiveCourse = async (id: string) => {
  try {
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, id))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    const [archived] = await db
      .update(CoursesTable)
      .set({
        status: 'ARCHIVED',
        updatedAt: new Date(),
      })
      .where(eq(CoursesTable.id, id))
      .returning();

    return successResponse(archived, 'Course archived successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to archive course', 'ARCHIVE_ERROR', 500);
  }
};

// CREATE MODULE
const createModule = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.title) {
      return errorResponse('Module title is required');
    }

    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, id))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    // Get current max sort order
    const [maxOrder] = await db
      .select({ max: sql<number>`MAX(${CourseModulesTable.sortOrder})` })
      .from(CourseModulesTable)
      .where(eq(CourseModulesTable.courseId, id));

    const sortOrder = (maxOrder?.max ?? -1) + 1;

    const [newModule] = await db
      .insert(CourseModulesTable)
      .values({
        courseId: id,
        title: body.title,
        description: body.description || null,
        hasAssessment: false,
        assessmentRequired: true,
        minimumPassingScore: 60,
        requireAllLessonsComplete: true,
        sortOrder: body.sortOrder ?? sortOrder,
      })
      .returning();

    return successResponse(newModule, 'Module created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create module', 'MODULE_ERROR', 500);
  }
};

// ADD LEARNING OUTCOME
const addLearningOutcome = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.outcome) {
      return errorResponse('Outcome text is required');
    }

    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, id))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    // Get current max sort order
    const [maxOrder] = await db
      .select({ max: sql<number>`MAX(${CourseLearningOutcomesTable.sortOrder})` })
      .from(CourseLearningOutcomesTable)
      .where(eq(CourseLearningOutcomesTable.courseId, id));

    const sortOrder = (maxOrder?.max ?? -1) + 1;

    const [newOutcome] = await db
      .insert(CourseLearningOutcomesTable)
      .values({
        courseId: id,
        outcome: body.outcome,
        sortOrder: body.sortOrder ?? sortOrder,
      })
      .returning();

    return successResponse(newOutcome, 'Learning outcome added', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to add outcome', 'OUTCOME_ERROR', 500);
  }
};

// ADD REQUIREMENT
const addRequirement = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.requirement) {
      return errorResponse('Requirement text is required');
    }

    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, id))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    // Get current max sort order
    const [maxOrder] = await db
      .select({ max: sql<number>`MAX(${CourseRequirementsTable.sortOrder})` })
      .from(CourseRequirementsTable)
      .where(eq(CourseRequirementsTable.courseId, id));

    const sortOrder = (maxOrder?.max ?? -1) + 1;

    const [newRequirement] = await db
      .insert(CourseRequirementsTable)
      .values({
        courseId: id,
        requirement: body.requirement,
        sortOrder: body.sortOrder ?? sortOrder,
      })
      .returning();

    return successResponse(newRequirement, 'Requirement added', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to add requirement', 'REQUIREMENT_ERROR', 500);
  }
};

// UPDATE MODULE
const updateModule = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [module] = await db
      .select()
      .from(CourseModulesTable)
      .where(eq(CourseModulesTable.id, id))
      .limit(1);

    if (!module) {
      return errorResponse('Module not found', 'NOT_FOUND', 404);
    }

    const [updated] = await db
      .update(CourseModulesTable)
      .set({
        title: body.title,
        description: body.description || null,
        hasAssessment: body.hasAssessment !== undefined ? body.hasAssessment : module.hasAssessment,
        assessmentRequired: body.assessmentRequired !== undefined ? body.assessmentRequired : module.assessmentRequired,
        minimumPassingScore: body.minimumPassingScore || module.minimumPassingScore,
        requireAllLessonsComplete: body.requireAllLessonsComplete !== undefined ? body.requireAllLessonsComplete : module.requireAllLessonsComplete,
        sortOrder: body.sortOrder !== undefined ? body.sortOrder : module.sortOrder,
      })
      .where(eq(CourseModulesTable.id, id))
      .returning();

    return successResponse(updated, 'Module updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update module', 'UPDATE_ERROR', 500);
  }
};

// DELETE MODULE
const deleteModule = async (id: string) => {
  try {
    const [module] = await db
      .select()
      .from(CourseModulesTable)
      .where(eq(CourseModulesTable.id, id))
      .limit(1);

    if (!module) {
      return errorResponse('Module not found', 'NOT_FOUND', 404);
    }

    await db.delete(CourseModulesTable).where(eq(CourseModulesTable.id, id));

    return successResponse({ id }, 'Module deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete module', 'DELETE_ERROR', 500);
  }
};

const updateOutcome = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [outcome] = await db
      .select()
      .from(CourseLearningOutcomesTable)
      .where(eq(CourseLearningOutcomesTable.id, id))
      .limit(1);

    if (!outcome) {
      return errorResponse('Outcome not found', 'NOT_FOUND', 404);
    }

    const [updated] = await db
      .update(CourseLearningOutcomesTable)
      .set({ outcome: body.outcome })
      .where(eq(CourseLearningOutcomesTable.id, id))
      .returning();

    return successResponse(updated, 'Outcome updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update outcome', 'UPDATE_ERROR', 500);
  }
};

// DELETE OUTCOME
const deleteOutcome = async (id: string) => {
  try {
    await db.delete(CourseLearningOutcomesTable).where(eq(CourseLearningOutcomesTable.id, id));
    return successResponse({ id }, 'Outcome deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete outcome', 'DELETE_ERROR', 500);
  }
};

// UPDATE REQUIREMENT
const updateRequirement = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [requirement] = await db
      .select()
      .from(CourseRequirementsTable)
      .where(eq(CourseRequirementsTable.id, id))
      .limit(1);

    if (!requirement) {
      return errorResponse('Requirement not found', 'NOT_FOUND', 404);
    }

    const [updated] = await db
      .update(CourseRequirementsTable)
      .set({ requirement: body.requirement })
      .where(eq(CourseRequirementsTable.id, id))
      .returning();

    return successResponse(updated, 'Requirement updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update requirement', 'UPDATE_ERROR', 500);
  }
};

// DELETE REQUIREMENT
const deleteRequirement = async (id: string) => {
  try {
    await db.delete(CourseRequirementsTable).where(eq(CourseRequirementsTable.id, id));
    return successResponse({ id }, 'Requirement deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete requirement', 'DELETE_ERROR', 500);
  }
};

// CREATE LESSON
const createLesson = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();
    const moduleId = new URL(request.url).searchParams.get('moduleId');

    if (!body.title || !moduleId) {
      return errorResponse('Missing required fields: title, moduleId');
    }

    const [module] = await db
      .select()
      .from(CourseModulesTable)
      .where(eq(CourseModulesTable.id, moduleId))
      .limit(1);

    if (!module) {
      return errorResponse('Module not found', 'NOT_FOUND', 404);
    }

    // Get current max sort order for lessons in this module
    const [maxOrder] = await db
      .select({ max: sql<number>`MAX(${CourseLessonsTable.sortOrder})` })
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.moduleId, moduleId));

    const sortOrder = (maxOrder?.max ?? -1) + 1;

    const [newLesson] = await db
      .insert(CourseLessonsTable)
      .values({
        moduleId,
        courseId: id,
        title: body.title,
        description: body.description || null,
        contentType: body.contentType || 'VIDEO',
        videoUrl: body.videoUrl || null,
        videoDuration: body.videoDuration || null,
        articleContent: body.articleContent || null,
        resources: body.resources || null,
        hasQuiz: false,
        quizRequired: false,
        isFree: body.isFree || false,
        sortOrder: body.sortOrder ?? sortOrder,
      })
      .returning();

    // Create default completion rules
    await db
      .insert(LessonCompletionRulesTable)
      .values({
        lessonId: newLesson.id,
        requireVideoWatched: body.contentType === 'VIDEO',
        minVideoWatchPercentage: 90,
        requireQuizPassed: false,
        requireResourcesViewed: false,
      });

    return successResponse(newLesson, 'Lesson created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create lesson', 'LESSON_ERROR', 500);
  }
};

// UPDATE LESSON
const updateLesson = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [lesson] = await db
      .select()
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.id, id))
      .limit(1);

    if (!lesson) {
      return errorResponse('Lesson not found', 'NOT_FOUND', 404);
    }

    const [updated] = await db
      .update(CourseLessonsTable)
      .set({
        title: body.title,
        description: body.description,
        contentType: body.contentType,
        videoUrl: body.videoUrl,
        videoDuration: body.videoDuration,
        articleContent: body.articleContent,
        resources: body.resources,
        hasQuiz: body.hasQuiz !== undefined ? body.hasQuiz : lesson.hasQuiz,
        quizRequired: body.quizRequired !== undefined ? body.quizRequired : lesson.quizRequired,
        isFree: body.isFree,
        sortOrder: body.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(CourseLessonsTable.id, id))
      .returning();

    return successResponse(updated, 'Lesson updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update lesson', 'UPDATE_ERROR', 500);
  }
};

// DELETE LESSON
const deleteLesson = async (id: string) => {
  try {
    const [lesson] = await db
      .select()
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.id, id))
      .limit(1);

    if (!lesson) {
      return errorResponse('Lesson not found', 'NOT_FOUND', 404);
    }

    await db.delete(CourseLessonsTable).where(eq(CourseLessonsTable.id, id));

    return successResponse({ id }, 'Lesson deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete lesson', 'DELETE_ERROR', 500);
  }
};

// GET COURSE CURRICULUM WITH LESSONS
const getCourseCurriculumWithLessons = async (id: string) => {
  const [course] = await db
    .select()
    .from(CoursesTable)
    .where(eq(CoursesTable.id, id))
    .limit(1);

  if (!course) {
    return errorResponse('Course not found', 'NOT_FOUND', 404);
  }

  // Get modules
  const modules = await db
    .select()
    .from(CourseModulesTable)
    .where(eq(CourseModulesTable.courseId, id))
    .orderBy(CourseModulesTable.sortOrder);

  // Get lessons for each module with completion rules
  const modulesWithLessons = await Promise.all(
    modules.map(async (module) => {
      const lessons = await db
        .select({
          id: CourseLessonsTable.id,
          moduleId: CourseLessonsTable.moduleId,
          courseId: CourseLessonsTable.courseId,
          title: CourseLessonsTable.title,
          description: CourseLessonsTable.description,
          contentType: CourseLessonsTable.contentType,
          videoUrl: CourseLessonsTable.videoUrl,
          videoDuration: CourseLessonsTable.videoDuration,
          articleContent: CourseLessonsTable.articleContent,
          resources: CourseLessonsTable.resources,
          hasQuiz: CourseLessonsTable.hasQuiz,
          quizRequired: CourseLessonsTable.quizRequired,
          sortOrder: CourseLessonsTable.sortOrder,
          isFree: CourseLessonsTable.isFree,
          createdAt: CourseLessonsTable.createdAt,
          updatedAt: CourseLessonsTable.updatedAt,
        })
        .from(CourseLessonsTable)
        .where(eq(CourseLessonsTable.moduleId, module.id))
        .orderBy(CourseLessonsTable.sortOrder);

      // Get completion rules for each lesson
      const lessonsWithRules = await Promise.all(
        lessons.map(async (lesson) => {
          const [completionRules] = await db
            .select()
            .from(LessonCompletionRulesTable)
            .where(eq(LessonCompletionRulesTable.lessonId, lesson.id))
            .limit(1);

          // Get lesson quiz if exists
          let quiz = null;
          if (lesson.hasQuiz) {
            [quiz] = await db
              .select()
              .from(AssessmentsTable)
              .where(
                and(
                  eq(AssessmentsTable.lessonId, lesson.id),
                  eq(AssessmentsTable.assessmentLevel, 'LESSON_QUIZ')
                )
              )
              .limit(1);
          }

          return {
            ...lesson,
            completionRules: completionRules || null,
            quiz,
          };
        })
      );

      // Get module assessment if exists
      let moduleAssessment = null;
      if (module.hasAssessment) {
        [moduleAssessment] = await db
          .select()
          .from(AssessmentsTable)
          .where(
            and(
              eq(AssessmentsTable.moduleId, module.id),
              eq(AssessmentsTable.assessmentLevel, 'MODULE_ASSESSMENT')
            )
          )
          .limit(1);
      }

      return {
        ...module,
        lessons: lessonsWithRules,
        moduleAssessment,
      };
    })
  );

  // Get course final assessment
  let finalAssessment = null;
  if (course.hasFinalAssessment) {
    [finalAssessment] = await db
      .select()
      .from(AssessmentsTable)
      .where(
        and(
          eq(AssessmentsTable.courseId, id),
          eq(AssessmentsTable.assessmentLevel, 'COURSE_FINAL')
        )
      )
      .limit(1);
  }

  const curriculum = {
    courseId: id,
    courseTitle: course.title,
    course: {
      ...course,
      hasFinalAssessment: course.hasFinalAssessment,
      finalAssessmentRequired: course.finalAssessmentRequired,
    },
    modules: modulesWithLessons,
    finalAssessment,
    totalModules: modulesWithLessons.length,
    totalLessons: modulesWithLessons.reduce((total, module) => total + module.lessons.length, 0)
  };

  return successResponse(curriculum);
};

// GET COURSE BY SLUG
const getCourseBySlug = async (slug: string) => {
  const [course] = await db
    .select({
      id: CoursesTable.id,
      slug: CoursesTable.slug,
      title: CoursesTable.title,
      shortDescription: CoursesTable.shortDescription,
      description: CoursesTable.description,
      thumbnailUrl: CoursesTable.thumbnailUrl,
      previewVideoUrl: CoursesTable.previewVideoUrl,
      duration: CoursesTable.duration,
      level: CoursesTable.level,
      language: CoursesTable.language,
      prerequisites: CoursesTable.prerequisites,
      status: CoursesTable.status,
      isFeatured: CoursesTable.isFeatured,
      maxStudents: CoursesTable.maxStudents,
      currentEnrollments: CoursesTable.currentEnrollments,
      isFree: CoursesTable.isFree,
      price: CoursesTable.price,
      discountPrice: CoursesTable.discountPrice,
      hasFinalAssessment: CoursesTable.hasFinalAssessment,
      finalAssessmentRequired: CoursesTable.finalAssessmentRequired,
      minimumCoursePassingScore: CoursesTable.minimumCoursePassingScore,
      requireAllModulesComplete: CoursesTable.requireAllModulesComplete,
      requireAllAssessmentsPassed: CoursesTable.requireAllAssessmentsPassed,
      createdAt: CoursesTable.createdAt,
      publishedAt: CoursesTable.publishedAt,
      collegeName: CollegesTable.collegeName,
      collegeId: CollegesTable.id,
      categoryName: CategoriesTable.name,
      categoryId: CategoriesTable.id,
    })
    .from(CoursesTable)
    .leftJoin(CollegesTable, eq(CoursesTable.collegeId, CollegesTable.id))
    .leftJoin(CategoriesTable, eq(CoursesTable.categoryId, CategoriesTable.id))
    .where(eq(CoursesTable.slug, slug))
    .limit(1);

  if (!course) {
    return errorResponse('Course not found', 'NOT_FOUND', 404);
  }

  const outcomes = await db
    .select()
    .from(CourseLearningOutcomesTable)
    .where(eq(CourseLearningOutcomesTable.courseId, course.id))
    .orderBy(CourseLearningOutcomesTable.sortOrder);

  const requirements = await db
    .select()
    .from(CourseRequirementsTable)
    .where(eq(CourseRequirementsTable.courseId, course.id))
    .orderBy(CourseRequirementsTable.sortOrder);

  const modules = await db
    .select()
    .from(CourseModulesTable)
    .where(eq(CourseModulesTable.courseId, course.id))
    .orderBy(CourseModulesTable.sortOrder);

  // Get lessons for each module
  const modulesWithLessons = await Promise.all(
    modules.map(async (module) => {
      const lessons = await db
        .select()
        .from(CourseLessonsTable)
        .where(eq(CourseLessonsTable.moduleId, module.id))
        .orderBy(CourseLessonsTable.sortOrder);

      return {
        ...module,
        lessons
      };
    })
  );

  return successResponse({
    ...course,
    outcomes,
    requirements,
    curriculum: {
      modules: modulesWithLessons,
      totalModules: modulesWithLessons.length,
      totalLessons: modulesWithLessons.reduce((total, module) => total + module.lessons.length, 0)
    }
  });
};


// CREATE ASSESSMENT QUESTIONS
const createAssessmentQuestions = async (assessmentId: string, questions: QuestionData[]) => {
  try {
    const createdQuestions = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      const [newQuestion] = await db
        .insert(AssessmentQuestionsTable)
        .values({
          assessmentId,
          questionText: question.questionText,
          questionType: question.questionType,
          difficulty: question.difficulty || 'MEDIUM',
          options: question.options || null,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation || null,
          points: question.points || 1,
          negativePoints: question.negativePoints || 0,
          questionBankId: question.questionBankId || null,
          sortOrder: i,
          isActive: true,
        })
        .returning();
      
      createdQuestions.push(newQuestion);
    }
    
    return createdQuestions;
  } catch (error: any) {
    console.error('Create assessment questions error:', error);
    throw error;
  }
};
// CREATE ASSESSMENT FOR COURSE
// CREATE ASSESSMENT FOR COURSE
const createAssessmentForCourse = async (courseId: string, request: NextRequest, params: SearchParams) => {
  try {
    const body = await request.json() as AssessmentData & { questions?: QuestionData[] };
    const assessmentLevel = params.assessmentLevel as 'LESSON_QUIZ' | 'MODULE_ASSESSMENT' | 'COURSE_FINAL';
    const lessonId = params.lessonId;
    const moduleId = params.moduleId;

    if (!assessmentLevel || !['LESSON_QUIZ', 'MODULE_ASSESSMENT', 'COURSE_FINAL'].includes(assessmentLevel)) {
      return errorResponse('Valid assessment level is required');
    }

    // Validate based on level
    if (assessmentLevel === 'LESSON_QUIZ' && !lessonId) {
      return errorResponse('Lesson ID is required for lesson quiz');
    }

    if (assessmentLevel === 'MODULE_ASSESSMENT' && !moduleId) {
      return errorResponse('Module ID is required for module assessment');
    }

    // Check if course exists
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, courseId))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    // For lesson quiz, check if lesson exists and doesn't already have a quiz
    if (lessonId) {
      const [lesson] = await db
        .select()
        .from(CourseLessonsTable)
        .where(eq(CourseLessonsTable.id, lessonId))
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
            eq(AssessmentsTable.lessonId, lessonId),
            eq(AssessmentsTable.assessmentLevel, 'LESSON_QUIZ')
          )
        )
        .limit(1);

      if (existingQuiz) {
        return errorResponse('Lesson already has a quiz', 'DUPLICATE', 409);
      }
    }

    // For module assessment, check if module exists
    if (moduleId) {
      const [module] = await db
        .select()
        .from(CourseModulesTable)
        .where(eq(CourseModulesTable.id, moduleId))
        .limit(1);

      if (!module) {
        return errorResponse('Module not found', 'NOT_FOUND', 404);
      }
    }

    // Create assessment
    const [newAssessment] = await db
      .insert(AssessmentsTable)
      .values({
        courseId,
        moduleId: moduleId || null,
        lessonId: lessonId || null,
        assessmentLevel,
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

    // Create questions if they exist
    let questions: { id: string; isActive: boolean; createdAt: Date; updatedAt: Date; sortOrder: number; assessmentId: string; questionBankId: string | null; questionText: string; questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"; difficulty: "EASY" | "MEDIUM" | "HARD"; options: unknown; correctAnswer: string; explanation: string | null; points: number; negativePoints: number; }[] = [];
    if (body.questions && Array.isArray(body.questions) && body.questions.length > 0) {
      questions = await createAssessmentQuestions(newAssessment.id, body.questions);
    }

    // Update flags
    if (assessmentLevel === 'LESSON_QUIZ' && lessonId) {
      await db
        .update(CourseLessonsTable)
        .set({
          hasQuiz: true,
          quizRequired: body.isRequired || false,
        })
        .where(eq(CourseLessonsTable.id, lessonId));
    } else if (assessmentLevel === 'MODULE_ASSESSMENT' && moduleId) {
      await db
        .update(CourseModulesTable)
        .set({
          hasAssessment: true,
          assessmentRequired: body.isRequired || false,
          minimumPassingScore: body.passingScore || 60,
        })
        .where(eq(CourseModulesTable.id, moduleId));
    } else if (assessmentLevel === 'COURSE_FINAL') {
      await db
        .update(CoursesTable)
        .set({
          hasFinalAssessment: true,
          finalAssessmentRequired: body.isRequired !== undefined ? body.isRequired : true,
          minimumCoursePassingScore: body.passingScore || 60,
        })
        .where(eq(CoursesTable.id, courseId));
    }

    return successResponse({
      assessment: newAssessment,
      questions: questions,
      message: 'Assessment created successfully'
    }, 'Assessment created successfully', 201);
  } catch (error: any) {
    console.error('Create assessment error:', error);
    return errorResponse(error.message || 'Failed to create assessment', 'ASSESSMENT_ERROR', 500);
  }
};

// GET COURSE COMPLETION STATUS
const getCourseCompletionStatus = async (courseId: string, userId: string) => {
  try {
    // Get course
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, courseId))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    // Get enrollment
    const [enrollment] = await db
      .select()
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.courseId, courseId)
        )
      )
      .limit(1);

    if (!enrollment) {
      return errorResponse('User is not enrolled in this course', 'NOT_ENROLLED', 403);
    }

    // Get modules
    const modules = await db
      .select()
      .from(CourseModulesTable)
      .where(eq(CourseModulesTable.courseId, courseId))
      .orderBy(asc(CourseModulesTable.sortOrder));

    // Get module completion status
    const moduleStatus = await Promise.all(
      modules.map(async (module) => {
        // Get lessons in module
        const lessons = await db
          .select()
          .from(CourseLessonsTable)
          .where(eq(CourseLessonsTable.moduleId, module.id))
          .orderBy(asc(CourseLessonsTable.sortOrder));

        // Get lesson progress
        const lessonStatus = await Promise.all(
          lessons.map(async (lesson) => {
            const [progress] = await db
              .select()
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
            // Check if lesson is complete based on rules
            let isComplete = false;
            if (progress) {
              const videoComplete = !completionRules?.requireVideoWatched ||
                (progress.videoPercentageWatched || 0) >= (completionRules.minVideoWatchPercentage || 90);

              const quizComplete = !lesson.hasQuiz ||
                !completionRules?.requireQuizPassed ||
                (progress.quizAttempted && progress.quizPassed);

              // Safely check resourcesViewed - it's JSONB type
              let resourcesComplete = true;
              if (completionRules?.requireResourcesViewed) {
                try {
                  // Parse resourcesViewed as an object
                  const resourcesViewed = progress.resourcesViewed as Record<string, any> | null;
                  resourcesComplete = resourcesViewed !== null &&
                    typeof resourcesViewed === 'object' &&
                    Object.keys(resourcesViewed).length > 0;
                } catch (error) {
                  resourcesComplete = false;
                }
              }

              isComplete = videoComplete && quizComplete && resourcesComplete && Boolean(progress.isCompleted);
            }

            return {
              id: lesson.id,
              title: lesson.title,
              hasQuiz: lesson.hasQuiz,
              quizRequired: lesson.quizRequired,
              progress: progress || null,
              isComplete,
              completionRules,
            };
          })
        );

        // Check if all lessons in module are complete
        const allLessonsComplete = lessonStatus.every(lesson => lesson.isComplete);

        // Check module assessment if it exists
        let moduleAssessmentPassed = true;
        if (module.hasAssessment && module.assessmentRequired) {
          const [assessment] = await db
            .select()
            .from(AssessmentsTable)
            .where(
              and(
                eq(AssessmentsTable.moduleId, module.id),
                eq(AssessmentsTable.assessmentLevel, 'MODULE_ASSESSMENT')
              )
            )
            .limit(1);

          if (assessment) {
            const [attempt] = await db
              .select()
              .from(AssessmentAttemptsTable)
              .where(
                and(
                  eq(AssessmentAttemptsTable.assessmentId, assessment.id),
                  eq(AssessmentAttemptsTable.userId, userId),
                  eq(AssessmentAttemptsTable.enrollmentId, enrollment.id),
                  eq(AssessmentAttemptsTable.status, 'COMPLETED'),
                  eq(AssessmentAttemptsTable.passed, true)
                )
              )
              .orderBy(desc(AssessmentAttemptsTable.attemptNumber))
              .limit(1);

            moduleAssessmentPassed = !!attempt;
          }
        }

        const isModuleComplete = module.requireAllLessonsComplete
          ? allLessonsComplete && (!module.hasAssessment || moduleAssessmentPassed)
          : true;

        return {
          id: module.id,
          title: module.title,
          hasAssessment: module.hasAssessment,
          assessmentRequired: module.assessmentRequired,
          allLessonsComplete,
          moduleAssessmentPassed,
          isComplete: isModuleComplete,
          lessons: lessonStatus,
        };
      })
    );

    // Check course final assessment
    let finalAssessmentPassed = true;
    if (course.hasFinalAssessment && course.finalAssessmentRequired) {
      const [finalAssessment] = await db
        .select()
        .from(AssessmentsTable)
        .where(
          and(
            eq(AssessmentsTable.courseId, courseId),
            eq(AssessmentsTable.assessmentLevel, 'COURSE_FINAL')
          )
        )
        .limit(1);

      if (finalAssessment) {
        const [attempt] = await db
          .select()
          .from(AssessmentAttemptsTable)
          .where(
            and(
              eq(AssessmentAttemptsTable.assessmentId, finalAssessment.id),
              eq(AssessmentAttemptsTable.userId, userId),
              eq(AssessmentAttemptsTable.enrollmentId, enrollment.id),
              eq(AssessmentAttemptsTable.status, 'COMPLETED'),
              eq(AssessmentAttemptsTable.passed, true)
            )
          )
          .orderBy(desc(AssessmentAttemptsTable.attemptNumber))
          .limit(1);

        finalAssessmentPassed = !!attempt;
      }
    }

    // Calculate overall completion
    const allModulesComplete = moduleStatus.every(module => module.isComplete);
    const allRequiredAssessmentsPassed = moduleStatus.every(module =>
      !module.hasAssessment || !module.assessmentRequired || module.moduleAssessmentPassed
    ) && (!course.hasFinalAssessment || !course.finalAssessmentRequired || finalAssessmentPassed);

    const isCourseComplete = course.requireAllModulesComplete
      ? allModulesComplete && allRequiredAssessmentsPassed
      : true;

    // Check if certificate can be issued
    const canIssueCertificate = isCourseComplete &&
      enrollment.overallScore !== undefined &&
      enrollment.overallScore !== null &&
      enrollment.overallScore >= (course.minimumCoursePassingScore || 60);

    return successResponse({
      courseId,
      userId,
      enrollmentId: enrollment.id,
      overallProgress: enrollment.progress,
      overallScore: enrollment.overallScore,
      finalAssessmentScore: enrollment.finalAssessmentScore,
      averageQuizScore: enrollment.averageQuizScore,
      completedLessons: enrollment.completedLessons,
      totalLessons: enrollment.totalLessons,
      completedAssessments: enrollment.completedAssessments,
      totalAssessments: enrollment.totalAssessments,
      moduleStatus,
      allModulesComplete,
      allRequiredAssessmentsPassed,
      finalAssessmentPassed,
      isCourseComplete,
      canIssueCertificate,
      certificateEligible: enrollment.certificateEligible,
      certificateIssued: enrollment.certificateIssued,
    });
  } catch (error: any) {
    console.error('Get completion status error:', error);
    return errorResponse(error.message || 'Failed to get completion status', 'COMPLETION_ERROR', 500);
  }
};

// ADD FACULTY TO COURSE
const addFacultyToCourse = async (courseId: string, request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.facultyId) {
      return errorResponse('Faculty ID is required');
    }

    // Check if course exists
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, courseId))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    // Check if faculty exists
    const [faculty] = await db
      .select()
      .from(FacultyTable)
      .where(eq(FacultyTable.id, body.facultyId))
      .limit(1);

    if (!faculty) {
      return errorResponse('Faculty not found', 'NOT_FOUND', 404);
    }

    // Check if already assigned
    const [existing] = await db
      .select()
      .from(CourseFacultyTable)
      .where(
        and(
          eq(CourseFacultyTable.courseId, courseId),
          eq(CourseFacultyTable.facultyId, body.facultyId)
        )
      )
      .limit(1);

    if (existing) {
      return errorResponse('Faculty is already assigned to this course', 'DUPLICATE', 409);
    }

    const [newAssignment] = await db
      .insert(CourseFacultyTable)
      .values({
        courseId,
        facultyId: body.facultyId,
        isPrimaryInstructor: body.isPrimaryInstructor || false,
        teachingRole: body.teachingRole || 'INSTRUCTOR',
      })
      .returning();

    return successResponse(newAssignment, 'Faculty added to course', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to add faculty', 'FACULTY_ERROR', 500);
  }
};

// REMOVE FACULTY FROM COURSE
const removeFacultyFromCourse = async (courseId: string, facultyId: string) => {
  try {
    // Check if assignment exists
    const [assignment] = await db
      .select()
      .from(CourseFacultyTable)
      .where(
        and(
          eq(CourseFacultyTable.courseId, courseId),
          eq(CourseFacultyTable.facultyId, facultyId)
        )
      )
      .limit(1);

    if (!assignment) {
      return errorResponse('Faculty is not assigned to this course', 'NOT_FOUND', 404);
    }

    await db
      .delete(CourseFacultyTable)
      .where(
        and(
          eq(CourseFacultyTable.courseId, courseId),
          eq(CourseFacultyTable.facultyId, facultyId)
        )
      );

    return successResponse({ courseId, facultyId }, 'Faculty removed from course');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to remove faculty', 'FACULTY_ERROR', 500);
  }
};

// GET COURSE PROGRESS FOR USER
const getUserCourseProgress = async (courseId: string, userId: string) => {
  try {
    // Get enrollment
    const [enrollment] = await db
      .select()
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.courseId, courseId)
        )
      )
      .limit(1);

    if (!enrollment) {
      return errorResponse('User is not enrolled in this course', 'NOT_ENROLLED', 403);
    }

    // Get all lessons in course
    const lessons = await db
      .select({
        id: CourseLessonsTable.id,
        title: CourseLessonsTable.title,
        moduleId: CourseLessonsTable.moduleId,
        moduleTitle: CourseModulesTable.title,
      })
      .from(CourseLessonsTable)
      .innerJoin(CourseModulesTable, eq(CourseLessonsTable.moduleId, CourseModulesTable.id))
      .where(eq(CourseLessonsTable.courseId, courseId))
      .orderBy(CourseModulesTable.sortOrder, CourseLessonsTable.sortOrder);

    // Get progress for each lesson
    const progress = await Promise.all(
      lessons.map(async (lesson) => {
        const [lessonProgress] = await db
          .select()
          .from(LessonProgressTable)
          .where(
            and(
              eq(LessonProgressTable.lessonId, lesson.id),
              eq(LessonProgressTable.userId, userId),
              eq(LessonProgressTable.enrollmentId, enrollment.id)
            )
          )
          .limit(1);

        return {
          ...lesson,
          progress: lessonProgress || null,
          isCompleted: lessonProgress?.isCompleted || false,
        };
      })
    );

    return successResponse({
      enrollment,
      progress,
      totalLessons: lessons.length,
      completedLessons: progress.filter(p => p.isCompleted).length,
      progressPercentage: lessons.length > 0 ?
        Math.round((progress.filter(p => p.isCompleted).length / lessons.length) * 100) : 0,
    });
  } catch (error: any) {
    console.error('Get user progress error:', error);
    return errorResponse(error.message || 'Failed to get progress', 'PROGRESS_ERROR', 500);
  }
};

// GET COURSE STATISTICS
const getCourseStatistics = async (courseId: string) => {
  try {
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, courseId))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    // Get total enrollments
    const totalEnrollments = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(EnrollmentsTable)
      .where(eq(EnrollmentsTable.courseId, courseId))
      .then(result => Number(result[0]?.count || 0));

    // Get active enrollments
    const activeEnrollments = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.courseId, courseId),
          eq(EnrollmentsTable.status, 'ACTIVE')
        )
      )
      .then(result => Number(result[0]?.count || 0));

    // Get completed enrollments
    const completedEnrollments = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.courseId, courseId),
          eq(EnrollmentsTable.status, 'COMPLETED')
        )
      )
      .then(result => Number(result[0]?.count || 0));

    // Get average progress
    const averageProgress = await db
      .select({ avg: sql<number>`AVG(${EnrollmentsTable.progress})` })
      .from(EnrollmentsTable)
      .where(eq(EnrollmentsTable.courseId, courseId))
      .then(result => Number(result[0]?.avg || 0));

    // Get average score
    const averageScore = await db
      .select({ avg: sql<number>`AVG(${EnrollmentsTable.overallScore})` })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.courseId, courseId),
          sql`${EnrollmentsTable.overallScore} IS NOT NULL`
        )
      )
      .then(result => Number(result[0]?.avg || 0));

    // Get module completion statistics
    const modules = await db
      .select()
      .from(CourseModulesTable)
      .where(eq(CourseModulesTable.courseId, courseId))
      .orderBy(CourseModulesTable.sortOrder);

    const moduleStats = await Promise.all(
      modules.map(async (module) => {
        // Get lessons in module
        const lessons = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(CourseLessonsTable)
          .where(eq(CourseLessonsTable.moduleId, module.id))
          .then(result => Number(result[0]?.count || 0));

        // Get students who completed this module
        const completedStudents = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${EnrollmentsTable.userId})` })
          .from(EnrollmentsTable)
          .innerJoin(LessonProgressTable, eq(EnrollmentsTable.id, LessonProgressTable.enrollmentId))
          .innerJoin(CourseLessonsTable, eq(LessonProgressTable.lessonId, CourseLessonsTable.id))
          .where(
            and(
              eq(EnrollmentsTable.courseId, courseId),
              eq(CourseLessonsTable.moduleId, module.id),
              eq(LessonProgressTable.isCompleted, true)
            )
          )
          .then(result => Number(result[0]?.count || 0));

        return {
          id: module.id,
          title: module.title,
          totalLessons: lessons,
          completedStudents,
          completionRate: totalEnrollments > 0 ? Math.round((completedStudents / totalEnrollments) * 100) : 0,
        };
      })
    );

    return successResponse({
      courseId,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0,
      averageProgress: Math.round(averageProgress),
      averageScore: Math.round(averageScore),
      moduleStats,
    });
  } catch (error: any) {
    console.error('Get course statistics error:', error);
    return errorResponse(error.message || 'Failed to get statistics', 'STATS_ERROR', 500);
  }
};

// GET COURSE ANALYTICS
const getCourseAnalytics = async (courseId: string) => {
  try {
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, courseId))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    // Get enrollment trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const enrollmentTrends = await db
      .select({
        date: sql<string>`DATE(${EnrollmentsTable.enrolledAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.courseId, courseId),
          sql`${EnrollmentsTable.enrolledAt} >= ${thirtyDaysAgo}`
        )
      )
      .groupBy(sql`DATE(${EnrollmentsTable.enrolledAt})`)
      .orderBy(sql`DATE(${EnrollmentsTable.enrolledAt})`);

    // Get assessment performance
    const assessments = await db
      .select()
      .from(AssessmentsTable)
      .where(eq(AssessmentsTable.courseId, courseId));

    const assessmentPerformance = await Promise.all(
      assessments.map(async (assessment) => {
        const attempts = await db
          .select()
          .from(AssessmentAttemptsTable)
          .where(
            and(
              eq(AssessmentAttemptsTable.assessmentId, assessment.id),
              eq(AssessmentAttemptsTable.status, 'COMPLETED')
            )
          );

        const totalAttempts = attempts.length;
        const passedAttempts = attempts.filter(a => a.passed).length;
        const averageScore = attempts.length > 0 ?
          Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length) : 0;

        return {
          id: assessment.id,
          title: assessment.title,
          assessmentLevel: assessment.assessmentLevel,
          totalAttempts,
          passedAttempts,
          passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
          averageScore,
        };
      })
    );

    // Get student performance distribution
    const performanceDistribution = await db
      .select({
        range: sql<string>`CASE
          WHEN ${EnrollmentsTable.overallScore} >= 90 THEN '90-100'
          WHEN ${EnrollmentsTable.overallScore} >= 80 THEN '80-89'
          WHEN ${EnrollmentsTable.overallScore} >= 70 THEN '70-79'
          WHEN ${EnrollmentsTable.overallScore} >= 60 THEN '60-69'
          ELSE 'Below 60'
        END`,
        count: sql<number>`COUNT(*)`,
      })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.courseId, courseId),
          sql`${EnrollmentsTable.overallScore} IS NOT NULL`
        )
      )
      .groupBy(sql`range`)
      .orderBy(sql`range`);

    // Get top performing students
    const topStudents = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        progress: EnrollmentsTable.progress,
        overallScore: EnrollmentsTable.overallScore,
        completedAt: EnrollmentsTable.completedAt,
      })
      .from(EnrollmentsTable)
      .innerJoin(UsersTable, eq(EnrollmentsTable.userId, UsersTable.id))
      .where(
        and(
          eq(EnrollmentsTable.courseId, courseId),
          sql`${EnrollmentsTable.overallScore} IS NOT NULL`
        )
      )
      .orderBy(desc(EnrollmentsTable.overallScore))
      .limit(10);

    return successResponse({
      courseId,
      enrollmentTrends,
      assessmentPerformance,
      performanceDistribution,
      topStudents,
    });
  } catch (error: any) {
    console.error('Get course analytics error:', error);
    return errorResponse(error.message || 'Failed to get analytics', 'ANALYTICS_ERROR', 500);
  }
};

// GET QUESTION BANKS FOR COURSE
const getCourseQuestionBanks = async (courseId: string) => {
  try {
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, courseId))
      .limit(1);

    if (!course) {
      return errorResponse('Course not found', 'NOT_FOUND', 404);
    }

    // Get question banks from the same college
    const questionBanks = await db
      .select()
      .from(QuestionBanksTable)
      .where(
        and(
          eq(QuestionBanksTable.collegeId, course.collegeId!),
          eq(QuestionBanksTable.isActive, true)
        )
      )
      .orderBy(desc(QuestionBanksTable.createdAt));

    // Get questions count for each bank
    const banksWithCounts = await Promise.all(
      questionBanks.map(async (bank) => {
        const [count] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(AssessmentQuestionsTable)
          .where(eq(AssessmentQuestionsTable.questionBankId, bank.id));

        return {
          ...bank,
          questionCount: Number(count?.count || 0),
        };
      })
    );

    return successResponse(banksWithCounts);
  } catch (error: any) {
    console.error('Get question banks error:', error);
    return errorResponse(error.message || 'Failed to get question banks', 'QUESTION_BANK_ERROR', 500);
  }
};

// GET LESSON COMPLETION RULES
const getLessonCompletionRules = async (lessonId: string) => {
  try {
    const [rules] = await db
      .select()
      .from(LessonCompletionRulesTable)
      .where(eq(LessonCompletionRulesTable.lessonId, lessonId))
      .limit(1);

    if (!rules) {
      // Create default rules if not exists
      const [lesson] = await db
        .select()
        .from(CourseLessonsTable)
        .where(eq(CourseLessonsTable.id, lessonId))
        .limit(1);

      if (!lesson) {
        return errorResponse('Lesson not found', 'NOT_FOUND', 404);
      }

      const [newRules] = await db
        .insert(LessonCompletionRulesTable)
        .values({
          lessonId,
          requireVideoWatched: lesson.contentType === 'VIDEO',
          minVideoWatchPercentage: 90,
          requireQuizPassed: lesson.hasQuiz && lesson.quizRequired,
          requireResourcesViewed: false,
        })
        .returning();

      return successResponse(newRules);
    }

    return successResponse(rules);
  } catch (error: any) {
    console.error('Get completion rules error:', error);
    return errorResponse(error.message || 'Failed to get completion rules', 'RULES_ERROR', 500);
  }
};

// UPDATE LESSON COMPLETION RULES
const updateLessonCompletionRules = async (lessonId: string, request: NextRequest) => {
  try {
    const body = await request.json() as CompletionRulesData;

    const [lesson] = await db
      .select()
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.id, lessonId))
      .limit(1);

    if (!lesson) {
      return errorResponse('Lesson not found', 'NOT_FOUND', 404);
    }

    // Check if rules exist
    const [existingRules] = await db
      .select()
      .from(LessonCompletionRulesTable)
      .where(eq(LessonCompletionRulesTable.lessonId, lessonId))
      .limit(1);

    let updatedRules;
    if (existingRules) {
      [updatedRules] = await db
        .update(LessonCompletionRulesTable)
        .set({
          requireVideoWatched: body.requireVideoWatched !== undefined ? body.requireVideoWatched : existingRules.requireVideoWatched,
          minVideoWatchPercentage: body.minVideoWatchPercentage || existingRules.minVideoWatchPercentage,
          requireQuizPassed: body.requireQuizPassed !== undefined ? body.requireQuizPassed : existingRules.requireQuizPassed,
          requireResourcesViewed: body.requireResourcesViewed !== undefined ? body.requireResourcesViewed : existingRules.requireResourcesViewed,
          updatedAt: new Date(),
        })
        .where(eq(LessonCompletionRulesTable.lessonId, lessonId))
        .returning();
    } else {
      [updatedRules] = await db
        .insert(LessonCompletionRulesTable)
        .values({
          lessonId,
          requireVideoWatched: body.requireVideoWatched !== undefined ? body.requireVideoWatched : lesson.contentType === 'VIDEO',
          minVideoWatchPercentage: body.minVideoWatchPercentage || 90,
          requireQuizPassed: body.requireQuizPassed !== undefined ? body.requireQuizPassed : (lesson.hasQuiz && lesson.quizRequired),
          requireResourcesViewed: body.requireResourcesViewed !== undefined ? body.requireResourcesViewed : false,
        })
        .returning();
    }

    return successResponse(updatedRules, 'Completion rules updated successfully');
  } catch (error: any) {
    console.error('Update completion rules error:', error);
    return errorResponse(error.message || 'Failed to update completion rules', 'RULES_ERROR', 500);
  }
};

// MARK LESSON AS COMPLETE FOR USER
const markLessonCompleteForUser = async (lessonId: string, userId: string) => {
  try {
    // Get lesson
    const [lesson] = await db
      .select()
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.id, lessonId))
      .limit(1);

    if (!lesson) {
      return errorResponse('Lesson not found', 'NOT_FOUND', 404);
    }

    // Get user enrollment
    const [enrollment] = await db
      .select()
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.userId, userId),
          eq(EnrollmentsTable.courseId, lesson.courseId),
          eq(EnrollmentsTable.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!enrollment) {
      return errorResponse('User is not enrolled in this course', 'NOT_ENROLLED', 403);
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
          videoPercentageWatched: 100,
        })
        .returning();
    }

    // Update enrollment statistics
    await updateEnrollmentProgress(enrollment.id, lesson.courseId);

    return successResponse(progress, 'Lesson marked as complete');
  } catch (error: any) {
    console.error('Mark lesson complete error:', error);
    return errorResponse(error.message || 'Failed to mark lesson as complete', 'COMPLETE_ERROR', 500);
  }
};

// Update enrollment progress
const updateEnrollmentProgress = async (enrollmentId: string, courseId: string) => {
  try {
    // Get total lessons in course
    const totalLessons = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(CourseLessonsTable)
      .where(eq(CourseLessonsTable.courseId, courseId))
      .then(result => Number(result[0]?.count || 0));

    // Get completed lessons for this enrollment
    const completedLessons = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(LessonProgressTable)
      .where(
        and(
          eq(LessonProgressTable.enrollmentId, enrollmentId),
          eq(LessonProgressTable.isCompleted, true)
        )
      )
      .then(result => Number(result[0]?.count || 0));

    // Calculate progress percentage
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Update enrollment
    await db
      .update(EnrollmentsTable)
      .set({
        progress,
        completedLessons,
        totalLessons,
        lastAccessedAt: new Date(),
      })
      .where(eq(EnrollmentsTable.id, enrollmentId));

  } catch (error) {
    console.error('Update enrollment progress error:', error);
  }
};

// ===========================
// API ROUTE HANDLERS
// ===========================

// GET Handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: SearchParams = {
      id: searchParams.get('id') || undefined,
      slug: searchParams.get('slug') || undefined,
      curriculum: searchParams.get('curriculum') || undefined,
      modules: searchParams.get('modules') || undefined,
      completion: searchParams.get('completion') || undefined,
      userId: searchParams.get('userId') || undefined,
      faculty: searchParams.get('faculty') || undefined,
      progress: searchParams.get('progress') || undefined,
      stats: searchParams.get('stats') || undefined,
      analytics: searchParams.get('analytics') || undefined,
      questionBank: searchParams.get('questionBank') || undefined,
      completionRules: searchParams.get('completionRules') || undefined,
      lessonId: searchParams.get('lessonId') || undefined,
    };

    // Route: GET /api/courses?slug=course-slug
    if (params.slug) {
      return await getCourseBySlug(params.slug);
    }

    // Route: GET /api/courses?id=123&curriculum=true
    if (params.id && parseBoolean(params.curriculum)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getCourseCurriculumWithLessons(params.id);
    }

    // Route: GET /api/courses?id=123&modules=true
    if (params.id && parseBoolean(params.modules)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getCourseModules(params.id);
    }

    // Route: GET /api/courses?id=123&completion=true&userId=456
    if (params.id && parseBoolean(params.completion) && params.userId) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      const validation2 = validateId(params.userId);
      if (!validation2.valid) {
        return errorResponse(validation2.error!);
      }
      return await getCourseCompletionStatus(params.id, params.userId);
    }

    // Route: GET /api/courses?id=123&faculty=true
    if (params.id && parseBoolean(params.faculty)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      // Return faculty for course (already included in getCourseById)
      return await getCourseById(params.id);
    }

    // Route: GET /api/courses?id=123&progress=true&userId=456
    if (params.id && parseBoolean(params.progress) && params.userId) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      const validation2 = validateId(params.userId);
      if (!validation2.valid) {
        return errorResponse(validation2.error!);
      }
      return await getUserCourseProgress(params.id, params.userId);
    }

    // Route: GET /api/courses?id=123&stats=true
    if (params.id && parseBoolean(params.stats)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getCourseStatistics(params.id);
    }

    // Route: GET /api/courses?id=123&analytics=true
    if (params.id && parseBoolean(params.analytics)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getCourseAnalytics(params.id);
    }

    // Route: GET /api/courses?id=123&questionBank=true
    if (params.id && parseBoolean(params.questionBank)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getCourseQuestionBanks(params.id);
    }

    // Route: GET /api/courses?lessonId=123&completionRules=true
    if (params.lessonId && parseBoolean(params.completionRules)) {
      const validation = validateId(params.lessonId);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getLessonCompletionRules(params.lessonId);
    }

    // Route: GET /api/courses?id=123
    if (params.id) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getCourseById(params.id);
    }

    // Route: GET /api/courses (list all)
    return await listCourses();
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
      submit: searchParams.get('submit') || undefined,
      approve: searchParams.get('approve') || undefined,
      reject: searchParams.get('reject') || undefined,
      modules: searchParams.get('modules') || undefined,
      outcomes: searchParams.get('outcomes') || undefined,
      requirements: searchParams.get('requirements') || undefined,
      lessons: searchParams.get('lessons') || undefined,
      assessments: searchParams.get('assessments') || undefined,
      assessmentLevel: searchParams.get('assessmentLevel') || undefined,
      lessonId: searchParams.get('lessonId') || undefined,
      moduleId: searchParams.get('moduleId') || undefined,
      addFaculty: searchParams.get('addFaculty') || undefined,
      markComplete: searchParams.get('markComplete') || undefined,
      userId: searchParams.get('userId') || undefined,
    };

    // Route: POST /api/courses?id=123&submit=true
    if (params.id && parseBoolean(params.submit)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await submitCourse(params.id);
    }

    // Route: POST /api/courses?id=123&approve=true
    if (params.id && parseBoolean(params.approve)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await approveCourse(params.id, request);
    }

    // Route: POST /api/courses?id=123&reject=true
    if (params.id && parseBoolean(params.reject)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await rejectCourse(params.id, request);
    }

    // Route: POST /api/courses?id=123&modules=true
    if (params.id && parseBoolean(params.modules)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await createModule(params.id, request);
    }

    // Route: POST /api/courses?id=123&outcomes=true
    if (params.id && parseBoolean(params.outcomes)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await addLearningOutcome(params.id, request);
    }

    // Route: POST /api/courses?id=123&requirements=true
    if (params.id && parseBoolean(params.requirements)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await addRequirement(params.id, request);
    }

    // Route: POST /api/courses?id=123&lessons=true&moduleId=456
    if (params.id && parseBoolean(params.lessons)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await createLesson(params.id, request);
    }

    // Route: POST /api/courses?id=123&assessments=true&level=LESSON_QUIZ&lessonId=456
    if (params.id && parseBoolean(params.assessments)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await createAssessmentForCourse(params.id, request, params);
    }

    // Route: POST /api/courses?id=123&addFaculty=true
    if (params.id && parseBoolean(params.addFaculty)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await addFacultyToCourse(params.id, request);
    }

    // Route: POST /api/courses?id=123&markComplete=true&lessonId=456&userId=789
    if (params.id && parseBoolean(params.markComplete) && params.lessonId && params.userId) {
      const validation = validateId(params.lessonId);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      const validation2 = validateId(params.userId);
      if (!validation2.valid) {
        return errorResponse(validation2.error!);
      }
      return await markLessonCompleteForUser(params.lessonId, params.userId);
    }

    // Route: POST /api/courses (create new course)
    return await createCourse(request);
  } catch (error: any) {
    console.error('POST error:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

// PUT Handler
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: SearchParams = {
      id: searchParams.get('id') || undefined,
      publish: searchParams.get('publish') || undefined,
      archive: searchParams.get('archive') || undefined,
      updateModule: searchParams.get('updateModule') || undefined,
      updateOutcome: searchParams.get('updateOutcome') || undefined,
      updateRequirement: searchParams.get('updateRequirement') || undefined,
      updateLesson: searchParams.get('updateLesson') || undefined,
      updateCompletionRules: searchParams.get('updateCompletionRules') || undefined,
      lessonId: searchParams.get('lessonId') || undefined,
    };

    if (!params.id) {
      return errorResponse('ID is required for update operations');
    }

    const validation = validateId(params.id);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    // Route: PUT /api/courses?id=123&updateModule=true
    if (parseBoolean(params.updateModule)) {
      return await updateModule(params.id, request);
    }

    // Route: PUT /api/courses?id=123&updateOutcome=true
    if (parseBoolean(params.updateOutcome)) {
      return await updateOutcome(params.id, request);
    }

    // Route: PUT /api/courses?id=123&updateRequirement=true
    if (parseBoolean(params.updateRequirement)) {
      return await updateRequirement(params.id, request);
    }

    // Route: PUT /api/courses?id=123&updateLesson=true
    if (parseBoolean(params.updateLesson)) {
      return await updateLesson(params.id, request);
    }

    // Route: PUT /api/courses?id=123&updateCompletionRules=true&lessonId=456
    if (parseBoolean(params.updateCompletionRules) && params.lessonId) {
      const validation2 = validateId(params.lessonId);
      if (!validation2.valid) {
        return errorResponse(validation2.error!);
      }
      return await updateLessonCompletionRules(params.lessonId, request);
    }

    // Route: PUT /api/courses?id=123&publish=true
    if (parseBoolean(params.publish)) {
      return await publishCourse(params.id);
    }

    // Route: PUT /api/courses?id=123&archive=true
    if (parseBoolean(params.archive)) {
      return await archiveCourse(params.id);
    }

    // Route: PUT /api/courses?id=123 (general course update)
    return await updateCourse(params.id, request);
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
      deleteModule: searchParams.get('deleteModule') || undefined,
      deleteOutcome: searchParams.get('deleteOutcome') || undefined,
      deleteRequirement: searchParams.get('deleteRequirement') || undefined,
      deleteLesson: searchParams.get('deleteLesson') || undefined,
      removeFaculty: searchParams.get('removeFaculty') || undefined,
      facultyId: searchParams.get('facultyId') || undefined,
    };

    if (!params.id) {
      return errorResponse('ID is required for delete operation');
    }

    const validation = validateId(params.id);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    // Route: DELETE /api/courses?id=123&deleteModule=true
    if (parseBoolean(params.deleteModule)) {
      return await deleteModule(params.id);
    }

    // Route: DELETE /api/courses?id=123&deleteOutcome=true
    if (parseBoolean(params.deleteOutcome)) {
      return await deleteOutcome(params.id);
    }

    // Route: DELETE /api/courses?id=123&deleteRequirement=true
    if (parseBoolean(params.deleteRequirement)) {
      return await deleteRequirement(params.id);
    }

    // Route: DELETE /api/courses?id=123&deleteLesson=true
    if (parseBoolean(params.deleteLesson)) {
      return await deleteLesson(params.id);
    }

    // Route: DELETE /api/courses?id=123&removeFaculty=true&facultyId=456
    if (parseBoolean(params.removeFaculty) && params.facultyId) {
      const validation2 = validateId(params.facultyId);
      if (!validation2.valid) {
        return errorResponse(validation2.error!);
      }
      return await removeFacultyFromCourse(params.id, params.facultyId);
    }

    // Route: DELETE /api/courses?id=123 (delete course)
    return await deleteCourse(params.id);
  } catch (error: any) {
    console.error('DELETE error:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}