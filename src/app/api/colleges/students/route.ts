// File path: app/api/colleges/students/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { UsersTable, StudentProfilesTable } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collegeId = searchParams.get("collegeId");

    if (!collegeId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "College ID is required",
          },
        },
        { status: 400 }
      );
    }

    // Get students who belong to this college OR have no college assigned
    const students = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        mobile: UsersTable.mobile,
        profileImage: UsersTable.profileImage,
        isActive: UsersTable.isActive,
        institution: StudentProfilesTable.institution,
        educationLevel: StudentProfilesTable.educationLevel,
        currentSemester: StudentProfilesTable.currentSemester,
        specialization: StudentProfilesTable.specialization,
        collegeId: StudentProfilesTable.collegeId,
      })
      .from(UsersTable)
      .innerJoin(
        StudentProfilesTable,
        eq(UsersTable.id, StudentProfilesTable.id)
      )
      .where(
        and(
          eq(UsersTable.role, "STUDENT"),
          eq(UsersTable.isActive, true),
          or(
            eq(StudentProfilesTable.collegeId, collegeId),
            
          )
        )
      );

    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      profileImage: student.profileImage,
      isActive: student.isActive,
      rollNumber: null,
      institution: student.institution,
      educationLevel: student.educationLevel,
      currentSemester: student.currentSemester,
      specialization: student.specialization,
      departmentName: null,
      collegeId: student.collegeId,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedStudents,
        count: formattedStudents.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching college students:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to fetch students",
        },
      },
      { status: 500 }
    );
  }
}