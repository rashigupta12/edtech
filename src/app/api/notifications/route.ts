
// ===========================
// 10. NOTIFICATIONS API
// src/app/api/notifications/route.ts
// ===========================

import { db } from '@/db';
import { NotificationsTable } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const parseBoolean = (value: string | null | undefined): boolean => value === 'true' || value === '1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unread = searchParams.get('unread');

    if (!userId) return NextResponse.json({ success: false, error: { message: 'userId required' } }, { status: 400 });

    // GET /api/notifications?userId=123&unread=true
    if (parseBoolean(unread)) {
      const notifications = await db.select().from(NotificationsTable)
        .where(and(eq(NotificationsTable.userId, userId), eq(NotificationsTable.isRead, false)))
        .orderBy(desc(NotificationsTable.createdAt));
      return NextResponse.json({ success: true, data: notifications });
    }

    // GET /api/notifications?userId=123
    const notifications = await db.select().from(NotificationsTable)
      .where(eq(NotificationsTable.userId, userId))
      .orderBy(desc(NotificationsTable.createdAt));
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const readAll = searchParams.get('readAll');

    // PUT /api/notifications?userId=123&readAll=true
    if (userId && parseBoolean(readAll)) {
      await db.update(NotificationsTable)
        .set({ isRead: true })
        .where(eq(NotificationsTable.userId, userId));
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    // PUT /api/notifications?id=123
    if (id) {
      const [notification] = await db.update(NotificationsTable)
        .set({ isRead: true })
        .where(eq(NotificationsTable.id, id)).returning();
      return NextResponse.json({ success: true, data: notification });
    }

    return NextResponse.json({ success: false, error: { message: 'id or userId required' } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const clearAll = searchParams.get('clearAll');

    // DELETE /api/notifications?userId=123&clearAll=true
    if (userId && parseBoolean(clearAll)) {
      await db.delete(NotificationsTable).where(eq(NotificationsTable.userId, userId));
      return NextResponse.json({ success: true, message: 'All notifications cleared' });
    }

    // DELETE /api/notifications?id=123
    if (id) {
      await db.delete(NotificationsTable).where(eq(NotificationsTable.id, id));
      return NextResponse.json({ success: true, message: 'Notification deleted' });
    }

    return NextResponse.json({ success: false, error: { message: 'id or userId required' } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}