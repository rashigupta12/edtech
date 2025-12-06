/*eslint-disable  @typescript-eslint/no-explicit-any*/
/*eslint-disable   @typescript-eslint/no-unused-vars*/
"use client";

import { useCurrentUser } from "@/hooks/auth";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Swal from "sweetalert2";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  BookOpen,
  Filter,
  Link,
  Users,
  Calendar,
  Bookmark,
  ChevronRight,
  Shield,
  UserCheck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Batch {
  id: string;
  name: string;
  code: string;
  academicYear: string;
  departmentName?: string;
}

interface Course {
  id: string;
  title: string;
  code?: string;
  categoryName?: string;
  facultyName?: string;
  isActive: boolean;
}

interface Faculty {
  id: string;
  userId: string;
  name: string;
  designation: string;
  user?: { 
    name: string;
    email: string;
    profileImage?: string | null;
    mobile?: string;
  };
}

interface BatchCourse {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCode?: string;
  facultyId?: string;
  facultyName?: string;
  semester?: number;
  academicYear?: string;
}

const BatchCoursesPage = () => {
  const user = useCurrentUser();
  const [collegeId, setCollegeId] = useState<string>("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [batchCourses, setBatchCourses] = useState<BatchCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [openAddForm, setOpenAddForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedBatchCourse, setSelectedBatchCourse] = useState<BatchCourse | null>(null);
  const [formData, setFormData] = useState({
    facultyId: "unassigned",
    semester: "",
    academicYear: "",
  });

const fetchCollegeId = useCallback(async () => {
    if (!user?.id) return;
    const res = await fetch(`/api/colleges?userId=${user.id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) setCollegeId(data.data.id);
  }, [user]);

  // Wrap loadBatches in useCallback
  const loadBatches = useCallback(async () => {
    if (!collegeId) return;
    try {
      const res = await fetch(`/api/batches?collegeId=${collegeId}`);
      const data = await res.json();
      if (data.success) {
        setBatches(data.data);
        if (data.data.length > 0 && !selectedBatch) {
          setSelectedBatch(data.data[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading batches:", error);
    }
  }, [collegeId, selectedBatch]);

  // Wrap loadCourses in useCallback
  const loadCourses = useCallback(async () => {
    if (!collegeId) return;
    try {
      const res = await fetch(`/api/courses?collegeId=${collegeId}`);
      const data = await res.json();
      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  }, [collegeId]);

  // Wrap loadFaculty in useCallback
  const loadFaculty = useCallback(async () => {
    if (!collegeId) return;
    try {
      const res = await fetch(`/api/faculty?collegeId=${collegeId}`);
      const data = await res.json();
      if (data.success) {
        setFaculty(data.data);
      }
    } catch (error) {
      console.error("Error loading faculty:", error);
    }
  }, [collegeId]);

  // Wrap loadBatchCourses in useCallback
  const loadBatchCourses = useCallback(async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/batch-courses?batchId=${selectedBatch}`);
      const data = await res.json();
      if (data.success) {
        setBatchCourses(data.data);
      }
    } catch (error) {
      console.error("Error loading batch courses:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedBatch]);

  // Update useEffect dependencies
  useEffect(() => {
    fetchCollegeId();
  }, [user, fetchCollegeId]);

  useEffect(() => {
    if (collegeId) {
      loadBatches();
      loadCourses();
      loadFaculty();
    }
  }, [collegeId, loadBatches, loadCourses, loadFaculty]);

  useEffect(() => {
    if (selectedBatch) {
      loadBatchCourses();
    }
  }, [selectedBatch, loadBatchCourses]);


  const getBatchName = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    return batch ? `${batch.name} (${batch.code})` : "";
  };

  const getAssignedCourseIds = () => {
    return batchCourses.map(bc => bc.courseId);
  };

  const getAvailableCourses = () => {
    const assignedIds = getAssignedCourseIds();
    return courses.filter(course => !assignedIds.includes(course.id));
  };

  const openEdit = (batchCourse: BatchCourse) => {
    setSelectedBatchCourse(batchCourse);
    setFormData({
      facultyId: batchCourse.facultyId || "unassigned",
      semester: batchCourse.semester?.toString() || "",
      academicYear: batchCourse.academicYear || "",
    });
    setOpenEditForm(true);
  };

  const handleAddCourse = async () => {
    if (!selectedCourse) {
      Swal.fire({
        icon: "warning",
        title: "No course selected",
        text: "Please select a course to add",
        confirmButtonColor: "#059669",
      });
      return;
    }

    setSubmitting(true);
    try {
      const courseData = {
        batchId: selectedBatch,
        courseId: selectedCourse,
        facultyId: formData.facultyId === "unassigned" ? null : formData.facultyId,
        semester: formData.semester ? parseInt(formData.semester) : null,
        academicYear: formData.academicYear || null,
      };

      const res = await fetch("/api/batch-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to add course to batch");
      }

      setOpenAddForm(false);
      setSelectedCourse("");
      setFormData({
        facultyId: "unassigned",
        semester: "",
        academicYear: "",
      });
      await loadBatchCourses();
      
      Swal.fire({
        icon: "success",
        title: "Course Added!",
        text: "Course added to batch successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Error adding course:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to add course to batch",
        confirmButtonColor: "#059669",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (!selectedBatchCourse) return;

    setSubmitting(true);
    try {
      const courseData = {
        facultyId: formData.facultyId === "unassigned" ? null : formData.facultyId,
        semester: formData.semester ? parseInt(formData.semester) : null,
        academicYear: formData.academicYear || null,
      };

      const res = await fetch(`/api/batch-courses?id=${selectedBatchCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update course");
      }

      setOpenEditForm(false);
      setSelectedBatchCourse(null);
      setFormData({
        facultyId: "unassigned",
        semester: "",
        academicYear: "",
      });
      await loadBatchCourses();
      
      Swal.fire({
        icon: "success",
        title: "Course Updated!",
        text: "Course details updated successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Error updating course:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to update course",
        confirmButtonColor: "#059669",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCourse = async (batchCourseId: string, courseTitle: string) => {
    const result = await Swal.fire({
      title: "Remove Course from Batch?",
      html: `Are you sure you want to remove <strong>"${courseTitle}"</strong> from the batch?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/batch-courses?id=${batchCourseId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to remove course");
      }

      await loadBatchCourses();
      
      Swal.fire({
        icon: "success",
        title: "Course Removed!",
        text: "Course removed from batch successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Error removing course:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to remove course",
        confirmButtonColor: "#059669",
      });
    }
  };

  const filteredBatchCourses = batchCourses.filter(
    bc =>
      bc.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bc.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bc.facultyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className={`flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full transition-all duration-200 ${(openAddForm || openEditForm) ? 'opacity-50 pointer-events-none blur-[1px]' : ''}`}>
        <div className="space-y-6">
          {/* Header with Search and Action Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Batch Courses Management
              </h1>
              <p className="text-gray-600 mt-2 max-w-2xl">
                Assign and manage courses for academic batches. Easily link courses to faculty and organize them by semester.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search courses or faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 border-gray-300 bg-white focus:border-emerald-500 focus:ring-emerald-500 w-full sm:w-64"
                />
              </div>

              <Button
                onClick={() => setOpenAddForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transition-all duration-200 h-10 px-4"
                disabled={!selectedBatch || getAvailableCourses().length === 0}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Assign Course</span>
                <span className="sm:hidden">Assign</span>
              </Button>
            </div>
          </div>

          {/* Batch Selection Card - Improved Design */}
          <Card className="bg-gradient-to-r from-white to-gray-50 border border-gray-200/80 shadow-md rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Select Academic Batch</h2>
                      <p className="text-sm text-gray-600">Choose a batch to manage its courses</p>
                    </div>
                    <Select
                    value={selectedBatch}
                    onValueChange={setSelectedBatch}
                    disabled={loading}
                  >
                    <SelectTrigger className="border-gray-300 bg-white focus:border-emerald-500 focus:ring-emerald-500 h-11 w-full md:w-96">
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{batch.name}</div>
                              <div className="text-sm text-gray-500">{batch.code} • {batch.academicYear}</div>
                            </div>
                            {batch.departmentName && (
                              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                                {batch.departmentName}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
                  
                  
                </div>

                {selectedBatch && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <div className="text-sm font-medium text-gray-600">Total Courses</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {batchCourses.length}
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        <div className="text-sm font-medium text-gray-600">With Faculty</div>
                      </div>
                      <div className="text-2xl font-bold text-emerald-600">
                        {batchCourses.filter(bc => bc.facultyId).length}
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Bookmark className="w-4 h-4 text-blue-500" />
                        <div className="text-sm font-medium text-gray-600">Available</div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {getAvailableCourses().length}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedBatch ? (
            <>
              {/* Batch Courses Table */}
              <Card className="bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
                      <span className="text-gray-600">Loading batch courses...</span>
                      <p className="text-sm text-gray-500 mt-2">Fetching course assignments and faculty details</p>
                    </div>
                  ) : filteredBatchCourses.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No courses assigned to this batch
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        This batch doesn&apos;t have any courses assigned yet. Start by adding courses to create a curriculum.
                      </p>
                      <Button
                        onClick={() => setOpenAddForm(true)}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Assign Your First Course
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl p-2">
                     
                      
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-gray-50/80">
                            <TableRow className="border-b border-gray-200">
                              <TableHead className="font-semibold text-gray-700 py-3">Course Title</TableHead>
                              <TableHead className="font-semibold text-gray-700 py-3">Assigned Faculty</TableHead>
                              <TableHead className="font-semibold text-gray-700 py-3">Semester</TableHead>
                              <TableHead className="font-semibold text-gray-700 py-3">Academic Year</TableHead>
                              <TableHead className="font-semibold text-gray-700 py-3 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredBatchCourses.map((batchCourse, index) => (
                              <TableRow 
                                key={batchCourse.id} 
                                className={`hover:bg-gray-50/70 border-b border-gray-100 ${index === filteredBatchCourses.length - 1 ? 'border-b-0' : ''}`}
                              >
                                <TableCell className="py-4">
                                  <div className="font-medium text-gray-900 group">
                                    {batchCourse.courseTitle}
                                    {batchCourse.courseCode && (
                                      <div className="text-sm text-gray-500 mt-1">{batchCourse.courseCode}</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  {batchCourse.facultyName ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <UserCheck className="w-4 h-4 text-emerald-600" />
                                      </div>
                                      <span className="text-gray-700">{batchCourse.facultyName}</span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
                                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                      Not assigned
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-4">
                                  {batchCourse.semester ? (
                                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                                      Semester {batchCourse.semester}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="py-4">
                                  {batchCourse.academicYear ? (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <Calendar className="w-4 h-4" />
                                      {batchCourse.academicYear}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="py-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => openEdit(batchCourse)}
                                      className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-700"
                                      title="Edit assignment"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleRemoveCourse(batchCourse.id, batchCourse.courseTitle)}
                                      title="Remove course"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Filter className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Select a Batch to Begin
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Choose a batch from the dropdown above to view and manage course assignments. You &apos;ll be able to add courses, assign faculty, and organize by semester.
                </p>
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm">Select a batch to continue</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Course Form - Slides from right */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${openAddForm ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Link className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Assign Course to Batch</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Add a course to {getBatchName(selectedBatch)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setOpenAddForm(false);
                setSelectedCourse("");
                setFormData({
                  facultyId: "unassigned",
                  semester: "",
                  academicYear: "",
                });
              }}
              className="hover:bg-emerald-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Select Course *
                </Label>
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                  disabled={submitting}
                >
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 h-11">
                    <SelectValue placeholder="Choose a course to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableCourses().map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{course.title}</span>
                          {course.code && (
                            <span className="text-sm text-gray-500">{course.code}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Assign Faculty (Optional)
                </Label>
                <Select
                  value={formData.facultyId}
                  onValueChange={(value) => setFormData({ ...formData, facultyId: value })}
                  disabled={submitting}
                >
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 h-11">
                    <SelectValue placeholder="Select faculty member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-gray-500" />
                        </div>
                        <span>Not assigned</span>
                      </div>
                    </SelectItem>
                    {faculty.map((fac) => (
                      <SelectItem key={fac.id} value={fac.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{fac.user?.name || fac.name}</span>
                          <span className="text-sm text-gray-500">{fac.user?.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Semester (Optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="e.g., 3"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    disabled={submitting}
                    className="border-gray-300 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Academic Year (Optional)</Label>
                  <Input
                    placeholder="e.g., 2024-2025"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    disabled={submitting}
                    className="border-gray-300 h-11"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenAddForm(false);
                  setSelectedCourse("");
                  setFormData({
                    facultyId: "unassigned",
                    semester: "",
                    academicYear: "",
                  });
                }}
                disabled={submitting}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCourse}
                disabled={submitting || !selectedCourse}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white h-11 shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Assign Course
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Course Form - Slides from right */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${openEditForm ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Edit className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Course Assignment</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update {selectedBatchCourse?.courseTitle}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setOpenEditForm(false);
                setSelectedBatchCourse(null);
                setFormData({
                  facultyId: "unassigned",
                  semester: "",
                  academicYear: "",
                });
              }}
              className="hover:bg-emerald-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Selected Course</div>
                <div className="text-lg font-semibold text-gray-900">{selectedBatchCourse?.courseTitle}</div>
                {selectedBatchCourse?.courseCode && (
                  <div className="text-sm text-gray-500 mt-1">Code: {selectedBatchCourse.courseCode}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Assign Faculty (Optional)
                </Label>
                <Select
                  value={formData.facultyId}
                  onValueChange={(value) => setFormData({ ...formData, facultyId: value })}
                  disabled={submitting}
                >
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 h-11">
                    <SelectValue placeholder="Select faculty member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-gray-500" />
                        </div>
                        <span>Not assigned</span>
                      </div>
                    </SelectItem>
                    {faculty.map((fac) => (
                      <SelectItem key={fac.id} value={fac.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{fac.user?.name || fac.name}</span>
                          <span className="text-sm text-gray-500">{fac.user?.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Semester (Optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="e.g., 3"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    disabled={submitting}
                    className="border-gray-300 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Academic Year (Optional)</Label>
                  <Input
                    placeholder="e.g., 2024-2025"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    disabled={submitting}
                    className="border-gray-300 h-11"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenEditForm(false);
                  setSelectedBatchCourse(null);
                  setFormData({
                    facultyId: "unassigned",
                    semester: "",
                    academicYear: "",
                  });
                }}
                disabled={submitting}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCourse}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white h-11 shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Course
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {(openAddForm || openEditForm) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => {
            if (openAddForm) {
              setOpenAddForm(false);
              setSelectedCourse("");
              setFormData({
                facultyId: "unassigned",
                semester: "",
                academicYear: "",
              });
            }
            if (openEditForm) {
              setOpenEditForm(false);
              setSelectedBatchCourse(null);
              setFormData({
                facultyId: "unassigned",
                semester: "",
                academicYear: "",
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default BatchCoursesPage;