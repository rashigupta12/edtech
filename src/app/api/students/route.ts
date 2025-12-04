// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { 
  StudentProfilesTable, 
  UsersTable, 
  CollegesTable,
  EnrollmentsTable,
  CoursesTable
} from "@/db/schema";
import { eq, and, like, or, sql, inArray } from "drizzle-orm";

// Define the Gender type from your schema
type Gender = "MALE" | "FEMALE" | "OTHER";

// GET /api/students - Get all students or filtered by college
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collegeId = searchParams.get("collegeId");
    const studentId = searchParams.get("id");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const enrollmentNo = searchParams.get("enrollmentNo");
    const status = searchParams.get("status");

    // Get single student profile
    if (studentId) {
      const student = await db
        .select({
          id: StudentProfilesTable.id,
          collegeId: StudentProfilesTable.collegeId,
          dateOfBirth: StudentProfilesTable.dateOfBirth,
          gender: StudentProfilesTable.gender,
          address: StudentProfilesTable.address,
          city: StudentProfilesTable.city,
          state: StudentProfilesTable.state,
          country: StudentProfilesTable.country,
          pinCode: StudentProfilesTable.pinCode,
          educationLevel: StudentProfilesTable.educationLevel,
          institution: StudentProfilesTable.institution,
          currentSemester: StudentProfilesTable.currentSemester,
          specialization: StudentProfilesTable.specialization,
          enrollmentNumber: StudentProfilesTable.enrollmentNumber,
          academicRecords: StudentProfilesTable.academicRecords,
          skills: StudentProfilesTable.skills,
          resumeUrl: StudentProfilesTable.resumeUrl,
          linkedinUrl: StudentProfilesTable.linkedinUrl,
          githubUrl: StudentProfilesTable.githubUrl,
          createdAt: StudentProfilesTable.createdAt,
          updatedAt: StudentProfilesTable.updatedAt,
          user: {
            id: UsersTable.id,
            name: UsersTable.name,
            email: UsersTable.email,
            mobile: UsersTable.mobile,
            role: UsersTable.role,
            profileImage: UsersTable.profileImage,
            isActive: UsersTable.isActive,
            createdAt: UsersTable.createdAt,
          },
          college: {
            name: CollegesTable.collegeName,
            code: CollegesTable.collegeCode,
          },
        })
        .from(StudentProfilesTable)
        .innerJoin(UsersTable, eq(StudentProfilesTable.id, UsersTable.id))
        .leftJoin(
          CollegesTable,
          eq(StudentProfilesTable.collegeId, CollegesTable.id)
        )
        .where(eq(StudentProfilesTable.id, studentId))
        .limit(1);

      if (!student.length) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Student not found" } },
          { status: 404 }
        );
      }

      // Get student's enrollments
      const enrollments = await db
        .select({
          id: EnrollmentsTable.id,
          courseId: EnrollmentsTable.courseId,
          status: EnrollmentsTable.status,
          progress: EnrollmentsTable.progress,
          enrolledAt: EnrollmentsTable.enrolledAt,
          completedAt: EnrollmentsTable.completedAt,
          course: {
            title: CoursesTable.title,
            slug: CoursesTable.slug,
            thumbnailUrl: CoursesTable.thumbnailUrl,
          },
        })
        .from(EnrollmentsTable)
        .leftJoin(
          CoursesTable,
          eq(EnrollmentsTable.courseId, CoursesTable.id)
        )
        .where(
          and(
            eq(EnrollmentsTable.userId, studentId),
            eq(EnrollmentsTable.status, "ACTIVE")
          )
        );

      return NextResponse.json({ 
        success: true, 
        data: {
          ...student[0],
          enrollments,
          totalEnrollments: enrollments.length
        } 
      });
    }

    // Get students list with filters
    const conditions = [];
    
    if (collegeId) {
      conditions.push(eq(StudentProfilesTable.collegeId, collegeId));
    }
    
    if (status) {
      conditions.push(eq(UsersTable.isActive, status === "ACTIVE"));
    }

    if (search) {
      const searchConditions = [
        like(UsersTable.name, `%${search}%`),
        like(UsersTable.email, `%${search}%`),
        like(StudentProfilesTable.institution, `%${search}%`),
        like(StudentProfilesTable.specialization, `%${search}%`),
      ];
      conditions.push(or(...searchConditions));
    }

    if (enrollmentNo) {
      conditions.push(like(sql`CAST(${StudentProfilesTable.id} AS TEXT)`, `%${enrollmentNo}%`));
    }

    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(StudentProfilesTable)
      .innerJoin(UsersTable, eq(StudentProfilesTable.id, UsersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = Number(countResult[0]?.count) || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated students
    const students = await db
      .select({
        id: StudentProfilesTable.id,
        collegeId: StudentProfilesTable.collegeId,
        dateOfBirth: StudentProfilesTable.dateOfBirth,
        gender: StudentProfilesTable.gender,
        enrollmentNumber: StudentProfilesTable.enrollmentNumber,
        educationLevel: StudentProfilesTable.educationLevel,
        institution: StudentProfilesTable.institution,
        currentSemester: StudentProfilesTable.currentSemester,
        specialization: StudentProfilesTable.specialization,
        createdAt: StudentProfilesTable.createdAt,
        user: {
          id: UsersTable.id,
          name: UsersTable.name,
          email: UsersTable.email,
          mobile: UsersTable.mobile,
          role: UsersTable.role,
          profileImage: UsersTable.profileImage,
          isActive: UsersTable.isActive,
        },
        college: {
          name: CollegesTable.collegeName,
          code: CollegesTable.collegeCode,
        },
      })
      .from(StudentProfilesTable)
      .innerJoin(UsersTable, eq(StudentProfilesTable.id, UsersTable.id))
      .leftJoin(
        CollegesTable,
        eq(StudentProfilesTable.collegeId, CollegesTable.id)
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(UsersTable.name)
      .limit(limit)
      .offset(offset);

    // Get enrollment counts for each student - FIXED VERSION
    const studentIds = students.map(s => s.id);
    let enrollmentsByStudent: Record<string, number> = {};
    
    if (studentIds.length > 0) {
      // Use inArray instead of raw SQL
      const enrollmentCounts = await db
        .select({
          userId: EnrollmentsTable.userId,
          count: sql<number>`count(*)`
        })
        .from(EnrollmentsTable)
        .where(
          and(
            eq(EnrollmentsTable.status, "ACTIVE"),
            inArray(EnrollmentsTable.userId, studentIds) // ✅ Safe way to query
          )
        )
        .groupBy(EnrollmentsTable.userId);

      enrollmentsByStudent = enrollmentCounts.reduce((acc, item) => {
        acc[item.userId] = Number(item.count);
        return acc;
      }, {} as Record<string, number>);
    }

    // Add enrollment counts to students
    const studentsWithEnrollments = students.map(student => ({
      ...student,
      enrollmentCount: enrollmentsByStudent[student.id] || 0
    }));

    return NextResponse.json({ 
      success: true, 
      data: studentsWithEnrollments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });
  } catch (error) {
    console.error("Students GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// Define interfaces for request body
interface StudentRequestBody {
  id?: string;
  collegeId?: string;
  dateOfBirth?: string | Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  educationLevel?: string;
  institution?: string;
  currentSemester?: number;
  specialization?: string;
  academicRecords?: unknown;
  skills?: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
  enrollmentNumber?: string;
  githubUrl?: string;
}

// Helper function to validate and cast gender
const validateGender = (gender: string | undefined): Gender | null => {
  if (!gender) return null;
  const upperGender = gender.toUpperCase();
  if (upperGender === "MALE" || upperGender === "FEMALE" || upperGender === "OTHER") {
    return upperGender as Gender;
  }
  return null;
};

// POST /api/students - Create new student profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as StudentRequestBody;
    const {
      id,
      collegeId,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      country,
      pinCode,
      educationLevel,
      institution,
      currentSemester,
      specialization,
      academicRecords,
      skills,
      resumeUrl,
      linkedinUrl,
      enrollmentNumber,
      githubUrl,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "User ID is required" } },
        { status: 400 }
      );
    }

    const existingProfile = await db
      .select()
      .from(StudentProfilesTable)
      .where(eq(StudentProfilesTable.id, id))
      .limit(1);

    let result;
    const now = new Date();
    const validatedGender = validateGender(gender);

    if (existingProfile.length > 0) {
      result = await db
        .update(StudentProfilesTable)
        .set({
          collegeId,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender: validatedGender,
          address,
          city,
          state,
          country: country || "India",
          pinCode,
          educationLevel,
          institution,
          currentSemester,
          specialization,
          academicRecords,
          skills,
          resumeUrl,
          enrollmentNumber,
          linkedinUrl,
          githubUrl,
          updatedAt: now,
        })
        .where(eq(StudentProfilesTable.id, id))
        .returning();

      return NextResponse.json(
        { 
          success: true, 
          data: result[0], 
          message: "Student profile updated successfully" 
        },
        { status: 200 }
      );
    } else {
      result = await db
        .insert(StudentProfilesTable)
        .values({
          id,
          collegeId,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender: validatedGender,
          address,
          city,
          state,
          country: country || "India",
          pinCode,
          educationLevel,
          institution,
          currentSemester,
          specialization,
          academicRecords,
          skills,
          resumeUrl,
          linkedinUrl,
          enrollmentNumber,
          githubUrl,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return NextResponse.json(
        { 
          success: true, 
          data: result[0], 
          message: "Student profile created successfully" 
        },
        { status: 201 }
      );
    }
  } catch (error: unknown) {
    console.error("Student POST error:", error);
    
    const err = error as { code?: string; message?: string };
    
    if (err.code === "23503" || err.message?.includes("foreign key constraint")) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "USER_NOT_FOUND", 
            message: "User not found. Please create the user first." 
          } 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// Define interface for PUT request body
interface UpdateStudentRequestBody {
  collegeId?: string;
  dateOfBirth?: string | Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  educationLevel?: string;
  institution?: string;
  currentSemester?: number;
  enrollmentNumber?: string;
  specialization?: string;
  academicRecords?: unknown;
  skills?: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

// PUT /api/students?id={studentId} - Update student profile
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("id");

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Student ID required" } },
        { status: 400 }
      );
    }

    const body = await request.json() as UpdateStudentRequestBody;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.collegeId !== undefined) updateData.collegeId = body.collegeId;
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    
    // Validate and cast gender
    if (body.gender !== undefined) {
      const validatedGender = validateGender(body.gender);
      updateData.gender = validatedGender;
    }
    
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.pinCode !== undefined) updateData.pinCode = body.pinCode;
    if (body.educationLevel !== undefined) updateData.educationLevel = body.educationLevel;
    if (body.institution !== undefined) updateData.institution = body.institution;
    if (body.currentSemester !== undefined) updateData.currentSemester = body.currentSemester;
    if (body.enrollmentNumber !== undefined) updateData.enrollmentNumber = body.enrollmentNumber;

    if (body.specialization !== undefined) updateData.specialization = body.specialization;
    if (body.academicRecords !== undefined) updateData.academicRecords = body.academicRecords;
    if (body.skills !== undefined) updateData.skills = body.skills;
    if (body.resumeUrl !== undefined) updateData.resumeUrl = body.resumeUrl;
    if (body.linkedinUrl !== undefined) updateData.linkedinUrl = body.linkedinUrl;
    if (body.githubUrl !== undefined) updateData.githubUrl = body.githubUrl;

    const [updated] = await db
      .update(StudentProfilesTable)
      .set(updateData)
      .where(eq(StudentProfilesTable.id, studentId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Student profile not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Student profile updated successfully",
    });
  } catch (error: unknown) {
    console.error("Student PUT error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// DELETE /api/students?id={studentId}
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("id");

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Student ID required" } },
        { status: 400 }
      );
    }

    await db.delete(StudentProfilesTable).where(eq(StudentProfilesTable.id, studentId));

    return NextResponse.json({
      success: true,
      message: "Student profile deleted successfully",
    });
  } catch (error) {
    console.error("Student DELETE error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}