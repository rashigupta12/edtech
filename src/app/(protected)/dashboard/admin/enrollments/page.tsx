/*eslint-disable  @typescript-eslint/no-explicit-any*/
/*eslint-disable  @typescript-eslint/no-unused-vars*/
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Calendar, DollarSign, Search, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type Course = {
  id: string;
  title: string;
  slug: string;
};

type Payment = {
  id: string;
  enrollmentId: string;
  invoiceNumber: string;
  finalAmount: string;
  status: string;
  createdAt: string;
};

type Enrollment = {
  id: string;
  user: { id: string; name: string; email: string };
  course: { id: string; title: string; slug: string };
  status: string;
  enrolledAt: string;
  payment: { amount: number; invoiceId: string; status: string };
};

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("ALL");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const [enrollRes, courseRes, userRes, paymentRes] = await Promise.all([
          fetch("/api/admin/enrollments"),
          fetch("/api/courses"),
          fetch("/api/admin/users"),
          fetch("/api/admin/payments"),
        ]);

        const [enrollData, courseData, userData, paymentData] = await Promise.all([
          enrollRes.json(),
          courseRes.json(),
          userRes.json(),
          paymentRes.json(),
        ]);

        // ✅ Unwrap nested arrays
        const enrollments = enrollData?.enrollments || [];
        const users = userData?.users || [];
        const payments = paymentData?.payments || [];
        const courses = courseData.courses || [];

        // ✅ Map users
        const userMap = new Map<string, User>();
        users.forEach((u: any) => {
          userMap.set(u.id, { id: u.id, name: u.name, email: u.email });
        });

        // ✅ Map courses
        const courseList: Course[] = courses.map((c: any) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
        }));

        // ✅ Map payments by enrollmentId - ONLY COMPLETED payments
        const paymentMap = new Map<string, Payment>();
        payments.forEach((p: any) => {
          if (p.enrollmentId && p.status === "COMPLETED") {
            paymentMap.set(p.enrollmentId, {
              id: p.id,
              enrollmentId: p.enrollmentId,
              invoiceNumber: p.invoiceNumber,
              finalAmount: p.finalAmount || "0",
              status: p.status,
              createdAt: p.createdAt,
            });
          }
        });

        // ✅ Build enrollments - ONLY include those with COMPLETED payments
        const builtEnrollments: Enrollment[] = enrollments
          .filter((e: any) => paymentMap.has(e.id)) // Only include if payment is completed
          .map((e: any) => {
            const user = userMap.get(e.userId) || {
              id: e.userId,
              name: "Unknown User",
              email: "",
            };

            const course = courseList.find((c) => c.id === e.courseId) || {
              id: e.courseId,
              title: `Course #${e.courseId.slice(0, 8)}`,
              slug: e.courseId,
            };

            const payment = paymentMap.get(e.id)!; // We know it exists because of filter
            const paymentInfo = {
              amount: parseFloat(payment.finalAmount),
              invoiceId: payment.invoiceNumber,
              status: payment.status,
            };

            return {
              id: e.id,
              user,
              course,
              status: e.status,
              enrolledAt: e.enrolledAt,
              payment: paymentInfo,
            };
          });

        // ✅ Update states
        setEnrollments(builtEnrollments);
        setCourses([{ id: "ALL", title: "All Courses", slug: "" }, ...courseList]);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const filtered = enrollments.filter((e) => {
    const matchesSearch =
      e.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === "ALL" || e.course.id === courseFilter;
    return matchesSearch && matchesCourse;
  });

  // Calculate stats
  const totalRevenue = enrollments.reduce((sum, e) => sum + e.payment.amount, 0);
  const activeEnrollments = enrollments.filter(e => e.status === "ACTIVE").length;
  const completedEnrollments = enrollments.filter(e => e.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-blue-700 bg-clip-text text-transparent">
            Enrollments Management
          </h2>
          <p className="text-gray-600 mt-2">
            Track student progress with completed payments ({filtered.length} enrollments)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search student or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Course Filter */}
          {/* <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-full sm:w-64 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id} className="focus:bg-blue-50">
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
        </div>
      </div>

      {/* Stats Overview - All cards in single row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Enrollments
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {enrollments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeEnrollments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedEnrollments}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading Enrollments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No enrollments found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || courseFilter !== "ALL"
                ? "Try adjusting your search or filter criteria"
                : "No enrollments found with completed payments."}
            </p>
            {searchTerm || courseFilter !== "ALL" ? (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setCourseFilter("ALL");
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                Clear Filters
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-500 text-white border-b border-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Course
                  </th>
               
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Enrolled
                  </th>
             
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <Link 
                        href={`/dashboard/admin/users/${e.user.id}`} 
                        className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors hover:underline block"
                      >
                        {e.user.name}
                      </Link>
                      <div className="text-sm text-gray-600">{e.user.email}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {e.course.title}
                      </div>
                    </td>

                  

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                       
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{e.payment.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-xs text-green-600 font-medium mt-1">
                        {e.payment.status}
                      </div>
                    </td>

                   <td className="px-6 py-4">
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <Calendar className="h-4 w-4 text-gray-400" />
    {new Date(e.enrolledAt).toLocaleDateString("en-GB")}
  </div>
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}