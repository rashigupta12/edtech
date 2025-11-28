/*eslint-disable @typescript-eslint/no-explicit-any */
// app/(protected)/dashboard/agent/assign-coupons/page.tsx
"use client";

import { AlertCircle, Book, Calendar, Clock, Search, Tag, Users, X, Plus, ShieldAlert, RefreshCw, DollarSign } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2"

interface Student {
  id: string;
  name: string;
  email: string;
  isEnrolled?: boolean;
}

interface Course {
  id: string;
  title: string;
  priceINR: string;
  hasAdminDiscount?: boolean;
  adminDiscountAmount?: string;
  commissionPercourse?: string | null;
  hasCommission?: boolean;
}

interface Coupon {
  id: string;
  code: string;
  discountValue: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  validUntil: string;
}

interface EnrollmentCheck {
  studentId: string;
  isEnrolled: boolean;
}

interface RecentAssignment {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  couponCode: string;
  discountValue: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  assignedAt: string;
  assignedByName: string;
}

export default function AssignCouponsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<RecentAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [enrollmentChecks, setEnrollmentChecks] = useState<EnrollmentCheck[]>([]);
  console.log(enrollmentChecks)
  const [showSidebar, setShowSidebar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchData(),
        fetchRecentAssignments()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (selectedCourse && students.length > 0) {
      checkStudentEnrollments();
    }
  }, [selectedCourse, students]);

  const fetchData = async () => {
    try {
      const [studentsRes, coursesRes, couponsRes] = await Promise.all([
        fetch("/api/jyotishi/students"),
        // ✅ NEW: Add forJyotishi parameter to only get courses with commission
        fetch("/api/courses?forJyotishi=true"),
        fetch("/api/jyotishi/coupons")
      ]);

      // Process students
      const studentsData = await studentsRes.json();
      const transformedStudents: Student[] = studentsData.students?.map((student: any) => ({
        id: student.studentId,
        name: student.studentName || "Unknown Student",
        email: student.studentEmail || "No email"
      })) || [];
      setStudents(transformedStudents);

      // Process courses
      const coursesData = await coursesRes.json();
      const courseArray = Array.isArray(coursesData) ? coursesData : coursesData.courses || [];
      
      const courseDetailsPromises = courseArray.map(async (course: any) => {
        try {
          const detailRes = await fetch(`/api/courses/${course.slug}`);
          const detailData = await detailRes.json();
          
          const hasAdminDiscount = detailData.course?.appliedCoupons?.some(
            (coupon: any) => coupon.creatorType === 'ADMIN'
          ) || false;
          
          const adminDiscountAmount = detailData.course?.adminDiscountAmount || "0";
          
          return {
            id: course.id,
            title: course.title,
            priceINR: course.priceINR,
            hasAdminDiscount,
            adminDiscountAmount,
            commissionPercourse: course.commissionPercourse,
            hasCommission: course.hasCommission
          };
        } catch {
          return {
            id: course.id,
            title: course.title,
            priceINR: course.priceINR,
            hasAdminDiscount: false,
            adminDiscountAmount: "0",
            commissionPercourse: course.commissionPercourse,
            hasCommission: course.hasCommission
          };
        }
      });
      
      const transformedCourses = await Promise.all(courseDetailsPromises);
      setCourses(transformedCourses);

      // Process coupons
      const couponsData = await couponsRes.json();
      const transformedCoupons: Coupon[] = couponsData.coupons?.map((coupon: any) => ({
        id: coupon.id,
        code: coupon.code,
        discountValue: coupon.discountValue,
        discountType: coupon.discountType,
        validUntil: coupon.validUntil
      })) || [];
      setCoupons(transformedCoupons);

    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire({
        icon: 'error',
        title: 'Data Load Failed',
        text: 'Failed to load required data',
        confirmButtonColor: '#d33',
      });
    }
  };

  const fetchRecentAssignments = async () => {
    try {
      console.log('Fetching recent assignments...');
      const response = await fetch("/api/jyotishi/recent-assignments");
      const data = await response.json();
      console.log('Recent assignments received:', data.assignments);
      
      if (data.assignments) {
        setRecentAssignments(data.assignments);
      } else {
        setRecentAssignments([]);
      }
    } catch (error) {
      console.error("Error fetching recent assignments:", error);
      setRecentAssignments([]);
    }
  };

  const checkStudentEnrollments = async () => {
    try {
      const response = await fetch(`/api/jyotishi/check-enrollments?courseId=${selectedCourse}`);
      const data = await response.json();
      
      if (data.enrollments) {
        setEnrollmentChecks(data.enrollments);
        
        setStudents(prevStudents => 
          prevStudents.map(student => ({
            ...student,
            isEnrolled: data.enrollments.some((e: EnrollmentCheck) => 
              e.studentId === student.id && e.isEnrolled
            )
          }))
        );
      }
    } catch (error) {
      console.error("Error checking enrollments:", error);
    }
  };

  const handleAssignCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !selectedCourse || !selectedCoupon) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select all fields',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    const selectedCourseData = courses.find(c => c.id === selectedCourse);
    if (selectedCourseData?.hasAdminDiscount) {
      Swal.fire({
        icon: 'warning',
        title: 'Admin Discount Applied',
        text: 'Cannot assign coupon to this course as it already has an admin discount applied.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    const selectedStudentData = students.find(s => s.id === selectedStudent);
    if (selectedStudentData?.isEnrolled) {
      Swal.fire({
        icon: 'warning',
        title: 'Student Already Enrolled',
        text: 'This student is already enrolled in the selected course. Cannot assign coupon.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/jyotishi/assign-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          courseId: selectedCourse,
          couponId: selectedCoupon,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Coupon assigned successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Reset form first
        setSelectedStudent("");
        setSelectedCourse("");
        setSelectedCoupon("");
        setSearchTerm("");
        setEnrollmentChecks([]);
        setShowSidebar(false);
        
        // Force complete data refresh with a small delay to ensure API has processed
        setTimeout(async () => {
          await fetchAllData();
        }, 500);
        
      } else {
        throw new Error(result.error || 'Failed to assign coupon');
      }
    } catch (error) {
      console.error("Error assigning coupon:", error);
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: error instanceof Error ? error.message : 'Failed to assign coupon',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    await fetchAllData();
    Swal.fire({
      icon: 'success',
      title: 'Refreshed!',
      text: 'Data has been refreshed',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const filteredStudents = students.filter(student =>
    (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const selectedStudentData = students.find(s => s.id === selectedStudent);
  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-2 w-full mx-auto">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Assign Coupons to Students</h1>
          <p className="text-gray-600 mt-1">Manage coupon assignments for your students</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowSidebar(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Coupon to Student
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assignments - Main Content */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Assignments</h2>
                <span className="bg-blue-100 text-blue-700 text-sm px-2.5 py-0.5 rounded-full font-medium">
                  {recentAssignments.length}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
            
            {refreshing ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Refreshing data...</p>
              </div>
            ) : recentAssignments.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No recent assignments</p>
                <p className="text-sm text-gray-500 mt-1">Assign your first coupon to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student & Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coupon Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAssignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {assignment.studentName}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {assignment.studentEmail}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                <Book className="w-3 h-3" />
                                {assignment.courseTitle}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <code className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-mono border border-amber-200 w-fit">
                              {assignment.couponCode}
                            </code>
                            <span className={`text-sm font-medium ${
                              assignment.discountType === "PERCENTAGE" ? "text-amber-600" : "text-blue-600"
                            }`}>
                              {assignment.discountType === "PERCENTAGE" 
                                ? `${assignment.discountValue}% off` 
                                : `₹${assignment.discountValue} off`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {assignment.assignedByName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-sm">
                            <span className="text-gray-900 flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              {formatDate(assignment.assignedAt)}
                            </span>
                            <span className="text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-4 h-4 text-gray-500" />
                              {formatTime(assignment.assignedAt)}
                            </span>
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
      </div>

      {/* Assignment Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowSidebar(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Assign Coupon to Student</h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="text-white hover:bg-blue-800 p-1 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleAssignCoupon} className="space-y-6">
                  {/* Course Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Book className="w-4 h-4 inline mr-2 text-blue-600" />
                      Select Course
                      <span className="text-xs text-green-600 ml-2">
                        (Only courses with commission)
                      </span>
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => {
                        setSelectedCourse(e.target.value);
                        setSelectedStudent("");
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    >
                      <option value="">Choose a course...</option>
                      {courses.map((course) => (
                        <option 
                          key={course.id} 
                          value={course.id}
                          disabled={course.hasAdminDiscount}
                          className={course.hasAdminDiscount ? "text-gray-400 bg-gray-100" : ""}
                        >
                          {course.title} (₹{course.priceINR})
                          {course.commissionPercourse && ` - Commission: ${course.commissionPercourse}%`}
                          {course.hasAdminDiscount && " - Admin Discount Applied"}
                        </option>
                      ))}
                    </select>
                    {courses.length === 0 && (
                      <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <DollarSign className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>No courses with commission available. Please contact admin to set up commission for courses.</span>
                      </div>
                    )}
                    {courses.filter(c => !c.hasAdminDiscount).length === 0 && courses.length > 0 && (
                      <p className="text-sm text-amber-600">All courses have admin discounts applied</p>
                    )}
                  </div>

                  {/* Commission Info Badge */}
                  {selectedCourseData?.commissionPercourse && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <span className="text-green-900 font-medium block">
                            Commission Available
                          </span>
                          <p className="text-green-700 text-sm mt-1">
                            You will earn {selectedCourseData.commissionPercourse}% commission on this course enrollment.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Discount Warning */}
                  {selectedCourseData?.hasAdminDiscount && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <ShieldAlert className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-red-800 font-medium block">
                            Admin Discount Already Applied
                          </span>
                          <p className="text-red-700 text-sm mt-1">
                            This course already has an admin discount of ₹{selectedCourseData.adminDiscountAmount}. 
                            Jyotishi coupons cannot be assigned to courses with existing admin discounts.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Student Selection */}
                  {selectedCourse && !selectedCourseData?.hasAdminDiscount && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <Users className="w-4 h-4 inline mr-2 text-blue-600" />
                        Select Student
                        <span className="text-xs text-gray-500 ml-2">
                          (Already enrolled students are disabled)
                        </span>
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search students by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <select
                          value={selectedStudent}
                          onChange={(e) => setSelectedStudent(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        >
                          <option value="">Choose a student...</option>
                          {filteredStudents.map((student) => (
                            <option 
                              key={student.id} 
                              value={student.id}
                              disabled={student.isEnrolled}
                              className={student.isEnrolled ? "text-gray-400 bg-gray-100" : ""}
                            >
                              {student.name} ({student.email})
                              {student.isEnrolled && " - Already Enrolled"}
                            </option>
                          ))}
                        </select>
                        {filteredStudents.length === 0 && (
                          <p className="text-sm text-gray-500">No students found</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Coupon Selection */}
                  {selectedCourse && selectedStudent && !selectedCourseData?.hasAdminDiscount && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <Tag className="w-4 h-4 inline mr-2 text-amber-600" />
                        Select Coupon
                      </label>
                      <select
                        value={selectedCoupon}
                        onChange={(e) => setSelectedCoupon(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      >
                        <option value="">Choose a coupon...</option>
                        {coupons
                          .filter(coupon => {
                            try {
                              return new Date(coupon.validUntil) > new Date();
                            } catch {
                              return false;
                            }
                          })
                          .map((coupon) => (
                            <option key={coupon.id} value={coupon.id}>
                              {coupon.code} - {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} off
                            </option>
                          ))}
                      </select>
                      {coupons.length === 0 && (
                        <p className="text-sm text-gray-500">No active coupons found</p>
                      )}
                    </div>
                  )}

                  {/* Warning message if student is enrolled */}
                  {selectedStudentData?.isEnrolled && !selectedCourseData?.hasAdminDiscount && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
                        <span className="text-amber-800 font-medium">
                          This student is already enrolled
                        </span>
                      </div>
                      <p className="text-amber-700 text-sm mt-1">
                        Coupons cannot be assigned to students who are already enrolled in this course.
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || selectedStudentData?.isEnrolled || selectedCourseData?.hasAdminDiscount}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Assigning Coupon...
                      </span>
                    ) : (
                      "Assign Coupon to Student"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}