// src/app/api/agent/recent-sales/route.ts
import { auth } from "@/auth";
import { db } from "@/db";
import {
  CommissionsTable,
  CouponsTable,
  CoursesTable,
  UsersTable
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";


interface RecentSale {
  id: string;
  studentName: string;
  courseName: string;
  saleAmount: number;
  commissionAmount: number;
  commissionRate: number;
  status: string;
  couponCode?: string;
  createdAt: Date;
  timeAgo: string;
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== "JYOTISHI") {
      return NextResponse.json(
        { error: "Unauthorized - Agent access required" },
        { status: 401 }
      );
    }

    const jyotishiId = session.user.id;

    // Fetch recent commissions (last 10)
    const recentSales = await db
      .select({
        id: CommissionsTable.id,
        studentName: UsersTable.name,
        courseName: CoursesTable.title,
        saleAmount: CommissionsTable.saleAmount,
        commissionAmount: CommissionsTable.commissionAmount,
        commissionRate: CommissionsTable.commissionRate,
        status: CommissionsTable.status,
        couponCode: CouponsTable.code,
        createdAt: CommissionsTable.createdAt,
      })
      .from(CommissionsTable)
      .innerJoin(UsersTable, eq(CommissionsTable.studentId, UsersTable.id))
      .innerJoin(CoursesTable, eq(CommissionsTable.courseId, CoursesTable.id))
      .leftJoin(CouponsTable, eq(CommissionsTable.couponId, CouponsTable.id))
      .where(eq(CommissionsTable.jyotishiId, jyotishiId))
      .orderBy(desc(CommissionsTable.createdAt))
      .limit(10);

    const formattedSales: RecentSale[] = recentSales.map(sale => ({
      id: sale.id,
      studentName: sale.studentName,
      courseName: sale.courseName,
      saleAmount: parseFloat(sale.saleAmount),
      commissionAmount: parseFloat(sale.commissionAmount),
      commissionRate: parseFloat(sale.commissionRate),
      status: sale.status,
      couponCode: sale.couponCode || undefined,
      createdAt: sale.createdAt,
      timeAgo: getRelativeTime(new Date(sale.createdAt))
    }));

    return NextResponse.json(formattedSales);
  } catch (error) {
    console.error("Agent recent sales error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent sales" },
      { status: 500 }
    );
  }
}

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}