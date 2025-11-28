//src/app/api/admin/courses/[id]/sessions/route.ts
/*eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import {
  CourseSessionsTable,
  CoursesTable
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// POST - Create a new session
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;

  try {
    const { id: courseId } = params;
    const body = await req.json();

    // Check if course exists
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const {
      sessionNumber,
      title,
      description,
      sessionDate,
      sessionTime,
      duration,
      meetingLink,
      meetingPasscode,
      recordingUrl,
      isCompleted = false,
    } = body;

    // Validate required fields
    if (!sessionNumber || !title || !sessionDate || !sessionTime) {
      return NextResponse.json(
        { error: "Session number, title, date, and time are required" },
        { status: 400 }
      );
    }

    // Check if session number already exists for this course
    const existingSession = await db
      .select()
      .from(CourseSessionsTable)
      .where(
        and(
          eq(CourseSessionsTable.courseId, courseId),
          eq(CourseSessionsTable.sessionNumber, sessionNumber)
        )
      )
      .limit(1);

    if (existingSession.length > 0) {
      return NextResponse.json(
        { error: `Session number ${sessionNumber} already exists for this course` },
        { status: 400 }
      );
    }

    // Create session data with proper typing
    const sessionData = {
      courseId,
      sessionNumber: Number(sessionNumber),
      title: String(title),
      description: description ? String(description) : "",
      sessionDate: new Date(sessionDate),
      sessionTime: String(sessionTime),
      duration: Number(duration) || 60,
      meetingLink: meetingLink ? String(meetingLink) : "",
      meetingPasscode: meetingPasscode ? String(meetingPasscode) : "",
      recordingUrl: recordingUrl ? String(recordingUrl) : "",
      isCompleted: Boolean(isCompleted),
    };

    const [newSession] = await db
      .insert(CourseSessionsTable)
      .values(sessionData)
      .returning();

    return NextResponse.json(
      {
        message: "Session created successfully",
        session: {
          ...newSession,
          sessionDate: newSession.sessionDate?.toISOString().split('T')[0] || '',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/admin/courses/[id]/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to create session", details: error.message },
      { status: 500 }
    );
  }
}


