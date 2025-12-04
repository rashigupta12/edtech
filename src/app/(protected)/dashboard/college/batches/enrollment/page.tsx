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
  UserPlus,
  Users,
  GraduationCap,
  Filter,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Batch {
  id: string;
  name: string;
  code: string;
  academicYear: string;
  departmentName?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  departmentName?: string;
}

interface BatchEnrollment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rollNumber: string;
  enrollmentDate: string;
  isActive: boolean;
}

const BatchEnrollmentPage = () => {
  const user = useCurrentUser();
  const [collegeId, setCollegeId] = useState<string>("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<BatchEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);

  const [rollNumbers, setRollNumbers] = useState<{[key: string]: string}>({});
  const [selectedStudentsForAdd, setSelectedStudentsForAdd] = useState<string[]>([]);

  const fetchCollegeId = async () => {
    if (!user?.id) return;
    const res = await fetch(`/api/colleges?userId=${user.id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) setCollegeId(data.data.id);
  };

  const loadBatches = async () => {
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
  };

  const loadStudents = async () => {
    if (!collegeId) return;
    try {
      const res = await fetch(`/api/colleges/students?collegeId=${collegeId}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  const loadEnrollments = async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/batch-enrollments?batchId=${selectedBatch}`);
      const data = await res.json();
      if (data.success) {
        setEnrollments(data.data);
      }
    } catch (error) {
      console.error("Error loading enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeId();
  }, [user]);

  useEffect(() => {
    if (collegeId) {
      loadBatches();
      loadStudents();
    }
  }, [collegeId]);

  useEffect(() => {
    if (selectedBatch) {
      loadEnrollments();
    }
  }, [selectedBatch]);

  // Get batch name by ID
  const getBatchName = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    return batch ? `${batch.name} (${batch.code})` : "";
  };

  // Get enrolled student IDs
  const getEnrolledStudentIds = () => {
    return enrollments.map(e => e.userId);
  };

  // Get available students (not enrolled)
  const getAvailableStudents = () => {
    const enrolledIds = getEnrolledStudentIds();
    return students.filter(student => !enrolledIds.includes(student.id));
  };

  // Handle add students to batch
  const handleAddStudents = async () => {
    if (selectedStudentsForAdd.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No students selected",
        text: "Please select at least one student to enroll",
        confirmButtonColor: "#059669",
      });
      return;
    }

    setSubmitting(true);
    try {
      const enrollmentsData = selectedStudentsForAdd.map(studentId => ({
        batchId: selectedBatch,
        userId: studentId,
        rollNumber: rollNumbers[studentId] || "",
      }));

      const res = await fetch("/api/batch-enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollments: enrollmentsData }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to enroll students");
      }

      setOpenAddDialog(false);
      setSelectedStudentsForAdd([]);
      setRollNumbers({});
      await loadEnrollments();
      
      Swal.fire({
        icon: "success",
        title: "Students Enrolled!",
        text: `${enrollmentsData.length} student(s) enrolled successfully`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Error enrolling students:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to enroll students",
        confirmButtonColor: "#059669",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle remove students from batch
  const handleRemoveStudents = async () => {
    if (selectedStudents.length === 0 && !selectedEnrollmentId) return;

    setSubmitting(true);
    try {
      let enrollmentIds = selectedEnrollmentId ? [selectedEnrollmentId] : 
        enrollments.filter(e => selectedStudents.includes(e.userId)).map(e => e.id);

      const res = await fetch("/api/batch-enrollments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to remove students");
      }

      setOpenRemoveDialog(false);
      setSelectedStudents([]);
      setSelectedEnrollmentId(null);
      await loadEnrollments();
      
      Swal.fire({
        icon: "success",
        title: "Students Removed!",
        text: `${enrollmentIds.length} student(s) removed from batch`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Error removing students:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to remove students",
        confirmButtonColor: "#059669",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle toggle enrollment status
  const toggleEnrollmentStatus = async (enrollmentId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/batch-enrollments?id=${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update enrollment status");
      }

      await loadEnrollments();
      
      Swal.fire({
        icon: "success",
        title: `${currentStatus ? "Deactivated" : "Activated"}!`,
        text: `Enrollment ${currentStatus ? "deactivated" : "activated"} successfully`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Error toggling enrollment:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to update enrollment status",
        confirmButtonColor: "#059669",
      });
    }
  };

  // Export enrollments to CSV
  const exportToCSV = () => {
    if (enrollments.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No data to export",
        text: "There are no enrollments to export",
        confirmButtonColor: "#059669",
      });
      return;
    }

    const batch = batches.find(b => b.id === selectedBatch);
    const headers = ["Roll Number", "Student Name", "Email", "Enrollment Date", "Status"];
    const rows = enrollments.map(e => [
      e.rollNumber || "",
      e.userName,
      e.userEmail,
      new Date(e.enrollmentDate).toLocaleDateString(),
      e.isActive ? "Active" : "Inactive"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch?.code || 'batch'}-enrollments.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredEnrollments = enrollments.filter(
    e =>
      e.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Batch Enrollment Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage student enrollments for batches
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedBatch && (
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="flex items-center gap-2 border-gray-300"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Batch Selection Card */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Select Batch
                </Label>
                <Select
                  value={selectedBatch}
                  onValueChange={setSelectedBatch}
                  disabled={loading}
                >
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} ({batch.code}) - {batch.academicYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBatch && (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Total Enrollments</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {enrollments.length} students
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Active Enrollments</div>
                    <div className="text-2xl font-bold text-emerald-600 mt-1">
                      {enrollments.filter(e => e.isActive).length} students
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedBatch ? (
          <>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative max-w-md w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search enrollments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setOpenAddDialog(true)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!selectedBatch}
                >
                  <UserPlus className="w-4 h-4" />
                  Add Students
                </Button>

                <Button
                  onClick={() => setOpenRemoveDialog(true)}
                  variant="outline"
                  className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={selectedStudents.length === 0 && !selectedEnrollmentId}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Selected
                </Button>
              </div>
            </div>

            {/* Enrollments Table */}
            <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <span className="ml-2 text-gray-600">Loading enrollments...</span>
                  </div>
                ) : filteredEnrollments.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No students enrolled in this batch
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Click 'Add Students' to enroll students in this batch
                    </p>
                    <Button
                      onClick={() => setOpenAddDialog(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Students
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                filteredEnrollments.length > 0 &&
                                selectedStudents.length === filteredEnrollments.length
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedStudents(filteredEnrollments.map(e => e.userId));
                                } else {
                                  setSelectedStudents([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700">Roll Number</TableHead>
                          <TableHead className="font-semibold text-gray-700">Student Name</TableHead>
                          <TableHead className="font-semibold text-gray-700">Email</TableHead>
                          <TableHead className="font-semibold text-gray-700">Enrollment Date</TableHead>
                          <TableHead className="font-semibold text-gray-700">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEnrollments.map((enrollment) => (
                          <TableRow key={enrollment.id} className="hover:bg-gray-50/50">
                            <TableCell>
                              <Checkbox
                                checked={selectedStudents.includes(enrollment.userId)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedStudents([...selectedStudents, enrollment.userId]);
                                  } else {
                                    setSelectedStudents(selectedStudents.filter(id => id !== enrollment.userId));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-gray-700">
                              {enrollment.rollNumber || "—"}
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">
                              {enrollment.userName}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {enrollment.userEmail}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  enrollment.isActive
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-gray-100 text-gray-700 border-gray-200"
                                }
                              >
                                {enrollment.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleEnrollmentStatus(enrollment.id, enrollment.isActive)}
                                className="hover:bg-emerald-50 hover:text-emerald-700"
                                title={enrollment.isActive ? "Deactivate" : "Activate"}
                              >
                                {enrollment.isActive ? "🚫" : "✅"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedEnrollmentId(enrollment.id);
                                  setOpenRemoveDialog(true);
                                }}
                                title="Remove from batch"
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
          </>
        ) : (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a Batch
              </h3>
              <p className="text-gray-600">
                Please select a batch from the dropdown above to view and manage enrollments
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Students Dialog */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Students to Batch</DialogTitle>
            <DialogDescription>
              Select students to enroll in {getBatchName(selectedBatch)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-700">
              Available Students: {getAvailableStudents().length}
            </div>
            
            {getAvailableStudents().length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                All students are already enrolled in this batch
              </div>
            ) : (
              <div className="space-y-2">
                {getAvailableStudents().map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedStudentsForAdd.includes(student.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudentsForAdd([...selectedStudentsForAdd, student.id]);
                          } else {
                            setSelectedStudentsForAdd(selectedStudentsForAdd.filter(id => id !== student.id));
                          }
                        }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                        {student.departmentName && (
                          <div className="text-xs text-gray-400">{student.departmentName}</div>
                        )}
                      </div>
                    </div>
                    <div className="w-40">
                      <Input
                        placeholder="Roll Number"
                        value={rollNumbers[student.id] || ""}
                        onChange={(e) => setRollNumbers({
                          ...rollNumbers,
                          [student.id]: e.target.value
                        })}
                        className="border-gray-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenAddDialog(false);
                setSelectedStudentsForAdd([]);
                setRollNumbers({});
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStudents}
              disabled={submitting || selectedStudentsForAdd.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Enrolling...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Enroll {selectedStudentsForAdd.length} Student(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={openRemoveDialog} onOpenChange={setOpenRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Students from Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {
                selectedEnrollmentId ? "this student" : `${selectedStudents.length} student(s)`
              } from the batch? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveStudents}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BatchEnrollmentPage;

