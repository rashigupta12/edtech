/* eslint-disable @typescript-eslint/no-unused-vars */
import { CertificateRequestsTable, EnrollmentsTable } from "@/db/schema";
import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
export async function POST(req: NextRequest) {
  try {
    const { requestId, adminId, certificateUrl } = await req.json();

    // Update certificate request
    await db
      .update(CertificateRequestsTable)
      .set({
        status: "APPROVED",
        processedAt: new Date(),
        processedBy: adminId,
      })
      .where(eq(CertificateRequestsTable.id, requestId));

    // Get enrollment ID
    const [request] = await db
      .select()
      .from(CertificateRequestsTable)
      .where(eq(CertificateRequestsTable.id, requestId))
      .limit(1);

    // Update enrollment
    await db
      .update(EnrollmentsTable)
      .set({
        certificateIssued: true,
        certificateIssuedAt: new Date(),
        certificateUrl,
      })
      .where(eq(EnrollmentsTable.id, request.enrollmentId));

    return NextResponse.json(
      { message: "Certificate generated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
