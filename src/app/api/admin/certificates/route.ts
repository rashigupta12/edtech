/*eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/certificates/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  EnrollmentsTable,
  UsersTable,
  CoursesTable,
} from "@/db/schema";
import { eq, and, or, isNotNull, desc } from "drizzle-orm";

export async function GET() {
  try {
    const certificates = await db
      .select({
        id: EnrollmentsTable.id,
        enrollmentId: EnrollmentsTable.id,
        userId: EnrollmentsTable.userId,
        userName: UsersTable.name,
        userEmail: UsersTable.email,
        courseTitle: CoursesTable.title,
        courseInstructor: CoursesTable.instructor,
        certificateUrl: EnrollmentsTable.certificateUrl,
        certificateData: EnrollmentsTable.certificateData,
        certificateIssuedAt: EnrollmentsTable.certificateIssuedAt,
        completedAt: EnrollmentsTable.completedAt,
      })
      .from(EnrollmentsTable)
      .innerJoin(UsersTable, eq(EnrollmentsTable.userId, UsersTable.id))
      .innerJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
      .where(
        and(
          eq(EnrollmentsTable.certificateIssued, true),
          // ✅ Check for EITHER certificateUrl OR certificateData
          or(
            isNotNull(EnrollmentsTable.certificateUrl),
            isNotNull(EnrollmentsTable.certificateData)
          ),
          isNotNull(EnrollmentsTable.certificateIssuedAt)
        )
      )
      .orderBy(desc(EnrollmentsTable.certificateIssuedAt));

    console.log(`Found ${certificates.length} issued certificates`);

    const transformed = certificates.map((cert) => ({
      id: cert.id,
      enrollmentId: cert.enrollmentId,
      userId: cert.userId,
      // Use certificateUrl if available, otherwise generate a placeholder
      certificateUrl: cert.certificateUrl || `/api/certificates/generate/${cert.enrollmentId}`,
      certificateIssuedAt: cert.certificateIssuedAt!.toISOString(),
      completedAt: cert.completedAt?.toISOString() || null,
      certificateData: cert.certificateData, // Include certificate data
      user: {
        name: cert.userName!,
        email: cert.userEmail!,
      },
      course: {
        title: cert.courseTitle!,
        instructor: cert.courseInstructor!,
      },
    }));

    return NextResponse.json({ certificates: transformed }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificates", details: error.message },
      { status: 500 }
    );
  }
}