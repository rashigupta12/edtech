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
import { Loader2, Plus, Search, Crown, Edit, Trash2, Save, X, CheckSquare, Square } from "lucide-react";
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
  { value: "HOD", label: "Head of Department", icon: <Crown className="w-3 h-3 inline ml-1" /> },
  { value: "VISITING_FACULTY", label: "Visiting Faculty" },
];

const permissionsList = [
  { key: "canCreateCourses", label: "Can Create Courses" },
  { key: "canApproveContent", label: "Can Approve Content" },
  { key: "canManageStudents", label: "Can Manage Students" },
  { key: "canScheduleSessions", label: "Can Schedule Sessions" },
];

const FacultyPage = () => {
  const user = useCurrentUser();
  const [collegeId, setCollegeId] = useState<string>("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);

  const [addForm, setAddForm] = useState({
    name: "", email: "", mobile: "", password: "",
    departmentId: "", facultyRole: "LECTURER", designation: "Lecturer",
    permissions: {
      canCreateCourses: false,
      canApproveContent: false,
      canManageStudents: false,
      canScheduleSessions: true,
    },
  });

  const [editForm, setEditForm] = useState({
    departmentId: "", facultyRole: "LECTURER", designation: "",
    permissions: { canCreateCourses: false, canApproveContent: false, canManageStudents: false, canScheduleSessions: true },
  });

  const fetchCollegeId = async () => {
    if (!user?.id) return;
    const res = await fetch(`/api/colleges?userId=${user.id}`, { cache: "no-store" });
    const data = await res.json();
    if (data.success) setCollegeId(data.data.id);
  };

  const loadData = async () => {
    if (!collegeId) return;
    setLoading(true);
    const [deptRes, facRes] = await Promise.all([
      fetch(`/api/departments?collegeId=${collegeId}`),
      fetch(`/api/faculty?collegeId=${collegeId}`),
    ]);
    const deptData = await deptRes.json();
    const facData = await facRes.json();
    setDepartments(deptData.data || []);
    setFacultyList(facData.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCollegeId(); }, [user]);
  useEffect(() => { if (collegeId) loadData(); }, [collegeId]);

  // CREATE Faculty
  const handleAddSubmit = async () => {
    if (!addForm.name || !addForm.email || !addForm.password) {
      alert("Name, Email, and Password are required");
      return;
    }
    setSubmitting(true);
    try {
      const userRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          email: addForm.email,
          password: addForm.password,
          mobile: addForm.mobile || null,
          role: "FACULTY",
        }),
      });
      const userData = await userRes.json();
      if (!userRes.ok) throw new Error(userData.error || "Failed to create user");

      const facultyRes = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeId,
          userId: userData.jyotishi.id,
          departmentId: addForm.departmentId || null,
          facultyRole: addForm.facultyRole,
          designation: addForm.designation,
          employmentType: "FULL_TIME",
          ...addForm.permissions, // Send permissions
        }),
      });

      if (!facultyRes.ok) throw new Error("Failed to assign faculty role");

      alert("Faculty added successfully!");
      setOpenAddModal(false);
      setAddForm({
        name: "", email: "", mobile: "", password: "",
        departmentId: "", facultyRole: "LECTURER", designation: "Lecturer",
        permissions: { canCreateCourses: false, canApproveContent: false, canManageStudents: false, canScheduleSessions: true },
      });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to add faculty");
    } finally {
      setSubmitting(false);
    }
  };

  // EDIT Faculty
  const startEdit = (faculty: any) => {
    setEditingFaculty(faculty);
    setEditForm({
      departmentId: faculty.departmentId || "",
      facultyRole: faculty.facultyRole || "LECTURER",
      designation: faculty.designation || "Lecturer",
      permissions: {
        canCreateCourses: faculty.canCreateCourses || false,
        canApproveContent: faculty.canApproveContent || false,
        canManageStudents: faculty.canManageStudents || false,
        canScheduleSessions: faculty.canScheduleSessions !== false,
      },
    });
  };

