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
  Calendar,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const BatchPage = () => {
  const user = useCurrentUser();
  const [collegeId, setCollegeId] = useState<string>("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

const [formData, setFormData] = useState({
  name: "",
  code: "",
  academicYear: "",
  departmentId: "all", // Use "all" instead of empty string
  startDate: undefined as Date | undefined,
  endDate: undefined as Date | undefined,
  description: "",
  isActive: true,
});
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    code: "",
    academicYear: "",
  });

  // Academic year options (you can generate dynamically)
  const academicYearOptions = [
    "2023-2024",
    "2024-2025",
    "2025-2026",
    "2026-2027",
    "2027-2028",
  ];

  // Validation functions
  const validateName = (name: string): string => {
    if (!name.trim()) return "Batch name is required";
    if (name.length > 100) return "Batch name must be less than 100 characters";
    return "";
  };

  const validateCode = (code: string): string => {
    if (!code.trim()) return "Batch code is required";
    if (code.length > 20) return "Code must be less than 20 characters";
    const codeRegex = /^[A-Z0-9\-_]+$/;
    if (!codeRegex.test(code)) return "Only uppercase letters, numbers, hyphens and underscores allowed";
    return "";
  };

  const validateAcademicYear = (year: string): string => {
    if (!year.trim()) return "Academic year is required";
    const yearRegex = /^\d{4}-\d{4}$/;
    if (!yearRegex.test(year)) return "Format must be YYYY-YYYY (e.g., 2024-2025)";
    return "";
  };

  const fetchCollegeId = async () => {
    if (!user?.id) return;
    const res = await fetch(`/api/colleges?userId=${user.id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) setCollegeId(data.data.id);
  };

  const loadData = async () => {
    if (!collegeId) return;
    setLoading(true);
    try {
      const [deptRes, batchesRes] = await Promise.all([
        fetch(`/api/departments?collegeId=${collegeId}`),
        fetch(`/api/batches?collegeId=${collegeId}`),
      ]);
      const deptData = await deptRes.json();
      const batchesData = await batchesRes.json();
      setDepartments(deptData.data || []);
      setBatches(batchesData.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeId();
  }, [user]);
  
  useEffect(() => {
    if (collegeId) loadData();
  }, [collegeId]);

  // Open form in ADD mode
  const openAddForm = () => {
     setIsEditMode(false);
  setEditingBatchId(null);
  setFormData({
    name: "",
    code: "",
    academicYear: "",
    departmentId: "all", // Use "all" here
    startDate: undefined,
    endDate: undefined,
    description: "",
    isActive: true,
  });
    setValidationErrors({
      name: "",
      code: "",
      academicYear: "",
    });
    setOpenForm(true);
  };

  // Open form in EDIT mode
  const openEditForm = (batch: any) => {
    setIsEditMode(true);
  setEditingBatchId(batch.id);
  setFormData({
    name: batch.name || "",
    code: batch.code || "",
    academicYear: batch.academicYear || "",
    departmentId: batch.departmentId || "all", // Use "all" here
    startDate: batch.startDate ? new Date(batch.startDate) : undefined,
    endDate: batch.endDate ? new Date(batch.endDate) : undefined,
    description: batch.description || "",
    isActive: batch.isActive ?? true,
  });
    setValidationErrors({
      name: "",
      code: "",
      academicYear: "",
    });
    setOpenForm(true);
  };

  // Close form
  const closeForm = () => {
    setOpenForm(false);
    setIsEditMode(false);
    setEditingBatchId(null);
  };

  // Handle input changes with validation
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'name') {
      setValidationErrors(prev => ({ ...prev, name: validateName(value) }));
    }
    if (field === 'code') {
      const uppercaseValue = value.toUpperCase();
      setFormData(prev => ({ ...prev, code: uppercaseValue }));
      setValidationErrors(prev => ({ ...prev, code: validateCode(uppercaseValue) }));
    }
    if (field === 'academicYear') {
      setValidationErrors(prev => ({ ...prev, academicYear: validateAcademicYear(value) }));
    }
  };

  // Check if form has validation errors
  const hasValidationErrors = () => {
    return Object.values(validationErrors).some(error => error !== "");
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all fields
    const nameError = validateName(formData.name);
    const codeError = validateCode(formData.code);
    const academicYearError = validateAcademicYear(formData.academicYear);

    if (nameError || codeError || academicYearError) {
      setValidationErrors({
        name: nameError,
        code: codeError,
        academicYear: academicYearError,
      });
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please fix the validation errors before submitting",
        confirmButtonColor: "#059669",
      });
      return;
    }

    // Validate dates if both are provided
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      Swal.fire({
        icon: "warning",
        title: "Date Error",
        text: "End date must be after start date",
        confirmButtonColor: "#059669",
      });
      return;
    }

    setSubmitting(true);
    try {
const batchData = {
  collegeId,
  name: formData.name.trim(),
  code: formData.code.trim(),
  academicYear: formData.academicYear.trim(),
  departmentId: formData.departmentId === "all" ? null : formData.departmentId,
  startDate: formData.startDate,
  endDate: formData.endDate,
  description: formData.description.trim(),
  isActive: formData.isActive,
};

      const url = isEditMode && editingBatchId 
        ? `/api/batches?id=${editingBatchId}`
        : "/api/batches";
      
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} batch`);
      }

      closeForm();
      loadData();
      Swal.fire({
        icon: "success",
        title: `${isEditMode ? 'Updated!' : 'Created!'}`,
        text: `Batch ${isEditMode ? 'updated' : 'created'} successfully`,
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: "#059669",
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || `Failed to ${isEditMode ? 'update' : 'create'} batch`,
        confirmButtonColor: "#059669",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE Batch
  const deleteBatch = async (batchId: string, batchName: string) => {
    const result = await Swal.fire({
      title: "Delete Batch?",
      html: `Are you sure you want to delete <strong>"${batchName}"</strong>?<br>This action cannot be undone.`,
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
      const res = await fetch(`/api/batches?id=${batchId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Batch has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
        loadData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: data.error?.message || "Failed to delete batch",
          confirmButtonColor: "#059669",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the batch.",
        confirmButtonColor: "#059669",
      });
    }
  };

  // Toggle batch active status
  const toggleBatchStatus = async (batchId: string, currentStatus: boolean, batchName: string) => {
    const action = currentStatus ? "deactivate" : "activate";
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Batch?`,
      html: `Are you sure you want to ${action} <strong>"${batchName}"</strong>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/batches?id=${batchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: `${action.charAt(0).toUpperCase() + action.slice(1)}d!`,
          text: `Batch has been ${action}d successfully.`,
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
        loadData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Operation Failed",
          text: data.error?.message || `Failed to ${action} batch`,
          confirmButtonColor: "#059669",
        });
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `An error occurred while ${action}ing the batch.`,
        confirmButtonColor: "#059669",
      });
    }
  };

  const filtered = batches.filter(
    (b) =>
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.academicYear?.toLowerCase().includes(searchTerm.toLowerCase())
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
                Batch Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage academic batches for your college
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative max-w-md w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search batches..."
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
                Add Batch
              </Button>
            </div>
          </div>

          {/* Batches Table */}
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? "No batches found" : "No batches added yet"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm
                      ? "Try adjusting your search criteria"
                      : "Click 'Add Batch' to get started"}
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
                      Add Batch
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">Batch Name</TableHead>
                        <TableHead className="font-semibold text-gray-700">Code</TableHead>
                        <TableHead className="font-semibold text-gray-700">Academic Year</TableHead>
                        <TableHead className="font-semibold text-gray-700">Department</TableHead>
                        <TableHead className="font-semibold text-gray-700">Duration</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((batch) => (
                        <TableRow key={batch.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">
                            <div>
                              <div>{batch.name}</div>
                              {batch.description && (
                                <div className="text-xs text-gray-500 truncate max-w-xs">
                                  {batch.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-gray-700">
                            {batch.code || "—"}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {batch.academicYear}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {batch.departmentName || "All Departments"}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            <div className="text-sm">
                              {batch.startDate ? (
                                <div className="flex flex-col">
                                  <span>{format(new Date(batch.startDate), "MMM dd, yyyy")}</span>
                                  {batch.endDate && (
                                    <>
                                      <span className="text-xs text-gray-400">to</span>
                                      <span>{format(new Date(batch.endDate), "MMM dd, yyyy")}</span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                "—"
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  batch.isActive
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-gray-100 text-gray-700 border-gray-200"
                                }
                              >
                                {batch.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleBatchStatus(batch.id, batch.isActive, batch.name)}
                                className="h-6 w-6 p-0"
                                title={batch.isActive ? "Deactivate" : "Activate"}
                              >
                                {batch.isActive ? "🚫" : "✅"}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditForm(batch)}
                              className="hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteBatch(batch.id, batch.name)}
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
                    Edit Batch
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-emerald-600" />
                    Add New Batch
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
                  Batch Name *
                </label>
                <Input
                  placeholder="e.g., Computer Science 2024 Batch"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={submitting}
                  className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    validationErrors.name ? "border-red-300 focus:border-red-500" : ""
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
                )}
              </div>

              {/* Code Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Batch Code *
                </label>
                <Input
                  placeholder="e.g., CS2024"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  disabled={submitting}
                  className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    validationErrors.code ? "border-red-300 focus:border-red-500" : ""
                  }`}
                />
                {validationErrors.code ? (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.code}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Uppercase letters, numbers, hyphens and underscores only</p>
                )}
              </div>

              {/* Academic Year Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Academic Year *
                </label>
                <Select
                  value={formData.academicYear}
                  onValueChange={(v) => handleInputChange('academicYear', v)}
                  disabled={submitting}
                >
                  <SelectTrigger className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    validationErrors.academicYear ? "border-red-300 focus:border-red-500" : ""
                  }`}>
                    <SelectValue placeholder="Select Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.academicYear && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.academicYear}</p>
                )}
              </div>

              {/* Department Field */}
           {/* Department Field */}
<div>
  <label className="text-sm font-medium text-gray-700 mb-2 block">
    Department (Optional)
  </label>
<Select
  value={formData.departmentId}
  onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
  disabled={submitting}
>
  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
    <SelectValue placeholder="Select Department (Optional)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Departments</SelectItem>
    {departments.map((d) => (
      <SelectItem key={d.id} value={d.id}>
        {d.name} ({d.code})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
</div>

              {/* Start Date Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Start Date (Optional)
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300",
                        !formData.startDate && "text-gray-500"
                      )}
                      disabled={submitting}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(formData.startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData({ ...formData, startDate: date })}
                      initialFocus
                      disabled={submitting}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  End Date (Optional)
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300",
                        !formData.endDate && "text-gray-500"
                      )}
                      disabled={submitting}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.endDate ? (
                        format(formData.endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData({ ...formData, endDate: date })}
                      initialFocus
                      disabled={submitting}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Description Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Enter batch description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={submitting}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 min-h-[100px]"
                />
              </div>

              {/* Status Field */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={submitting}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Active Batch
                </label>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting || hasValidationErrors()}
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
                    {isEditMode ? "Update Batch" : "Create Batch"}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={closeForm}
                className="border-gray-300"
                disabled={submitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
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

export default BatchPage;