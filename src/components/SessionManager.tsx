/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Edit, Save, X } from "lucide-react";
import React, { useState } from "react";

export interface Session {
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
}

interface SessionManagerProps {
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  totalSessions: number;
  courseId?: string; // Optional: if provided, will use API calls
  onRefresh?: () => void; // Optional: callback to refresh course data
}

export default function SessionManager({
  sessions,
  setSessions,
  totalSessions,
  courseId,
  onRefresh,
}: SessionManagerProps) {
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Session | null>(null);

  const addSession = () => {
    const newSessionNumber =
      sessions.length > 0
        ? Math.max(...sessions.map((s) => s.sessionNumber)) + 1
        : 1;

    const newSession: Session = {
      id: `temp-${Date.now()}`,
      sessionNumber: newSessionNumber,
      title: `Session ${newSessionNumber}`,
      description: "",
      sessionDate: "",
      sessionTime: "",
      duration: 60,
      meetingLink: "",
      meetingPasscode: "",
      recordingUrl: "",
      isCompleted: false,
    };

    // Always add to local state first, save to API when user clicks save
    setSessions([...sessions, newSession]);
    setEditingSession(newSession.id);
    setEditFormData(newSession);
  };

  const startEditing = (session: Session) => {
    setEditingSession(session.id);
    setEditFormData({ ...session });
  };

  const cancelEditing = () => {
    // If it's a new temp session that hasn't been saved yet, remove it from the list
    if (editingSession?.startsWith("temp-")) {
      const updatedSessions = sessions.filter((s) => s.id !== editingSession);
      setSessions(updatedSessions);
    }
    setEditingSession(null);
    setEditFormData(null);
  };

  const saveEditing = async () => {
    if (!editFormData) return;

    if (
      !editFormData.sessionDate ||
      !editFormData.sessionTime ||
      !editFormData.title
    ) {
      Swal.fire({
        icon: "error",
        title: "Missing Required Fields",
        text: "Title, Date, and Time are required fields.",
        confirmButtonColor: "#16a34a",
      });
      return;
    }

    // If courseId is provided, save to API
    if (courseId) {
      const isNewSession = editingSession?.startsWith("temp-");
      
      try {
        const url = isNewSession 
          ? `/api/admin/courses/${courseId}/sessions`
          : `/api/admin/courses/${courseId}/sessions/${editingSession}`;
        
        const method = isNewSession ? "POST" : "PUT";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editFormData),
        });

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: `Session ${isNewSession ? 'created' : 'updated'} successfully`,
            timer: 1500,
            showConfirmButton: false,
          });
          setEditingSession(null);
          setEditFormData(null);
          if (onRefresh) onRefresh();
        } else {
          const err = await res.json();
          Swal.fire({
            icon: "error",
            title: "Error",
            text: err.error || `Failed to ${isNewSession ? 'create' : 'update'} session`,
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Error ${isNewSession ? 'creating' : 'updating'} session`,
        });
      }
    } else {
      // Local state management (for create course page)
      const updatedSessions = sessions.map((session) =>
        session.id === editingSession ? editFormData : session
      );
      setSessions(updatedSessions);
      setEditingSession(null);
      setEditFormData(null);
    }
  };

  const updateEditFormData = (field: keyof Session, value: any) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, [field]: value });
    }
  };

  const removeSession = async (session: Session, index: number) => {
    const result = await Swal.fire({
      title: "Delete Session?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    // If it's a temp session, just remove from local state
    if (session.id.startsWith("temp-")) {
      const updatedSessions = sessions.filter((_, i) => i !== index);
      // Re-number sessions after deletion
      const renumberedSessions = updatedSessions.map((s, idx) => ({
        ...s,
        sessionNumber: idx + 1,
      }));
      setSessions(renumberedSessions);

      // If we're deleting the session being edited, cancel editing
      if (session.id === editingSession) {
        setEditingSession(null);
        setEditFormData(null);
      }
      return;
    }

    // If courseId is provided and session exists in DB, delete via API
    if (courseId) {
      try {
        const res = await fetch(
          `/api/admin/courses/${courseId}/sessions/${session.id}`,
          {
            method: "DELETE",
          }
        );

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Session deleted successfully",
            timer: 1500,
            showConfirmButton: false,
          });
          if (onRefresh) onRefresh();
        } else {
          const err = await res.json();
          Swal.fire({
            icon: "error",
            title: "Error",
            text: err.error || "Failed to delete session",
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error deleting session",
        });
      }
    } else {
      // Local state management (shouldn't reach here for persisted sessions)
      const updatedSessions = sessions.filter((_, i) => i !== index);
      const renumberedSessions = updatedSessions.map((s, idx) => ({
        ...s,
        sessionNumber: idx + 1,
      }));
      setSessions(renumberedSessions);

      if (session.id === editingSession) {
        setEditingSession(null);
        setEditFormData(null);
      }
    }
  };

  const generateSessionsFromTotal = () => {
    if (!totalSessions || totalSessions <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Total Sessions",
        text: "Please set a valid total sessions count first.",
        confirmButtonColor: "#16a34a",
      });
      return;
    }

    const newSessions: Session[] = [];
    for (let i = 1; i <= totalSessions; i++) {
      newSessions.push({
        id: `temp-${Date.now()}-${i}`,
        sessionNumber: i,
        title: `Session ${i}`,
        description: "",
        sessionDate: "",
        sessionTime: "",
        duration: 60,
        meetingLink: "",
        meetingPasscode: "",
        recordingUrl: "",
        isCompleted: false,
      });
    }
    setSessions(newSessions);
    if (newSessions.length > 0) {
      setEditingSession(newSessions[0].id);
      setEditFormData(newSessions[0]);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "-";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB");
  };

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-green-50 to-green-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-gray-900">
            Course Sessions ({sessions.length} of {totalSessions || 0})
          </CardTitle>
          <div className="flex gap-2">
            {totalSessions > 0 && !courseId && (
              <Button
                type="button"
                variant="outline"
                onClick={generateSessionsFromTotal}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                Generate {totalSessions} Sessions
              </Button>
            )}
            <Button
              type="button"
              onClick={addSession}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Session
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No sessions added yet.</p>
            <p className="text-sm mt-2">
              {totalSessions && !courseId
                ? `Click "Generate ${totalSessions} Sessions" to auto-create sessions or add them manually.`
                : 'Click "Add Session" to create a new session.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    S.No.
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Session Title
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Time
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Duration
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Meeting Link
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Passcode
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Recording URL
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions
                  .sort((a, b) => a.sessionNumber - b.sessionNumber)
                  .map((session, index) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900">
                        {session.sessionNumber}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {editingSession === session.id ? (
                          <Input
                            value={editFormData?.title || ""}
                            onChange={(e) =>
                              updateEditFormData("title", e.target.value)
                            }
                            placeholder="Session title"
                            className="w-full"
                            required
                          />
                        ) : (
                          session.title || "-"
                        )}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {editingSession === session.id ? (
                          <Input
                            type="date"
                            value={editFormData?.sessionDate || ""}
                            onChange={(e) =>
                              updateEditFormData("sessionDate", e.target.value)
                            }
                            className="w-full"
                            required
                          />
                        ) : (
                          formatDate(session.sessionDate)
                        )}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {editingSession === session.id ? (
                          <Input
                            type="time"
                            value={editFormData?.sessionTime || ""}
                            onChange={(e) =>
                              updateEditFormData("sessionTime", e.target.value)
                            }
                            className="w-full"
                            required
                          />
                        ) : (
                          formatTime(session.sessionTime)
                        )}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {editingSession === session.id ? (
                          <Input
                            type="number"
                            value={editFormData?.duration || 60}
                            onChange={(e) =>
                              updateEditFormData(
                                "duration",
                                parseInt(e.target.value) || 60
                              )
                            }
                            className="w-full"
                            min="1"
                            required
                          />
                        ) : (
                          `${session.duration} mins`
                        )}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {editingSession === session.id ? (
                          <Input
                            type="url"
                            value={editFormData?.meetingLink || ""}
                            onChange={(e) =>
                              updateEditFormData("meetingLink", e.target.value)
                            }
                            placeholder="https://zoom.us/j/..."
                            className="w-full"
                          />
                        ) : session.meetingLink ? (
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            Join Meeting
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {editingSession === session.id ? (
                          <Input
                            value={editFormData?.meetingPasscode || ""}
                            onChange={(e) =>
                              updateEditFormData(
                                "meetingPasscode",
                                e.target.value
                              )
                            }
                            placeholder="123456"
                            className="w-full"
                          />
                        ) : (
                          session.meetingPasscode || "-"
                        )}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {editingSession === session.id ? (
                          <Input
                            type="url"
                            value={editFormData?.recordingUrl || ""}
                            onChange={(e) =>
                              updateEditFormData("recordingUrl", e.target.value)
                            }
                            placeholder="https://youtube.com/..."
                            className="w-full"
                          />
                        ) : session.recordingUrl ? (
                          <a
                            href={session.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            Watch Recording
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {editingSession === session.id ? (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData?.isCompleted || false}
                              onChange={(e) =>
                                updateEditFormData(
                                  "isCompleted",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300"
                            />
                            <Label className="ml-2 text-sm">Completed</Label>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              session.isCompleted
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {session.isCompleted ? "Completed" : "Upcoming"}
                          </span>
                        )}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {editingSession === session.id ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                onClick={saveEditing}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                className="border-gray-300"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(session)}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => removeSession(session, index)}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {editingSession && editFormData && (
              <Card className="mt-4 border border-blue-200">
                <CardHeader className="bg-blue-50 border-b">
                  <CardTitle className="text-lg text-blue-900">
                    Edit Session Details - Session {editFormData.sessionNumber}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editFormData.description}
                        onChange={(e) =>
                          updateEditFormData("description", e.target.value)
                        }
                        placeholder="Session details and topics covered..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        onClick={saveEditing}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEditing}
                        className="border-gray-300"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}