const saveEdit = async () => {
  if (!editingFaculty) return;
  try {
    const res = await fetch(`/api/faculty?id=${editingFaculty.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        departmentId: editForm.departmentId || null,
        facultyRole: editForm.facultyRole,
        designation: editForm.designation,
        // Send permissions as individual fields, not as an object
        canCreateCourses: editForm.permissions.canCreateCourses,
        canApproveContent: editForm.permissions.canApproveContent,
        canManageStudents: editForm.permissions.canManageStudents,
        canScheduleSessions: editForm.permissions.canScheduleSessions,
      }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || "Update failed");
    }
    
    const result = await res.json();
    setEditingFaculty(null);
    loadData();
    alert("Faculty updated successfully!");
  } catch (err: any) {
    alert("Failed to update faculty: " + err.message);
  }
};

  // DELETE Faculty
  const deleteFaculty = async (facultyId: string) => {
    if (!confirm("Delete this faculty member permanently?")) return;
    try {
      await fetch(`/api/faculty?id=${facultyId}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const filtered = facultyList.filter(f =>
    f.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center gap-4">
            <CardTitle className="text-2xl font-bold">Faculty Management</CardTitle>
            <Button onClick={() => setOpenAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Faculty
            </Button>
          </div>
          <div className="mt-4 relative max-w-md">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input placeholder="Search faculty..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No faculty found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => {
                 
                  const roleLabel = facultyRoles.find(r => r.value === f.facultyRole)?.label || f.facultyRole;

                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.user?.name}</TableCell>
                      <TableCell>{f.user?.email}</TableCell>
                      <TableCell>{f.departmentName || "—"}</TableCell>
                      <TableCell>
                        {editingFaculty?.id === f.id ? (
                          <Select value={editForm.facultyRole} onValueChange={v => {
                            const role = facultyRoles.find(r => r.value === v);
                            setEditForm({ ...editForm, facultyRole: v, designation: role?.label || "Lecturer" });
                          }}>
                            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {facultyRoles.map(r => (
                                <SelectItem key={r.value} value={r.value}>{r.label} {r.icon}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={f.facultyRole === "HOD" ? "default" : "secondary"}>
                            {roleLabel}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingFaculty?.id === f.id ? (
                          <div className="space-y-2">
                            {permissionsList.map(p => (
                              <div key={p.key} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={editForm.permissions[p.key as keyof typeof editForm.permissions]}
                                  onCheckedChange={(checked) => setEditForm({
                                    ...editForm,
                                    permissions: { ...editForm.permissions, [p.key]: checked }
                                  })}
                                />
                                <Label className="text-xs">{p.label}</Label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs space-y-1">
                            {f.canCreateCourses && <Badge variant="outline">Create</Badge>}
                            {f.canApproveContent && <Badge variant="outline">Approve</Badge>}
                            {f.canManageStudents && <Badge variant="outline">Students</Badge>}
                            {f.canScheduleSessions && <Badge variant="outline">Schedule</Badge>}
                            {!f.canCreateCourses && !f.canApproveContent && !f.canManageStudents && !f.canScheduleSessions && "—"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {editingFaculty?.id === f.id ? (
                          <>
                            <Button size="sm" onClick={saveEdit}><Save className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingFaculty(null)}><X className="w-4 h-4" /></Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => startEdit(f)}><Edit className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteFaculty(f.id)}><Trash2 className="w-4 h-4" /></Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Faculty Modal */}
      {openAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Add New Faculty</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input placeholder="Full Name" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} disabled={submitting} />
              <Input type="email" placeholder="Email Address" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} disabled={submitting} />
              <Input placeholder="Mobile (optional)" value={addForm.mobile} onChange={e => setAddForm({ ...addForm, mobile: e.target.value })} disabled={submitting} />
              <Input type="password" placeholder="Password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} disabled={submitting} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Select value={addForm.departmentId} onValueChange={v => setAddForm({ ...addForm, departmentId: v })} disabled={submitting}>
                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>)}</SelectContent>
              </Select>

              <Select value={addForm.facultyRole} onValueChange={v => {
                const role = facultyRoles.find(r => r.value === v);
                setAddForm({ ...addForm, facultyRole: v, designation: role?.label || "Lecturer" });
              }} disabled={submitting}>
                <SelectTrigger><SelectValue placeholder="Faculty Role" /></SelectTrigger>
                <SelectContent>{facultyRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label} {r.icon}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-3">Permissions</h3>
              <div className="grid grid-cols-2 gap-4">
                {permissionsList.map(p => (
                  <div key={p.key} className="flex items-center space-x-3">
                    <Checkbox
                      id={p.key}
                      checked={addForm.permissions[p.key as keyof typeof addForm.permissions]}
                      onCheckedChange={(checked) => setAddForm({
                        ...addForm,
                        permissions: { ...addForm.permissions, [p.key]: checked }
                      })}
                      disabled={submitting}
                    />
                    <Label htmlFor={p.key} className="cursor-pointer">{p.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpenAddModal(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleAddSubmit} disabled={submitting}>
                {submitting ? <>Creating...</> : "Create Faculty"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyPage;