/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/sessions/route.ts
// ===========================

import { db } from '@/db';
import { SessionAttendanceTable, SessionsTable } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';


const parseBoolean = (value: string | null | undefined): boolean => value === 'true' || value === '1';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const courseId = searchParams.get('courseId');
    const upcoming = searchParams.get('upcoming');
    const attendance = searchParams.get('attendance');
    const myAttendance = searchParams.get('myAttendance');
    const userId = searchParams.get('userId');

    // GET /api/sessions?myAttendance=true&userId=123
    if (parseBoolean(myAttendance) && userId) {
      const att = await db.select().from(SessionAttendanceTable)
        .where(eq(SessionAttendanceTable.userId, userId));
      return NextResponse.json({ success: true, data: att });
    }

    // GET /api/sessions?id=123&attendance=true
    if (id && parseBoolean(attendance)) {
      const att = await db.select().from(SessionAttendanceTable)
        .where(eq(SessionAttendanceTable.sessionId, id));
      return NextResponse.json({ success: true, data: att });
    }

    // GET /api/sessions?upcoming=true
    if (parseBoolean(upcoming)) {
      const sessions = await db.select().from(SessionsTable)
        .where(eq(SessionsTable.status, 'SCHEDULED'))
        .orderBy(SessionsTable.sessionDate);
      return NextResponse.json({ success: true, data: sessions });
    }

    // GET /api/sessions?courseId=123
    if (courseId) {
      const sessions = await db.select().from(SessionsTable)
        .where(eq(SessionsTable.courseId, courseId))
        .orderBy(desc(SessionsTable.sessionDate));
      return NextResponse.json({ success: true, data: sessions });
    }

    // GET /api/sessions?id=123
    if (id) {
      const [session] = await db.select().from(SessionsTable).where(eq(SessionsTable.id, id)).limit(1);
      if (!session) return NextResponse.json({ success: false, error: { message: 'Session not found' } }, { status: 404 });
      return NextResponse.json({ success: true, data: session });
    }

    return NextResponse.json({ success: false, error: { message: 'Invalid parameters' } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const join = searchParams.get('join');
    const markAttendance = searchParams.get('markAttendance');
    const body = await request.json();

    // POST /api/sessions?id=123&join=true
    if (id && parseBoolean(join)) {
      const [att] = await db.insert(SessionAttendanceTable).values({
        sessionId: id,
        userId: body.userId,
        attended: true,
        joinedAt: new Date(),
      }).returning();
      return NextResponse.json({ success: true, data: att, message: 'Joined session' });
    }

    // POST /api/sessions?id=123&markAttendance=true
    if (id && parseBoolean(markAttendance)) {
      const [att] = await db.insert(SessionAttendanceTable).values({
        sessionId: id,
        userId: body.userId,
        attended: body.attended || true,
      }).returning();
      return NextResponse.json({ success: true, data: att });
    }

    // POST /api/sessions (create new)
    const [session] = await db.insert(SessionsTable).values({
      courseId: body.courseId,
      title: body.title,
      description: body.description,
      sessionDate: body.sessionDate,
      startTime: body.startTime,
      endTime: body.endTime,
      duration: body.duration,
      meetingLink: body.meetingLink,
      meetingPassword: body.meetingPassword,
      meetingPlatform: body.meetingPlatform,
      status: 'SCHEDULED',
      createdBy: body.createdBy,
    }).returning();
    return NextResponse.json({ success: true, data: session, message: 'Session created' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const recording = searchParams.get('recording');
    const attendanceId = searchParams.get('attendanceId');
    const body = await request.json();

    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

    // PUT /api/sessions?id=123&recording=true
    if (parseBoolean(recording)) {
      const [session] = await db.update(SessionsTable)
        .set({ recordingUrl: body.recordingUrl, updatedAt: new Date() })
        .where(eq(SessionsTable.id, id)).returning();
      return NextResponse.json({ success: true, data: session });
    }

    // PUT /api/sessions?id=123&attendanceId=456
    if (attendanceId) {
      const [att] = await db.update(SessionAttendanceTable)
        .set({ attended: body.attended, leftAt: body.leftAt })
        .where(eq(SessionAttendanceTable.id, attendanceId)).returning();
      return NextResponse.json({ success: true, data: att });
    }

    // PUT /api/sessions?id=123
    const [session] = await db.update(SessionsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(SessionsTable.id, id)).returning();
    return NextResponse.json({ success: true, data: session, message: 'Session updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

    await db.delete(SessionsTable).where(eq(SessionsTable.id, id));
    return NextResponse.json({ success: true, message: 'Session deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
