import { NextResponse } from "next/server";
import { db } from "@/db";
import { UsersTable, StudentProfilesTable, CollegesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Fetch all users with role STUDENT and their profiles
    const students = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        mobile: UsersTable.mobile,
        isActive: UsersTable.isActive,
        createdAt: UsersTable.createdAt,
        enrollmentNumber: StudentProfilesTable.enrollmentNumber,
        educationLevel: StudentProfilesTable.educationLevel,
        institution: StudentProfilesTable.institution,
        currentSemester: StudentProfilesTable.currentSemester,
        collegeName: CollegesTable.collegeName,
        city: StudentProfilesTable.city,
        state: StudentProfilesTable.state,
      })
      .from(UsersTable)
      .leftJoin(StudentProfilesTable, eq(UsersTable.id, StudentProfilesTable.id))
      .leftJoin(CollegesTable, eq(StudentProfilesTable.collegeId, CollegesTable.id))
      .where(eq(UsersTable.role, "STUDENT"))
      .orderBy(UsersTable.createdAt);

    return NextResponse.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch students",
      },
      { status: 500 }
    );
  }
}