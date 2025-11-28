// src/app/api/colleges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { CollegesTable, UsersTable, CoursesTable } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';

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
  pending?: string;
  stats?: string;
  courses?: string;
  approve?: string;
  reject?: string;
  suspend?: string;
  documents?: string;
};

// ===========================
// HELPERS
// ===========================

const parseBoolean = (value: string | null | undefined): boolean => {
  return value === 'true' || value === '1';
};

const validateId = (id: string | undefined): { valid: boolean; error?: string } => {
  if (!id) return { valid: false, error: 'ID is required' };
  // UUID validation
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

// ===========================
// CONTROLLERS
// ===========================

// LIST ALL COLLEGES
const listColleges = async () => {
  const colleges = await db
    .select({
      id: CollegesTable.id,
      collegeName: CollegesTable.collegeName,
      collegeCode: CollegesTable.collegeCode,
      city: CollegesTable.city,
      state: CollegesTable.state,
      status: CollegesTable.status,
      logo: CollegesTable.logo,
      contactEmail: CollegesTable.contactEmail,
      contactPhone: CollegesTable.contactPhone,
      createdAt: CollegesTable.createdAt,
    })
    .from(CollegesTable)
    .orderBy(sql`${CollegesTable.createdAt} DESC`);

  return successResponse(colleges);
};

// GET PENDING COLLEGES
const getPendingColleges = async () => {
  const pending = await db
    .select({
      id: CollegesTable.id,
      collegeName: CollegesTable.collegeName,
      collegeCode: CollegesTable.collegeCode,
      city: CollegesTable.city,
      state: CollegesTable.state,
      contactEmail: CollegesTable.contactEmail,
      verificationDocument: CollegesTable.verificationDocument,
      createdAt: CollegesTable.createdAt,
    })
    .from(CollegesTable)
    .where(eq(CollegesTable.status, 'PENDING'))
    .orderBy(sql`${CollegesTable.createdAt} DESC`);

  return successResponse(pending);
};

// GET SINGLE COLLEGE
const getCollegeById = async (id: string) => {
  const college = await db
    .select()
    .from(CollegesTable)
    .where(eq(CollegesTable.id, id))
    .limit(1);

  if (!college[0]) {
    return errorResponse('College not found', 'NOT_FOUND', 404);
  }

  return successResponse(college[0]);
};

// GET COLLEGE STATS
const getCollegeStats = async (id: string) => {
  const [college] = await db
    .select()
    .from(CollegesTable)
    .where(eq(CollegesTable.id, id))
    .limit(1);

  if (!college) {
    return errorResponse('College not found', 'NOT_FOUND', 404);
  }

  // Get total courses
  const [coursesCount] = await db
    .select({ count: count() })
    .from(CoursesTable)
    .where(eq(CoursesTable.collegeId, id));

  // Get published courses
  const [publishedCount] = await db
    .select({ count: count() })
    .from(CoursesTable)
    .where(
      and(
        eq(CoursesTable.collegeId, id),
        eq(CoursesTable.status, 'PUBLISHED')
      )
    );

  // Get total enrollments (you'll need to join with enrollments table)
  // const [enrollmentsCount] = await db
  //   .select({ count: count() })
  //   .from(EnrollmentsTable)
  //   .innerJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
  //   .where(eq(CoursesTable.collegeId, id));

  const stats = {
    collegeId: id,
    collegeName: college.collegeName,
    totalCourses: coursesCount?.count || 0,
    publishedCourses: publishedCount?.count || 0,
    draftCourses: (coursesCount?.count || 0) - (publishedCount?.count || 0),
    totalEnrollments: 0, // Replace with actual query
    status: college.status,
  };

  return successResponse(stats);
};

// GET COLLEGE COURSES
const getCollegeCourses = async (id: string) => {
  const [college] = await db
    .select()
    .from(CollegesTable)
    .where(eq(CollegesTable.id, id))
    .limit(1);

  if (!college) {
    return errorResponse('College not found', 'NOT_FOUND', 404);
  }

  const courses = await db
    .select({
      id: CoursesTable.id,
      title: CoursesTable.title,
      slug: CoursesTable.slug,
      status: CoursesTable.status,
      thumbnailUrl: CoursesTable.thumbnailUrl,
      level: CoursesTable.level,
      duration: CoursesTable.duration,
      currentEnrollments: CoursesTable.currentEnrollments,
      createdAt: CoursesTable.createdAt,
    })
    .from(CoursesTable)
    .where(eq(CoursesTable.collegeId, id))
    .orderBy(sql`${CoursesTable.createdAt} DESC`);

  return successResponse({
    collegeId: id,
    collegeName: college.collegeName,
    courses,
  });
};

// CREATE COLLEGE
const createCollege = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.userId || !body.collegeName || !body.collegeCode) {
      return errorResponse('Missing required fields: userId, collegeName, collegeCode');
    }

    // Check if college code already exists
    const [existing] = await db
      .select()
      .from(CollegesTable)
      .where(eq(CollegesTable.collegeCode, body.collegeCode))
      .limit(1);

    if (existing) {
      return errorResponse('College code already exists', 'DUPLICATE', 409);
    }

    // Create college
    const [newCollege] = await db
      .insert(CollegesTable)
      .values({
        userId: body.userId,
        collegeName: body.collegeName,
        collegeCode: body.collegeCode,
        address: body.address,
        city: body.city,
        state: body.state,
        pinCode: body.pinCode,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        websiteUrl: body.websiteUrl || null,
        logo: body.logo || null,
        about: body.about || null,
        verificationDocument: body.verificationDocument || null,
        status: 'PENDING',
      })
      .returning();

    return successResponse(newCollege, 'College created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create college', 'CREATE_ERROR', 500);
  }
};

