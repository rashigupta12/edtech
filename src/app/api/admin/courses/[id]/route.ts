//src/app/admin/coures/[id]/route.ts
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
  CourseSessionsTable,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ==========================
// GET - Get single course
// ==========================
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: slug } = await context.params;

  try {
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.slug, slug))
      .limit(1);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const [features, whyLearn, content, topics, sessions] = await Promise.all([
      db.select().from(CourseFeaturesTable).where(eq(CourseFeaturesTable.courseId, course.id)),
      db.select().from(CourseWhyLearnTable).where(eq(CourseWhyLearnTable.courseId, course.id)),
      db.select().from(CourseContentTable).where(eq(CourseContentTable.courseId, course.id)),
      db.select().from(CourseTopicsTable).where(eq(CourseTopicsTable.courseId, course.id)),
      db.select().from(CourseSessionsTable).where(eq(CourseSessionsTable.courseId, course.id)),
    ]);

    return NextResponse.json(
      {
        ...course,
        features: features.map((f) => f.feature),
        whyLearn: whyLearn.map((w) => ({
          title: w.title,
          description: w.description,
        })),
        content: content.map((c) => c.content),
        topics: topics.map((t) => t.topic),
        sessions: sessions.map((s) => ({
          id: s.id,
          sessionNumber: s.sessionNumber,
          title: s.title,
          description: s.description,
          sessionDate: s.sessionDate?.toISOString().split('T')[0] || '',
          sessionTime: s.sessionTime,
          duration: s.duration,
          meetingLink: s.meetingLink,
          meetingPasscode: s.meetingPasscode,
          recordingUrl: s.recordingUrl,
          isCompleted: s.isCompleted,
          createdAt: s.createdAt?.toISOString(),
          updatedAt: s.updatedAt?.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/courses/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

// ==========================
// PUT - Update a course
// ==========================
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;

  try {
    const { id } = params;
    const body = await req.json();

    const { features, whyLearn, content, topics, sessions, ...courseData } = body;

    const dateFields = [
      "createdAt",
      "updatedAt",
      "startDate",
      "endDate",
      "registrationDeadline",
    ] as const;

    const cleanedCourseData = { ...courseData };

    for (const field of dateFields) {
      if (cleanedCourseData[field] != null && cleanedCourseData[field] !== "") {
        if (typeof cleanedCourseData[field] === "string") {
          cleanedCourseData[field] = new Date(cleanedCourseData[field]);
        }
      } else if (cleanedCourseData[field] === "") {
        cleanedCourseData[field] = null;
      }
    }

    cleanedCourseData.updatedAt = new Date();

    const [updatedCourse] = await db
      .update(CoursesTable)
      .set(cleanedCourseData)
      .where(eq(CoursesTable.id, id))
      .returning();

    if (!updatedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (features !== undefined) {
      await db.delete(CourseFeaturesTable).where(eq(CourseFeaturesTable.courseId, id));
      if (features.length > 0) {
        await db.insert(CourseFeaturesTable).values(
          features.map((feature: string, index: number) => ({
            courseId: id,
            feature,
            sortOrder: index,
          }))
        );
      }
    }

    if (whyLearn !== undefined) {
      await db.delete(CourseWhyLearnTable).where(eq(CourseWhyLearnTable.courseId, id));
      if (whyLearn.length > 0) {
        await db.insert(CourseWhyLearnTable).values(
          whyLearn.map((item: any, index: number) => ({
            courseId: id,
            title: item.title,
            description: item.description,
            sortOrder: index,
          }))
        );
      }
    }

    if (content !== undefined) {
      await db.delete(CourseContentTable).where(eq(CourseContentTable.courseId, id));
      if (content.length > 0) {
        await db.insert(CourseContentTable).values(
          content.map((item: string, index: number) => ({
            courseId: id,
            content: item,
            sortOrder: index,
          }))
        );
      }
    }

    if (topics !== undefined) {
      await db.delete(CourseTopicsTable).where(eq(CourseTopicsTable.courseId, id));
      if (topics.length > 0) {
        await db.insert(CourseTopicsTable).values(
          topics.map((topic: string) => ({
            courseId: id,
            topic,
          }))
        );
      }
    }

    return NextResponse.json(
      { message: "Course updated successfully", course: updatedCourse },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT /api/admin/courses/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update course", details: error.message },
      { status: 500 }
    );
  }
}

// ==========================
// DELETE - Delete a course
// ==========================
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // Check if course exists
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, id))
      .limit(1);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Delete related records first
    await Promise.all([
      db.delete(CourseFeaturesTable).where(eq(CourseFeaturesTable.courseId, id)),
      db.delete(CourseWhyLearnTable).where(eq(CourseWhyLearnTable.courseId, id)),
      db.delete(CourseContentTable).where(eq(CourseContentTable.courseId, id)),
      db.delete(CourseTopicsTable).where(eq(CourseTopicsTable.courseId, id)),
      db.delete(CourseSessionsTable).where(eq(CourseSessionsTable.courseId, id)),
    ]);

    // Delete the main course
    await db.delete(CoursesTable).where(eq(CoursesTable.id, id));

    return NextResponse.json(
      { message: "Course deleted successfully", deletedId: id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /api/admin/courses/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete course", details: error.message },
      { status: 500 }
    );
  }
}

