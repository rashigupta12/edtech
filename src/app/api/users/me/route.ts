/*eslint-disable   @typescript-eslint/no-unused-vars*/
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { UsersTable } from '@/db/schema';
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

    const [user] = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        mobile: UsersTable.mobile,
        role: UsersTable.role,
        profileImage: UsersTable.profileImage,
        bio: UsersTable.bio,
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, session.user.id));

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user info' },
      { status: 500 }
    );
  }
}