/*eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/auth";
import {
  Building2,
  Edit,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  collegeId: string;
  createdAt: string;
  updatedAt: string;
}

const Departments = () => {
  const user = useCurrentUser();
  const userid = user?.id;

  const [collegeId, setCollegeId] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  // Fetch college ID from user
  const fetchCollegeId = async () => {
    if (!userid) return;

    try {
      const res = await fetch(`/api/colleges?userId=${userid}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success && data.data?.id) {
        setCollegeId(data.data.id);
      }
    } catch (err) {
      console.error("Failed to fetch college ID");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load college information",
        confirmButtonColor: "#059669",
      });
    }
  };

  // Load departments for this college only
  const loadDepartments = async () => {
    if (!collegeId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/departments?collegeId=${collegeId}`);
      const data = await res.json();
      setDepartments(data.data || []);
    } catch (err) {
      console.error("Failed to load departments");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load departments",
        confirmButtonColor: "#059669",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeId();
  }, [userid]);

  useEffect(() => {
    if (collegeId) {
      loadDepartments();
    }
  }, [collegeId]);
  const generateDepartmentCode = (name: string): string => {
  const trimmedName = name.trim().toUpperCase();
  
  if (!trimmedName) return '';
  
  const words = trimmedName.split(/\s+/);
  
  if (words.length === 1) {
    const word = words[0];
    if (word.length <= 3) {
      return word;
    } else if (word.length <= 5) {
      return word.slice(0, 3); 
    } else {
      return word.slice(0, 4);
    }
  } else if (words.length === 2) {
    return words[0].slice(0, 1) + words[1].slice(0, 1);
  } else {
    return words
      .map(word => word.charAt(0))
      .join('')
      .slice(0, 6); 
  }
};

 const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value } = e.target;

  if (name === "isActive") {
    setForm((prev) => ({ ...prev, [name]: value === "true" }));
  } else if (name === "name") {
    // Auto-generate code from name
    const generatedCode = generateDepartmentCode(value);
    setForm((prev) => ({ ...prev, name: value, code: generatedCode }));
  } else {
    setForm((prev) => ({ ...prev, [name]: value }));
  }
};
  const checkDuplicateCode = async (
    code: string,
    excludeId?: string
  ): Promise<boolean> => {
    const duplicate = departments.find(
      (dept) =>
        dept.code.toUpperCase() === code.toUpperCase() && dept.id !== excludeId
    );
    return !!duplicate;
  };

  const openAddForm = () => {
    setShowForm(true);
    setEditMode(false);
    setSelectedDepartment(null);
    setForm({
      name: "",
      code: "",
      description: "",
      isActive: true,
    });
  };

  const openEditForm = (dept: Department) => {
    setShowForm(true);
    setEditMode(true);
    setSelectedDepartment(dept);
    setForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
      isActive: dept.isActive,
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditMode(false);
    setSelectedDepartment(null);
    setForm({
      name: "",
      code: "",
      description: "",
      isActive: true,
    });
  };

  const saveDepartment = async () => {
    if (!form.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Required",
        text: "Department name is required",
        confirmButtonColor: "#059669",
      });
      return;
    }

    if (!form.code.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Required",
        text: "Department code is required",
        confirmButtonColor: "#059669",
      });
      return;
    }

    if (!collegeId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "College information not found",
        confirmButtonColor: "#059669",
      });
      return;
    }
    const isDuplicate = await checkDuplicateCode(
      form.code,
      editMode ? selectedDepartment?.id : undefined
    );

    if (isDuplicate) {
      Swal.fire({
        icon: "error",
        title: "Duplicate Code",
        text: `Department code "${form.code}" already exists. Please use a different code.`,
        confirmButtonColor: "#059669",
      });
      return;
    }

    setSaving(true);

    const method = editMode ? "PUT" : "POST";
    const url = editMode
      ? `/api/departments?id=${selectedDepartment?.id}`
      : "/api/departments";

    const payload = {
      ...form,
      collegeId: collegeId,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: editMode
            ? "Department updated successfully"
            : "Department created successfully",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });

        closeForm();
        loadDepartments();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: data.error?.message || "Failed to save department",
          confirmButtonColor: "#059669",
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Network error. Please try again.",
        confirmButtonColor: "#059669",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteDepartment = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Delete Department?",
      html: `Are you sure you want to delete <strong>"${name}"</strong>?<br>This action cannot be undone.`,
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
      const res = await fetch(`/api/departments?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Department has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
        loadDepartments();
      } else {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: data.error?.message || "Failed to delete department",
          confirmButtonColor: "#059669",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the department.",
        confirmButtonColor: "#059669",
      });
    }
  };

  // Filter departments by search term
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      {/* Main Content */}
      <div className={`transition-all duration-300 ${showForm ? "mr-80" : ""}`}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
              <p className="text-gray-600 mt-2">
                Manage your college departments
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative max-w-md w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search departments..."
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
                Add Department
              </Button>
            </div>
          </div>

          {/* Departments Table */}
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : filteredDepartments.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm
                      ? "No departments found"
                      : "No departments added yet"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm
                      ? "Try adjusting your search criteria"
                      : "Click 'Add Department' to get started"}
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
                      Add Department
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">
                          Name
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Code
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Description
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDepartments.map((dept) => (
                        <TableRow key={dept.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">
                            {dept.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="font-mono bg-gray-100 text-gray-700"
                            >
                              {dept.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {dept.description || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                dept.isActive
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              }
                            >
                              {dept.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditForm(dept)}
                              className="hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() =>
                                deleteDepartment(dept.id, dept.name)
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

      {/* Slide-in Form Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ${
          showForm ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Form Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {editMode ? (
                  <>
                    <Edit className="w-5 h-5 text-emerald-600" />
                    Edit Department
                  </>
                ) : (
                  <>
                    Create New Department
                  </>
                )}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeForm}
                className="hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Department Name *
                </label>
                <Input
                  name="name"
                  placeholder="e.g., Computer Science"
                  value={form.name}
                  onChange={handleFormChange}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Department Code *
                </label>
                <Input
                  name="code"
                  placeholder="Auto-generated from name"
                  value={form.code}
                  onChange={handleFormChange}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 uppercase"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from department name. You can &apos;t edit it.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description (Optional)
                </label>
                <Textarea
                  name="description"
                  placeholder="Brief description of the department"
                  value={form.description}
                  onChange={handleFormChange}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="isActive"
                      value="true"
                      checked={form.isActive === true}
                      onChange={handleFormChange}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="flex items-center gap-2">
                      Active
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="isActive"
                      value="false"
                      checked={form.isActive === false}
                      onChange={handleFormChange}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="flex items-center gap-2">
                      Inactive
                    </span>
                  </label>
                </div>
              </div>

          
            </div>
          </div>

          {/* Form Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <Button
                onClick={saveDepartment}
                disabled={saving}
                className="flex bg-emerald-600 hover:bg-emerald-700 text-white w-32"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {editMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editMode ? "Update" : "Create"}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={closeForm}
                className="border-gray-300 w-32"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay when form is open */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeForm}
        />
      )}
    </div>
  );
};

export default Departments;
