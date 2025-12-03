/*eslint-disable @typescript-eslint/no-explicit-any */
// app/api/faculty/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { 
  FacultyTable, 
  UsersTable, 
  DepartmentsTable,
  FacultyProfilesTable 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/faculty - Get all faculty members or filtered by college/department
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collegeId = searchParams.get("collegeId");
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const facultyId = searchParams.get("id");

    // Get single faculty profile
    if (facultyId) {
      const faculty = await db
        .select({
          id: FacultyTable.id,
          employeeId: FacultyTable.employeeId,
          facultyRole: FacultyTable.facultyRole,
          designation: FacultyTable.designation,
          employmentType: FacultyTable.employmentType,
          status: FacultyTable.status,
          joiningDate: FacultyTable.joiningDate,
          permissions: {
            canCreateCourses: FacultyTable.canCreateCourses,
            canApproveContent: FacultyTable.canApproveContent,
            canManageStudents: FacultyTable.canManageStudents,
            canScheduleSessions: FacultyTable.canScheduleSessions,
          },
          user: {
            name: UsersTable.name,
            email: UsersTable.email,
            profileImage: UsersTable.profileImage,
            mobile:UsersTable.mobile,
          },
          profile: FacultyProfilesTable,
          department: {
            name: DepartmentsTable.name,
            code: DepartmentsTable.code,
          },
        })
        .from(FacultyTable)
        .leftJoin(UsersTable, eq(FacultyTable.userId, UsersTable.id))
        .leftJoin(
          FacultyProfilesTable,
          eq(FacultyTable.userId, FacultyProfilesTable.id)
        )
        .leftJoin(
          DepartmentsTable,
          eq(FacultyTable.departmentId, DepartmentsTable.id)
        )
        .where(eq(FacultyTable.id, facultyId))
        .limit(1);

      if (!faculty.length) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Faculty not found" } },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: faculty[0] });
    }

    // Get faculty list with filters
    const conditions = [];
    if (collegeId) conditions.push(eq(FacultyTable.collegeId, collegeId));
    if (departmentId) conditions.push(eq(FacultyTable.departmentId, departmentId));
    if (status) conditions.push(eq(FacultyTable.status, status as any));

    const facultyList = await db
      .select({
        id: FacultyTable.id,
        userId: FacultyTable.userId,
        employeeId: FacultyTable.employeeId,
        facultyRole: FacultyTable.facultyRole,
        designation: FacultyTable.designation,
        employmentType: FacultyTable.employmentType,
        status: FacultyTable.status,
        departmentName: DepartmentsTable.name,
        user: {
          name: UsersTable.name,
          email: UsersTable.email,
          profileImage: UsersTable.profileImage,
          mobile:UsersTable.mobile,
        },
        permissions: {
          canCreateCourses: FacultyTable.canCreateCourses,
          canApproveContent: FacultyTable.canApproveContent,
          canManageStudents: FacultyTable.canManageStudents,
            canScheduleSessions: FacultyTable.canScheduleSessions,
        },
      })
      .from(FacultyTable)
      .leftJoin(UsersTable, eq(FacultyTable.userId, UsersTable.id))
      .leftJoin(DepartmentsTable, eq(FacultyTable.departmentId, DepartmentsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({ success: true, data: facultyList });
  } catch (error) {
    console.error("Faculty GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST /api/faculty - Create new faculty member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      collegeId,
      userId,
      departmentId,
      employeeId,
      facultyRole,
      designation,
      employmentType,
      joiningDate,
      // Extract permissions directly from body (not from permissions object)
      canCreateCourses,
      canApproveContent,
      canManageStudents,
      canScheduleSessions,
    } = body;

    // Validation
    if (!collegeId || !userId || !designation) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const [newFaculty] = await db
      .insert(FacultyTable)
      .values({
        collegeId,
        userId,
        departmentId,
        employeeId,
        facultyRole: facultyRole || "LECTURER",
        designation,
        employmentType: employmentType || "FULL_TIME",
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        // Use the extracted permission fields directly
        canCreateCourses: canCreateCourses ?? false,
        canApproveContent: canApproveContent ?? false,
        canManageStudents: canManageStudents ?? false,
        canScheduleSessions: canScheduleSessions ?? true,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: newFaculty, message: "Faculty member added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Faculty POST error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
// In your PUT function in app/api/faculty/route.ts
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const facultyId = searchParams.get("id");

    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Faculty ID required" } },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if this is a permissions update (has permissions object)
    if (body.permissions && typeof body.permissions === 'object') {
      const { canCreateCourses, canApproveContent, canManageStudents, canScheduleSessions } = body.permissions;

      const [updated] = await db
        .update(FacultyTable)
        .set({
          canCreateCourses: canCreateCourses ?? false,
          canApproveContent: canApproveContent ?? false,
          canManageStudents: canManageStudents ?? false,
          canScheduleSessions: canScheduleSessions ?? true,
          updatedAt: new Date(),
        })
        .where(eq(FacultyTable.id, facultyId))
        .returning();

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Permissions updated successfully",
      });
    }

    // General faculty update - handle permissions fields directly
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Map individual permission fields if present
    if (body.canCreateCourses !== undefined) updateData.canCreateCourses = body.canCreateCourses;
    if (body.canApproveContent !== undefined) updateData.canApproveContent = body.canApproveContent;
    if (body.canManageStudents !== undefined) updateData.canManageStudents = body.canManageStudents;
    if (body.canScheduleSessions !== undefined) updateData.canScheduleSessions = body.canScheduleSessions;

    // Map other fields
    if (body.departmentId !== undefined) updateData.departmentId = body.departmentId;
    if (body.facultyRole !== undefined) updateData.facultyRole = body.facultyRole;
    if (body.designation !== undefined) updateData.designation = body.designation;
    if (body.employmentType !== undefined) updateData.employmentType = body.employmentType;
    if (body.status !== undefined) updateData.status = body.status;

    const [updated] = await db
      .update(FacultyTable)
      .set(updateData)
      .where(eq(FacultyTable.id, facultyId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Faculty updated successfully",
    });
  } catch (error) {
    console.error("Faculty PUT error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// DELETE /api/faculty?id={facultyId}
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const facultyId = searchParams.get("id");

    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Faculty ID required" } },
        { status: 400 }
      );
    }

    await db.delete(FacultyTable).where(eq(FacultyTable.id, facultyId));

    return NextResponse.json({
      success: true,
      message: "Faculty deleted successfully",
    });
  } catch (error) {
    console.error("Faculty DELETE error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}