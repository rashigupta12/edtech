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
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Mail,
  Phone,
  GraduationCap,
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

const StudentPage = () => {
  const user = useCurrentUser();
  const [collegeId, setCollegeId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const [collegeName, setCollegeName] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    enrollmentNo: "",
    batchYear: new Date().getFullYear().toString(),
    currentSemester: "",
    specialization: "",
    educationLevel: "",
    gender: "",
   
  });

  const [validationErrors, setValidationErrors] = useState({
    email: "",
    mobile: "",
    password: "",
  });

  // Generate batch years (last 5 years + current + next 2 years)
  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: 8 }, (_, i) => 
    (currentYear - 3 + i).toString()
  );

  const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ];

  const educationLevels = [
    { value: "HIGH_SCHOOL", label: "High School" },
    { value: "UNDERGRADUATE", label: "Undergraduate" },
    { value: "POSTGRADUATE", label: "Postgraduate" },
    { value: "DOCTORATE", label: "Doctorate" },
  ];

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
    if (mobile.length === 10) return ""; // Valid 10-digit number
    return mobile ? "Must be 10 digits" : "";
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    if (password.length < 8) return "At least 8 characters required";
    return "";
  };

const fetchCollegeId = async () => {
  if (!user?.id) return;
  try {
    const res = await fetch(`/api/colleges?userId=${user.id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) {
      setCollegeId(data.data.id);
      // Store the college name for later use
      setCollegeName(data.data.collegeName);
    }
  } catch (error) {
    console.error("Error fetching college ID:", error);
  }
};

  const loadStudents = async () => {
    if (!collegeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/students?collegeId=${collegeId}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data || []);
      } else {
        console.error("Error loading students:", data.error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error?.message || "Failed to load students",
          confirmButtonColor: "#059669",
        });
      }
    } catch (error) {
      console.error("Error loading students:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load students",
        confirmButtonColor: "#059669",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeId();
  }, [user]);

  useEffect(() => {
    if (collegeId) loadStudents();
  }, [collegeId]);

  // Open form in ADD mode
  const openAddForm = () => {
    setIsEditMode(false);
    setEditingStudentId(null);
    setFormData({
      name: "",
      email: "",
      mobile: "",
      password: "",
      enrollmentNo: "",
      batchYear: currentYear.toString(),
      currentSemester: "",
      specialization: "",
      educationLevel: "",
      gender: "",
      
    });
    setValidationErrors({
      email: "",
      mobile: "",
      password: "",
    });
    setOpenForm(true);
  };

  // Open form in EDIT mode
  const openEditForm = (student: any) => {
    setIsEditMode(true);
    setEditingStudentId(student.id);
    setFormData({
      name: student.user?.name || "",
      email: student.user?.email || "",
      mobile: student.user?.mobile || "",
      password: "", // Not shown in edit mode
       enrollmentNo: student.enrollmentNumber || "",
      batchYear: student.batchYear?.toString() || currentYear.toString(),
      currentSemester: student.currentSemester?.toString() || "",
      specialization: student.specialization || "",
      educationLevel: student.educationLevel || "",
      gender: student.gender || "",
     
      
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
    setEditingStudentId(null);
  };

  // Handle input changes with validation
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "email" && !isEditMode) {
      setValidationErrors((prev) => ({
        ...prev,
        email: validateEmail(value),
      }));
    }
    if (field === "mobile") {
      const limitedValue = value.slice(0, 10);
      if (value.length <= 10) {
        setFormData((prev) => ({ ...prev, mobile: limitedValue }));
        setValidationErrors((prev) => ({
          ...prev,
          mobile: validateMobile(limitedValue),
        }));
      }
    }
    if (field === "password" && !isEditMode) {
      setValidationErrors((prev) => ({
        ...prev,
        password: validatePassword(value),
      }));
    }
  };

  // Check if form has validation errors
  const hasValidationErrors = () => {
    return Object.values(validationErrors).some((error) => error !== "");
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (isEditMode) {
      // EDIT mode submission - Update student profile only
      if (!editingStudentId) return;

      setSubmitting(true);
      try {
        const res = await fetch(`/api/students?id=${editingStudentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollmentNumber: formData.enrollmentNo,
            currentSemester: formData.currentSemester ? parseInt(formData.currentSemester) : null,
            specialization: formData.specialization,
            institution: collegeName,
            educationLevel: formData.educationLevel,
            gender: formData.gender,
            
          }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error?.message || "Failed to update student");
        }

        closeForm();
        loadStudents();
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Student updated successfully",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to update student: " + err.message,
          confirmButtonColor: "#059669",
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      // ADD mode submission - Create user first, then student profile
      if (!formData.name || !formData.email || !formData.password) {
        Swal.fire({
          icon: "warning",
          title: "Required",
          text: "Name, Email, and Password are required",
          confirmButtonColor: "#059669",
        });
        return;
      }

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
        
        const userRes = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            mobile: formData.mobile || null,
            role: "STUDENT",
          }),
        });
        
        const userData = await userRes.json();
        
        if (!userRes.ok) {
          throw new Error(userData.error || "Failed to create user");
        }

        
        const studentRes = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: userData.jyotishi.id,
            collegeId,
            enrollmentNumber: formData.enrollmentNo, 
            currentSemester: formData.currentSemester ? parseInt(formData.currentSemester) : null,
            specialization: formData.specialization,
            institution: collegeName,
            educationLevel: formData.educationLevel,
            gender: formData.gender,
          }),
        });

        const studentData = await studentRes.json();
        
        if (!studentRes.ok) {
          throw new Error(studentData.error?.message || "Failed to create student profile");
        }

        closeForm();
        loadStudents();
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Student added successfully",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Failed to add student",
          confirmButtonColor: "#059669",
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  // DELETE Student
  const deleteStudent = async (studentId: string, studentName: string) => {
    const result = await Swal.fire({
      title: "Delete Student?",
      html: `Are you sure you want to delete <strong>"${studentName}"</strong>?<br>This action will only delete the student profile, not the user account.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete profile!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/students?id=${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Student profile has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
        loadStudents();
      } else {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: data.error?.message || "Failed to delete student profile",
          confirmButtonColor: "#059669",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the student profile.",
        confirmButtonColor: "#059669",
      });
    }
  };

  const filtered = students.filter(
    (s) =>
      s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      {/* Main Content */}
      <div className={`transition-all duration-300 ${openForm ? "mr-96" : ""}`}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Student Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage student profiles and information
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative max-w-md w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search students..."
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
                Add Student
              </Button>
            </div>
          </div>

          {/* Students Table */}
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
                    {searchTerm ? "No students found" : "No students added yet"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm
                      ? "Try adjusting your search criteria"
                      : "Click 'Add Student' to get started"}
                  </p>
                  {searchTerm ? (
                    <Button
                      variant="outline"
                      onClick={() => setSearchTerm("")}
                      className="border-gray-300"
                    >
                      Clear Search
                    </Button>
                  ) : (
                    <Button
                      onClick={openAddForm}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Student
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">
                          Student
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Contact
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Education
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Institution
                        </TableHead>
                       
                        <TableHead className="font-semibold text-gray-700 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((s) => (
                        <TableRow key={s.id} className="hover:bg-gray-50/50">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {s.user?.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {s.user?.email}
                              </span>
                              {s.gender && (
                                <Badge variant="outline" className="text-xs w-fit mt-1">
                                  {s.gender}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {s.user?.mobile && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  {s.user.mobile}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-3 h-3" />
                                {s.user?.email}
                              </div>
                              {s.city && s.state && (
                                <div className="text-xs text-gray-500">
                                  {s.city}, {s.state}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {s.educationLevel && (
                                <span className="text-sm text-gray-700">
                                  {s.educationLevel}
                                </span>
                              )}
                              {s.specialization && (
                                <span className="text-xs text-gray-500">
                                  {s.specialization}
                                </span>
                              )}
                              {s.currentSemester && (
                                <Badge variant="outline" className="text-xs w-fit mt-1">
                                  Semester: {s.currentSemester}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {s.institution ? (
                              <div className="text-sm text-gray-700">
                                {s.institution}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                         
                          <TableCell className="text-right space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditForm(s)}
                              className="hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() =>
                                deleteStudent(s.id, s.user?.name || "this student")
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
                    Edit Student Profile
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-emerald-600" />
                    Add New Student
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
                  placeholder="e.g., John Smith"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={isEditMode || submitting}
                  className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    isEditMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
                  }`}
                />
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Name can only be changed in user settings
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
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={isEditMode || submitting}
                  className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    isEditMode
                      ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                      : ""
                  } ${
                    validationErrors.email && !isEditMode
                      ? "border-red-300 focus:border-red-500"
                      : ""
                  }`}
                />
                {!isEditMode && validationErrors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {validationErrors.email}
                  </p>
                )}
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email can only be changed in user settings
                  </p>
                )}
              </div>

              {/* Mobile Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Mobile Number
                </label>
                <Input
                  placeholder="Enter 10-digit mobile number"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  maxLength={10}
                  disabled={submitting}
                  className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    validationErrors.mobile
                      ? "border-red-300 focus:border-red-500"
                      : ""
                  }`}
                />
                {validationErrors.mobile && (
                  <p className="text-xs text-red-500 mt-1">
                    {validationErrors.mobile}
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
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    disabled={submitting}
                    className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                      validationErrors.password
                        ? "border-red-300 focus:border-red-500"
                        : ""
                    }`}
                  />
                  {validationErrors.password && (
                    <p className="text-xs text-red-500 mt-1">
                      {validationErrors.password}
                    </p>
                  )}
                </div>
              )}

              {/* Enrollment Number Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Enrollment Number
                </label>
                <Input
                  placeholder="e.g., EN20230001"
                  value={formData.enrollmentNo}
                  onChange={(e) => handleInputChange("enrollmentNo", e.target.value)}
                  disabled={submitting}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {/* Current Semester Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Current Semester
                </label>
                <Select
                  value={formData.currentSemester}
                  onValueChange={(v) =>
                    setFormData({ ...formData, currentSemester: v })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => (i + 1).toString()).map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Specialization Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Specialization
                </label>
                <Input
                  placeholder="e.g., Computer Science, Mechanical Engineering"
                  value={formData.specialization}
                  onChange={(e) => handleInputChange("specialization", e.target.value)}
                  disabled={submitting}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {/* Institution Field */}
              {/* <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Institution
                </label>
                <Input
                  placeholder="e.g., University/College name"
                  value={formData.institution}
                  onChange={(e) => handleInputChange("institution", e.target.value)}
                  disabled={submitting}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div> */}
              {/* Institution Display */}
<div>
  <label className="text-sm font-medium text-gray-700 mb-2 block">
    Institution
  </label>
  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
    <GraduationCap className="w-4 h-4 text-gray-500" />
    <span className="text-sm text-gray-700">
      {collegeName || "Loading college name..."}
    </span>
  </div>
  <p className="text-xs text-gray-500 mt-1">
    Institution is automatically set from your college
  </p>
</div>

              {/* Education Level Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Education Level
                </label>
                <Select
                  value={formData.educationLevel}
                  onValueChange={(v) =>
                    setFormData({ ...formData, educationLevel: v })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Select Education Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Gender
                </label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) =>
                    setFormData({ ...formData, gender: v })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((gender) => (
                      <SelectItem key={gender.value} value={gender.value}>
                        {gender.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    {isEditMode ? "Update Profile" : "Create Student"}
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

export default StudentPage;