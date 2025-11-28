"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Swal from "sweetalert2";
import { DynamicWhyLearn } from "@/components/courses/course-form";
import { EnhancedDynamicList } from "@/components/courses/EnhancedDynamicList";
import { CourseFormFields } from "@/components/courses/CourseFormFields";
import RichTextEditor from "@/components/courses/RichTextEditor";
import SessionManager, { Session } from "@/components/SessionManager";

// const USD_TO_INR_RATE = 83.5;

type Course = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  instructor: string | null;
  duration: string | null;
  durationMinutes: number | null;
  totalSessions: number | null;
  priceINR: number;
  priceUSD: number;
  status: string;
  thumbnailUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
  whyLearnIntro: string | null;
  whatYouLearn: string | null;
  disclaimer: string | null;
  maxStudents: number | null;
  currentEnrollments: number;
  commissionPercourse: number | null;
  assignedJyotishiId: string | null;
  assignedJyotishiName: string | null;
  features: string[];
  whyLearn: { title: string; description: string }[];
  courseContent: string[];
  topics: string[];
  sessions: Session[];
};

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUSDManual, setIsUSDManual] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    id: "",
    slug: "",
    title: "",
    tagline: "",
    description: "",
    instructor: "To be announced",
    durationMinutes: "",
    totalSessions: "",
    priceINR: "",
    priceUSD: "",
    status: "DRAFT",
    thumbnailUrl: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    whyLearnIntro: "",
    whatYouLearn: "",
    disclaimer: "",
    maxStudents: "",
    currentEnrollments: "0",
    commissionPercourse: "",
    assignedJyotishiId: null as string | null,
    assignedJyotishiName: null as string | null,
  });

  // Arrays
  const [features, setFeatures] = useState<string[]>([]);
  const [whyLearn, setWhyLearn] = useState<{ title: string; description: string }[]>([]);
  const [courseContent, setCourseContent] = useState<string[]>([]);
  const [relatedTopics, setRelatedTopics] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [dateErrors, setDateErrors] = useState({
    registrationDeadline: "",
    startDate: "",
    endDate: "",
  });

  // Field change handler
  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Jyotishi change handler
  const handleJyotishiChange = useCallback((id: string | null, name: string | null) => {
    setFormData(prev => ({
      ...prev,
      assignedJyotishiId: id,
      assignedJyotishiName: name,
      instructor: name || "To be announced"
    }));
  }, []);

  // Date validation
  const validateDates = useCallback(() => {
    const errors = {
      registrationDeadline: "",
      startDate: "",
      endDate: "",
    };

    if (formData.registrationDeadline && formData.startDate) {
      if (new Date(formData.registrationDeadline) >= new Date(formData.startDate)) {
        errors.registrationDeadline = "Registration deadline must be before start date";
      }
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        errors.startDate = "Start date must be before end date";
      }
    }

    setDateErrors(errors);
    return Object.values(errors).every((error) => !error);
  }, [formData.registrationDeadline, formData.startDate, formData.endDate]);

  useEffect(() => {
    validateDates();
  }, [validateDates]);

  // Format duration
  const formatDuration = useCallback(() => {
    const minutes = parseInt(formData.durationMinutes);
    if (isNaN(minutes)) return "";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
  }, [formData.durationMinutes]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/courses/${slug}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!res.ok) {
        throw new Error("Course not found");
      }

      const data: Course = await res.json();

      // Populate form data
      setFormData({
        id: data.id,
        slug: data.slug,
        title: data.title,
        tagline: data.tagline || "",
        description: data.description,
        instructor: data.instructor || "To be announced",
        durationMinutes: data.durationMinutes ? String(data.durationMinutes) : "",
        totalSessions: data.totalSessions ? String(data.totalSessions) : "",
        priceINR: String(data.priceINR),
        priceUSD: String(data.priceUSD),
        status: data.status,
        thumbnailUrl: data.thumbnailUrl || "",
        startDate: data.startDate ? data.startDate.split("T")[0] : "",
        endDate: data.endDate ? data.endDate.split("T")[0] : "",
        registrationDeadline: data.registrationDeadline ? data.registrationDeadline.split("T")[0] : "",
        whyLearnIntro: data.whyLearnIntro || "",
        whatYouLearn: data.whatYouLearn || "",
        disclaimer: data.disclaimer || "",
        maxStudents: data.maxStudents ? String(data.maxStudents) : "",
        currentEnrollments: String(data.currentEnrollments),
        commissionPercourse: data.commissionPercourse !== null ? String(data.commissionPercourse) : "",
        assignedJyotishiId: data.assignedJyotishiId,
        assignedJyotishiName: data.assignedJyotishiName || null,
      });

      // Set arrays
      setFeatures(data.features || []);
      setWhyLearn(data.whyLearn || []);
      setCourseContent(data.courseContent || []);
      setRelatedTopics(data.topics || []);
      setSessions(data.sessions || []);

    } catch (error) {
      console.error("Failed to fetch course:", error);
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

  useEffect(() => {
    if (slug) {
      fetchCourse();
    }
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDates()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fix the date validation errors before submitting',
      });
      return;
    }

    setSaving(true);

    // Calculate total duration string
    const durationString = formatDuration() || `${formData.totalSessions} live sessions`;

    const payload = {
      slug: formData.slug,
      title: formData.title,
      tagline: formData.tagline || null,
      description: formData.description,
      instructor: formData.instructor || null,
      duration: durationString,
      durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : null,
      totalSessions: formData.totalSessions ? Number(formData.totalSessions) : null,
      priceINR: formData.priceINR ? Number(formData.priceINR) : null,
      priceUSD: formData.priceUSD ? Number(formData.priceUSD) : null,
      status: formData.status,
      thumbnailUrl: formData.thumbnailUrl || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      registrationDeadline: formData.registrationDeadline || null,
      whyLearnIntro: formData.whyLearnIntro || null,
      whatYouLearn: formData.whatYouLearn || null,
      disclaimer: formData.disclaimer || null,
      maxStudents: formData.maxStudents ? Number(formData.maxStudents) : null,
      currentEnrollments: Number(formData.currentEnrollments),
      commissionPercourse: formData.commissionPercourse ? Number(formData.commissionPercourse) : null,
      assignedJyotishiId: formData.assignedJyotishiId,

      features: features.filter((f) => f.trim()),
      whyLearn: whyLearn.filter((w) => w.title.trim() && w.description.trim()),
      content: courseContent.filter((c) => c.trim()),
      topics: relatedTopics.filter((t) => t.trim()),
      sessions: sessions.map(session => ({
        ...session,
        duration: Number(session.duration),
      })),
    };

    try {
      const res = await fetch(`/api/admin/courses/${formData.id}`, {
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
        router.push("/dashboard/admin/courses");
        router.refresh();
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
        title: "Unexpected Error",
        text: "An unexpected error occurred",
      });
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto ">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/admin/courses"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Course</h1>
              <p className="text-gray-600">Update course details and content.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          {/* Basic Information */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <CourseFormFields
                formData={formData}
                onFieldChange={handleFieldChange}
                onJyotishiChange={handleJyotishiChange}
                dateErrors={dateErrors}
                isUSDManual={isUSDManual}
                onUSDManualToggle={() => setIsUSDManual(false)}
                formatDuration={formatDuration}
              />
            </CardContent>
          </Card>

          {/* Sessions Management */}
          <SessionManager
  sessions={sessions}
  setSessions={setSessions}
  totalSessions={parseInt(formData.totalSessions) || 0}
  courseId={formData.id}  // Pass the course ID
  onRefresh={fetchCourse}  // Pass the refresh function
/>

          {/* Content & SEO */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">
                Content & SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => handleFieldChange("description", value)}
                  placeholder="Enter course description..."
                  minHeight="300px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why Learn Intro
                </label>
                <RichTextEditor
                  value={formData.whyLearnIntro}
                  onChange={(value) => handleFieldChange("whyLearnIntro", value)}
                  placeholder="Enter why learn introduction..."
                  minHeight="200px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What You Learn
                </label>
                <RichTextEditor
                  value={formData.whatYouLearn}
                  onChange={(value) => handleFieldChange("whatYouLearn", value)}
                  placeholder="Enter what students will learn..."
                  minHeight="300px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disclaimer
                </label>
                <RichTextEditor
                  value={formData.disclaimer}
                  onChange={(value) => handleFieldChange("disclaimer", value)}
                  placeholder="Enter disclaimer..."
                  minHeight="200px"
                />
              </div>
            </CardContent>
          </Card>

          {/* Capacity */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">Capacity</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Students
                </label>
                <input
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => handleFieldChange("maxStudents", e.target.value)}
                  placeholder="50"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Enrollments
                </label>
                <input
                  type="number"
                  value={formData.currentEnrollments}
                  onChange={(e) => handleFieldChange("currentEnrollments", e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Lists */}
          <EnhancedDynamicList
            title="Features"
            items={features}
            setItems={setFeatures}
            placeholder="25 live sessions on Zoom"
            type="feature"
          />

          <DynamicWhyLearn items={whyLearn} setItems={setWhyLearn} />

          <EnhancedDynamicList
            title="Course Content"
            items={courseContent}
            setItems={setCourseContent}
            placeholder="The Zodiac and Its Divisions"
            type="content"
          />

          <EnhancedDynamicList
            title="Related Topics"
            items={relatedTopics}
            setItems={setRelatedTopics}
            placeholder="Astrology"
            type="topic"
          />

          {/* Sticky Save Button */}
    
          
        <div className="flex justify-end gap-3 ">
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            asChild
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Link href="/dashboard/admin/courses">Cancel</Link>
          </Button>
        
      </div>
        </form>
      </div>
    </div>
  );
}