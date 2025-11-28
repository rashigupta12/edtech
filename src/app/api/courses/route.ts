/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/courses/route.ts
import { db } from '@/db';
import {
  CategoriesTable,
  CollegesTable,
  CourseLearningOutcomesTable,
  CourseModulesTable,
  CourseRequirementsTable,
  CoursesTable,
} from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
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
  submit?: string;
  approve?: string;
  reject?: string;
  publish?: string;
  archive?: string;
  curriculum?: string;
  modules?: string;
  outcomes?: string;
  requirements?: string;
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

  return successResponse(course);
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
        status: 'DRAFT',
        isFeatured: false,
        maxStudents: body.maxStudents || null,
        currentEnrollments: 0,
        isFree: body.isFree ?? true,
        price: body.price || null,
        discountPrice: body.discountPrice || null,
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
    // Get admin user ID from auth
    // const adminId = await getAuthUserId(request);

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
        // approvedBy: adminId,
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

// ===========================
// MAIN ROUTE HANDLERS
// ===========================

// GET Handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: SearchParams = {
      id: searchParams.get('id') || undefined,
      curriculum: searchParams.get('curriculum') || undefined,
      modules: searchParams.get('modules') || undefined,
    };

    // Route: GET /api/courses?id=123&curriculum=true
    if (params.id && parseBoolean(params.curriculum)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getCourseCurriculum(params.id);
    }

    // Route: GET /api/courses?id=123&modules=true
    if (params.id && parseBoolean(params.modules)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getCourseModules(params.id);
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

    // Route: POST /api/courses (create new)
    return await createCourse(request);
  } catch (error: any) {
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
    };

    if (!params.id) {
      return errorResponse('ID is required for update operations');
    }

    const validation = validateId(params.id);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    // Route: PUT /api/courses?id=123&publish=true
    if (parseBoolean(params.publish)) {
      return await publishCourse(params.id);
    }

    // Route: PUT /api/courses?id=123&archive=true
    if (parseBoolean(params.archive)) {
      return await archiveCourse(params.id);
    }

    // Route: PUT /api/courses?id=123 (general update)
    return await updateCourse(params.id, request);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

// DELETE Handler
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('ID is required for delete operation');
    }

    const validation = validateId(id);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    // Route: DELETE /api/courses?id=123
    return await deleteCourse(id);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}