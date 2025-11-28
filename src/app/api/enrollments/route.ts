// src/app/api/enrollments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { EnrollmentsTable, BootcampEnrollmentsTable, CoursesTable, BootcampsTable } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

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
// CONTROLLERS - COURSE ENROLLMENTS
// ===========================

// LIST USER'S ENROLLMENTS
const listUserEnrollments = async (userId: string) => {
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
    })
    .from(EnrollmentsTable)
    .innerJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
    .where(eq(EnrollmentsTable.userId, userId))
    .orderBy(desc(EnrollmentsTable.lastAccessedAt));

  return successResponse(enrollments);
};

// GET ENROLLMENT BY ID
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
    })
    .from(EnrollmentsTable)
    .innerJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
    .where(eq(EnrollmentsTable.id, id))
    .limit(1);

  if (!enrollment) return errorResponse('Enrollment not found', 'NOT_FOUND', 404);
  return successResponse(enrollment);
};

// GET COURSE ENROLLMENTS (for college/admin)
const getCourseEnrollments = async (courseId: string) => {
  const enrollments = await db
    .select()
    .from(EnrollmentsTable)
    .where(eq(EnrollmentsTable.courseId, courseId))
    .orderBy(desc(EnrollmentsTable.enrolledAt));

  return successResponse(enrollments);
};

// GET ENROLLMENT STATS
const getEnrollmentStats = async (userId?: string) => {
  let stats: any = {};

  if (userId) {
    // Student stats
    const [totalEnrollments] = await db.select({ count: count() }).from(EnrollmentsTable).where(eq(EnrollmentsTable.userId, userId));

    const [activeEnrollments] = await db
      .select({ count: count() })
      .from(EnrollmentsTable)
      .where(and(eq(EnrollmentsTable.userId, userId), eq(EnrollmentsTable.status, 'ACTIVE')));

    const [completedEnrollments] = await db
      .select({ count: count() })
      .from(EnrollmentsTable)
      .where(and(eq(EnrollmentsTable.userId, userId), eq(EnrollmentsTable.status, 'COMPLETED')));

    stats = {
      total: totalEnrollments?.count || 0,
      active: activeEnrollments?.count || 0,
      completed: completedEnrollments?.count || 0,
    };
  } else {
    // Platform-wide stats
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
};

// ENROLL IN COURSE
const enrollInCourse = async (request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.userId || !body.courseId) {
      return errorResponse('Missing required fields: userId, courseId');
    }

    // Check if already enrolled
    const [existing] = await db
      .select()
      .from(EnrollmentsTable)
      .where(and(eq(EnrollmentsTable.userId, body.userId), eq(EnrollmentsTable.courseId, body.courseId)))
      .limit(1);

    if (existing) {
      return errorResponse('Already enrolled in this course', 'ALREADY_ENROLLED', 409);
    }

    const [enrollment] = await db
      .insert(EnrollmentsTable)
      .values({
        userId: body.userId,
        courseId: body.courseId,
        status: 'ACTIVE',
        progress: 0,
        enrolledAt: new Date(),
      })
      .returning();

    return successResponse(enrollment, 'Enrolled successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to enroll', 'ENROLL_ERROR', 500);
  }
};

// UPDATE ENROLLMENT
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

// UNENROLL (DELETE)
const unenrollFromCourse = async (id: string) => {
  try {
    const [enrollment] = await db.select().from(EnrollmentsTable).where(eq(EnrollmentsTable.id, id)).limit(1);

    if (!enrollment) return errorResponse('Enrollment not found', 'NOT_FOUND', 404);

    await db.delete(EnrollmentsTable).where(eq(EnrollmentsTable.id, id));

    return successResponse({ id }, 'Unenrolled successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to unenroll', 'UNENROLL_ERROR', 500);
  }
};

// ===========================
// CONTROLLERS - BOOTCAMP ENROLLMENTS
// ===========================

// LIST USER'S BOOTCAMP ENROLLMENTS
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

// GET BOOTCAMP ENROLLMENT BY ID
const getBootcampEnrollmentById = async (id: string) => {
  const [enrollment] = await db
    .select()
    .from(BootcampEnrollmentsTable)
    .where(eq(BootcampEnrollmentsTable.id, id))
    .limit(1);

  if (!enrollment) return errorResponse('Bootcamp enrollment not found', 'NOT_FOUND', 404);
  return successResponse(enrollment);
};

// ENROLL IN BOOTCAMP
const enrollInBootcamp = async (request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.userId || !body.bootcampId) {
      return errorResponse('Missing required fields: userId, bootcampId');
    }

    // Check if already enrolled
    const [existing] = await db
      .select()
      .from(BootcampEnrollmentsTable)
      .where(and(eq(BootcampEnrollmentsTable.userId, body.userId), eq(BootcampEnrollmentsTable.bootcampId, body.bootcampId)))
      .limit(1);

    if (existing) {
      return errorResponse('Already enrolled in this bootcamp', 'ALREADY_ENROLLED', 409);
    }

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

    // GET /api/enrollments?stats=true&userId=123
    if (parseBoolean(stats)) {
      return await getEnrollmentStats(userId || undefined);
    }

    // GET /api/enrollments?courseId=123
    if (courseId) {
      const validation = validateId(courseId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getCourseEnrollments(courseId);
    }

    // GET /api/enrollments?bootcamp=true&userId=123
    if (parseBoolean(bootcamp) && userId) {
      const validation = validateId(userId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await listUserBootcampEnrollments(userId);
    }

    // GET /api/enrollments?bootcamp=true&id=123
    if (parseBoolean(bootcamp) && id) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getBootcampEnrollmentById(id);
    }

    // GET /api/enrollments?id=123
    if (id) {
      const validation = validateId(id);
      if (!validation.valid) return errorResponse(validation.error!);
      return await getEnrollmentById(id);
    }

    // GET /api/enrollments?userId=123 (list user enrollments)
    if (userId) {
      const validation = validateId(userId);
      if (!validation.valid) return errorResponse(validation.error!);
      return await listUserEnrollments(userId);
    }

    return errorResponse('userId parameter is required');
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bootcamp = searchParams.get('bootcamp');

    // POST /api/enrollments?bootcamp=true
    if (parseBoolean(bootcamp)) {
      return await enrollInBootcamp(request);
    }

    // POST /api/enrollments (enroll in course)
    return await enrollInCourse(request);
  } catch (error: any) {
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
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}