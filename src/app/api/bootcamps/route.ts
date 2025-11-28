// src/app/api/bootcamps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { BootcampsTable, BootcampCoursesTable, CoursesTable, CollegesTable } from '@/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

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

const generateSlug = (title: string): string => {
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
};

// ===========================
// CONTROLLERS
// ===========================

// LIST ALL BOOTCAMPS
const listBootcamps = async () => {
  const bootcamps = await db
    .select({
      id: BootcampsTable.id,
      slug: BootcampsTable.slug,
      title: BootcampsTable.title,
      description: BootcampsTable.description,
      thumbnailUrl: BootcampsTable.thumbnailUrl,
      duration: BootcampsTable.duration,
      status: BootcampsTable.status,
      startDate: BootcampsTable.startDate,
      endDate: BootcampsTable.endDate,
      currentEnrollments: BootcampsTable.currentEnrollments,
      collegeName: CollegesTable.collegeName,
      createdAt: BootcampsTable.createdAt,
    })
    .from(BootcampsTable)
    .leftJoin(CollegesTable, eq(BootcampsTable.collegeId, CollegesTable.id))
    .orderBy(desc(BootcampsTable.createdAt));

  return successResponse(bootcamps);
};

// GET PENDING BOOTCAMPS
const getPendingBootcamps = async () => {
  const pending = await db
    .select()
    .from(BootcampsTable)
    .where(eq(BootcampsTable.status, 'PENDING_APPROVAL'))
    .orderBy(desc(BootcampsTable.createdAt));

  return successResponse(pending);
};

// GET BOOTCAMP BY ID
const getBootcampById = async (id: string) => {
  const [bootcamp] = await db.select().from(BootcampsTable).where(eq(BootcampsTable.id, id)).limit(1);
  if (!bootcamp) return errorResponse('Bootcamp not found', 'NOT_FOUND', 404);
  return successResponse(bootcamp);
};

// GET BOOTCAMP BY SLUG
const getBootcampBySlug = async (slug: string) => {
  const [bootcamp] = await db.select().from(BootcampsTable).where(eq(BootcampsTable.slug, slug)).limit(1);
  if (!bootcamp) return errorResponse('Bootcamp not found', 'NOT_FOUND', 404);
  return successResponse(bootcamp);
};

// GET COLLEGE BOOTCAMPS
const getCollegeBootcamps = async (collegeId: string) => {
  const bootcamps = await db
    .select()
    .from(BootcampsTable)
    .where(eq(BootcampsTable.collegeId, collegeId))
    .orderBy(desc(BootcampsTable.createdAt));

  return successResponse(bootcamps);
};

// GET BOOTCAMP COURSES
const getBootcampCourses = async (id: string) => {
  const courses = await db
    .select({
      id: CoursesTable.id,
      title: CoursesTable.title,
      slug: CoursesTable.slug,
      thumbnailUrl: CoursesTable.thumbnailUrl,
      duration: CoursesTable.duration,
      level: CoursesTable.level,
      sortOrder: BootcampCoursesTable.sortOrder,
    })
    .from(BootcampCoursesTable)
    .innerJoin(CoursesTable, eq(BootcampCoursesTable.courseId, CoursesTable.id))
    .where(eq(BootcampCoursesTable.bootcampId, id))
    .orderBy(BootcampCoursesTable.sortOrder);

  return successResponse(courses);
};

// CREATE BOOTCAMP
const createBootcamp = async (request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.title || !body.createdBy) {
      return errorResponse('Missing required fields: title, createdBy');
    }

    const slug = body.slug || generateSlug(body.title);
    const [existing] = await db.select().from(BootcampsTable).where(eq(BootcampsTable.slug, slug)).limit(1);
    if (existing) return errorResponse('Bootcamp slug already exists', 'DUPLICATE', 409);

    const [newBootcamp] = await db
      .insert(BootcampsTable)
      .values({
        slug,
        title: body.title,
        description: body.description,
        createdBy: body.createdBy,
        collegeId: body.collegeId || null,
        thumbnailUrl: body.thumbnailUrl || null,
        duration: body.duration,
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        status: 'DRAFT',
        maxStudents: body.maxStudents || null,
        currentEnrollments: 0,
        isFree: body.isFree ?? true,
      })
      .returning();

    return successResponse(newBootcamp, 'Bootcamp created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create bootcamp', 'CREATE_ERROR', 500);
  }
};

