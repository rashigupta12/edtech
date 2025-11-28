// app/api/admin/certificates/approve/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { 
  CertificateRequestsTable,
  EnrollmentsTable 
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { requestId, adminId, certificateData } = await request.json();

    // Update the certificate request status
    await db
      .update(CertificateRequestsTable)
      .set({
        status: "APPROVED",
        processedAt: new Date(),
        processedBy: adminId,
      })
      .where(eq(CertificateRequestsTable.id, requestId));

    // Get the enrollment ID from the request
    const [requestData] = await db
      .select({
        enrollmentId: CertificateRequestsTable.enrollmentId,
      })
      .from(CertificateRequestsTable)
      .where(eq(CertificateRequestsTable.id, requestId))
      .limit(1);

    if (!requestData) {
      return NextResponse.json(
        { error: "Certificate request not found" },
        { status: 404 }
      );
    }

    // Update enrollment with certificate status and data
    await db
      .update(EnrollmentsTable)
      .set({
        certificateIssued: true,
        certificateIssuedAt: new Date(),
        certificateData: certificateData, // JSONB field stores object directly
      })
      .where(eq(EnrollmentsTable.id, requestData.enrollmentId));

    return NextResponse.json(
      { 
        message: "Certificate approved successfully",
        certificateData 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving certificate:", error);
    return NextResponse.json(
      { error: "Failed to approve certificate" },
      { status: 500 }
    );
  }
}