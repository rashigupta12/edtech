import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { StudentProfilesTable, UsersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // If ID is provided, use it, otherwise use session user ID
    const userId = id || session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    const [student] = await db
      .select()
      .from(StudentProfilesTable)
      .where(eq(StudentProfilesTable.id, userId));

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userId = session.user.id;

    // Check if user exists and has STUDENT role
    const [user] = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.id, userId));

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Only students can create student profiles' },
        { status: 403 }
      );
    }

    // Check if profile already exists
    const [existingProfile] = await db
      .select()
      .from(StudentProfilesTable)
      .where(eq(StudentProfilesTable.id, userId));

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists. Use PUT to update.' },
        { status: 400 }
      );
    }

    // Create new profile
    const [newProfile] = await db
      .insert(StudentProfilesTable)
      .values({
        id: userId,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || 'India',
        pinCode: body.pinCode || null,
        educationLevel: body.educationLevel || null,
        institution: body.institution || null,
        currentSemester: body.currentSemester ? Number(body.currentSemester) : null,
        specialization: body.specialization || null,
        academicRecords: body.academicRecords || null,
        skills: Array.isArray(body.skills) ? body.skills : (body.skills ? [body.skills] : []),
        resumeUrl: body.resumeUrl || null,
        linkedinUrl: body.linkedinUrl || null,
        githubUrl: body.githubUrl || null,
      })
      .returning();

    return NextResponse.json(
      { message: 'Profile created successfully', profile: newProfile },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating student profile:', error);
    return NextResponse.json(
      { error: 'Failed to create student profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userId = session.user.id;

    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(StudentProfilesTable)
      .where(eq(StudentProfilesTable.id, userId));

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found. Create profile first.' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      gender: body.gender || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      country: body.country || 'India',
      pinCode: body.pinCode || null,
      educationLevel: body.educationLevel || null,
      institution: body.institution || null,
      specialization: body.specialization || null,
      academicRecords: body.academicRecords || null,
      resumeUrl: body.resumeUrl || null,
      linkedinUrl: body.linkedinUrl || null,
      githubUrl: body.githubUrl || null,
      updatedAt: new Date(),
    };

    // Handle current semester conversion
    if (body.currentSemester !== undefined && body.currentSemester !== null) {
      updateData.currentSemester = Number(body.currentSemester);
    }

    // Handle skills conversion
    if (body.skills !== undefined) {
      if (Array.isArray(body.skills)) {
        updateData.skills = body.skills;
      } else if (typeof body.skills === 'string') {
        updateData.skills = body.skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill);
      } else {
        updateData.skills = [];
      }
    }

    // Update profile
    const [updatedProfile] = await db
      .update(StudentProfilesTable)
      .set(updateData)
      .where(eq(StudentProfilesTable.id, userId))
      .returning();

    return NextResponse.json(
      { message: 'Profile updated successfully', profile: updatedProfile }
    );
  } catch (error) {
    console.error('Error updating student profile:', error);
    return NextResponse.json(
      { error: 'Failed to update student profile' },
      { status: 500 }
    );
  }
}