// UPDATE BOOTCAMP
const updateBootcamp = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();
    const [bootcamp] = await db.select().from(BootcampsTable).where(eq(BootcampsTable.id, id)).limit(1);
    if (!bootcamp) return errorResponse('Bootcamp not found', 'NOT_FOUND', 404);

    const [updated] = await db.update(BootcampsTable).set({ ...body, updatedAt: new Date() }).where(eq(BootcampsTable.id, id)).returning();
    return successResponse(updated, 'Bootcamp updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update bootcamp', 'UPDATE_ERROR', 500);
  }
};

// DELETE BOOTCAMP
const deleteBootcamp = async (id: string) => {
  try {
    const [bootcamp] = await db.select().from(BootcampsTable).where(eq(BootcampsTable.id, id)).limit(1);
    if (!bootcamp) return errorResponse('Bootcamp not found', 'NOT_FOUND', 404);

    await db.delete(BootcampsTable).where(eq(BootcampsTable.id, id));
    return successResponse({ id }, 'Bootcamp deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete bootcamp', 'DELETE_ERROR', 500);
  }
};

// SUBMIT FOR APPROVAL
const submitBootcamp = async (id: string) => {
  try {
    const [bootcamp] = await db.select().from(BootcampsTable).where(eq(BootcampsTable.id, id)).limit(1);
    if (!bootcamp) return errorResponse('Bootcamp not found', 'NOT_FOUND', 404);
    if (bootcamp.status !== 'DRAFT') return errorResponse('Only draft bootcamps can be submitted', 'INVALID_STATE', 400);

    const [submitted] = await db
      .update(BootcampsTable)
      .set({ status: 'PENDING_APPROVAL', submittedForApprovalAt: new Date(), updatedAt: new Date() })
      .where(eq(BootcampsTable.id, id))
      .returning();

    return successResponse(submitted, 'Bootcamp submitted for approval');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to submit bootcamp', 'SUBMIT_ERROR', 500);
  }
};

// APPROVE BOOTCAMP
const approveBootcamp = async (id: string) => {
  try {
    const [bootcamp] = await db.select().from(BootcampsTable).where(eq(BootcampsTable.id, id)).limit(1);
    if (!bootcamp) return errorResponse('Bootcamp not found', 'NOT_FOUND', 404);
    if (bootcamp.status !== 'PENDING_APPROVAL') return errorResponse('Bootcamp is not pending approval', 'INVALID_STATE', 400);

    const [approved] = await db
      .update(BootcampsTable)
      .set({ status: 'APPROVED', approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(BootcampsTable.id, id))
      .returning();

    return successResponse(approved, 'Bootcamp approved successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to approve bootcamp', 'APPROVE_ERROR', 500);
  }
};

// REJECT BOOTCAMP
const rejectBootcamp = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.reason) return errorResponse('Rejection reason is required');

    const [bootcamp] = await db.select().from(BootcampsTable).where(eq(BootcampsTable.id, id)).limit(1);
    if (!bootcamp) return errorResponse('Bootcamp not found', 'NOT_FOUND', 404);

    const [rejected] = await db
      .update(BootcampsTable)
      .set({ status: 'REJECTED', rejectionReason: body.reason, updatedAt: new Date() })
      .where(eq(BootcampsTable.id, id))
      .returning();

    return successResponse(rejected, 'Bootcamp rejected');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to reject bootcamp', 'REJECT_ERROR', 500);
  }
};

// PUBLISH BOOTCAMP
const publishBootcamp = async (id: string) => {
  try {
    const [bootcamp] = await db.select().from(BootcampsTable).where(eq(BootcampsTable.id, id)).limit(1);
    if (!bootcamp) return errorResponse('Bootcamp not found', 'NOT_FOUND', 404);
    if (bootcamp.status !== 'APPROVED') return errorResponse('Only approved bootcamps can be published', 'INVALID_STATE', 400);

    const [published] = await db.update(BootcampsTable).set({ status: 'PUBLISHED', updatedAt: new Date() }).where(eq(BootcampsTable.id, id)).returning();
    return successResponse(published, 'Bootcamp published successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to publish bootcamp', 'PUBLISH_ERROR', 500);
  }
};

