
// ===========================
// 9. ANNOUNCEMENTS API
// src/app/api/announcements/route.ts
// ===========================

import { db } from '@/db';
import { AnnouncementsTable } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const parseBoolean = (value: string | null | undefined): boolean => value === 'true' || value === '1';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const platform = searchParams.get('platform');
    const collegeId = searchParams.get('collegeId');
    const courseId = searchParams.get('courseId');

    // GET /api/announcements?id=123
    if (id) {
      const [announcement] = await db.select().from(AnnouncementsTable).where(eq(AnnouncementsTable.id, id)).limit(1);
      if (!announcement) return NextResponse.json({ success: false, error: { message: 'Announcement not found' } }, { status: 404 });
      return NextResponse.json({ success: true, data: announcement });
    }

    // GET /api/announcements?platform=true
    if (parseBoolean(platform)) {
      const announcements = await db.select().from(AnnouncementsTable)
        .where(and(eq(AnnouncementsTable.type, 'PLATFORM'), eq(AnnouncementsTable.isPublished, true)))
        .orderBy(desc(AnnouncementsTable.publishedAt));
      return NextResponse.json({ success: true, data: announcements });
    }

    // GET /api/announcements?collegeId=123
    if (collegeId) {
      const announcements = await db.select().from(AnnouncementsTable)
        .where(eq(AnnouncementsTable.collegeId, collegeId))
        .orderBy(desc(AnnouncementsTable.createdAt));
      return NextResponse.json({ success: true, data: announcements });
    }

    // GET /api/announcements?courseId=123
    if (courseId) {
      const announcements = await db.select().from(AnnouncementsTable)
        .where(eq(AnnouncementsTable.courseId, courseId))
        .orderBy(desc(AnnouncementsTable.createdAt));
      return NextResponse.json({ success: true, data: announcements });
    }

    // GET /api/announcements (all published)
    const announcements = await db.select().from(AnnouncementsTable)
      .where(eq(AnnouncementsTable.isPublished, true))
      .orderBy(desc(AnnouncementsTable.publishedAt));
    return NextResponse.json({ success: true, data: announcements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [announcement] = await db.insert(AnnouncementsTable).values({
      title: body.title,
      content: body.content,
      type: body.type || 'PLATFORM',
      targetAudience: body.targetAudience,
      isScheduled: body.isScheduled || false,
      scheduledAt: body.scheduledAt,
      isPublished: body.isPublished || false,
      publishedAt: body.isPublished ? new Date() : null,
      createdBy: body.createdBy,
      collegeId: body.collegeId,
      courseId: body.courseId,
    }).returning();
    return NextResponse.json({ success: true, data: announcement, message: 'Announcement created' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

    const body = await request.json();
    const [announcement] = await db.update(AnnouncementsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(AnnouncementsTable.id, id)).returning();
    return NextResponse.json({ success: true, data: announcement, message: 'Announcement updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

    await db.delete(AnnouncementsTable).where(eq(AnnouncementsTable.id, id));
    return NextResponse.json({ success: true, message: 'Announcement deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}