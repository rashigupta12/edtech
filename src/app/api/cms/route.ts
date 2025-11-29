// app/api/cms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { CMSPagesTable, UsersTable } from '@/db/schema';
import { eq, desc, and, like, sql } from 'drizzle-orm';

// GET /api/cms - Get all CMS pages with filtering, sorting, and pagination
// GET /api/cms?id=123 - Get individual CMS page by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if requesting individual page
    const pageId = searchParams.get('id');
    
    if (pageId) {
      // Get individual CMS page
      return await getCMSById(pageId);
    }
    
    // Otherwise, get paginated list of pages
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        like(CMSPagesTable.title, `%${search}%`)
      );
    }
    
    if (isActive !== null) {
      conditions.push(
        eq(CMSPagesTable.isActive, isActive === 'true')
      );
    }
    
    const whereCondition = conditions.length > 0 
      ? and(...conditions)
      : undefined;

    // Build order by
    let orderBy;
    switch (sortBy) {
      case 'title':
        orderBy = sortOrder === 'asc' ? CMSPagesTable.title : desc(CMSPagesTable.title);
        break;
      case 'slug':
        orderBy = sortOrder === 'asc' ? CMSPagesTable.slug : desc(CMSPagesTable.slug);
        break;
      default:
        orderBy = sortOrder === 'asc' ? CMSPagesTable.createdAt : desc(CMSPagesTable.createdAt);
    }

    // Get paginated results
    const pages = await db
      .select()
      .from(CMSPagesTable)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(CMSPagesTable)
      .where(whereCondition);
    
    const total = countResult[0].count;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: pages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching CMS pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CMS pages' },
      { status: 500 }
    );
  }
}

// GET individual CMS page by ID
const getCMSById = async (id: string) => {
  try {
    // Validate ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid page ID format' },
        { status: 400 }
      );
    }

    // Fetch the individual page with user information
    const [pageWithUser] = await db
      .select({
        page: CMSPagesTable,
        userName: UsersTable.name,
        userEmail: UsersTable.email,
      })
      .from(CMSPagesTable)
      .leftJoin(UsersTable, eq(CMSPagesTable.createdBy, UsersTable.id))
      .where(eq(CMSPagesTable.id, id));

    if (!pageWithUser) {
      return NextResponse.json(
        { success: false, error: 'CMS page not found' },
        { status: 404 }
      );
    }

    // Combine the data
    const formattedPage = {
      ...pageWithUser.page,
      user: {
        name: pageWithUser.userName,
        email: pageWithUser.userEmail,
      }
    };

    return NextResponse.json({
      success: true,
      data: formattedPage,
    });
  } catch (error) {
    console.error('Error fetching CMS page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CMS page' },
      { status: 500 }
    );
  }
};

// POST /api/cms - Create a new CMS page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      title, 
      slug, 
      content, 
      metaTitle, 
      metaDescription, 
      isActive = true,
      createdBy 
    } = body;
    
    // Validate required fields
    if (!title || !slug || !content || !createdBy) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: title, slug, content, and createdBy are required' 
        },
        { status: 400 }
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Slug must contain only lowercase letters, numbers, and hyphens' 
        },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPage = await db
      .select()
      .from(CMSPagesTable)
      .where(eq(CMSPagesTable.slug, slug))
      .limit(1);
    
    if (existingPage.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Slug already exists' },
        { status: 409 }
      );
    }

    // Create new page
    const [newPage] = await db
      .insert(CMSPagesTable)
      .values({
        title,
        slug,
        content,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || `${title} - CMS page`,
        isActive,
        createdBy,
      })
      .returning();

    return NextResponse.json(
      { 
        success: true, 
        message: 'CMS page created successfully',
        data: newPage 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating CMS page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create CMS page' },
      { status: 500 }
    );
  }
}

// PUT /api/cms - Update individual CMS page
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('id');
    
    if (!pageId) {
      return NextResponse.json(
        { success: false, error: 'Page ID is required for update' },
        { status: 400 }
      );
    }

    return await updateCMSById(pageId, request);
  } catch (error) {
    console.error('Error in PUT operation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// Update individual CMS page by ID
const updateCMSById = async (id: string, request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid page ID format' },
        { status: 400 }
      );
    }

    const {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      isActive,
    } = body;

    // Check if page exists
    const [existingPage] = await db
      .select()
      .from(CMSPagesTable)
      .where(eq(CMSPagesTable.id, id));

    if (!existingPage) {
      return NextResponse.json(
        { success: false, error: 'CMS page not found' },
        { status: 404 }
      );
    }

    // If slug is being updated, check if it already exists (excluding current page)
    if (slug && slug !== existingPage.slug) {
      const [pageWithSlug] = await db
        .select()
        .from(CMSPagesTable)
        .where(eq(CMSPagesTable.slug, slug))
        .limit(1);

      if (pageWithSlug && pageWithSlug.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 409 }
        );
      }
    }

    // Validate slug format if provided
    if (slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Slug must contain only lowercase letters, numbers, and hyphens'
          },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (title !== undefined && !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (content !== undefined && !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Update the page
    const [updatedPage] = await db
      .update(CMSPagesTable)
      .set({
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(CMSPagesTable.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'CMS page updated successfully',
      data: updatedPage,
    });
  } catch (error) {
    console.error('Error updating CMS page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update CMS page' },
      { status: 500 }
    );
  }
};

// DELETE /api/cms - Delete individual CMS page
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('id');

    if (!pageId) {
      return NextResponse.json(
        { success: false, error: 'Page ID is required for deletion' },
        { status: 400 }
      );
    }

    return await deleteCMSById(pageId);
  } catch (error) {
    console.error('Error in DELETE operation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}

// Delete individual CMS page by ID
const deleteCMSById = async (id: string) => {
  try {
    // Validate ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid page ID format' },
        { status: 400 }
      );
    }

    // Check if page exists
    const [existingPage] = await db
      .select()
      .from(CMSPagesTable)
      .where(eq(CMSPagesTable.id, id));

    if (!existingPage) {
      return NextResponse.json(
        { success: false, error: 'CMS page not found' },
        { status: 404 }
      );
    }

    // Delete the page
    const [deletedPage] = await db
      .delete(CMSPagesTable)
      .where(eq(CMSPagesTable.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'CMS page deleted successfully',
      data: deletedPage,
    });
  } catch (error) {
    console.error('Error deleting CMS page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete CMS page' },
      { status: 500 }
    );
  }
};