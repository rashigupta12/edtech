/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { 
  CoursesTable, 
  CourseFeaturesTable, 
  CourseWhyLearnTable, 
  CourseContentTable, 
  CourseTopicsTable,
  CourseSessionsTable 
} from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - List all courses
// src/app/api/admin/courses/route.ts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query = db.select().from(CoursesTable);

    type CourseStatus = "COMPLETED" | "DRAFT" | "UPCOMING" | "REGISTRATION_OPEN" | "ONGOING" | "ARCHIVED";
    const allowedStatuses: CourseStatus[] = [
      "COMPLETED",
      "DRAFT",
      "UPCOMING",
      "REGISTRATION_OPEN",
      "ONGOING",
      "ARCHIVED"
    ];

    const typedStatus = allowedStatuses.includes(status as CourseStatus)
      ? (status as CourseStatus)
      : undefined;

    const courses = await (typedStatus
      ? query.where(eq(CoursesTable.status, typedStatus))
      : query);

    return NextResponse.json({ courses }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      slug,
      title,
      tagline,
      description,
      instructor,
      duration,
      totalSessions,
      priceINR,
      priceUSD,
      status,
      thumbnailUrl,
      startDate,
      endDate,
      registrationDeadline,
      whyLearnIntro,
      whatYouLearn,
      disclaimer,
      maxStudents,
      currentEnrollments,
      features,
      whyLearn,
      courseContent,
      relatedTopics,
      commissionPercourse,
      
      sessions,
    } = body;

    // Helper function to convert string to Date or null
    const toDateOrNull = (dateStr: string | null) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };

    // Match the EXACT column names from your Drizzle schema (camelCase)
    const courseData = {
      slug,
      title,
      tagline: tagline || null,
      description,
      instructor: instructor || null,
      duration: duration || null,
      totalSessions: totalSessions || null,
      priceINR: priceINR ?? null,
      priceUSD: priceUSD ?? null,
      status,
      thumbnailUrl: thumbnailUrl || null,
      startDate: toDateOrNull(startDate),
      endDate: toDateOrNull(endDate),
      registrationDeadline: toDateOrNull(registrationDeadline),
      whyLearnIntro: whyLearnIntro || null,
      whatYouLearn: whatYouLearn || null,
      disclaimer: disclaimer || null,
      maxStudents: maxStudents || null,
      currentEnrollments: currentEnrollments || 0,
      commissionPercourse: commissionPercourse|| null
    };

    // Insert course
    const [course] = await db
      .insert(CoursesTable)
      .values(courseData)
      .returning();

    // Insert related data
    if (features?.length) {
      await db.insert(CourseFeaturesTable).values(
        features.map((feature: string, index: number) => ({
          courseId: course.id,
          feature,
          sortOrder: index,
        }))
      );
    }

    if (whyLearn?.length) {
      await db.insert(CourseWhyLearnTable).values(
        whyLearn.map((item: any, index: number) => ({
          courseId: course.id,
          title: item.title,
          description: item.description,
          sortOrder: index,
        }))
      );
    }

    if (courseContent?.length) {
      await db.insert(CourseContentTable).values(
        courseContent.map((item: string, index: number) => ({
          courseId: course.id,
          content: item,
          sortOrder: index,
        }))
      );
    }

    if (relatedTopics?.length) {
      await db.insert(CourseTopicsTable).values(
        relatedTopics.map((topic: string) => ({
          courseId: course.id,
          topic,
        }))
      );
    }

    // Insert sessions if provided
    if (sessions?.length) {
      await db.insert(CourseSessionsTable).values(
        sessions.map((session: any) => ({
          courseId: course.id,
          sessionNumber: session.sessionNumber,
          title: session.title,
          description: session.description || null,
          sessionDate: session.sessionDate ? new Date(session.sessionDate) : null,
          sessionTime: session.sessionTime || null,
          duration: session.duration || 60,
          meetingLink: session.meetingLink || null,
          meetingPasscode: session.meetingPasscode || null,
          recordingUrl: session.recordingUrl || null,
          isCompleted: session.isCompleted || false,
        }))
      );
    }

    return NextResponse.json(
      { message: "Course created successfully", course },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Course creation error:", error);
    return NextResponse.json(
      { error: "Failed to create course", details: error.message },
      { status: 500 }
    );
  }
}