// UPDATE COLLEGE
const updateCollege = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [college] = await db
      .select()
      .from(CollegesTable)
      .where(eq(CollegesTable.id, id))
      .limit(1);

    if (!college) {
      return errorResponse('College not found', 'NOT_FOUND', 404);
    }

    const [updated] = await db
      .update(CollegesTable)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(CollegesTable.id, id))
      .returning();

    return successResponse(updated, 'College updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update college', 'UPDATE_ERROR', 500);
  }
};

// DELETE COLLEGE
const deleteCollege = async (id: string) => {
  try {
    const [college] = await db
      .select()
      .from(CollegesTable)
      .where(eq(CollegesTable.id, id))
      .limit(1);

    if (!college) {
      return errorResponse('College not found', 'NOT_FOUND', 404);
    }

    await db.delete(CollegesTable).where(eq(CollegesTable.id, id));

    return successResponse({ id }, 'College deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete college', 'DELETE_ERROR', 500);
  }
};

// APPROVE COLLEGE
const approveCollege = async (id: string, request: NextRequest) => {
  try {
    // Get admin user ID from auth (you'll need to implement this)
    // const adminId = await getAuthUserId(request);

    const [college] = await db
      .select()
      .from(CollegesTable)
      .where(eq(CollegesTable.id, id))
      .limit(1);

    if (!college) {
      return errorResponse('College not found', 'NOT_FOUND', 404);
    }

    if (college.status !== 'PENDING') {
      return errorResponse('College is not in pending state', 'INVALID_STATE', 400);
    }

    const [approved] = await db
      .update(CollegesTable)
      .set({
        status: 'APPROVED',
        // approvedBy: adminId, // Add admin ID here
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(CollegesTable.id, id))
      .returning();

    return successResponse(approved, 'College approved successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to approve college', 'APPROVE_ERROR', 500);
  }
};

// REJECT COLLEGE
const rejectCollege = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return errorResponse('Rejection reason is required');
    }

    const [college] = await db
      .select()
      .from(CollegesTable)
      .where(eq(CollegesTable.id, id))
      .limit(1);

    if (!college) {
      return errorResponse('College not found', 'NOT_FOUND', 404);
    }

    const [rejected] = await db
      .update(CollegesTable)
      .set({
        status: 'REJECTED',
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(CollegesTable.id, id))
      .returning();

    return successResponse(rejected, 'College rejected');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to reject college', 'REJECT_ERROR', 500);
  }
};

