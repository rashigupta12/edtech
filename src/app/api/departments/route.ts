/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/departments/route.ts

import { db } from '@/db';
import { DepartmentsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const parseBoolean = (v: string | null | undefined): boolean =>
  v === 'true' || v === '1';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const collegeId = searchParams.get("collegeId");
    const active = searchParams.get("active");
    const includeCollege = searchParams.get("includeCollege");

    // GET /api/departments?id=123
    if (id) {
      const department = await db.query.DepartmentsTable.findFirst({
        where: (dept, { eq }) => eq(dept.id, id),
        with: includeCollege ? {
          college: true
        } : undefined,
      });

      if (!department) {
        return NextResponse.json(
          { success: false, error: { message: "Department not found" } },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: department });
    }

    // GET /api/departments?collegeId=xyz&active=true
    if (collegeId && parseBoolean(active)) {
      const departments = await db.query.DepartmentsTable.findMany({
        where: (dept, { eq, and }) =>
          and(eq(dept.collegeId, collegeId), eq(dept.isActive, true)),
        with: includeCollege ? {
          college: true
        } : undefined,
      });

      return NextResponse.json({ success: true, data: departments });
    }

    // GET /api/departments?collegeId=xyz
    if (collegeId) {
      const departments = await db.query.DepartmentsTable.findMany({
        where: (dept, { eq }) => eq(dept.collegeId, collegeId),
        with: includeCollege ? {
          college: true
        } : undefined,
      });

      return NextResponse.json({ success: true, data: departments });
    }

    // GET /api/departments?active=true
    if (parseBoolean(active)) {
      const departments = await db.query.DepartmentsTable.findMany({
        where: (dept, { eq }) => eq(dept.isActive, true),
        with: includeCollege ? {
          college: true
        } : undefined,
      });

      return NextResponse.json({ success: true, data: departments });
    }

    // GET all departments with college info if requested
    if (includeCollege) {
      const departments = await db.query.DepartmentsTable.findMany({
        with: {
          college: true
        }
      });
      return NextResponse.json({ success: true, data: departments });
    }

    // GET all departments without college info
    const departments = await db.query.DepartmentsTable.findMany();
    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [department] = await db
      .insert(DepartmentsTable)
      .values({
        collegeId: body.collegeId,
        name: body.name,
        code: body.code,
        description: body.description,
        headOfDepartment: body.headOfDepartment,
        isActive: body.isActive ?? true,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: department, message: 'Department created' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id)
      return NextResponse.json(
        { success: false, error: { message: 'ID required' } },
        { status: 400 }
      );

    const [department] = await db
      .update(DepartmentsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(DepartmentsTable.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: department,
      message: 'Department updated',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id)
      return NextResponse.json(
        { success: false, error: { message: 'ID required' } },
        { status: 400 }
      );

    await db.delete(DepartmentsTable).where(eq(DepartmentsTable.id, id));

    return NextResponse.json({
      success: true,
      message: 'Department deleted',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 }
    );
  }
}
