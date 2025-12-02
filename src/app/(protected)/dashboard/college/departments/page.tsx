"use client";

import { useCurrentUser } from "@/hooks/auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Search } from "lucide-react";

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

  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

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

  const handleFormChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  if (name === "isActive") {
    setForm((prev) => ({ ...prev, [name]: value === "true" }));
  } else {
    setForm((prev) => ({ ...prev, [name]: value }));
  }
};

  const openAddModal = () => {
    setEditMode(false);
    setSelectedDepartment(null);
    setForm({
      name: "",
      code: "",
      description: "",
      isActive: true,
    });
    setOpenModal(true);
  };

  const openEditModal = (dept: Department) => {
    setEditMode(true);
    setSelectedDepartment(dept);
    setForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
      isActive: dept.isActive,
    });
    setOpenModal(true);
  };

  const saveDepartment = async () => {
    if (!form.name || !form.code || !collegeId) {
      alert("Name and Code are required!");
      return;
    }

    const method = editMode ? "PUT" : "POST";
    const url = editMode
      ? `/api/departments?id=${selectedDepartment?.id}`
      : "/api/departments";

    const payload = {
      ...form,
      collegeId: collegeId, // Always enforce correct college
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setOpenModal(false);
        loadDepartments();
      } else {
        alert(data.error?.message || "Failed to save department");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const deleteDepartment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;

    try {
      const res = await fetch(`/api/departments?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        loadDepartments();
      } else {
        alert("Failed to delete department");
      }
    } catch (err) {
      alert("Error deleting department");
    }
  };

  // Filter departments by search term
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-2xl font-bold">Departments</CardTitle>
            <Button onClick={openAddModal} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Department
            </Button>
          </div>

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-md"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm ? "No departments found matching your search." : "No departments added yet."}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="uppercase font-mono">{dept.code}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {dept.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={dept.isActive ? "default" : "secondary"}>
                          {dept.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(dept)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteDepartment(dept.id)}
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

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-5">
                {editMode ? "Edit Department" : "Add New Department"}
              </h2>

              <div className="space-y-4">
                <Input
                  name="name"
                  placeholder="Department Name"
                  value={form.name}
                  onChange={handleFormChange}
                />
                <Input
                  name="code"
                  placeholder="Department Code (e.g. CSE, MEC)"
                  value={form.code}
                  onChange={handleFormChange}
                />
                <Input
                  name="description"
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={handleFormChange}
                />

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Status:</label>
                  <select
  name="isActive"
  value={form.isActive ? "true" : "false"}
  onChange={handleFormChange}
  className="border rounded-md px-3 py-2 text-sm"
>
  <option value="true">Active</option>
  <option value="false">Inactive</option>
</select>
                </div>

                <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded border">
                  College ID: <span className="font-mono">{collegeId || "Loading..."}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setOpenModal(false)}>
                  Cancel
                </Button>
                <Button onClick={saveDepartment}>
                  {editMode ? "Save Changes" : "Create Department"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;