// ADD COURSE TO BOOTCAMP
const addCourseToBootcamp = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.courseId) return errorResponse('Course ID is required');

    const [bootcamp] = await db.select().from(BootcampsTable).where(eq(BootcampsTable.id, id)).limit(1);
    if (!bootcamp) return errorResponse('Bootcamp not found', 'NOT_FOUND', 404);

    const [maxOrder] = await db
      .select({ max: sql<number>`MAX(${BootcampCoursesTable.sortOrder})` })
      .from(BootcampCoursesTable)
      .where(eq(BootcampCoursesTable.bootcampId, id));

    const sortOrder = (maxOrder?.max ?? -1) + 1;

    const [added] = await db
      .insert(BootcampCoursesTable)
      .values({ bootcampId: id, courseId: body.courseId, sortOrder: body.sortOrder ?? sortOrder })
      .returning();

    return successResponse(added, 'Course added to bootcamp', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to add course', 'ADD_COURSE_ERROR', 500);
  }
};

// REMOVE COURSE FROM BOOTCAMP
const removeCourseFromBootcamp = async (id: string, courseId: string) => {
  try {
    await db.delete(BootcampCoursesTable).where(and(eq(BootcampCoursesTable.bootcampId, id), eq(BootcampCoursesTable.courseId, courseId)));
    return successResponse({ bootcampId: id, courseId }, 'Course removed from bootcamp');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to remove course', 'REMOVE_COURSE_ERROR', 500);
  }
};

// REORDER COURSES
const reorderCourses = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();
    if (!Array.isArray(body.courses)) return errorResponse('Courses array is required');

    // Update sort order for each course
    for (const course of body.courses) {
      await db
        .update(BootcampCoursesTable)
        .set({ sortOrder: course.sortOrder })
        .where(and(eq(BootcampCoursesTable.bootcampId, id), eq(BootcampCoursesTable.courseId, course.courseId)));
    }

    return successResponse({ bootcampId: id }, 'Courses reordered successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to reorder courses', 'REORDER_ERROR', 500);
  }
};

// ===========================
// ROUTE HANDLERS
// ===========================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const collegeId = searchParams.get('collegeId');
    const pending = searchParams.get('pending');
    const courses = searchParams.get('courses');

    if (parseBoolean(pending)) return await getPendingBootcamps();
    if (slug) return await getBootcampBySlug(slug);
    if (collegeId) {
      const validation = validateId(collegeId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getCollegeBootcamps(collegeId);
    }
    if (id && parseBoolean(courses)) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getBootcampCourses(id);
    }
    if (id) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getBootcampById(id);
    }

    return await listBootcamps();
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const submit = searchParams.get('submit');
    const approve = searchParams.get('approve');
    const reject = searchParams.get('reject');
    const addCourse = searchParams.get('addCourse');

    if (id && parseBoolean(submit)) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await submitBootcamp(id);
    }
    if (id && parseBoolean(approve)) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await approveBootcamp(id);
    }
    if (id && parseBoolean(reject)) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await rejectBootcamp(id, request);
    }
    if (id && parseBoolean(addCourse)) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await addCourseToBootcamp(id, request);
    }

    return await createBootcamp(request);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const publish = searchParams.get('publish');
    const reorder = searchParams.get('reorder');

    if (!id) return errorResponse('ID is required for update operations');

    const validation = validateId(id);
    if (!validation.valid) return errorResponse(validation.error!);

    if (parseBoolean(publish)) return await publishBootcamp(id);
    if (parseBoolean(reorder)) return await reorderCourses(id, request);

    return await updateBootcamp(id, request);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const courseId = searchParams.get('courseId');

    if (!id) return errorResponse('ID is required for delete operation');

    const validation = validateId(id);
    if (!validation.valid) return errorResponse(validation.error!);

    if (courseId) {
      const courseValidation = validateId(courseId);
      if (!courseValidation.valid) return errorResponse(courseValidation.error!);
      return await removeCourseFromBootcamp(id, courseId);
    }

    return await deleteBootcamp(id);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}