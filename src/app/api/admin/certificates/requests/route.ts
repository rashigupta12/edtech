// app/api/admin/certificate-requests/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { CertificateRequestsTable, EnrollmentsTable, UsersTable, CoursesTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const requests = await db
      .select({
        id: CertificateRequestsTable.id,
        userId: CertificateRequestsTable.userId,
        enrollmentId: CertificateRequestsTable.enrollmentId,
        status: CertificateRequestsTable.status,
        requestedAt: CertificateRequestsTable.requestedAt,
        processedAt: CertificateRequestsTable.processedAt,
        processedBy: CertificateRequestsTable.processedBy,
        notes: CertificateRequestsTable.notes,
        userName: UsersTable.name,
        userEmail: UsersTable.email,
        courseTitle: CoursesTable.title,
        courseInstructor: CoursesTable.instructor,
        courseDuration: CoursesTable.duration,
        courseStartDate: CoursesTable.startDate,
        courseEndDate: CoursesTable.endDate,
        completedAt: EnrollmentsTable.completedAt,
        certificateIssued: EnrollmentsTable.certificateIssued,
      })
      .from(CertificateRequestsTable)
      .innerJoin(UsersTable, eq(CertificateRequestsTable.userId, UsersTable.id))
      .innerJoin(EnrollmentsTable, eq(CertificateRequestsTable.enrollmentId, EnrollmentsTable.id))
      .innerJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
      .orderBy(desc(CertificateRequestsTable.requestedAt));

    const transformedRequests = requests.map(request => ({
      id: request.id,
      userId: request.userId,
      enrollmentId: request.enrollmentId,
      user: {
        name: request.userName,
        email: request.userEmail,
      },
      enrollment: {
        course: {
          title: request.courseTitle,
          instructor: request.courseInstructor,
          duration: request.courseDuration,
          startDate: request.courseStartDate,
          endDate: request.courseEndDate,
        },
        completedAt: request.completedAt,
        certificateIssued: request.certificateIssued,
      },
      status: request.status,
      requestedAt: request.requestedAt,
      processedAt: request.processedAt,
      processedBy: request.processedBy,
      notes: request.notes,
    }));

    return NextResponse.json({ requests: transformedRequests });
  } catch (error) {
    console.error("Error fetching certificate requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificate requests" },
      { status: 500 }
    );
  }
}