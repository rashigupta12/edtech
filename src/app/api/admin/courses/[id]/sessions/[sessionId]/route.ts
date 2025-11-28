//src/app/api/admin/courses/[id]/sessions/[sessionId]/route.ts
/*eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import {
  CourseSessionsTable,
  CoursesTable
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// PUT - Update a session
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  const params = await context.params;

  try {
    const { id: courseId, sessionId } = params;
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

    // Check if session exists
    const [existingSession] = await db
      .select()
      .from(CourseSessionsTable)
      .where(
        and(
          eq(CourseSessionsTable.id, sessionId),
          eq(CourseSessionsTable.courseId, courseId)
        )
      )
      .limit(1);

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
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
      isCompleted,
    } = body;

    // If session number is being changed, check for conflicts
    if (sessionNumber && sessionNumber !== existingSession.sessionNumber) {
      const conflictingSession = await db
        .select()
        .from(CourseSessionsTable)
        .where(
          and(
            eq(CourseSessionsTable.courseId, courseId),
            eq(CourseSessionsTable.sessionNumber, sessionNumber)
          )
        )
        .limit(1);

      if (conflictingSession.length > 0) {
        return NextResponse.json(
          { error: `Session number ${sessionNumber} already exists for this course` },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update provided fields
    if (sessionNumber !== undefined) updateData.sessionNumber = sessionNumber;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || "";
    if (sessionDate !== undefined) updateData.sessionDate = sessionDate ? new Date(sessionDate) : null;
    if (sessionTime !== undefined) updateData.sessionTime = sessionTime;
    if (duration !== undefined) updateData.duration = duration;
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink || "";
    if (meetingPasscode !== undefined) updateData.meetingPasscode = meetingPasscode || "";
    if (recordingUrl !== undefined) updateData.recordingUrl = recordingUrl || "";
    if (isCompleted !== undefined) updateData.isCompleted = Boolean(isCompleted);

    const [updatedSession] = await db
      .update(CourseSessionsTable)
      .set(updateData)
      .where(
        and(
          eq(CourseSessionsTable.id, sessionId),
          eq(CourseSessionsTable.courseId, courseId)
        )
      )
      .returning();

    return NextResponse.json(
      {
        message: "Session updated successfully",
        session: {
          ...updatedSession,
          sessionDate: updatedSession.sessionDate?.toISOString().split('T')[0] || '',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT /api/admin/courses/[id]/sessions/[sessionId] error:", error);
    return NextResponse.json(
      { error: "Failed to update session", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a session
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  const params = await context.params;

  try {
    const { id: courseId, sessionId } = params;

    // Check if course exists
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if session exists
    const [session] = await db
      .select()
      .from(CourseSessionsTable)
      .where(
        and(
          eq(CourseSessionsTable.id, sessionId),
          eq(CourseSessionsTable.courseId, courseId)
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await db
      .delete(CourseSessionsTable)
      .where(
        and(
          eq(CourseSessionsTable.id, sessionId),
          eq(CourseSessionsTable.courseId, courseId)
        )
      );

    return NextResponse.json(
      { message: "Session deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /api/admin/courses/[id]/sessions/[sessionId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete session", details: error.message },
      { status: 500 }
    );
  }
}