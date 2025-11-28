/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@/db";
import { CoursesTable, EnrollmentsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user.id;
if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }
    const enrollments = await db
      .select({
        id: EnrollmentsTable.id,
        courseId: EnrollmentsTable.courseId,
        status: EnrollmentsTable.status,
        enrolledAt: EnrollmentsTable.enrolledAt,
        completedAt: EnrollmentsTable.completedAt,
        certificateIssued: EnrollmentsTable.certificateIssued,
        certificateUrl: EnrollmentsTable.certificateUrl,
        courseTitle: CoursesTable.title,
        courseThumbnail: CoursesTable.thumbnailUrl,
      })
      .from(EnrollmentsTable)
      .leftJoin(CoursesTable, eq(EnrollmentsTable.courseId, CoursesTable.id))
      .where(eq(EnrollmentsTable.userId, userId));

    return NextResponse.json({ enrollments }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}