/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars*/
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Swal from "sweetalert2";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  Plus,
  Save,
  Trash2,
  Users,
  X,
  Video,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import Image from "next/image";

type Course = {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  description: string;
  instructor?: string | null;
  duration?: string | null;
  totalSessions?: number | null;
  priceINR: string | number;
  priceUSD: string | number;
  status: string;
  thumbnailUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  registrationDeadline?: string | null;
  whyLearnIntro?: string | null;
  whatYouLearn?: string | null;
  disclaimer?: string | null;
  maxStudents?: number | null;
  currentEnrollments: number;
  commissionPercourse?: number | null;
  createdAt: string;
  updatedAt: string;
  features?: { feature: string }[] | string[];
  whyLearn?: { title: string; description: string }[];
  content?: { content: string }[];
  topics?: { topic: string }[];
  sessions?: Session[];
};

type Session = {
  id: string;
  sessionNumber: number;
  title: string;
  description: string;
  sessionDate: string;
  sessionTime: string;
  duration: number;
  meetingLink: string;
  meetingPasscode: string;
  recordingUrl: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ViewCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editSessionData, setEditSessionData] = useState<Session | null>(null);

  // Editable fields
  const [editData, setEditData] = useState<Course | null>(null);

  useEffect(() => {
    if (params.id) fetchCourse();
  }, [params.id]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${params.id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();

      const safeStatus = data.status ?? "DRAFT";
      const normalizedFeatures = Array.isArray(data.features)
        ? data.features.map((f: string | { feature: string }) =>
            typeof f === "string" ? { feature: f } : f
          )
        : [];

      const courseData = {
        ...data,
        status: safeStatus,
        priceINR: data.priceINR ?? 0,
        priceUSD: data.priceUSD ?? 0,
        commissionPercourse: data.commissionPercourse ?? null,
        features: normalizedFeatures,
        whyLearn: Array.isArray(data.whyLearn) ? data.whyLearn : [],
        content: Array.isArray(data.content) ? data.content : [],
        topics: Array.isArray(data.topics) ? data.topics : [],
        sessions: Array.isArray(data.sessions) ? data.sessions : [],
      };

      setCourse(courseData);
      setEditData(courseData);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Not Found",
        text: "Course not found",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...course! });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...course! });
    setEditingSession(null);
    setEditSessionData(null);
  };

  const handleSave = async () => {
    if (!editData) return;

    setSaving(true);
    try {
      const payload = {
        slug: editData.slug,
        title: editData.title,
        tagline: editData.tagline || null,
        description: editData.description,
        instructor: editData.instructor || null,
        duration: editData.duration || null,
        totalSessions: editData.totalSessions ? Number(editData.totalSessions) : null,
        priceINR: editData.priceINR ? Number(editData.priceINR) : null,
        priceUSD: editData.priceUSD ? Number(editData.priceUSD) : null,
        status: editData.status,
        thumbnailUrl: editData.thumbnailUrl || null,
        startDate: editData.startDate || null,
        endDate: editData.endDate || null,
        registrationDeadline: editData.registrationDeadline || null,
        whyLearnIntro: editData.whyLearnIntro || null,
        whatYouLearn: editData.whatYouLearn || null,
        disclaimer: editData.disclaimer || null,
        maxStudents: editData.maxStudents ? Number(editData.maxStudents) : null,
        currentEnrollments: Number(editData.currentEnrollments),
        commissionPercourse: editData.commissionPercourse ? Number(editData.commissionPercourse) : null,
        features: (editData.features || [])
          .map((f) => (typeof f === "string" ? f : f.feature))
          .filter((f) => f.trim()),
        whyLearn: (editData.whyLearn || []).filter((w) => w.title.trim() && w.description.trim()),
        content: (editData.content || [])
          .map((c) => (typeof c === "string" ? c : c.content))
          .filter((c) => c.trim()),
        topics: (editData.topics || [])
          .map((t) => (typeof t === "string" ? t : t.topic))
          .filter((t) => t.trim()),
      };

      const res = await fetch(`/api/admin/courses/${editData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Course updated successfully!",
          timer: 2000,
          showConfirmButton: false,
        });
        setIsEditing(false);
        fetchCourse();
      } else {
        const err = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.error || "Failed to update course",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error updating course",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/courses/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Course deleted successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/dashboard/admin/courses");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Delete failed",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error deleting course",
      });
    }
  };

  // Session Management Functions
const addSession = async () => {
  if (!course) return;

  // Always calculate based on current sessions to avoid conflicts
  const newSessionNumber = course.sessions && course.sessions.length > 0
    ? Math.max(...course.sessions.map((s) => s.sessionNumber)) + 1
    : 1;

  // Create a temporary session with empty fields that opens in edit mode
  const tempSession: Session = {
    id: `temp-${Date.now()}`,
    sessionNumber: newSessionNumber,
    title: "",
    description: "",
    sessionDate: "",
    sessionTime: "",
    duration: 60,
    meetingLink: "",
    meetingPasscode: "",
    recordingUrl: "",
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to local state immediately to show the form
  const updatedSessions = [...(course.sessions || []), tempSession];
  setCourse({ ...course, sessions: updatedSessions });
  if (editData) {
    setEditData({ ...editData, sessions: updatedSessions });
  }
  
  // Open the new session in edit mode
  setEditingSession(tempSession.id);
  setEditSessionData(tempSession);
};

  const startEditingSession = (session: Session) => {
    setEditingSession(session.id);
    setEditSessionData({ ...session });
  };

const cancelEditingSession = () => {
  if (editingSession?.startsWith('temp-') && course) {
    // Remove the temporary session from local state
    const updatedSessions = course.sessions?.filter(s => s.id !== editingSession) || [];
    setCourse({ ...course, sessions: updatedSessions });
    if (editData) {
      setEditData({ ...editData, sessions: updatedSessions });
    }
  }
  
  setEditingSession(null);
  setEditSessionData(null);
};

const saveSession = async () => {
  if (!editSessionData || !course) return;

  // Validate required fields
  if (!editSessionData.title || !editSessionData.sessionDate || !editSessionData.sessionTime) {
    Swal.fire({
      icon: "error",
      title: "Missing Required Fields",
      text: "Session title, date, and time are required.",
      confirmButtonColor: "#16a34a",
    });
    return;
  }

  try {
    const isNewSession = editSessionData.id.startsWith('temp-');
    
    if (isNewSession) {
      // Create new session via API
      const { id, createdAt, updatedAt, ...sessionData } = editSessionData;
      
      const res = await fetch(`/api/admin/courses/${course.id}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      if (res.ok) {
        Swal.fire("Success", "Session created successfully!", "success");
        setEditingSession(null);
        setEditSessionData(null);
        fetchCourse(); // Refresh to get the real session ID from database
      } else {
        const err = await res.json();
        Swal.fire("Error", err.error || "Failed to create session", "error");
      }
    } else {
      // Update existing session
      const res = await fetch(`/api/admin/courses/${course.id}/sessions/${editSessionData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSessionData),
      });

      if (res.ok) {
        Swal.fire("Success", "Session updated successfully!", "success");
        setEditingSession(null);
        setEditSessionData(null);
        fetchCourse();
      } else {
        const err = await res.json();
        Swal.fire("Error", err.error || "Failed to update session", "error");
      }
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Error saving session", "error");
  }
};

const deleteSession = async (sessionId: string) => {
  const result = await Swal.fire({
    title: "Delete Session?",
    text: "This cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
  });
  if (!result.isConfirmed || !course) return;

  // If it's a temporary session, just remove from local state and re-sequence
  if (sessionId.startsWith('temp-')) {
    const updatedSessions = course.sessions?.filter(s => s.id !== sessionId) || [];
    
    // Re-sequence session numbers
    const renumberedSessions = updatedSessions
      .sort((a, b) => a.sessionNumber - b.sessionNumber)
      .map((session, index) => ({
        ...session,
        sessionNumber: index + 1
      }));
    
    setCourse({ ...course, sessions: renumberedSessions });
    if (editData) {
      setEditData({ ...editData, sessions: renumberedSessions });
    }
    if (editingSession === sessionId) {
      setEditingSession(null);
      setEditSessionData(null);
    }
    return;
  }

  try {
    const res = await fetch(`/api/admin/courses/${course.id}/sessions/${sessionId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      Swal.fire("Deleted", "Session deleted.", "success");
      
      // If backend doesn't re-sequence, do it on frontend
      // Remove the session from local state immediately for better UX
      const deletedSession = course.sessions?.find(s => s.id === sessionId);
      if (deletedSession) {
        const updatedSessions = course.sessions?.filter(s => s.id !== sessionId) || [];
        
        // Re-sequence sessions that come after the deleted one
        const renumberedSessions = updatedSessions.map(session => {
          if (session.sessionNumber > deletedSession.sessionNumber) {
            return {
              ...session,
              sessionNumber: session.sessionNumber - 1
            };
          }
          return session;
        }).sort((a, b) => a.sessionNumber - b.sessionNumber);

        setCourse({ ...course, sessions: renumberedSessions });
        if (editData) {
          setEditData({ ...editData, sessions: renumberedSessions });
        }
      }
      
      // Still fetch course to ensure data is in sync with backend
      fetchCourse();
    } else {
      Swal.fire("Error", "Failed to delete session", "error");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Error deleting session", "error");
  }
};

  const updateEditSessionField = (field: keyof Session, value: any) => {
    if (!editSessionData) return;
    setEditSessionData({ ...editSessionData, [field]: value });
  };

  const updateEditField = (field: keyof Course, value: any) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const addArrayItem = (
    field: "features" | "whyLearn" | "content" | "topics"
  ) => {
    if (!editData) return;
    const newItem =
      field === "whyLearn"
        ? { title: "", description: "" }
        : field === "features"
        ? { feature: "" }
        : field === "content"
        ? { content: "" }
        : { topic: "" };
    const currentArray = (editData[field] as any[]) || [];
    setEditData({ ...editData, [field]: [...currentArray, newItem] });
  };

  const removeArrayItem = (
    field: "features" | "whyLearn" | "content" | "topics",
    index: number
  ) => {
    if (!editData) return;
    const currentArray = (editData[field] as any[]) || [];
    const newArray = [...currentArray];
    newArray.splice(index, 1);
    setEditData({ ...editData, [field]: newArray });
  };

  const updateArrayItem = (
    field: "features" | "whyLearn" | "content" | "topics",
    index: number,
    value: any
  ) => {
    if (!editData) return;
    const currentArray = (editData[field] as any[]) || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    setEditData({ ...editData, [field]: newArray });
  };

  // Helper functions
  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN") : "Not set";
  const formatTime = (time: string) => {
    if (!time) return "-";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatDateForInput = (d: string | null) => (d ? d.split("T")[0] : "");

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-500",
      REGISTRATION_OPEN: "bg-green-500",
      ONGOING: "bg-blue-500",
      UPCOMING: "bg-yellow-500",
      COMPLETED: "bg-purple-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getSessionStatus = (session: Session) => {
    const now = new Date();
    const sessionDateTime = new Date(`${session.sessionDate}T${session.sessionTime}`);

    if (session.isCompleted) return { text: "Completed", color: "bg-green-100 text-green-800" };
    if (sessionDateTime < now) return { text: "Missed", color: "bg-red-100 text-red-800" };
    if (sessionDateTime.toDateString() === now.toDateString())
      return { text: "Today", color: "bg-blue-100 text-blue-800" };
    return { text: "Upcoming", color: "bg-yellow-100 text-yellow-800" };
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );

  if (!course || !editData)
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Course Not Found</h2>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/admin/courses">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
          </Link>
        </Button>
      </div>
    );

  const displayData = isEditing ? editData : course;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="relative py-8 mb-8 bg-gradient-to-r from-blue-50 to-amber-50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/admin/courses"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Courses
                </Link>
                <Badge variant="outline" className="text-xs bg-white">
                  ADMIN VIEW
                </Badge>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-700">Title</Label>
                  <Input
                    value={editData.title}
                    onChange={(e) => updateEditField("title", e.target.value)}
                    className="text-2xl font-bold border-blue-300 focus:border-blue-500 h-16"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Tagline</Label>
                  <Input
                    value={editData.tagline || ""}
                    onChange={(e) => updateEditField("tagline", e.target.value)}
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{displayData.title}</h1>
                {displayData.tagline && (
                  <p className="text-lg text-gray-600 mb-6">{displayData.tagline}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {isEditing ? (
                <div className="w-full space-y-2">
                  <Label className="text-sm text-gray-700">Topics</Label>
                  {(editData.topics || []).map((t, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        value={typeof t === "string" ? t : t.topic}
                        onChange={(e) =>
                          updateArrayItem("topics", i, { topic: e.target.value })
                        }
                        placeholder="Topic"
                        className="border-blue-300 focus:border-blue-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem("topics", i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("topics")}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Topic
                  </Button>
                </div>
              ) : (
                displayData.topics?.map((t) => (
                  <Badge
                    key={typeof t === "string" ? t : t.topic}
                    className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                  >
                    {typeof t === "string" ? t : t.topic}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Live Sessions */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Sessions</CardTitle>
                    <CardDescription>
                      {course.sessions?.length || 0} sessions scheduled
                    </CardDescription>
                  </div>
                  {/* Only show Add Session button in edit mode */}
                  {isEditing && (
                    <Button onClick={addSession} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Session
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!course.sessions || course.sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No sessions scheduled yet.</p>
                    {isEditing && (
                      <p className="text-sm mt-2">Add sessions to get started.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {course.sessions
                      .sort((a, b) => a.sessionNumber - b.sessionNumber)
                      .map((session) => (
                        <Card key={session.id} className="border border-gray-200">
                          <CardContent className="p-4">
                            {editingSession === session.id ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Session Title *</Label>
                                    <Input
                                      value={editSessionData?.title || ""}
                                      onChange={(e) =>
                                        updateEditSessionField("title", e.target.value)
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Session Date *</Label>
                                    <Input
                                      type="date"
                                      value={editSessionData?.sessionDate || ""}
                                      onChange={(e) =>
                                        updateEditSessionField("sessionDate", e.target.value)
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Session Time *</Label>
                                    <Input
                                      type="time"
                                      value={editSessionData?.sessionTime || ""}
                                      onChange={(e) =>
                                        updateEditSessionField("sessionTime", e.target.value)
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Duration (minutes) *</Label>
                                    <Input
                                      type="number"
                                      value={editSessionData?.duration || 60}
                                      onChange={(e) =>
                                        updateEditSessionField(
                                          "duration",
                                          parseInt(e.target.value) || 60
                                        )
                                      }
                                      min="1"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Meeting Link</Label>
                                    <Input
                                      type="url"
                                      value={editSessionData?.meetingLink || ""}
                                      onChange={(e) =>
                                        updateEditSessionField("meetingLink", e.target.value)
                                      }
                                      placeholder="https://zoom.us/j/..."
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Passcode</Label>
                                    <Input
                                      value={editSessionData?.meetingPasscode || ""}
                                      onChange={(e) =>
                                        updateEditSessionField("meetingPasscode", e.target.value)
                                      }
                                      placeholder="123456"
                                    />
                                  </div>
                                  <div className="md:col-span-2 space-y-2">
                                    <Label>Recording URL</Label>
                                    <Input
                                      type="url"
                                      value={editSessionData?.recordingUrl || ""}
                                      onChange={(e) =>
                                        updateEditSessionField("recordingUrl", e.target.value)
                                      }
                                      placeholder="https://youtube.com/..."
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={editSessionData?.isCompleted || false}
                                      onChange={(e) =>
                                        updateEditSessionField("isCompleted", e.target.checked)
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <Label className="text-sm">Session Completed</Label>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Description</Label>
                                  <Textarea
                                    value={editSessionData?.description || ""}
                                    onChange={(e) =>
                                      updateEditSessionField("description", e.target.value)
                                    }
                                    placeholder="Session details and topics covered..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={saveSession}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Session
                                  </Button>
                                  <Button variant="outline" onClick={cancelEditingSession}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                      Session {session.sessionNumber}: {session.title}
                                      <Badge className={getSessionStatus(session).color}>
                                        {getSessionStatus(session).text}
                                      </Badge>
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                      <Calendar className="h-3 w-3 inline mr-1" />
                                      {formatDate(session.sessionDate)} at {formatTime(session.sessionTime)} • {session.duration} mins
                                    </p>
                                  </div>
                                  {isEditing && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => startEditingSession(session)}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => deleteSession(session.id)}
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {session.description && (
                                  <p className="text-sm text-gray-700 mb-3">{session.description}</p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  {session.meetingLink && (
                                    <div className="flex items-center gap-2">
                                      <LinkIcon className="h-4 w-4 text-blue-600" />
                                      <a
                                        href={session.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        Join Meeting
                                      </a>
                                    </div>
                                  )}
                                  {session.meetingPasscode && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Passcode:</span>
                                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                        {session.meetingPasscode}
                                      </code>
                                    </div>
                                  )}
                                  {session.recordingUrl && (
                                    <div className="flex items-center gap-2 md:col-span-2">
                                      <Video className="h-4 w-4 text-green-600" />
                                      <a
                                        href={session.recordingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:underline"
                                      >
                                        Watch Recording
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Overview */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50">
                <CardTitle>Course Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Description</Label>
                    <Textarea
                      value={editData.description}
                      onChange={(e) => updateEditField("description", e.target.value)}
                      rows={6}
                      className="border-blue-300 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <p className="mb-6 leading-relaxed whitespace-pre-wrap text-gray-700">
                    {displayData.description || "No description provided."}
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Instructor
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editData.instructor || ""}
                        onChange={(e) => updateEditField("instructor", e.target.value)}
                        className="border-blue-300 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-700">
                        {displayData.instructor || "To be announced"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Duration
                    </Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editData.duration || ""}
                          onChange={(e) => updateEditField("duration", e.target.value)}
                          placeholder="25 live sessions"
                          className="border-blue-300 focus:border-blue-500"
                        />
                        <Input
                          type="number"
                          value={editData.totalSessions || ""}
                          onChange={(e) => updateEditField("totalSessions", e.target.value)}
                          placeholder="Sessions count"
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                    ) : (
                      <p className="text-gray-700">
                        {displayData.duration || "Not specified"}
                        {displayData.totalSessions && ` • ${displayData.totalSessions} sessions`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50">
                <CardTitle>Course Features</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Features</Label>
                    {(editData.features || []).map((f, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={typeof f === "string" ? f : f.feature}
                          onChange={(e) =>
                            updateArrayItem("features", i, { feature: e.target.value })
                          }
                          placeholder="Feature"
                          className="border-blue-300 focus:border-blue-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem("features", i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("features")}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Feature
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {displayData.features?.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors border border-blue-100"
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="leading-snug text-gray-700">
                          {typeof f === "string" ? f : f.feature}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Why Learn */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-50">
                <CardTitle>Why Learn {displayData.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700">Introduction</Label>
                      <Textarea
                        value={editData.whyLearnIntro || ""}
                        onChange={(e) => updateEditField("whyLearnIntro", e.target.value)}
                        rows={3}
                        className="border-amber-300 focus:border-amber-500"
                      />
                    </div>
                    {(editData.whyLearn || []).map((item, i) => (
                      <div
                        key={i}
                        className="space-y-2 p-4 border border-amber-200 rounded bg-amber-50"
                      >
                        <div className="flex justify-between items-center">
                          <Label className="text-sm text-gray-700">Item {i + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeArrayItem("whyLearn", i)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          value={item.title}
                          onChange={(e) =>
                            updateArrayItem("whyLearn", i, {
                              ...item,
                              title: e.target.value,
                            })
                          }
                          placeholder="Title"
                          className="border-amber-300 focus:border-amber-500"
                        />
                        <Textarea
                          value={item.description}
                          onChange={(e) =>
                            updateArrayItem("whyLearn", i, {
                              ...item,
                              description: e.target.value,
                            })
                          }
                          placeholder="Description"
                          rows={3}
                          className="border-amber-300 focus:border-amber-500"
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("whyLearn")}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                  </div>
                ) : (
                  <>
                    {displayData.whyLearnIntro && (
                      <p className="mb-6 leading-relaxed text-gray-700">
                        {displayData.whyLearnIntro}
                      </p>
                    )}
                    <Accordion type="single" collapsible className="w-full">
                      {displayData.whyLearn?.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="hover:text-amber-600 transition-colors text-gray-900">
                            {item.title}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-700 leading-relaxed">
                            {item.description}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Course Content */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50">
                <CardTitle>Course Content</CardTitle>
                <CardDescription>
                  {displayData.content?.length || 0} detailed lectures
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Content Items</Label>
                    {editData.content?.map((c, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={typeof c === "string" ? c : c.content}
                          onChange={(e) =>
                            updateArrayItem("content", i, { content: e.target.value })
                          }
                          placeholder="Content item"
                          className="border-blue-300 focus:border-blue-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem("content", i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("content")}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Content
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {displayData.content?.map((c, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 hover:bg-blue-50 rounded-lg transition-colors group border border-blue-100"
                      >
                        <BookOpen className="h-5 w-5 mt-1 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="leading-relaxed text-gray-700">
                          {typeof c === "string" ? c : c.content}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing & Enrollment */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-xl">Course Enrollment</CardTitle>
                <CardDescription>
                  {displayData.status === "REGISTRATION_OPEN"
                    ? "Registration is open"
                    : displayData.status === "DRAFT"
                    ? "Draft mode"
                    : "Check status"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Price USD</Label>
                        <Input
                          type="number"
                          value={editData.priceUSD}
                          onChange={(e) => updateEditField("priceUSD", e.target.value)}
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Price INR</Label>
                        <Input
                          type="number"
                          value={editData.priceINR}
                          onChange={(e) => updateEditField("priceINR", e.target.value)}
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Commission per Course (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editData.commissionPercourse ?? ""}
                          onChange={(e) => updateEditField("commissionPercourse", e.target.value)}
                          placeholder="15.5"
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Status</Label>
                        <select
                          value={editData.status}
                          onChange={(e) => updateEditField("status", e.target.value)}
                          className="w-full p-2 border border-blue-300 rounded focus:border-blue-500"
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="REGISTRATION_OPEN">REGISTRATION OPEN</option>
                          <option value="ONGOING">ONGOING</option>
                          <option value="UPCOMING">UPCOMING</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>

                      <div className="pt-4 border-t">
                        <ImageUpload
                          label="Course Thumbnail"
                          value={editData.thumbnailUrl || ""}
                          onChange={(url) => updateEditField("thumbnailUrl", url)}
                          isThumbnail={true}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-blue-600">
                          ${Number(displayData.priceUSD).toLocaleString()}
                        </span>
                        <Badge className={`text-white ${getStatusColor(displayData.status)}`}>
                          {displayData.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-lg font-medium text-amber-600">
                        ₹{Number(displayData.priceINR).toLocaleString("en-IN")}
                      </p>
                      {displayData.commissionPercourse !== null && (
                        <p className="text-sm text-gray-600">
                          Commission: {displayData.commissionPercourse}%
                        </p>
                      )}
                      {displayData.thumbnailUrl && (
                        <div className="mt-4">
                          <Label className="text-sm text-gray-600 mb-2 block">Course Thumbnail</Label>
                          <div className="relative w-full rounded-lg overflow-hidden border border-gray-200">
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                              <Image
                                src={displayData.thumbnailUrl}
                                alt={displayData.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <Separator />

                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Start Date</Label>
                        <Input
                          type="date"
                          value={formatDateForInput(editData.startDate || "")}
                          onChange={(e) => updateEditField("startDate", e.target.value)}
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">End Date</Label>
                        <Input
                          type="date"
                          value={formatDateForInput(editData.endDate || "")}
                          onChange={(e) => updateEditField("endDate", e.target.value)}
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Max Students</Label>
                        <Input
                          type="number"
                          value={editData.maxStudents || ""}
                          onChange={(e) => updateEditField("maxStudents", e.target.value)}
                          className="border-blue-300 focus:border-blue-500"
                          disabled
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Current Enrollments</Label>
                        <Input
                          type="number"
                          value={editData.currentEnrollments}
                          onChange={(e) => updateEditField("currentEnrollments", e.target.value)}
                          className="border-blue-300 focus:border-blue-500"
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(displayData.startDate || "")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">End Date</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(displayData.endDate || "")}
                        </span>
                      </div>
                      {displayData.maxStudents && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Seats</span>
                          <span className="font-medium text-gray-900">
                            {displayData.currentEnrollments}/{displayData.maxStudents}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Admin Actions */}
                  <div className="space-y-2">
                    {!isEditing ? (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-start border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Link href={`/courses/${displayData.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            View Live Page
                          </Link>
                        </Button>
                        <Button
                          className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                          onClick={handleEdit}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Course
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full justify-start"
                          onClick={handleDelete}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Course
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          className="w-full justify-start bg-green-600 hover:bg-green-700"
                          onClick={handleSave}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 text-center italic">
                    Last updated: {new Date(displayData.updatedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Technical Info */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50">
                <CardTitle className="text-lg">Technical Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Slug</span>
                  {isEditing ? (
                    <Input
                      value={editData.slug}
                      onChange={(e) => updateEditField("slug", e.target.value)}
                      className="w-40 border-blue-300 focus:border-blue-500"
                    />
                  ) : (
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {displayData.slug}
                    </code>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="text-gray-900">
                    {new Date(displayData.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}