/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/categories/route.ts

import { db } from '@/db';
import { CategoriesTable, CoursesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const parseBoolean = (value: string | null | undefined): boolean => value === 'true' || value === '1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const active = searchParams.get('active');
    const courses = searchParams.get('courses');

    // GET /api/categories?id=123&courses=true
    if (id && parseBoolean(courses)) {
      const coursesData = await db.select().from(CoursesTable)
        .where(eq(CoursesTable.categoryId, id));
      return NextResponse.json({ success: true, data: coursesData });
    }

    // GET /api/categories?id=123
    if (id) {
      const [category] = await db.select().from(CategoriesTable).where(eq(CategoriesTable.id, id)).limit(1);
      if (!category) return NextResponse.json({ success: false, error: { message: 'Category not found' } }, { status: 404 });
      return NextResponse.json({ success: true, data: category });
    }

    // GET /api/categories?active=true
    if (parseBoolean(active)) {
      const categories = await db.select().from(CategoriesTable)
        .where(eq(CategoriesTable.isActive, true))
        .orderBy(CategoriesTable.sortOrder);
      return NextResponse.json({ success: true, data: categories });
    }

    // GET /api/categories (all)
    const categories = await db.select().from(CategoriesTable).orderBy(CategoriesTable.sortOrder);
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [category] = await db.insert(CategoriesTable).values({
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description,
      icon: body.icon,
      sortOrder: body.sortOrder || 0,
      isActive: body.isActive ?? true,
    }).returning();
    return NextResponse.json({ success: true, data: category, message: 'Category created' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reorder = searchParams.get('reorder');
    const body = await request.json();

    // PUT /api/categories?reorder=true
    if (parseBoolean(reorder)) {
      for (const cat of body.categories) {
        await db.update(CategoriesTable).set({ sortOrder: cat.sortOrder }).where(eq(CategoriesTable.id, cat.id));
      }
      return NextResponse.json({ success: true, message: 'Categories reordered' });
    }

    // PUT /api/categories?id=123
    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });
    const [category] = await db.update(CategoriesTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(CategoriesTable.id, id)).returning();
    return NextResponse.json({ success: true, data: category, message: 'Category updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

    await db.delete(CategoriesTable).where(eq(CategoriesTable.id, id));
    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
