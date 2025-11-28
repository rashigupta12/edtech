// src/app/api/admin/dashboard-stats/route.ts
import { auth } from "@/auth";
import { db } from "@/db";
import {
  CertificateRequestsTable,
  CoursesTable,
  EnrollmentsTable,
  PaymentsTable,
  UsersTable
} from "@/db/schema";
import { and, count, eq, gte, sql, sum } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Calculate date ranges once
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Run ALL database queries in parallel
    const [
      // User counts
      totalUsersResult,
      lastMonthUsersResult,
      thisMonthUsersResult,
      
      // Course counts
      activeCoursesResult,
      totalCoursesResult,
      newCoursesThisMonthResult,
      
      // Revenue data
      totalRevenueResult,
      lastMonthRevenueResult,
      thisMonthRevenueResult,
      
      // Certificates & Enrollments
      pendingCertificatesResult,
      totalEnrollmentsResult,
      activeEnrollmentsResult
    ] = await Promise.all([
      // 1. User counts (parallel)
      db.select({ count: count() }).from(UsersTable),
      db.select({ count: count() })
        .from(UsersTable)
        .where(and(
          gte(UsersTable.createdAt, firstDayLastMonth),
          sql`${UsersTable.createdAt} < ${firstDayThisMonth}`
        )),
      db.select({ count: count() })
        .from(UsersTable)
        .where(gte(UsersTable.createdAt, firstDayThisMonth)),

      // 2. Course counts (parallel)
      db.select({ count: count() })
        .from(CoursesTable)
        .where(sql`${CoursesTable.status} IN ('REGISTRATION_OPEN', 'ONGOING')`),
      db.select({ count: count() }).from(CoursesTable),
      db.select({ count: count() })
        .from(CoursesTable)
        .where(gte(CoursesTable.createdAt, firstDayThisMonth)),

      // 3. Revenue data (parallel)
      db.select({ total: sum(PaymentsTable.finalAmount) })
        .from(PaymentsTable)
        .where(eq(PaymentsTable.status, "COMPLETED")),
      db.select({ total: sum(PaymentsTable.finalAmount) })
        .from(PaymentsTable)
        .where(and(
          eq(PaymentsTable.status, "COMPLETED"),
          gte(PaymentsTable.createdAt, firstDayLastMonth),
          sql`${PaymentsTable.createdAt} < ${firstDayThisMonth}`
        )),
      db.select({ total: sum(PaymentsTable.finalAmount) })
        .from(PaymentsTable)
        .where(and(
          eq(PaymentsTable.status, "COMPLETED"),
          gte(PaymentsTable.createdAt, firstDayThisMonth)
        )),

      // 4. Certificates & Enrollments (parallel)
      db.select({ count: count() })
        .from(CertificateRequestsTable)
        .where(eq(CertificateRequestsTable.status, "PENDING")),
      db.select({ count: count() }).from(EnrollmentsTable),
      db.select({ count: count() })
        .from(EnrollmentsTable)
        .where(eq(EnrollmentsTable.status, "ACTIVE"))
    ]);

    // Extract results
    const totalUsers = totalUsersResult[0]?.count || 0;
    const lastMonthUsers = lastMonthUsersResult[0]?.count || 0;
    const thisMonthUsers = thisMonthUsersResult[0]?.count || 0;
    const activeCourses = activeCoursesResult[0]?.count || 0;
    const totalCourses = totalCoursesResult[0]?.count || 0;
    const newCoursesThisMonth = newCoursesThisMonthResult[0]?.count || 0;
    const totalRevenue = parseFloat(totalRevenueResult[0]?.total || "0");
    const lastMonthRev = parseFloat(lastMonthRevenueResult[0]?.total || "0");
    const thisMonthRev = parseFloat(thisMonthRevenueResult[0]?.total || "0");
    const pendingCertificates = pendingCertificatesResult[0]?.count || 0;
    const totalEnrollments = totalEnrollmentsResult[0]?.count || 0;
    const activeEnrollments = activeEnrollmentsResult[0]?.count || 0;

    // Calculate growth percentages
    const userGrowth = lastMonthUsers > 0 
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 
      : thisMonthUsers > 0 ? 100 : 0;

    const revenueGrowth = lastMonthRev > 0
      ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100
      : thisMonthRev > 0 ? 100 : 0;

    return NextResponse.json({
      totalUsers: {
        count: totalUsers,
        growth: Math.round(userGrowth * 10) / 10,
        newThisMonth: thisMonthUsers
      },
      activeCourses: {
        count: activeCourses,
        total: totalCourses,
        newThisMonth: newCoursesThisMonth
      },
      revenue: {
        total: totalRevenue,
        growth: Math.round(revenueGrowth * 10) / 10,
        thisMonth: thisMonthRev
      },
      pendingCertificates: {
        count: pendingCertificates
      },
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments
      }
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}