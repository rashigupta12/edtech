// // app/api/user/certificate-request/route.ts
// import { NextResponse } from "next/server";
// import { db } from "@/db";
// import { CertificateRequestsTable, EnrollmentsTable } from "@/db/schema";
// import { eq, and } from "drizzle-orm";

// export async function POST(request: Request) {
//   try {
//     const { enrollmentId, userId } = await request.json();

//     // Check if enrollment exists and belongs to user
//     const enrollment = await db
//       .select()
//       .from(EnrollmentsTable)
//       .where(
//         and(
//           eq(EnrollmentsTable.id, enrollmentId),
//           eq(EnrollmentsTable.userId, userId)
//         )
//       )
//       .limit(1);

//     if (!enrollment.length) {
//       return NextResponse.json(
//         { error: "Enrollment not found" },
//         { status: 404 }
//       );
//     }

//     // Check if course is completed
//     if (enrollment[0].status !== "COMPLETED") {
//       return NextResponse.json(
//         { error: "Course must be completed to request certificate" },
//         { status: 400 }
//       );
//     }

//     // Check if certificate already exists
//     if (enrollment[0].certificateIssued) {
//       return NextResponse.json(
//         { error: "Certificate already issued" },
//         { status: 400 }
//       );
//     }

//     // Check if there's already a pending request
//     const existingRequest = await db
//       .select()
//       .from(CertificateRequestsTable)
//       .where(
//         and(
//           eq(CertificateRequestsTable.enrollmentId, enrollmentId),
//           eq(CertificateRequestsTable.status, "PENDING")
//         )
//       )
//       .limit(1);

//     if (existingRequest.length > 0) {
//       return NextResponse.json(
//         { error: "Certificate request already pending" },
//         { status: 400 }
//       );
//     }

//     // Create certificate request
//     await db.insert(CertificateRequestsTable).values({
//       userId,
//       enrollmentId,
//       status: "PENDING",
//       requestedAt: new Date(),
//     });

//     return NextResponse.json(
//       { message: "Certificate request submitted successfully" },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error creating certificate request:", error);
//     return NextResponse.json(
//       { error: "Failed to request certificate" },
//       { status: 500 }
//     );
//   }
// }

// app/api/user/certificate-request/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { CertificateRequestsTable, EnrollmentsTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { enrollmentId, userId } = await request.json();

    // Check if enrollment exists and belongs to user
    const enrollment = await db
      .select()
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.id, enrollmentId),
          eq(EnrollmentsTable.userId, userId)
        )
      )
      .limit(1);

    if (!enrollment.length) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // REMOVED: Course completion requirement
    // Users can request certificates for any enrolled course

    // Check if certificate already exists
    if (enrollment[0].certificateIssued) {
      return NextResponse.json(
        { error: "Certificate already issued" },
        { status: 400 }
      );
    }

    // Check if there's already a pending request
    const existingRequest = await db
      .select()
      .from(CertificateRequestsTable)
      .where(
        and(
          eq(CertificateRequestsTable.enrollmentId, enrollmentId),
          eq(CertificateRequestsTable.status, "PENDING")
        )
      )
      .limit(1);

    if (existingRequest.length > 0) {
      return NextResponse.json(
        { error: "Certificate request already pending" },
        { status: 400 }
      );
    }

    // Create certificate request
    await db.insert(CertificateRequestsTable).values({
      userId,
      enrollmentId,
      status: "PENDING",
      requestedAt: new Date(),
    });

    return NextResponse.json(
      { message: "Certificate request submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating certificate request:", error);
    return NextResponse.json(
      { error: "Failed to request certificate" },
      { status: 500 }
    );
  }
}