// SUSPEND COLLEGE
const suspendCollege = async (id: string, request: NextRequest) => {
  try {
    const [college] = await db
      .select()
      .from(CollegesTable)
      .where(eq(CollegesTable.id, id))
      .limit(1);

    if (!college) {
      return errorResponse('College not found', 'NOT_FOUND', 404);
    }

    const [suspended] = await db
      .update(CollegesTable)
      .set({
        status: 'SUSPENDED',
        updatedAt: new Date(),
      })
      .where(eq(CollegesTable.id, id))
      .returning();

    return successResponse(suspended, 'College suspended');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to suspend college', 'SUSPEND_ERROR', 500);
  }
};

// UPDATE DOCUMENTS
const updateDocuments = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    const [college] = await db
      .select()
      .from(CollegesTable)
      .where(eq(CollegesTable.id, id))
      .limit(1);

    if (!college) {
      return errorResponse('College not found', 'NOT_FOUND', 404);
    }

    const [updated] = await db
      .update(CollegesTable)
      .set({
        verificationDocument: body.verificationDocument || college.verificationDocument,
        additionalDocuments: body.additionalDocuments || college.additionalDocuments,
        updatedAt: new Date(),
      })
      .where(eq(CollegesTable.id, id))
      .returning();

    return successResponse(updated, 'Documents updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update documents', 'DOCUMENTS_ERROR', 500);
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
      pending: searchParams.get('pending') || undefined,
      stats: searchParams.get('stats') || undefined,
      courses: searchParams.get('courses') || undefined,
    };

    // Route: GET /api/colleges?pending=true
    if (parseBoolean(params.pending)) {
      return await getPendingColleges();
    }

    // Route: GET /api/colleges?id=123&stats=true
    if (params.id && parseBoolean(params.stats)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getCollegeStats(params.id);
    }

    // Route: GET /api/colleges?id=123&courses=true
    if (params.id && parseBoolean(params.courses)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getCollegeCourses(params.id);
    }

    // Route: GET /api/colleges?id=123
    if (params.id) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await getCollegeById(params.id);
    }

    // Route: GET /api/colleges (list all)
    return await listColleges();
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
      approve: searchParams.get('approve') || undefined,
      reject: searchParams.get('reject') || undefined,
      suspend: searchParams.get('suspend') || undefined,
    };

    // Route: POST /api/colleges?id=123&approve=true
    if (params.id && parseBoolean(params.approve)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await approveCollege(params.id, request);
    }

    // Route: POST /api/colleges?id=123&reject=true
    if (params.id && parseBoolean(params.reject)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await rejectCollege(params.id, request);
    }

    // Route: POST /api/colleges?id=123&suspend=true
    if (params.id && parseBoolean(params.suspend)) {
      const validation = validateId(params.id);
      if (!validation.valid) {
        return errorResponse(validation.error!);
      }
      return await suspendCollege(params.id, request);
    }

    // Route: POST /api/colleges (create new)
    return await createCollege(request);
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
      documents: searchParams.get('documents') || undefined,
    };

    if (!params.id) {
      return errorResponse('ID is required for update operations');
    }

    const validation = validateId(params.id);
    if (!validation.valid) {
      return errorResponse(validation.error!);
    }

    // Route: PUT /api/colleges?id=123&documents=true
    if (parseBoolean(params.documents)) {
      return await updateDocuments(params.id, request);
    }

    // Route: PUT /api/colleges?id=123 (general update)
    return await updateCollege(params.id, request);
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

    // Route: DELETE /api/colleges?id=123
    return await deleteCollege(id);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}