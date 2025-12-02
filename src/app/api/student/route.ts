import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { StudentProfilesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (id) {
      // Fetch single student by ID
      const [student] = await db
        .select()
        .from(StudentProfilesTable)
        .where(eq(StudentProfilesTable.id, id));

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ student });
    } else {
      // Fetch all students with pagination
      const students = await db
        .select()
        .from(StudentProfilesTable)
        .limit(limit ? parseInt(limit) : 100)
        .offset(offset ? parseInt(offset) : 0);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: StudentProfilesTable.id })
        .from(StudentProfilesTable);

      return NextResponse.json({
        students,
        pagination: {
          total: Number(count),
          limit: limit ? parseInt(limit) : 100,
          offset: offset ? parseInt(offset) : 0
        }
      });
    }
  } catch (error) {
    console.error('Error fetching student data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student data' },
      { status: 500 }
    );
  }
}