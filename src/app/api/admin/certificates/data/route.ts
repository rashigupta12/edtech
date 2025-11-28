// app/api/admin/certificates/data/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { EnrollmentsTable, CoursesTable, UsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get("enrollmentId");

    if (!enrollmentId) {
      return NextResponse.json(
        { error: "Enrollment ID is required" },
        { status: 400 }
      );
    }

    // Get enrollment with certificate data
    const [enrollment] = await db
      .select({
        id: EnrollmentsTable.id,
        certificateData: EnrollmentsTable.certificateData,
        certificateIssued: EnrollmentsTable.certificateIssued,
        userId: EnrollmentsTable.userId,
        courseId: EnrollmentsTable.courseId,
      })
      .from(EnrollmentsTable)
      .where(eq(EnrollmentsTable.id, enrollmentId))
      .limit(1);

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // If certificate data exists, return it
    if (enrollment.certificateData) {
      return NextResponse.json({
        certificateData: enrollment.certificateData,
        certificateIssued: enrollment.certificateIssued,
      });
    }

    // If no certificate data, fetch course and user info to generate it
    const [courseData] = await db
      .select({
        title: CoursesTable.title,
        instructor: CoursesTable.instructor,
        startDate: CoursesTable.startDate,
        endDate: CoursesTable.endDate,
      })
      .from(CoursesTable)
      .where(eq(CoursesTable.id, enrollment.courseId))
      .limit(1);

    const [userData] = await db
      .select({
        name: UsersTable.name,
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, enrollment.userId))
      .limit(1);

    if (!courseData || !userData) {
      return NextResponse.json(
        { error: "Course or user data not found" },
        { status: 404 }
      );
    }

    // Generate certificate data structure
    const generatedCertificateData = {
      studentName: userData.name,
      courseName: courseData.title,
      startDate: courseData.startDate?.toISOString() || new Date().toISOString(),
      endDate: courseData.endDate?.toISOString() || new Date().toISOString(),
      instructor: courseData.instructor || "Futuretek Institute",
      certificateId: `FT-${enrollmentId.slice(0, 8).toUpperCase()}`,
      issueDate: new Date().toISOString(),
    };

    return NextResponse.json({
      certificateData: generatedCertificateData,
      certificateIssued: enrollment.certificateIssued,
    });
  } catch (error) {
    console.error("Error fetching certificate data:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificate data" },
      { status: 500 }
    );
  }
}