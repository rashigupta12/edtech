// app/api/user/certificate-status/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { CertificateRequestsTable, EnrollmentsTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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

    // Get enrollment details
    const enrollment = await db
      .select({
        certificateIssued: EnrollmentsTable.certificateIssued,
        certificateData: EnrollmentsTable.certificateData,
      })
      .from(EnrollmentsTable)
      .where(eq(EnrollmentsTable.id, enrollmentId))
      .limit(1);

    if (!enrollment.length) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // Get latest certificate request
    const certificateRequest = await db
      .select({
        status: CertificateRequestsTable.status,
      })
      .from(CertificateRequestsTable)
      .where(eq(CertificateRequestsTable.enrollmentId, enrollmentId))
      .orderBy(desc(CertificateRequestsTable.requestedAt))
      .limit(1);

    // Parse certificate data
    let certificateData = null;
    if (enrollment[0].certificateData) {
      try {
        certificateData = typeof enrollment[0].certificateData === 'string' 
          ? JSON.parse(enrollment[0].certificateData) 
          : enrollment[0].certificateData;
      } catch (e) {
        console.error('Error parsing certificate data:', e);
      }
    }

    return NextResponse.json({
      certificateIssued: enrollment[0].certificateIssued,
      certificateData,
      certificateRequestStatus: certificateRequest[0]?.status || null,
    });
  } catch (error) {
    console.error("Error fetching certificate status:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificate status" },
      { status: 500 }
    );
  }
}