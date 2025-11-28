/* eslint-disable @typescript-eslint/no-explicit-any */
// 6. CERTIFICATES API
// src/app/api/certificates/route.ts


import { db } from '@/db';
import { CertificatesTable } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const parseBoolean = (value: string | null | undefined): boolean => value === 'true' || value === '1';

// CERTIFICATES ROUTE HANDLERS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const verificationCode = searchParams.get('verificationCode');
    const pending = searchParams.get('pending');

    // GET /api/certificates?verificationCode=ABC123
    if (verificationCode) {
      const [cert] = await db.select().from(CertificatesTable)
        .where(eq(CertificatesTable.verificationCode, verificationCode)).limit(1);
      if (!cert) return NextResponse.json({ success: false, error: { message: 'Certificate not found' } }, { status: 404 });
      return NextResponse.json({ success: true, data: cert });
    }

    // GET /api/certificates?pending=true
    if (parseBoolean(pending)) {
      const certs = await db.select().from(CertificatesTable)
        .where(eq(CertificatesTable.status, 'PENDING')).orderBy(desc(CertificatesTable.createdAt));
      return NextResponse.json({ success: true, data: certs });
    }

    // GET /api/certificates?courseId=123
    if (courseId) {
      const certs = await db.select().from(CertificatesTable)
        .where(eq(CertificatesTable.courseId, courseId)).orderBy(desc(CertificatesTable.issuedDate));
      return NextResponse.json({ success: true, data: certs });
    }

    // GET /api/certificates?id=123
    if (id) {
      const [cert] = await db.select().from(CertificatesTable).where(eq(CertificatesTable.id, id)).limit(1);
      if (!cert) return NextResponse.json({ success: false, error: { message: 'Certificate not found' } }, { status: 404 });
      return NextResponse.json({ success: true, data: cert });
    }

    // GET /api/certificates?userId=123
    if (userId) {
      const certs = await db.select().from(CertificatesTable)
        .where(eq(CertificatesTable.userId, userId)).orderBy(desc(CertificatesTable.issuedDate));
      return NextResponse.json({ success: true, data: certs });
    }

    return NextResponse.json({ success: false, error: { message: 'userId or id required' } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const approve = searchParams.get('approve');
    const reject = searchParams.get('reject');
    const generate = searchParams.get('generate');
    const requestCert = searchParams.get('request');

    // POST /api/certificates?id=123&approve=true
    if (id && parseBoolean(approve)) {
      const [cert] = await db.update(CertificatesTable)
        .set({ status: 'APPROVED', approvedAt: new Date() })
        .where(eq(CertificatesTable.id, id)).returning();
      return NextResponse.json({ success: true, data: cert, message: 'Certificate approved' });
    }

    // POST /api/certificates?id=123&reject=true
    if (id && parseBoolean(reject)) {
      const [cert] = await db.update(CertificatesTable)
        .set({ status: 'REJECTED' })
        .where(eq(CertificatesTable.id, id)).returning();
      return NextResponse.json({ success: true, data: cert, message: 'Certificate rejected' });
    }

    // POST /api/certificates?id=123&generate=true
    if (id && parseBoolean(generate)) {
      // Generate PDF logic here
      return NextResponse.json({ success: true, message: 'Certificate generated' });
    }

    // POST /api/certificates?request=true
    if (parseBoolean(requestCert)) {
      const body = await request.json();
      const [cert] = await db.insert(CertificatesTable).values({
        enrollmentId: body.enrollmentId,
        userId: body.userId,
        courseId: body.courseId,
        certificateNumber: `CERT-${Date.now()}`,
        verificationCode: `VERIFY-${Date.now()}`,
        studentName: body.studentName,
        courseName: body.courseName,
        collegeName: body.collegeName,
        completionDate: new Date(),
        status: 'PENDING',
      }).returning();
      return NextResponse.json({ success: true, data: cert, message: 'Certificate requested' }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: { message: 'Invalid request' } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

    await db.delete(CertificatesTable).where(eq(CertificatesTable.id, id));
    return NextResponse.json({ success: true, message: 'Certificate deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}