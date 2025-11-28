// app/api/jyotishi/recent-assignments/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { 
  UserCourseCouponsTable, 
  UsersTable, 
  CoursesTable, 
  CouponsTable 
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user to verify Jyotishi role
    const currentUser = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.email, session.user.email))
      .limit(1);

    if (currentUser.length === 0 || currentUser[0].role !== "JYOTISHI") {
      return NextResponse.json({ error: "Forbidden - Jyotishi role required" }, { status: 403 });
    }

    const jyotishiId = currentUser[0].id;
    const jyotishiName = currentUser[0].name;

    // Get recent assignments for this Jyotishi
    const assignments = await db
      .select({
        id: UserCourseCouponsTable.id,
        studentName: UsersTable.name,
        studentEmail: UsersTable.email,
        courseTitle: CoursesTable.title,
        couponCode: CouponsTable.code,
        discountValue: CouponsTable.discountValue,
        discountType: CouponsTable.discountType,
        assignedAt: UserCourseCouponsTable.createdAt,
        // Since the assignedBy is always the current Jyotishi, we can use their name directly
        assignedByName: sql`${jyotishiName}`.as("assignedByName"),
      })
      .from(UserCourseCouponsTable)
      .innerJoin(UsersTable, eq(UserCourseCouponsTable.userId, UsersTable.id))
      .innerJoin(CoursesTable, eq(UserCourseCouponsTable.courseId, CoursesTable.id))
      .innerJoin(CouponsTable, eq(UserCourseCouponsTable.couponId, CouponsTable.id))
      .where(eq(UserCourseCouponsTable.assignedBy, jyotishiId))
      .orderBy(desc(UserCourseCouponsTable.createdAt))
      .limit(10);

    return NextResponse.json({
      assignments: assignments.map(assignment => ({
        ...assignment,
        assignedAt: assignment.assignedAt?.toISOString(),
        assignedByName: assignment.assignedByName || jyotishiName, // Fallback to current user's name
      }))
    });
  } catch (error) {
    console.error("Error fetching recent assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}