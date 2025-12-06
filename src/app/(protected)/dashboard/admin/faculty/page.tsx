/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars*/
"use client";

import { useCurrentUser } from "@/hooks/auth";
import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Search,
  Crown,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Building2,
  School,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const facultyRoles = [
  { value: "LECTURER", label: "Lecturer" },
  { value: "ASSISTANT_PROFESSOR", label: "Assistant Professor" },
  { value: "ASSOCIATE_PROFESSOR", label: "Associate Professor" },
  { value: "PROFESSOR", label: "Professor" },
  {
    value: "HOD",
    label: "Head of Department",
    icon: <Crown className="w-3 h-3 inline ml-1" />,
  },
  { value: "VISITING_FACULTY", label: "Visiting Faculty" },
  { value: "ADMIN_FACULTY", label: "Admin Faculty" },
];

const permissionsList = [
  { key: "canCreateCourses", label: "Can Create Courses" },
  { key: "canApproveContent", label: "Can Approve Content" },
  { key: "canManageStudents", label: "Can Manage Students" },
  { key: "canScheduleSessions", label: "Can Schedule Sessions" },
];

const FacultyPage = () => {
  const user = useCurrentUser();
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [collegeFilter, setCollegeFilter] = useState<string>("all");

  const [openForm, setOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    collegeId: "",
    departmentId: "",
    facultyRole: "LECTURER",
    designation: "Lecturer",
    permissions: {
      canCreateCourses: false,
      canApproveContent: false,
      canManageStudents: false,
      canScheduleSessions: true,
    },
  });

  const [validationErrors, setValidationErrors] = useState({
    email: "",
    mobile: "",
    password: "",
  });

  // Validation functions
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateMobile = (mobile: string): string => {
    const mobileRegex = /^\d{0,10}$/;
    if (mobile && !mobileRegex.test(mobile)) return "Only digits allowed";
    if (mobile.length > 10) return "Max 10 digits allowed";
    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    if (password.length < 8) return "At least 8 characters required";
    if (!/(?=.*[a-z])/.test(password)) return "Requires lowercase letter";
    if (!/(?=.*[A-Z])/.test(password)) return "Requires uppercase letter";
    if (!/(?=.*\d)/.test(password)) return "Requires a number";
    if (!/(?=.*[@$!%*?&])/.test(password)) return "Requires special character";
    return "";
  };

  // Load all colleges
  const loadColleges = async () => {
    try {
      const res = await fetch(`/api/colleges`);
      const data = await res.json();
      setColleges(data.data || []);
    } catch (err) {
      console.error("Failed to load colleges");
    }
  };

  // Load departments based on selected college
  const loadDepartments = async (collegeId: string) => {
    if (!collegeId) {
      setDepartments([]);
      return;
    }
    try {
      const res = await fetch(`/api/departments?collegeId=${collegeId}`);
      const data = await res.json();
      setDepartments(data.data || []);
    } catch (err) {
      console.error("Failed to load departments");
    }
  };

  // Load all faculty with college and department info
  const loadFaculty = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/faculty?includeCollege=true`);
      const data = await res.json();
      setFacultyList(data.data || []);
    } catch (err) {
      console.error("Failed to load faculty");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load faculty members",
        confirmButtonColor: "#059669",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColleges();
    loadFaculty();
  }, []);

  // When college changes in form, load its departments
  useEffect(() => {
    if (formData.collegeId) {
      loadDepartments(formData.collegeId);
    } else {
      setDepartments([]);
    }
  }, [formData.collegeId]);

  // Open form in ADD mode
  const openAddForm = () => {
    setIsEditMode(false);
    setEditingFacultyId(null);
    setFormData({
      name: "",
      email: "",
      mobile: "",
      password: "",
      collegeId: "",
      departmentId: "",
      facultyRole: "LECTURER",
      designation: "Lecturer",
      permissions: {
        canCreateCourses: false,
        canApproveContent: false,
        canManageStudents: false,
        canScheduleSessions: true,
      },
    });
    setValidationErrors({
      email: "",
      mobile: "",
      password: "",
    });
    setOpenForm(true);
  };

  // Open form in EDIT mode
  const openEditForm = (faculty: any) => {
    setIsEditMode(true);
    setEditingFacultyId(faculty.id);
    setFormData({
      name: faculty.user?.name || "",
      email: faculty.user?.email || "",
      mobile: faculty.user?.mobile || "",
      password: "", // Password not shown in edit mode
      collegeId: faculty.collegeId || "",
      departmentId: faculty.departmentId || "",
      facultyRole: faculty.facultyRole || "LECTURER",
      designation: faculty.designation || "Lecturer",
      permissions: {
        canCreateCourses: faculty.permissions?.canCreateCourses || false,
        canApproveContent: faculty.permissions?.canApproveContent || false,
        canManageStudents: faculty.permissions?.canManageStudents || false,
        canScheduleSessions: faculty.permissions?.canScheduleSessions !== false,
      },
    });
    setValidationErrors({
      email: "",
      mobile: "",
      password: "",
    });
    setOpenForm(true);
  };

  // Close form
  const closeForm = () => {
    setOpenForm(false);
    setIsEditMode(false);
    setEditingFacultyId(null);
    setFormData({
      name: "",
      email: "",
      mobile: "",
      password: "",
      collegeId: "",
      departmentId: "",
      facultyRole: "LECTURER",
      designation: "Lecturer",
      permissions: {
        canCreateCourses: false,
        canApproveContent: false,
        canManageStudents: false,
        canScheduleSessions: true,
      },
    });
  };

  // Handle input changes with validation
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'collegeId') {
      // Clear department when college changes
      setFormData(prev => ({ ...prev, departmentId: "" }));
    }
    
    if (field === 'email' && !isEditMode) {
      setValidationErrors(prev => ({ ...prev, email: validateEmail(value) }));
    }
    if (field === 'mobile' && !isEditMode) {
      const limitedValue = value.slice(0, 10);
      if (value.length <= 10) {
        setFormData(prev => ({ ...prev, mobile: limitedValue }));
        setValidationErrors(prev => ({ ...prev, mobile: validateMobile(limitedValue) }));
      }
    }
    if (field === 'password' && !isEditMode) {
      setValidationErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
  };

  // Check if form has validation errors
  const hasValidationErrors = () => {
    return Object.values(validationErrors).some(error => error !== "");
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (isEditMode) {
      // EDIT mode submission
      if (!editingFacultyId) return;
      
      setSubmitting(true);
      try {
        const facultyRes = await fetch(`/api/faculty?id=${editingFacultyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            collegeId: formData.collegeId || null,
            departmentId: formData.departmentId || null,
            facultyRole: formData.facultyRole,
            designation: formData.designation,
            employmentType: "FULL_TIME",
            permissions: formData.permissions,
          }),
        });

        if (!facultyRes.ok) {
          const errorData = await facultyRes.json();
          throw new Error(errorData.error?.message || "Failed to update faculty");
        }

        closeForm();
        loadFaculty();
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Faculty updated successfully",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to update faculty: " + err.message,
          confirmButtonColor: "#059669",
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      // ADD mode submission
      // Basic required field validation
      if (!formData.name || !formData.email || !formData.password) {
        Swal.fire({
          icon: "warning",
          title: "Required",
          text: "Name, Email, and Password are required",
          confirmButtonColor: "#059669",
        });
        return;
      }

      // Validation errors check
      if (hasValidationErrors()) {
        Swal.fire({
          icon: "warning",
          title: "Validation Error",
          text: "Please fix the validation errors before submitting",
          confirmButtonColor: "#059669",
        });
        return;
      }

      // Final validation before submitting
      const emailError = validateEmail(formData.email);
      const passwordError = validatePassword(formData.password);
      const mobileError = validateMobile(formData.mobile);

      if (emailError || passwordError || mobileError) {
        setValidationErrors({
          email: emailError,
          mobile: mobileError,
          password: passwordError,
        });
        Swal.fire({
          icon: "warning",
          title: "Validation Error",
          text: "Please fix the validation errors before submitting",
          confirmButtonColor: "#059669",
        });
        return;
      }
      
      setSubmitting(true);
      try {
        // First create user
        const userRes = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            mobile: formData.mobile || null,
            role: "FACULTY",
          }),
        });
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error || "Failed to create user");

        // Then create faculty record - college can be null for admin faculty
        const facultyRes = await fetch("/api/faculty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            collegeId: formData.collegeId || null, // Can be null for admin faculty
            userId: userData.jyotishi.id,
            departmentId: formData.departmentId || null,
            facultyRole: formData.facultyRole,
            designation: formData.designation,
            employmentType: "FULL_TIME",
            ...formData.permissions,
          }),
        });

        if (!facultyRes.ok) {
          // If faculty creation fails, try to delete the user we just created
          await fetch(`/api/users?id=${userData.jyotishi.id}`, {
            method: "DELETE",
          });
          throw new Error("Failed to assign faculty role");
        }

        closeForm();
        loadFaculty();
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Faculty added successfully",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Failed to add faculty",
          confirmButtonColor: "#059669",
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  // DELETE Faculty
  const deleteFaculty = async (facultyId: string, facultyName: string) => {
    const result = await Swal.fire({
      title: "Delete Faculty?",
      html: `Are you sure you want to delete <strong>"${facultyName}"</strong>?<br>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/faculty?id=${facultyId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Faculty has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
        loadFaculty();
      } else {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: data.error?.message || "Failed to delete faculty",
          confirmButtonColor: "#059669",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the faculty.",
        confirmButtonColor: "#059669",
      });
    }
  };

  // Filter faculty by search term and college
  const filtered = facultyList.filter(
    (f) =>
      (collegeFilter === "all" || f.collegeId === collegeFilter) &&
      (f.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.college?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full mx-auto relative">
      {/* Main Content */}
      <div className={`transition-all duration-300 ${openForm ? "mr-96" : ""}`}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Faculty Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage faculty members across all colleges
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative max-w-md w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search faculty, college, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 w-full"
                />
              </div>

              <Button
                onClick={openAddForm}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Faculty
              </Button>
            </div>
          </div>

          {/* College Filter */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by College:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={collegeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCollegeFilter("all")}
                className={collegeFilter === "all" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                All Colleges
              </Button>
              <Button
                variant={collegeFilter === "unassigned" ? "default" : "outline"}
                size="sm"
                onClick={() => setCollegeFilter("unassigned")}
                className={collegeFilter === "unassigned" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                (Admin Faculty)
              </Button>
              {colleges.map((college) => (
                <Button
                  key={college.id}
                  variant={collegeFilter === college.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCollegeFilter(college.id)}
                  className={collegeFilter === college.id ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  {college.name} ({college.code})
                </Button>
              ))}
            </div>
          </div>

          {/* Faculty Table */}
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm || collegeFilter !== "all"
                      ? "No faculty found"
                      : "No faculty members yet"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || collegeFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Click 'Add Faculty' to get started"}
                  </p>
                  {searchTerm || collegeFilter !== "all" ? (
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                          setCollegeFilter("all");
                        }}
                        className="border-gray-300"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={openAddForm}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Faculty
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">College</TableHead>
                        <TableHead className="font-semibold text-gray-700">Name</TableHead>
                        <TableHead className="font-semibold text-gray-700">Email</TableHead>
                        <TableHead className="font-semibold text-gray-700">Mobile</TableHead>
                        <TableHead className="font-semibold text-gray-700">Department</TableHead>
                        <TableHead className="font-semibold text-gray-700">Role</TableHead>
                        <TableHead className="font-semibold text-gray-700">Permissions</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((f) => {
                        const roleLabel =
                          facultyRoles.find((r) => r.value === f.facultyRole)
                            ?.label || f.facultyRole;

                        return (
                          <TableRow key={f.id} className="hover:bg-gray-50/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {f.college?.name || "Admin (No College)"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {f.college?.code || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">
                              {f.user?.name}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {f.user?.email}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {f.user?.mobile || "—"}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              <div className="flex items-center gap-2">
                                {f.department?.name || "—"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  f.facultyRole === "HOD" || f.facultyRole === "ADMIN_FACULTY"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-gray-100 text-gray-700 border-gray-200"
                                }
                              >
                                {roleLabel}
                                {f.facultyRole === "HOD" && (
                                  <Crown className="w-3 h-3 inline ml-1" />
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {f.permissions?.canCreateCourses && (
                                  <Badge variant="outline" className="text-xs w-fit">Create course</Badge>
                                )}
                                {f.permissions?.canApproveContent && (
                                  <Badge variant="outline" className="text-xs w-fit">Approve Content</Badge>
                                )}
                                {f.permissions?.canManageStudents && (
                                  <Badge variant="outline" className="text-xs w-fit">Manage Students</Badge>
                                )}
                                {f.permissions?.canScheduleSessions && (
                                  <Badge variant="outline" className="text-xs w-fit">Schedule Sessions</Badge>
                                )}
                                {!f.permissions?.canCreateCourses &&
                                  !f.permissions?.canApproveContent &&
                                  !f.permissions?.canManageStudents &&
                                  !f.permissions?.canScheduleSessions && (
                                    <span className="text-gray-400 text-sm">—</span>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditForm(f)}
                                className="hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteFaculty(f.id, f.user?.name || "this faculty")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Single Form Panel (for both Add and Edit) */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ${
          openForm ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Form Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Edit className="w-5 h-5 text-emerald-600" />
                    Edit Faculty
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-emerald-600" />
                    Add New Faculty
                  </>
                )}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeForm}
                className="hover:bg-gray-100"
                disabled={submitting}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Full Name {!isEditMode && "*"}
                </label>
                <Input
                  placeholder="e.g., Dr. John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isEditMode || submitting}
                  className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    isEditMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
                  }`}
                />
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Name cannot be edited
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Email Address {!isEditMode && "*"}
                </label>
                <Input
                  type="email"
                  placeholder="faculty@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isEditMode || submitting}
                  className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    isEditMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
                  } ${validationErrors.email && !isEditMode ? "border-red-300 focus:border-red-500" : ""}`}
                />
                {!isEditMode && validationErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
                )}
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be edited
                  </p>
                )}
              </div>

              {/* Mobile Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Mobile Number
                </label>
                <Input
                  placeholder="Enter mobile no."
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  disabled={isEditMode || submitting}
                  maxLength={10}
                  className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    isEditMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
                  } ${validationErrors.mobile && !isEditMode ? "border-red-300 focus:border-red-500" : ""}`}
                />
                {!isEditMode && validationErrors.mobile && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.mobile}</p>
                )}
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Mobile number cannot be edited
                  </p>
                )}
              </div>

              {/* Password Field - Only shown in ADD mode */}
              {!isEditMode && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Password *
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={submitting}
                    className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                      validationErrors.password ? "border-red-300 focus:border-red-500" : ""
                    }`}
                  />
                  {validationErrors.password && (
                    <div className="text-xs text-red-500 mt-1 space-y-1">
                      {validationErrors.password === "Password is required" ? (
                        <p>Password is required</p>
                      ) : (
                        <>
                          <p className="font-medium">Password requirements:</p>
                          <div className="pl-2">
                            {validationErrors.password.includes("8 characters") && (
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span>At least 8 characters</span>
                              </div>
                            )}
                            {validationErrors.password.includes("lowercase") && (
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*[a-z])/.test(formData.password) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span>One lowercase letter</span>
                              </div>
                            )}
                            {validationErrors.password.includes("uppercase") && (
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*[A-Z])/.test(formData.password) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span>One uppercase letter</span>
                              </div>
                            )}
                            {validationErrors.password.includes("number") && (
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*\d)/.test(formData.password) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span>One number</span>
                              </div>
                            )}
                            {validationErrors.password.includes("special") && (
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*[@$!%*?&])/.test(formData.password) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span>One special character (!@#$%*?&)</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* College Field - Optional for admin faculty */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  College (Optional)
                </label>
                <Select
                  value={formData.collegeId}
                  onValueChange={(v) => handleInputChange('collegeId', v)}
                  disabled={submitting}
                >
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Select College (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gf">No College (Admin Faculty)</SelectItem>
                    {colleges.map((college) => (
                      <SelectItem key={college.id} value={college.id}>
                        {college.name} ({college.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to create admin faculty not assigned to any college
                </p>
              </div>

              {/* Department Field - Only shown if college is selected */}
              {formData.collegeId && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Department (Optional)
                  </label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                    disabled={submitting || !formData.collegeId}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Select Department (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Department</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Faculty Role Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Faculty Role
                </label>
                <Select
                  value={formData.facultyRole}
                  onValueChange={(v) => {
                    const role = facultyRoles.find((r) => r.value === v);
                    setFormData({
                      ...formData,
                      facultyRole: v,
                      designation: role?.label || "Lecturer",
                    });
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultyRoles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label} {r.icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Designation Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Designation
                </label>
                <Input
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  disabled={submitting}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Permissions
                </label>
                <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {permissionsList.map((p) => (
                    <div key={p.key} className="flex items-center space-x-3">
                      <Checkbox
                        id={p.key}
                        checked={formData.permissions[p.key as keyof typeof formData.permissions]}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              [p.key]: checked,
                            },
                          })
                        }
                        disabled={submitting}
                        className="border-gray-300"
                      />
                      <Label
                        htmlFor={p.key}
                        className="cursor-pointer text-sm text-gray-700"
                      >
                        {p.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting || (!isEditMode && hasValidationErrors())}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-400"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditMode ? "Update Faculty" : "Create Faculty"}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={closeForm}
                className="border-gray-300"
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay when form is open */}
      {openForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeForm}
        />
      )}
    </div>
  );
};

export default FacultyPage;